$ErrorActionPreference = "Stop"

$entryFile = Join-Path $PSScriptRoot "index.html"

if (-not (Test-Path $entryFile)) {
  throw "Arquivo index.html não encontrado na raiz do projeto."
}

Start-Process $entryFile | Out-Null
