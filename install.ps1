$ErrorActionPreference = "Stop"

function Show-Title($text) {
  Write-Host ""
  Write-Host $text -ForegroundColor Cyan
  Write-Host ("=" * $text.Length) -ForegroundColor Cyan
}

Show-Title "Instalador - Cartão Ponto no Navegador"

Write-Host "Esta versão não precisa de Python, servidor ou banco externo." -ForegroundColor Green
Write-Host "Os dados serão armazenados no navegador do usuário." -ForegroundColor DarkGray

Show-Title "Criando atalho no desktop"
& "$PSScriptRoot\Criar-Atalho-Desktop.ps1"

Show-Title "Abrindo o sistema"
& "$PSScriptRoot\Abrir-Sistema.ps1"
