param(
    [string] $EnvFile = (Join-Path $PSScriptRoot 'azure.env'),
    [string[]] $Only = @()
)

. (Join-Path $PSScriptRoot 'common.ps1')

$config = Read-EnvFile -Path $EnvFile
Assert-Config -Config $config -Keys @(
    'AZURE_LOCATION', 'IMAGE_PREFIX', 'IMAGE_TAG',
    'IDENTITY_CONNECTION', 'PROPERTY_CONNECTION', 'MARKETDATA_CONNECTION', 'ANALYTICS_CONNECTION',
    'ALERTS_CONNECTION', 'NOTIFICATIONS_CONNECTION',
    'JWT_PRIVATE_KEY', 'JWT_PUBLIC_KEY', 'MARKETDATA_API_KEY', 'ANALYTICS_API_KEY',
    'RESEND_API_KEY', 'RESEND_FROM_ADDRESS', 'CORS_ALLOWED_ORIGIN', 'FRONTEND_RESET_PASSWORD_URL',
    'IMPORT_CRON', 'IMPORT_LAST_PERIODS')

$subscriptionId = Get-AzValue account show --query id
$serviceBusName = "sb-inmodomain-$(Get-NameSuffix -SubscriptionId $subscriptionId)"

$environmentId = Get-AzValue containerapp env show `
    --name $script:EnvironmentName `
    --resource-group $script:ResourceGroup `
    --query id
$domain = Get-AzValue containerapp env show `
    --name $script:EnvironmentName `
    --resource-group $script:ResourceGroup `
    --query properties.defaultDomain

$appsConnection = Get-AzValue servicebus namespace authorization-rule keys list `
    --name apps `
    --namespace-name $serviceBusName `
    --resource-group $script:ResourceGroup `
    --query primaryConnectionString
$scalerConnection = Get-AzValue servicebus namespace authorization-rule keys list `
    --name scaler `
    --namespace-name $serviceBusName `
    --resource-group $script:ResourceGroup `
    --query primaryConnectionString

# Valores sustituidos en las plantillas; las llamadas entre servicios usan el FQDN interno por HTTPS.
$tokens = @{
    LOCATION                    = $config['AZURE_LOCATION']
    ENV_ID                      = $environmentId
    URL_PROPERTY                = "https://property.internal.$domain"
    URL_ANALYTICS               = "https://analytics.internal.$domain"
    URL_MARKETDATA              = "https://marketdata-api.internal.$domain"
    GW_IDENTITY                 = "https://identity.internal.$domain/"
    GW_PROPERTY                 = "https://property.internal.$domain/"
    GW_ANALYTICS                = "https://analytics.internal.$domain/"
    GW_ALERTS                   = "https://alerts.internal.$domain/"
    GW_NOTIFICATIONS            = "https://notifications.internal.$domain/"
    SERVICEBUS_APPS_CONNECTION  = $appsConnection
    SERVICEBUS_SCALER_CONNECTION = $scalerConnection
}
foreach ($key in @(
        'IDENTITY_CONNECTION', 'PROPERTY_CONNECTION', 'MARKETDATA_CONNECTION', 'ANALYTICS_CONNECTION',
        'ALERTS_CONNECTION', 'NOTIFICATIONS_CONNECTION', 'JWT_PRIVATE_KEY', 'JWT_PUBLIC_KEY',
        'MARKETDATA_API_KEY', 'ANALYTICS_API_KEY', 'RESEND_API_KEY', 'RESEND_FROM_ADDRESS',
        'CORS_ALLOWED_ORIGIN', 'FRONTEND_RESET_PASSWORD_URL', 'IMPORT_CRON', 'IMPORT_LAST_PERIODS')) {
    $tokens[$key] = $config[$key]
}

# Sustituye cada ${NOMBRE} por su valor como cadena JSON, válida como cadena YAML entre comillas dobles.
function Expand-Template {
    param([string] $Path, [hashtable] $Values)

    $text = Get-Content -Path $Path -Raw -Encoding UTF8
    $evaluator = [System.Text.RegularExpressions.MatchEvaluator] {
        param($match)

        $name = $match.Groups[1].Value
        if (-not $Values.ContainsKey($name)) {
            throw "Falta el valor de $name para la plantilla $Path."
        }

        return (ConvertTo-Json -InputObject ([string] $Values[$name]) -Compress)
    }

    return [regex]::Replace($text, '\$\{([A-Z0-9_]+)\}', $evaluator)
}

# Crea el recurso si no existe y lo actualiza si ya existe, a partir del YAML renderizado.
function Publish-Resource {
    param([string] $Name, [ValidateSet('app', 'job')] [string] $Kind)

    $values = $tokens.Clone()
    $values['IMAGE'] = "$($config['IMAGE_PREFIX'])-${Name}:$($config['IMAGE_TAG'])"

    $rendered = Expand-Template -Path (Join-Path $PSScriptRoot "apps/$Name.yaml") -Values $values
    $temp = Join-Path ([System.IO.Path]::GetTempPath()) "inmodomain-$Name.yaml"

    $listCommand = if ($Kind -eq 'job') { @('containerapp', 'job', 'list') } else { @('containerapp', 'list') }
    $verb = if ($Kind -eq 'job') { @('containerapp', 'job') } else { @('containerapp') }

    $existing = Get-AzValue @listCommand --resource-group $script:ResourceGroup --query "[?name=='$Name'].name"
    $action = if ([string]::IsNullOrWhiteSpace($existing)) { 'create' } else { 'update' }

    Write-Host "$Name ($action)..."
    try {
        [System.IO.File]::WriteAllText($temp, $rendered, (New-Object System.Text.UTF8Encoding $false))
        Invoke-Az @verb $action --name $Name --resource-group $script:ResourceGroup --yaml $temp | Out-Null
    }
    finally {
        Remove-Item -Path $temp -Force -ErrorAction SilentlyContinue
    }
}

$resources = @(
    @{ Name = 'marketdata-api'; Kind = 'app' },
    @{ Name = 'property'; Kind = 'app' },
    @{ Name = 'identity'; Kind = 'app' },
    @{ Name = 'analytics'; Kind = 'app' },
    @{ Name = 'alerts'; Kind = 'app' },
    @{ Name = 'notifications'; Kind = 'app' },
    @{ Name = 'gateway'; Kind = 'app' },
    @{ Name = 'import-job'; Kind = 'job' }
)

foreach ($resource in $resources) {
    if ($Only.Count -gt 0 -and $Only -notcontains $resource.Name) {
        continue
    }

    Publish-Resource -Name $resource.Name -Kind $resource.Kind
}

$gatewayFqdn = Get-AzValue containerapp show `
    --name gateway `
    --resource-group $script:ResourceGroup `
    --query properties.configuration.ingress.fqdn

Write-Host ''
Write-Host "Despliegue terminado. Gateway: https://$gatewayFqdn"