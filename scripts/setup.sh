#!/bin/bash
set -euo pipefail

# This script sets up the local development environment.
# It is designed to be idempotent.

echo "🚀 Starting setup..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it to continue."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment variables
if [ ! -f .env ]; then
    echo "⚙️ Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️ Please update .env with your actual API keys."
else
    echo "✅ .env already exists."
fi

echo "✨ Setup complete! Run 'npm run dev' to start the development server."
