$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$inputPath = 'imagens-trabalho/selecionadas.json'
$selected = @(Get-Content -LiteralPath $inputPath -Raw -Encoding utf8 | ConvertFrom-Json)
if ($selected.Count -ne 12) { throw 'Selecione exatamente 12 imagens.' }
$expected = @(1..12 | ForEach-Object { 'TI-{0:d4}' -f $_ })
$actual = @($selected | ForEach-Object { $_.patrimonio } | Sort-Object)
if (Compare-Object $expected $actual) { throw 'Patrimônios incompletos ou duplicados.' }
if (@($selected.id | Select-Object -Unique).Count -ne 12) { throw 'IDs de foto duplicados.' }
$candidates = @(Get-Content -LiteralPath 'imagens-trabalho/candidatos-pixabay.json' -Raw -Encoding utf8 | ConvertFrom-Json)
New-Item -ItemType Directory -Force -Path 'imagens-trabalho/prontas' | Out-Null
$manifestPath = 'imagens-trabalho/prontas/manifesto.json'
if (Test-Path -LiteralPath $manifestPath) { Remove-Item -LiteralPath $manifestPath }
$manifest = @()
$seenHashes = @{}
foreach ($item in $selected) {
  if ($item.aprovada -ne $true) { throw "Imagem não aprovada: $($item.patrimonio)" }
  $source = @($candidates | Where-Object patrimonio -eq $item.patrimonio | ForEach-Object { $_.candidatos } | Where-Object id -eq $item.id)
  if ($source.Count -ne 1 -or $source[0].download -ne $item.download -or $source[0].pagina -ne $item.pagina) { throw 'Seleção não corresponde aos dados da API.' }
  $uri = [Uri]$source[0].download
  if ($uri.Scheme -ne 'https' -or $uri.Host -notin @('pixabay.com', 'cdn.pixabay.com')) { throw 'Origem de imagem inválida.' }
  $tmp = Join-Path ([IO.Path]::GetTempPath()) ([IO.Path]::GetRandomFileName())
  try {
    Invoke-WebRequest -Uri $uri -OutFile $tmp -MaximumRedirection 0
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $tmp).Hash
    if ($seenHashes.ContainsKey($hash)) { throw "Conteúdo duplicado: $($item.patrimonio) e $($seenHashes[$hash])" }
    $seenHashes[$hash] = $item.patrimonio
    $original = [System.Drawing.Image]::FromFile($tmp)
    try {
      $scale = [Math]::Max(800 / $original.Width, 600 / $original.Height)
      $width = [int][Math]::Ceiling($original.Width * $scale); $height = [int][Math]::Ceiling($original.Height * $scale)
      $bitmap = [System.Drawing.Bitmap]::new(800, 600)
      try {
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try { $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic; $graphics.DrawImage($original, [int](($width - 800) / -2), [int](($height - 600) / -2), $width, $height) } finally { $graphics.Dispose() }
        $output = Join-Path (Resolve-Path 'imagens-trabalho/prontas') "$($item.patrimonio).jpg"
        $bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Jpeg)
      } finally { $bitmap.Dispose() }
    } finally { $original.Dispose() }
    $check = [System.Drawing.Image]::FromFile($output)
    try { if ($check.Width -ne 800 -or $check.Height -ne 600) { throw 'Dimensões inválidas.' } } finally { $check.Dispose() }
    $manifest += [pscustomobject]@{ patrimonio=$item.patrimonio; pixabayId=$source[0].id; pagina=$source[0].pagina; fotografo=$source[0].fotografo; fotografoUrl=$source[0].fotografoUrl; licenca=$source[0].licenca; arquivo="$($item.patrimonio).jpg" }
  } finally { Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue }
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding utf8
Write-Host 'Imagens preparadas localmente. Revise novamente antes de publicar manualmente.'
