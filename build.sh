#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Installing Python Dependencies ---"
pip install --upgrade pip
pip install -r requirements.txt

echo "--- Build Finished. Starting Gunicorn... ---"
# This last line will be used by Render as the Start Command
gunicorn -c gunicorn_config.py app:app