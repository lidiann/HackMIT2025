#!/bin/bash

echo "🌱 Eden AI Sustainability Counter - Development Setup"
echo "====================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🚀 Development Options:"
echo "1. Web Development (Recommended):"
echo "   npm run dev"
echo "   Then open: http://localhost:8080"
echo ""
echo "2. Chrome Extension Development:"
echo "   npm run build"
echo "   Then load the 'dist' folder in Chrome"
echo ""
echo "📁 Key files to edit:"
echo "   - src/components/AIUsageDashboard.tsx (main dashboard)"
echo "   - src/components/TokenCounter.tsx (token counter)"
echo "   - src/hooks/useAIUsage.ts (data management)"
echo "   - content.js (Claude.ai monitoring)"
echo ""
echo "🎉 Setup complete! Happy coding!"
