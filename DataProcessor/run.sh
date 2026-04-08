#!/bin/bash
set -e

echo "Job working directory:"
pwd

echo "Looking for manage.py..."
APP_DIR=$(find /tmp -maxdepth 3 -type f -name manage.py 2>/dev/null | grep -v "/tmp/jobs/" | head -n 1 | xargs dirname)

if [ -z "$APP_DIR" ]; then
  echo "Could not find manage.py under /tmp"
  exit 1
fi

echo "Found app directory: $APP_DIR"
cd "$APP_DIR"

if [ -x "$APP_DIR/antenv/bin/python" ]; then
  PYTHON_BIN="$APP_DIR/antenv/bin/python"
else
  echo "Could not find virtualenv python in antenv"
  exit 1
fi

echo "Using Python: $PYTHON_BIN"
"$PYTHON_BIN" --version

echo "Starting scheduled trade signal processor..."
"$PYTHON_BIN" -u manage.py process_daily_signals --verbosity 2
echo "Trade signal processor finished."