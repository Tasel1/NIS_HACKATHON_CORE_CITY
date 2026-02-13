#!/bin/bash
# Deployment preparation script

echo "Preparing Core City Platform for Render deployment..."

# Install dependencies
echo "Installing dependencies..."
npm install
cd backend && npm install && cd ..

# Build the frontend
echo "Building frontend..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "Files in dist directory:"
    ls -la dist/
    echo ""
    echo "Deployment package ready!"
    echo ""
    echo "To deploy to Render:"
    echo "1. Push this code to a GitHub repository"
    echo "2. Create a new Web Service on Render"
    echo "3. Point it to your GitHub repository"
    echo "4. Use build command: npm install && npm run build"
    echo "5. Use start command: npm start"
    echo "6. Add environment variables as specified in Render.yaml"
else
    echo "❌ Build failed!"
    exit 1
fi