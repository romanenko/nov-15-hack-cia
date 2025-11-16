#!/bin/bash
set -e

echo "🔧 Setting up workspace..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js $(node --version) detected"
echo "✓ npm $(npm --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
if ! npm install; then
    echo "❌ Error: Failed to install dependencies. Check the output above for details."
    exit 1
fi

echo "✓ Dependencies installed successfully"

# Check for .env file in root and symlink it
if [ -n "$CONDUCTOR_ROOT_PATH" ] && [ -f "$CONDUCTOR_ROOT_PATH/.env" ]; then
    echo "🔗 Symlinking .env file from root..."
    ln -sf "$CONDUCTOR_ROOT_PATH/.env" .env
    echo "✓ .env file symlinked"
elif [ -n "$CONDUCTOR_ROOT_PATH" ] && [ -f "$CONDUCTOR_ROOT_PATH/.env.example" ]; then
    echo "📋 No .env file found in root, but .env.example exists"
    echo "ℹ️  You may want to create a .env file in the root directory"
else
    echo "ℹ️  No .env file found (this may be okay if you don't need environment variables)"
fi

# Copy .env.development.local if it exists in root
if [ -n "$CONDUCTOR_ROOT_PATH" ] && [ -f "$CONDUCTOR_ROOT_PATH/.env.development.local" ]; then
    echo "📋 Copying .env.development.local from root..."
    cp "$CONDUCTOR_ROOT_PATH/.env.development.local" .env.development.local
    echo "✓ .env.development.local copied"
elif [ -n "$CONDUCTOR_ROOT_PATH" ]; then
    echo "ℹ️  No .env.development.local found in root (this may be okay)"
fi

echo ""
echo "✅ Workspace setup complete!"
echo "   Run 'npm run dev' to start the development server"
