param(
    [string]$Email = $env:TEST_EMAIL
)

# Test Email Script for Mamalu Kitchen
# Resend's onboarding@resend.dev sender can only send to your Resend account email.

Write-Host "=== Mamalu Kitchen Email Tests ===" -ForegroundColor Cyan
Write-Host ""

if (-not $Email) {
    Write-Host "Provide your Resend account email with -Email or TEST_EMAIL." -ForegroundColor Red
    Write-Host "Example: .\test-emails.ps1 -Email you@example.com" -ForegroundColor Yellow
    exit 1
}

$email = $Email
$baseUrl = "http://localhost:3000"
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "1. Testing Gift Card/Voucher Email..." -ForegroundColor Yellow
$body1 = @{
    type = "voucher"
    email = $email
} | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/api/test-email" -Method Post -Headers $headers -Body $body1

Write-Host ""
Write-Host ""

Write-Host "2. Testing Voucher Redemption Email..." -ForegroundColor Yellow
$body2 = @{
    type = "redemption"
    email = $email
} | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/api/test-email" -Method Post -Headers $headers -Body $body2

Write-Host ""
Write-Host ""

Write-Host "3. Testing Booking Confirmation Email..." -ForegroundColor Yellow
$body3 = @{
    type = "booking"
    email = $email
} | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/api/test-email" -Method Post -Headers $headers -Body $body3

Write-Host ""
Write-Host ""

Write-Host "4. Testing Service Booking Confirmation Email..." -ForegroundColor Yellow
$body4 = @{
    type = "service-booking"
    email = $email
} | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/api/test-email" -Method Post -Headers $headers -Body $body4

Write-Host ""
Write-Host ""
Write-Host "=== Tests Complete ===" -ForegroundColor Green
Write-Host "Check $email for the test emails!" -ForegroundColor Green
