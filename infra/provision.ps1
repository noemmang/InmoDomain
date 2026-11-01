param(
    [string] $EnvFile = (Join-Path $PSScriptRoot 'azure.env')
)

. (Join-Path $PSScriptRoot 'common.ps1')

$config = Read-EnvFile -Path $EnvFile
Assert-Config -Config $config -Keys @('AZURE_LOCATION', 'BUDGET_EMAIL')

$location = $config['AZURE_LOCATION']
$subscriptionId = Get-AzValue account show --query id
$tenantId = Get-AzValue account show --query tenantId
$suffix = Get-NameSuffix -SubscriptionId $subscriptionId
$serviceBusName = "sb-inmodomain-$suffix"
$resourceGroupScope = "/subscriptions/$subscriptionId/resourceGroups/$script:ResourceGroup"

Write-Host "Suscripción: $subscriptionId"

# Extensión de Container Apps y proveedores de recursos.
Invoke-Az extension add --name containerapp --upgrade | Out-Null
foreach ($provider in @('Microsoft.App', 'Microsoft.OperationalInsights', 'Microsoft.ServiceBus', 'Microsoft.Consumption')) {
    Invoke-Az provider register --namespace $provider --wait | Out-Null
}

Write-Host 'Grupo de recursos...'
Invoke-Az group create --name $script:ResourceGroup --location $location | Out-Null

# Log Analytics con tope diario de ingesta para mantenerse dentro de la franja gratuita (5 GB/mes).
Write-Host 'Log Analytics...'
Invoke-Az monitor log-analytics workspace create `
    --resource-group $script:ResourceGroup `
    --workspace-name $script:WorkspaceName `
    --location $location `
    --retention-time 30 `
    --quota 0.1 | Out-Null

$workspaceId = Get-AzValue monitor log-analytics workspace show `
    --resource-group $script:ResourceGroup `
    --workspace-name $script:WorkspaceName `
    --query customerId
$workspaceKey = Get-AzValue monitor log-analytics workspace get-shared-keys `
    --resource-group $script:ResourceGroup `
    --workspace-name $script:WorkspaceName `
    --query primarySharedKey

Write-Host 'Entorno de Container Apps...'
$existingEnvironment = Get-AzValue containerapp env list `
    --resource-group $script:ResourceGroup `
    --query "[?name=='$script:EnvironmentName'].name"
if ([string]::IsNullOrWhiteSpace($existingEnvironment)) {
    Invoke-Az containerapp env create `
        --name $script:EnvironmentName `
        --resource-group $script:ResourceGroup `
        --location $location `
        --logs-workspace-id $workspaceId `
        --logs-workspace-key $workspaceKey | Out-Null
}

# Service Bus en nivel Basic (sin cuota fija; solo admite colas).
Write-Host 'Service Bus...'
Invoke-Az servicebus namespace create `
    --name $serviceBusName `
    --resource-group $script:ResourceGroup `
    --location $location `
    --sku Basic | Out-Null

foreach ($queue in $script:Queues) {
    Invoke-Az servicebus queue create `
        --name $queue `
        --namespace-name $serviceBusName `
        --resource-group $script:ResourceGroup `
        --max-delivery-count 10 `
        --lock-duration PT1M `
        --default-message-time-to-live P7D | Out-Null
}

# Política "apps": enviar y escuchar. Política "scaler": Manage, exigida por KEDA para leer la longitud de la cola.
Invoke-Az servicebus namespace authorization-rule create `
    --name apps `
    --namespace-name $serviceBusName `
    --resource-group $script:ResourceGroup `
    --rights Send Listen | Out-Null
Invoke-Az servicebus namespace authorization-rule create `
    --name scaler `
    --namespace-name $serviceBusName `
    --resource-group $script:ResourceGroup `
    --rights Manage Send Listen | Out-Null

# Presupuesto mensual de 10 con avisos al 50, 75, 90 y 100 % del gasto real.
Write-Host 'Presupuesto...'
$notifications = [ordered]@{}
foreach ($threshold in @(50, 75, 90, 100)) {
    $notifications["Actual_GreaterThan_${threshold}_Percent"] = [ordered]@{
        enabled       = $true
        operator      = 'GreaterThan'
        threshold     = $threshold
        thresholdType = 'Actual'
        locale        = 'es-es'
        contactEmails = @($config['BUDGET_EMAIL'])
    }
}

