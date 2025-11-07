#!/bin/bash

# Quick Start Script for Career Agent
# This script helps you set up the Career Agent quickly

echo "🚀 Career Agent - Quick Start"
echo "=============================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"
echo ""

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip is not installed. Please install pip first."
    exit 1
fi

echo "✅ pip found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  .env file not found"
    echo ""
    echo "Creating .env file template..."
    echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
    echo "OPENAI_MODEL=gpt-4o-mini" >> .env
    echo ""
    echo "📝 Please edit .env and add your OpenAI API key:"
    echo "   1. Get your key from: https://platform.openai.com/api-keys"
    echo "   2. Edit .env file: nano .env (or use any text editor)"
    echo "   3. Replace 'your_openai_api_key_here' with your actual key"
    echo ""
else
    echo "✅ .env file found"
    
    # Check if API key is set
    if grep -q "your_openai_api_key_here" .env; then
        echo "⚠️  Please update OPENAI_API_KEY in .env file"
        echo ""
    fi
fi

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo ""
echo "1. Add your OpenAI API key to .env file"
echo "2. Update the career_context_path in example_usage.py or interactive_cli.py"
echo "3. Run: python3 example_usage.py"
echo "   OR"
echo "   Run: python3 interactive_cli.py (for interactive mode)"
echo ""
echo "📚 For detailed setup, see SETUP_GUIDE.md"
echo ""









