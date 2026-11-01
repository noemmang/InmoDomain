$ErrorActionPreference = 'Stop'

$script:ResourceGroup = 'rg-inmodomain'
$script:EnvironmentName = 'cae-inmodomain'
$script:WorkspaceName = 'log-inmodomain'
$script:AppRegistrationName = 'inmodomain-github-deploy'
$script:BudgetName = 'inmodomain-mensual'
$script:Queues = @('ComprasVentasImportadas', 'PreciosImportados', 'ContrasenaCambiada', 'IndicesRecalculados', 'AlertaDisparada')

# Ejecuta az y lanza una excepción si el código de salida no es 0.
function Invoke-Az {
    $output = & az @args
    if ($LASTEXITCODE -ne 0) {
        throw "az $($args -join ' ') terminó con código $LASTEXITCODE."
    }

    return $output
}

# Ejecuta az con salida tsv y devuelve el resultado como un único texto sin espacios sobrantes.
function Get-AzValue {
    $output = & az @args -o tsv
    if ($LASTEXITCODE -ne 0) {
        throw "az $($args -join ' ') terminó con código $LASTEXITCODE."
    }

    if ($null -eq $output) {
        return ''
    }

    return (($output | Out-String).Trim())
}

# Lee un fichero KEY=VALUE ignorando líneas vacías y comentarios.
function Read-EnvFile {
    param([string] $Path)

    if (-not (Test-Path -Path $Path)) {
        throw "No existe $Path. Copia infra/azure.env.example a infra/azure.env y rellénalo."
    }

    $values = @{}
    foreach ($line in Get-Content -Path $Path -Encoding UTF8) {
        $trimmed = $line.Trim()
        if ($trimmed -eq '' -or $trimmed.StartsWith('#')) {
            continue
        }

        $index = $trimmed.IndexOf('=')
        if ($index -lt 1) {
            throw "Línea no válida en ${Path}: $trimmed"
        }

        $values[$trimmed.Substring(0, $index).Trim()] = $trimmed.Substring($index + 1).Trim()
    }

    return $values
}

# Comprueba que las claves indicadas existen y no están vacías.
function Assert-Config {
    param([hashtable] $Config, [string[]] $Keys)

    $missing = $Keys | Where-Object { -not $Config.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($Config[$_]) }
    if ($missing) {
        throw "Faltan valores en azure.env: $($missing -join ', ')"
    }
}

# Sufijo estable derivado de la suscripción para nombres únicos a nivel global.
function Get-NameSuffix {
    param([string] $SubscriptionId)

    return $SubscriptionId.Replace('-', '').Substring(0, 6)
}