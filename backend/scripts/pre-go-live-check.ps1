param(
  [Parameter(Mandatory = $false)]
  [string]$ApiBaseUrl = "http://localhost:4000",

  [Parameter(Mandatory = $false)]
  [string]$AdminEmail = "admin@fawn.local",

  [Parameter(Mandatory = $false)]
  [string]$AdminPassword = "admin123",

  [Parameter(Mandatory = $false)]
  [string]$ViewerEmail = "viewer@fawn.local",

  [Parameter(Mandatory = $false)]
  [string]$ViewerPassword = "viewer123"
)

$ErrorActionPreference = "Stop"

Write-Host "Running pre-go-live checks against $ApiBaseUrl" -ForegroundColor Cyan

$health = Invoke-RestMethod -Uri "$ApiBaseUrl/health" -Method Get
if ($health.status -ne "ok") {
  throw "Health endpoint returned unexpected status: $($health.status)"
}
Write-Host "[OK] Health check passed" -ForegroundColor Green

$adminLogin = Invoke-RestMethod -Uri "$ApiBaseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body (@{
  email = $AdminEmail
  password = $AdminPassword
} | ConvertTo-Json)

if (-not $adminLogin.accessToken) {
  throw "Admin login did not return access token"
}

$adminToken = [string]$adminLogin.accessToken
if ([string]::IsNullOrWhiteSpace($adminToken)) {
  throw "Admin login returned empty token"
}

$adminHeaders = @{ "Authorization" = "Bearer $($adminToken.Trim())" }

$me = Invoke-RestMethod -Uri "$ApiBaseUrl/api/me" -Method Get -Headers $adminHeaders
if (-not $me.user -or -not $me.user.email) {
  throw "Me endpoint did not return user payload"
}
Write-Host "[OK] /api/me passed for admin" -ForegroundColor Green

$adminPing = Invoke-RestMethod -Uri "$ApiBaseUrl/api/admin/ping" -Method Get -Headers $adminHeaders
if ($adminPing.message -ne "admin access confirmed") {
  throw "Admin ping returned unexpected message: $($adminPing.message)"
}
Write-Host "[OK] /api/admin/ping passed for admin" -ForegroundColor Green

$viewerLogin = Invoke-RestMethod -Uri "$ApiBaseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body (@{
  email = $ViewerEmail
  password = $ViewerPassword
} | ConvertTo-Json)

if (-not $viewerLogin.accessToken) {
  throw "Viewer login did not return access token"
}

$viewerToken = [string]$viewerLogin.accessToken
if ([string]::IsNullOrWhiteSpace($viewerToken)) {
  throw "Viewer login returned empty token"
}

$viewerHeaders = @{ "Authorization" = "Bearer $($viewerToken.Trim())" }

$viewerDenied = $false
try {
  Invoke-RestMethod -Uri "$ApiBaseUrl/api/admin/ping" -Method Get -Headers $viewerHeaders | Out-Null
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  if ($statusCode -eq 403) {
    $viewerDenied = $true
  } else {
    throw "Viewer admin check failed with unexpected status code: $statusCode"
  }
}

if (-not $viewerDenied) {
  throw "Viewer should have been denied on /api/admin/ping"
}
Write-Host "[OK] Role guard check passed (viewer denied admin route)" -ForegroundColor Green

Write-Host "All pre-go-live checks passed." -ForegroundColor Green
