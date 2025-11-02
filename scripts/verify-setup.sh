#!/bin/bash

echo "🔍 Verifying Aplikasi BK Sekolah Setup..."
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
node --version

# Check npm
echo "✓ Checking npm..."
npm --version

# Check Docker
echo "✓ Checking Docker..."
docker --version

# Check if PostgreSQL container is running
echo "✓ Checking PostgreSQL container..."
if docker ps | grep -q "aplikasi-bk-postgres"; then
    echo "  PostgreSQL container is running ✓"
else
    echo "  PostgreSQL container is NOT running ✗"
    echo "  Run: docker-compose up -d"
fi

# Check if node_modules exists
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  Dependencies installed ✓"
else
    echo "  Dependencies NOT installed ✗"
    echo "  Run: npm install"
fi

# Check if .env.local exists
echo "✓ Checking environment variables..."
if [ -f ".env.local" ]; then
    echo "  .env.local exists ✓"
else
    echo "  .env.local NOT found ✗"
    echo "  Run: cp .env.example .env.local"
fi

echo ""
echo "✅ Setup verification complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run db:migrate' to create database schema (after Task 2)"
echo "2. Run 'npm run dev' to start development server"
