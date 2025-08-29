#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Starting build process ---"
echo "--> Step 1: Upgrading pip..."
pip install --upgrade pip

# Use sudo to ensure we have permissions to install system packages
echo "--> Step 2: Installing system dependencies (portaudio)..."
sudo apt-get update && sudo apt-get install -y portaudio19-dev

echo "--> Step 3: Installing Python packages from requirements.txt..."
pip install -r requirements.txt

echo "--- Build process finished successfully! ---"