#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Starting build process ---"

# 1. Upgrade pip
echo "--> Upgrading pip..."
pip install --upgrade pip

# 2. Install system dependencies for PyAudio
echo "--> Installing system dependencies (portaudio and alsa)..."
apt-get update && apt-get install -y portaudio19-dev libasound2-dev

# 3. Install Python packages from requirements.txt
echo "--> Installing Python packages..."
pip install -r requirements.txt

echo "--- Build process finished successfully! ---"