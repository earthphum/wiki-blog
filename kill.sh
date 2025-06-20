#!/bin/bash

# Kill backend
if [ -f backend.pid ]; then
  BACKEND_PID=$(cat backend.pid)
  echo "Killing backend process $BACKEND_PID..."
  kill $BACKEND_PID
  rm backend.pid
  rm -rf backend/content/
else
  echo "backend.pid file not found."
fi

# Kill frontend
if [ -f frontend.pid ]; then
  FRONTEND_PID=$(cat frontend.pid)
  echo "Killing frontend process $FRONTEND_PID..."
  kill $FRONTEND_PID
  rm frontend.pid
else
  echo "frontend.pid file not found."
fi