$firstDay = (Get-Date).ToString("yyyy-MM-01'T'00':'00':'00'Z'", [System.Globalization.CultureInfo]::InvariantCulture)
$budget = [ordered]@{
    properties = [ordered]@{
        category      = 'Cost'
        amount        = 10
        timeGrain     = 'Monthly'
        timePeriod    = [ordered]@{ startDate = $firstDay; endDate = '2036-12-31T00:00:00Z' }
        notifications = $notifications
    }
}

$budgetFile = Join-Path ([System.IO.Path]::GetTempPath()) 'inmodomain-budget.json'
try {
    [System.IO.File]::WriteAllText($budgetFile, ($budget | ConvertTo-Json -Depth 8), (New-Object System.Text.UTF8Encoding $false))
    Invoke-Az rest --method put `
        --url "https://management.azure.com/subscriptions/$subscriptionId/providers/Microsoft.Consumption/budgets/$($script:BudgetName)?api-version=2024-08-01" `
        --body "@$budgetFile" | Out-Null
}
finally {
    Remove-Item -Path $budgetFile -Force -ErrorAction SilentlyContinue
}

# Identidad de despliegue para GitHub Actions con OIDC (sin secretos de larga duración).
Write-Host 'Identidad de despliegue (OIDC)...'
$remote = (& git -C (Split-Path $PSScriptRoot -Parent) remote get-url origin)
if (-not ($remote -match 'github\.com[:/](?<repo>[^/]+/[^/]+?)(?:\.git)?$')) {
    throw "No se pudo obtener el repositorio de GitHub desde el remoto origin: $remote"
}

$repository = $Matches['repo']
$subject = "repo:${repository}:ref:refs/heads/main"

$appId = Get-AzValue ad app list --display-name $script:AppRegistrationName --query "[?displayName=='$($script:AppRegistrationName)'].appId | join(',', @)"
if ([string]::IsNullOrWhiteSpace($appId)) {
    $appId = Get-AzValue ad app create --display-name $script:AppRegistrationName --query appId
    Invoke-Az ad sp create --id $appId | Out-Null
}

$servicePrincipalId = Get-AzValue ad sp show --id $appId --query id

$existingCredential = Get-AzValue ad app federated-credential list --id $appId --query "[?name=='github-main'].name"
if ([string]::IsNullOrWhiteSpace($existingCredential)) {
    $credential = [ordered]@{
        name      = 'github-main'
        issuer    = 'https://token.actions.githubusercontent.com'
        subject   = $subject
        audiences = @('api://AzureADTokenExchange')
    }

    $credentialFile = Join-Path ([System.IO.Path]::GetTempPath()) 'inmodomain-federated-credential.json'
    try {
        [System.IO.File]::WriteAllText($credentialFile, ($credential | ConvertTo-Json), (New-Object System.Text.UTF8Encoding $false))
        Invoke-Az ad app federated-credential create --id $appId --parameters "@$credentialFile" | Out-Null
    }
    finally {
        Remove-Item -Path $credentialFile -Force -ErrorAction SilentlyContinue
    }
}

$existingAssignment = Get-AzValue role assignment list `
    --assignee $servicePrincipalId `
    --scope $resourceGroupScope `
    --role Contributor `
    --query "[].id"
if ([string]::IsNullOrWhiteSpace($existingAssignment)) {
    Invoke-Az role assignment create `
        --assignee-object-id $servicePrincipalId `
        --assignee-principal-type ServicePrincipal `
        --role Contributor `
        --scope $resourceGroupScope | Out-Null
}

Write-Host ''
Write-Host 'Aprovisionamiento terminado. Variables del repositorio en GitHub (Settings > Secrets and variables > Actions > Variables):'
Write-Host "  AZURE_CLIENT_ID       = $appId"
Write-Host "  AZURE_TENANT_ID       = $tenantId"
Write-Host "  AZURE_SUBSCRIPTION_ID = $subscriptionId"
Write-Host "  AZURE_RESOURCE_GROUP  = $script:ResourceGroup"
Write-Host "Subject de la credencial federada: $subject"