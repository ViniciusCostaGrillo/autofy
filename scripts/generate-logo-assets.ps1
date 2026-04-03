Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

function New-RoundedRectanglePath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function New-PolygonPath {
  param(
    [System.Drawing.PointF[]]$Points
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddPolygon($Points)
  return $path
}

function New-CurvePath {
  param(
    [System.Drawing.PointF[]]$Points,
    [float]$Width
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddCurve($Points, 0.45)

  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $Width)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  $widened = $path.Clone()
  $widened.Widen($pen)
  $pen.Dispose()
  $path.Dispose()

  return $widened
}

function Draw-LogoMark {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$Size,
    [bool]$TransparentOnly = $false
  )

  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  if (-not $TransparentOnly) {
    $shadowPath = New-RoundedRectanglePath ($Size * 0.1) ($Size * 0.12) ($Size * 0.8) ($Size * 0.8) ($Size * 0.14)
    $shadowColor = [System.Drawing.Color]::FromArgb(46, 0, 0, 0)
    $shadowBrush = New-Object System.Drawing.SolidBrush($shadowColor)
    $Graphics.FillPath($shadowBrush, $shadowPath)
    $shadowBrush.Dispose()
    $shadowPath.Dispose()

    $tilePath = New-RoundedRectanglePath ($Size * 0.09) ($Size * 0.08) ($Size * 0.82) ($Size * 0.82) ($Size * 0.14)
    $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      [System.Drawing.PointF]::new($Size * 0.16, $Size * 0.08),
      [System.Drawing.PointF]::new($Size * 0.82, $Size * 0.88),
      [System.Drawing.ColorTranslator]::FromHtml('#5FD13B'),
      [System.Drawing.ColorTranslator]::FromHtml('#0E5F2B')
    )
    $Graphics.FillPath($gradient, $tilePath)
    $gradient.Dispose()

    $highlightPath = New-RoundedRectanglePath ($Size * 0.14) ($Size * 0.11) ($Size * 0.72) ($Size * 0.18) ($Size * 0.09)
    $highlightBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      [System.Drawing.PointF]::new($Size * 0.18, $Size * 0.12),
      [System.Drawing.PointF]::new($Size * 0.62, $Size * 0.28),
      [System.Drawing.Color]::FromArgb(54, 255, 255, 255),
      [System.Drawing.Color]::FromArgb(0, 255, 255, 255)
    )
    $Graphics.FillPath($highlightBrush, $highlightPath)
    $highlightBrush.Dispose()
    $highlightPath.Dispose()
    $tilePath.Dispose()
  }

  $leftStroke = New-PolygonPath @(
    [System.Drawing.PointF]::new($Size * 0.32, $Size * 0.73),
    [System.Drawing.PointF]::new($Size * 0.47, $Size * 0.30),
    [System.Drawing.PointF]::new($Size * 0.56, $Size * 0.30),
    [System.Drawing.PointF]::new($Size * 0.45, $Size * 0.55),
    [System.Drawing.PointF]::new($Size * 0.40, $Size * 0.59)
  )

  $rightStroke = New-PolygonPath @(
    [System.Drawing.PointF]::new($Size * 0.49, $Size * 0.30),
    [System.Drawing.PointF]::new($Size * 0.58, $Size * 0.30),
    [System.Drawing.PointF]::new($Size * 0.69, $Size * 0.56),
    [System.Drawing.PointF]::new($Size * 0.62, $Size * 0.55),
    [System.Drawing.PointF]::new($Size * 0.54, $Size * 0.36)
  )

  $road = New-CurvePath @(
    [System.Drawing.PointF]::new($Size * 0.25, $Size * 0.74),
    [System.Drawing.PointF]::new($Size * 0.39, $Size * 0.65),
    [System.Drawing.PointF]::new($Size * 0.54, $Size * 0.56),
    [System.Drawing.PointF]::new($Size * 0.64, $Size * 0.57),
    [System.Drawing.PointF]::new($Size * 0.69, $Size * 0.69)
  ) ($Size * 0.086)

  $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

  if (-not $TransparentOnly) {
    $markShadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 0, 0, 0))
    $matrix = New-Object System.Drawing.Drawing2D.Matrix
    $matrix.Translate($Size * 0.012, $Size * 0.018)

    foreach ($shape in @($leftStroke, $rightStroke, $road)) {
      $shadowShape = $shape.Clone()
      $shadowShape.Transform($matrix)
      $Graphics.FillPath($markShadow, $shadowShape)
      $shadowShape.Dispose()
    }

    $markShadow.Dispose()
    $matrix.Dispose()
  }

  $Graphics.FillPath($whiteBrush, $leftStroke)
  $Graphics.FillPath($whiteBrush, $rightStroke)
  $Graphics.FillPath($whiteBrush, $road)

  $whiteBrush.Dispose()
  $leftStroke.Dispose()
  $rightStroke.Dispose()
  $road.Dispose()
}

function Save-Bitmap {
  param(
    [string]$Path,
    [int]$Width,
    [int]$Height,
    [scriptblock]$Painter
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::Transparent)

  & $Painter $graphics

  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

$root = Split-Path -Parent $PSScriptRoot
$imagesDir = Join-Path $root 'assets\images'

Save-Bitmap (Join-Path $imagesDir 'icon.png') 1024 1024 {
  param($graphics)
  Draw-LogoMark -Graphics $graphics -Size 1024
}

Save-Bitmap (Join-Path $imagesDir 'adaptive-icon.png') 1024 1024 {
  param($graphics)
  Draw-LogoMark -Graphics $graphics -Size 1024 -TransparentOnly $true
}

Save-Bitmap (Join-Path $imagesDir 'splash-icon.png') 1024 1024 {
  param($graphics)
  Draw-LogoMark -Graphics $graphics -Size 1024 -TransparentOnly $true
}

Save-Bitmap (Join-Path $imagesDir 'favicon.png') 48 48 {
  param($graphics)
  Draw-LogoMark -Graphics $graphics -Size 48
}
