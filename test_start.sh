#!/bin/bash
cd backend/auth_service
source ../../.venv/bin/activate
uvicorn main:app --port 8002 --reload
