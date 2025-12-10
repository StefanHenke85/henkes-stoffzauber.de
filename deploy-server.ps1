$password = "o6gZZqiM"
$server = "root@81.7.11.191"

Write-Host "🚀 Deploying to Production Server..." -ForegroundColor Green
Write-Host ""

# Create plink command file with password
$commands = @"
cd /var/www/henkes-stoffzauber.de
git fetch --all
git reset --hard origin/main
git pull origin main
cd web
npm run build
cd /var/www/henkes-api
pm2 restart henkes-api
pm2 status
"@

# Save commands to temp file
$commands | Out-File -FilePath "temp_commands.txt" -Encoding ASCII

# Use plink (PuTTY) to execute
Write-Host "Connecting to server..."
echo y | plink -pw $password $server "bash -s" < temp_commands.txt

# Cleanup
Remove-Item "temp_commands.txt" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
