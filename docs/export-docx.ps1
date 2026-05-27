# Export LexiPack manualu do Word (.docx)
# Spustenie: .\export-docx.ps1

$pandocCmd = Get-Command pandoc -ErrorAction SilentlyContinue
if ($pandocCmd) {
    $pandoc = $pandocCmd.Source
} else {
    $pandoc = "$env:LOCALAPPDATA\Pandoc\pandoc.exe"
}
if (-not (Test-Path $pandoc)) {
    Write-Error "Pandoc nenajdeny. Nainštaluj ho cez: winget install JohnMacFarlane.Pandoc"
    exit 1
}

$docsDir   = $PSScriptRoot
$manualDir = "$docsDir\manual"
$output    = "$docsDir\LexiPack-manual.docx"

$chapters = @(
    "uvod", "prihlasenie",
    "zoznam-balikov", "novy-balik",
    "editor", "slova", "metadata", "skratky", "import-export",
    "ai-generovanie", "ai-navrhy",
    "kvalita", "kvalita-domeny", "kvalita-cefr", "kvalita-priklady",
    "kvalita-duplicity", "kvalita-pokrytie", "kvalita-zdroje",
    "reviews", "zalozky",
    "nastavenia", "autocorrect", "analytika", "administracia"
)

$files = $chapters | ForEach-Object { "$manualDir\$_.md" } | Where-Object { Test-Path $_ }

Write-Host "Generujem $output ..."

& $pandoc @files `
    --from markdown `
    --to docx `
    --output $output `
    --toc `
    --toc-depth=2 `
    --standalone

if ($LASTEXITCODE -eq 0) {
    Write-Host "Hotovo: $output"
} else {
    Write-Error "Pandoc zlyhal."
}
