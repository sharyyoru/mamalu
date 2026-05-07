# Test Email Script for Mamalu Kitchen
# Run these commands to test different email types

Write-Host "=== Mamalu Kitchen Email Tests ===" -ForegroundColor Cyan
Write-Host ""

$email = "ralf@mutant.ae"
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
Write-Host "=== Tests Complete ===" -ForegroundColor Green
Write-Host "Check $email for the test emails!" -ForegroundColor Green
