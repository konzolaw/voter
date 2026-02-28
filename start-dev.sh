#!/bin/bash

echo "========================================"
echo "  RCC Voting System - Local Development"
echo "========================================"
echo ""

echo "[1/2] Starting Backend Server..."
cd backend
source venv/bin/activate
python manage.py runserver &
BACKEND_PID=$!

sleep 3

echo "[2/2] Starting Frontend Server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  Servers Running!"
echo "========================================"
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Admin:    http://localhost:3000/admin/login"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
