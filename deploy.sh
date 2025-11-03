#!/bin/bash

# Career Agent Deployment Helper Script
# This script helps you deploy to various platforms

set -e

echo "🚀 Career Agent Deployment Helper"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Please create a .env file with:"
    echo "  OPENAI_API_KEY=your_key_here"
    echo "  OPENAI_MODEL=gpt-4o-mini"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Select deployment platform:"
echo "1) Vercel (Serverless)"
echo "2) Render (Web Service)"
echo "3) Docker (Build Image)"
echo "4) Test Locally"
echo ""

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📦 Deploying to Vercel..."
        echo ""
        if ! command -v vercel &> /dev/null; then
            echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
            exit 1
        fi
        echo "1. Make sure you're logged in: vercel login"
        echo "2. Set environment variables: vercel env add OPENAI_API_KEY"
        echo "3. Deploying..."
        vercel
        echo ""
        echo "✅ Deployment initiated! Check Vercel dashboard for status."
        ;;
    2)
        echo ""
        echo "📦 Preparing for Render deployment..."
        echo ""
        echo "✅ Render configuration file (render.yaml) is ready!"
        echo ""
        echo "Next steps:"
        echo "1. Push code to GitHub/GitLab"
        echo "2. Go to https://dashboard.render.com"
        echo "3. Create New Web Service"
        echo "4. Connect your repository"
        echo "5. Render will auto-detect render.yaml"
        echo "6. Set environment variables in Render dashboard:"
        echo "   - OPENAI_API_KEY"
        echo "   - OPENAI_MODEL (optional)"
        echo ""
        echo "Ready to push to git? (y/n)"
        read -p "" -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "📤 Pushing to git..."
            git status
            echo ""
            echo "Make sure you've committed changes, then push to your repository."
        fi
        ;;
    3)
        echo ""
        echo "🐳 Building Docker image..."
        echo ""
        docker build -t career-agent:latest .
        echo ""
        echo "✅ Docker image built: career-agent:latest"
        echo ""
        echo "To run locally:"
        echo "  docker run -p 8000:8000 \\"
        echo "    -e OPENAI_API_KEY=your_key \\"
        echo "    -e OPENAI_MODEL=gpt-4o-mini \\"
        echo "    career-agent:latest"
        echo ""
        echo "To tag for registry:"
        echo "  docker tag career-agent:latest your-registry/career-agent:latest"
        echo "  docker push your-registry/career-agent:latest"
        ;;
    4)
        echo ""
        echo "🧪 Testing locally..."
        echo ""
        echo "Starting server on http://localhost:8000"
        echo "Press Ctrl+C to stop"
        echo ""
        python3 api_server_multi_tenant.py
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

