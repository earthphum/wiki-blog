#!/bin/bash

# รัน backend
echo "Starting backend..."
cd backend || {
  echo "Backend folder not found"
  exit 1
}
npm install
mkdir -p content
cd content
mkdir Aboutme
cd Aboutme
touch Readme.md
cd ..
cd ..
node index.js &
BACKEND_PID=$!
echo $BACKEND_PID >../backend.pid
echo "Backend PID: $BACKEND_PID"

# รัน frontend
echo "Starting frontend..."
cd ../frontend || {
  echo "Frontend folder not found"
  exit 1
}
npm install
npm run dev &
FRONTEND_PID=$!
echo $FRONTEND_PID >../frontend.pid
echo "Frontend PID: $FRONTEND_PID"

echo "Both backend and frontend are running in background."
