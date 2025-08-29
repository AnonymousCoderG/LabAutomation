#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Upgrade pip
pip install --upgrade pip

# 2. Install system dependencies for PyAudio and OpenCV
apt-get update && apt-get install -y portaudio19-dev libgl1-mesa-glx

# 3. Install Python packages from requirements.txt
pip install -r requirements.txt