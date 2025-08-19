#!/bin/bash

# Install dependencies
npm install

# Check for Vite compatibility issues and fix if needed
if npm install | grep -q "EBADENGINE"; then
  echo "Fixing Vite version..."
  npm uninstall vite
  npm install vite@6.0.0
  npm install
fi

# Install json-server globally
sudo npm install -g json-server

# Check if .env exists and contains VITE_URL
if [ -f .env ] && grep -q "VITE_URL=" .env; then
  echo ".env already exists with VITE_URL configured."
else
  echo "Creating .env with VITE_URL..."
  echo "VITE_URL='http://localhost:3000/'" > .env
fi

# Start json-server in the background
json-server --watch db.json --port 3000 &

# Start the development server
npm run dev
