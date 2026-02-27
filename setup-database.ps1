# PowerShell script to set up database using Docker
# Run this script if you have Docker installed

Write-Host "Setting up PostgreSQL database using Docker..." -ForegroundColor Green

# Check if Docker is installed
$dockerCheck = docker --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host "Docker is installed. Proceeding..." -ForegroundColor Green

# Pull PostgreSQL image
Write-Host "Pulling PostgreSQL image..." -ForegroundColor Yellow
docker pull postgres:15

# Run PostgreSQL container
Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
docker run --name edvance-db `
    -e POSTGRES_PASSWORD=postgres `
    -e POSTGRES_DB=edvance `
    -p 5432:5432 `
    -d postgres:15

if ($LASTEXITCODE -eq 0) {
    Write-Host "PostgreSQL container started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database Details:" -ForegroundColor Cyan
    Write-Host "  Host: localhost" -ForegroundColor White
    Write-Host "  Port: 5432" -ForegroundColor White
    Write-Host "  Database: edvance" -ForegroundColor White
    Write-Host "  Username: postgres" -ForegroundColor White
    Write-Host "  Password: postgres" -ForegroundColor White
    Write-Host ""
    Write-Host "Update your server/.env file with:" -ForegroundColor Yellow
    Write-Host 'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/edvance?schema=public' -ForegroundColor White
    Write-Host ""
    Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Verify database
    Write-Host "Verifying database..." -ForegroundColor Yellow
    docker exec edvance-db psql -U postgres -c "\l" | Select-String "edvance"
    
    Write-Host ""
    Write-Host "Database setup complete! You can now run Prisma migrations." -ForegroundColor Green
} else {
    Write-Host "Failed to start PostgreSQL container." -ForegroundColor Red
    Write-Host "Make sure Docker is running and port 5432 is available." -ForegroundColor Yellow
}






