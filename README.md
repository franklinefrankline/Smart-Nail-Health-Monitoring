# Smart Nail Health Monitoring System

A professional, full-stack health-tech web application for image-based nail health monitoring. 

Designed with a premium "Glass Health" & "Fresh Clinical" UI aesthetic, this application provides users with deterministic health scores, risk classifications, and actionable recommendations based on computer vision feature extraction.

## 🚀 Features

* **Premium Responsive UI**: Mobile-first design strictly built with HTML5, CSS3, and Vanilla JS.
* **Dual UI Modes**: Switch instantly between Fresh Clinical and Glass Health aesthetics.
* **Intelligent Image Analysis**: OpenCV-backed extraction of brightness, contrast, color variation, and texture scores.
* **Deterministic Health Scoring**: Advanced mapping algorithms to generate a 0-100 score and determine Low/Moderate/High risk levels.
* **Secure Authentication**: JWT-based auth with password strength validation.
* **PDF Report Generation**: Instantly download analysis reports in PDF format.
* **Mobile Camera Integration**: Directly use the mobile device camera (`capture="environment"`) for image uploads.

## 🛠 Technology Stack

**Frontend**:
* HTML5, CSS3, Vanilla JavaScript (No React/Vue/Angular)
* Chart.js (Data Visualization)
* FontAwesome 6.4 (Icons)

**Backend**:
* Python 3.10+
* FastAPI (High-performance API)
* SQLAlchemy (ORM)
* Uvicorn (ASGI server)
* OpenCV & Pillow & NumPy (Computer Vision & Image Processing)
* FPDF2 (PDF Generation)
* PyJWT & Passlib (Security)

**Database**:
* PostgreSQL

**Testing**:
* Playwright & Pytest

## 📦 Local Installation Guide

### 1. Database Setup
Ensure PostgreSQL is installed and running. Create the database:
```sql
CREATE DATABASE smart_nail_db;
```
Initialize the schema:
```bash
psql -U postgres -d smart_nail_db -f database/schema.sql
```

### 2. Backend Setup
Navigate to the backend directory and set up the virtual environment:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Configure environment variables in `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:YOURPASSWORD@localhost:5432/smart_nail_db
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Start the backend server:
```bash
uvicorn app.main:app --reload
```
The API will run on `http://127.0.0.1:8000`

### 3. Frontend Setup
The frontend is completely static. Simply serve the `frontend` folder using any local web server (e.g., VS Code Live Server, Python's http.server).
```bash
# Using python HTTP server
cd frontend
python -m http.server 5500
```
Open `http://127.0.0.1:5500` in your browser.

## ☁️ Deployment

### Backend (Render)
The backend is configured for easy deployment on [Render](https://render.com/).
1. Push your repository to GitHub.
2. In the Render Dashboard, create a **New Blueprint Instance**.
3. Connect your GitHub repository.
4. Render will automatically detect the `render.yaml` file and provision the Web Service and PostgreSQL database.
5. Once deployed, note your backend URL (e.g., `https://smart-nail-backend.onrender.com`).

### Frontend (Vercel)
The frontend is configured to be hosted on [Vercel](https://vercel.com/) with automatic API rewrites.
1. Update `frontend/vercel.json` and replace `YOUR_RENDER_BACKEND_URL` with your actual Render backend URL.
2. In the Vercel Dashboard, create a **New Project**.
3. Connect your GitHub repository.
4. Set the **Root Directory** to `frontend`.
5. Click **Deploy**. Your frontend will now securely communicate with your Render backend.

## 🧪 Testing
To run the Playwright E2E tests:
```bash
cd tests
playwright install
pytest test_e2e.py
```

## ⚠️ Disclaimer
**This is an academic/portfolio project.** The "Smart Nail Health Monitoring System" provides preliminary image-based insights for awareness. It is **not** a medical diagnostic tool. Please consult a qualified healthcare professional for diagnosis or treatment.
