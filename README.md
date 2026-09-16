# Smart Document Platform

A full-stack document management platform built with **FastAPI, PostgreSQL, SQLAlchemy, JWT Authentication, React, TypeScript, and Vite**.

The platform allows users to authenticate, create workspaces, manage documents, upload files, maintain document versions, organize documents, and manage permissions.

## 🚀 Features

### 🔐 Authentication

* User registration
* User login
* JWT authentication
* Logout
* Email verification
* Forgot password
* Reset password
* Protected API requests

### 🏢 Workspace Management

* Create workspaces
* View workspaces
* Open workspace details
* Workspace-based document management

### 📄 Document Management

* Create documents
* View documents
* Update documents
* Delete documents
* Workspace-based documents

### 🕒 Document Version History

* Create document versions
* View version history
* Restore previous document versions

### 📁 File Management

* Upload files
* Download files
* Rename files
* Delete files
* Workspace-based file listing

Supported file formats:

* PDF
* DOCX
* XLSX
* PNG
* JPG
* JPEG
* TXT

### 📂 Folder Support

* Folder model and backend support
* Assign documents to folders
* Organize documents using folders

### 👥 Permissions

Document permission system with the following roles:

* Viewer
* Editor
* Commenter

Permissions are associated with users, documents, and workspaces.

### 👨‍👩‍👧 Workspace Members

* Workspace member model
* Member management backend
* Workspace-based team structure

### ✍️ Rich Text Editor

* Basic rich text document editing
* Document content management

## 🛠️ Technology Stack

### Backend

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL
* Pydantic
* JWT Authentication
* Uvicorn

### Frontend

* React
* TypeScript
* Vite
* Axios
* HTML
* CSS

## 📁 Project Structure

```text
smart-document-platform/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── utils/
│   │   └── main.py
│   │
│   ├── uploads/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── VerifyEmail.tsx
│   │   │   ├── Workspaces.tsx
│   │   │   └── Workspace.tsx
│   │   │
│   │   ├── services/
│   │   │   └── api.ts
│   │   │
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── ...
│
└── README.md
```

## 🔌 Main API Routes

### Authentication

```text
POST /auth/register
POST /auth/login
GET  /auth/verify-email
POST /auth/forgot-password
POST /auth/reset-password
```

### File Management

```text
POST /upload/
GET  /upload/workspace/{workspace_id}
GET  /upload/{file_id}/download
```

Additional file operations include rename and delete.

### Permissions

Supported permission roles:

```text
viewer
editor
commenter
```

## 🔄 Application Flow

```text
Register
   ↓
Email Verification
   ↓
Login
   ↓
Dashboard
   ↓
Workspaces
   ↓
Workspace
   ↓
Documents / Files
```

## 🗄️ Database

The application uses **PostgreSQL** with **SQLAlchemy ORM**.

The backend contains database models for:

* Users
* Workspaces
* Workspace Members
* Documents
* Document Versions
* Folders
* Files
* Permissions
* Comments

## ⚙️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/zakriyawahid83-crypto/smart-document.git
cd smart-document
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/smart_document
SECRET_KEY=your_secret_key
```

### 4. Run Backend

```bash
uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 5. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## 🔗 Frontend & Backend

The React frontend communicates with the FastAPI backend using **Axios**.

The frontend sends the JWT token with authenticated API requests.

Backend API:

```text
http://127.0.0.1:8000
```

Frontend:

```text
http://localhost:5173
```

## 📌 Current Implementation

* [x] Authentication
* [x] Registration
* [x] Login
* [x] Logout
* [x] Email verification
* [x] Forgot/reset password
* [x] JWT authentication
* [x] Workspaces
* [x] Documents CRUD
* [x] Document version history
* [x] Version restore
* [x] File upload
* [x] File download
* [x] File rename
* [x] File delete
* [x] Folder support
* [x] Document permissions
* [x] Workspace members
* [x] Basic rich text editor
* [x] React frontend
* [x] FastAPI backend
* [x] PostgreSQL database
* [x] SQLAlchemy ORM
* [x] Axios API integration

## 👨‍💻 Developer

**Zakriya Wahid**

Computer Science — 2nd Year Student
Future Software Engineer

GitHub: `zakriyawahid83-crypto`

## 📄 License

This project is developed as a learning and portfolio project.
