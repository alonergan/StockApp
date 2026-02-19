# StockApp — Local Development Setup Guide (Windows)

This project runs:

- PostgreSQL (Docker)
- Django + Django REST Framework (Backend)
- React (Frontend)

This guide will get everything running locally.

---

# 1️⃣ Prerequisites

Install:

- Git  
- Python 3.x  
- Node.js (LTS)  
- Docker Desktop (WSL2 enabled)

Verify installation:

    python --version
    node --version
    npm --version
    docker --version
    docker compose version

---

# 2️⃣ Clone the Repository

    git clone <REPO_URL>
    cd StockApp

---

# 3️⃣ Start PostgreSQL (Docker)

From the project root (where docker-compose.yml is located):

    docker compose up -d
    docker compose ps

You should see something like:

    trading_pg   postgres:16   Up   0.0.0.0:5433->5432/tcp

We use port 5433 locally to avoid conflicts with Windows Postgres.

---

## Verify Database

    docker exec -it trading_pg psql -U StockTrader -d TradingDB -c "SELECT current_user, current_database();"

If that works, the database is running correctly.

---

## Reset Database (if authentication fails)

    docker compose down
    docker volume rm pgdata
    docker compose up -d

---

# 4️⃣ Backend Setup (Django)

## 4.1 Create Virtual Environment

    cd Backend
    py -m venv .venv
    .\.venv\Scripts\activate
    python -m pip install --upgrade pip

## 4.2 Install Dependencies

If requirements.txt exists:

    pip install -r requirements.txt

If not:

    pip install django djangorestframework psycopg2-binary python-dotenv django-cors-headers
    pip freeze > requirements.txt

---

## 4.3 Create Environment File (If it does not exist)

Create:

    StockApp/Backend/.env

Add:

    DEBUG=True
    SECRET_KEY=dev-only-change-me
    ALLOWED_HOSTS=127.0.0.1,localhost

    DB_NAME=TradingDB
    DB_USER=StockTrader
    DB_PASSWORD=P@ssw0rd!
    DB_HOST=127.0.0.1
    DB_PORT=5433

---

## 4.4 Run Migrations

    python manage.py migrate

Optional (admin access):

    python manage.py createsuperuser

---

## 4.5 Start Backend Server

    python manage.py runserver

Backend runs at:

    http://127.0.0.1:8000

---

# 5️⃣ Important Django Settings

CORS Configuration (/Backend/config/settings.py):

    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

CORS middleware should be first in MIDDLEWARE:

    MIDDLEWARE = [
        "corsheaders.middleware.CorsMiddleware",
        ...
    ]

---

# 6️⃣ Frontend Setup (React)

## Run Front End Server

    cd frontend
    npm run dev

Frontend runs at:

    http://localhost:5173

---

# 7️⃣ Daily Development Workflow

- This is for use when you have everything setup and want to run the app at a different time

Start Database:

    docker compose up -d

Start Backend:

    cd Backend
    .\.venv\Scripts\activate
    python manage.py runserver

Start Frontend:

    cd frontend
    npm run dev

---

# Architecture Overview

- React calls Django REST API
- Django handles business logic and database interaction
- PostgreSQL is the source of truth
- Future trading engine will be a background worker writing to the database
- Frontend reads latest state from the database via API
