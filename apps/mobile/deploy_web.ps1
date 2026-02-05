# deploy_web.ps1 for Windows
Write-Host "Project: Babki Mobile (Web)"
Write-Host "Step 1: Building..."

# Run the build script
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build Success! Files are in 'dist' folder."
    Write-Host "---------------------------------------------------"
    Write-Host "Step 2: Deploying..."
    Write-Host "If you use Vercel, run this command next:"
    Write-Host "npx vercel --prod"
    Write-Host "---------------------------------------------------"
} else {
    Write-Host "Build Failed. Please check errors above."
}
