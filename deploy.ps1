# deploy.ps1 (Run this from Root)
Write-Host "Deploying Mobile Web App..."
Write-Host "---------------------------"

# 1. Go to mobile app directory
Set-Location "apps/mobile"

# 2. Build
Write-Host "Building project..."
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build Successful."
    
    # 3. Deploy
    Write-Host "Deploying to Vercel..."
    # --prod ensures it updates the main link
    npx vercel --prod
} else {
    Write-Host "Build Failed!"
    exit 1
}

# 4. Return to root (optional in script scope but good practice)
Set-Location ../..
Write-Host "Done."
