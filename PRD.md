

# DropLock - Product Requirements Document (PRD)

**Version:** 1.1  
**Author:** Shodipo Micheal  
**Date:** April 2026  

---

## 1. Overview / Purpose
DropLock is a privacy-first, cloud-accessible text and file storage platform. Instead of requiring user accounts, users create “lockers” identified by a **unique name**. Each locker is secured with a **password** and can store encrypted text notes and files.  

**Key Goals:**  
- Simple, password-protected lockers instead of traditional user accounts.  
- Client-side encryption ensures only the user can read their notes/files.  
- Modern UI with drag-and-drop file uploads and responsive design.  
- Quick access to the last opened note for convenience.  

---

## 2. Target Audience
- Users who want fast, anonymous note storage without signing up  
- Professionals needing encrypted work notes  
- Students or researchers storing sensitive information  

---

## 3. Core Features

### 3.1 Locker System
- Input field for locker name  
- Check if locker exists:
  - If yes → ask for password  
  - If no → prompt user to set a password to create locker  
- Password-protect each locker individually  
- Lockers store encrypted notes + files  

### 3.2 Notepad Dashboard
- **Last opened note** loads by default  
- List of all notes on the left panel:
  - Add a new note  
  - Delete a note via an **X** button next to its name  
- Note content on the main panel  
- Drag-and-drop or button for **file uploads** inside each note:
  - Uploaded file fills the note area (100% of note size)  

### 3.3 Notes
- Client-side encryption per note (AES-256-GCM)  
- Each note has a unique ID in the locker  
- Optionally supports Markdown formatting  

### 3.4 File Storage
- Drag-and-drop or file selection upload  
- Files are displayed in a square covering the note area  
- Optional client-side encryption for files  

### 3.5 Security
- End-to-end encryption: locker name + password derive encryption keys  
- Password is **never sent to the server** in plaintext  
- Encrypted blobs stored in the backend only  

### 3.6 UI / UX
- Responsive layout: sidebar for notes, main panel for content  
- Animated or SVG background for modern aesthetic  
- Clean, intuitive controls for adding, deleting notes, and uploading files  

---

## 4. Functional Requirements

| Feature | Requirement | Priority |
|---------|------------|---------|
| Locker Name Input | Users can input a locker name | High |
| Locker Existence Check | System checks if locker exists | High |
| Password Prompt | Locker password verification | High |
| Note List | Display all notes on left sidebar | High |
| Note CRUD | Create, read, delete notes | High |
| Last Opened Note | Default open is last accessed note | High |
| File Upload | Drag/drop or button upload inside notes | High |
| File Display | Files take up entire note space | High |
| Client-side Encryption | Encrypt notes/files in browser | High |

---

## 5. Technical Requirements

**Frontend:**  
- React 18 + Tailwind CSS  
- Drag-and-drop support: `react-dropzone` or similar  
- State management: Redux or React Context  
- Optional animated backgrounds via `react-particles-js`  

**Backend:**  
- Golang (Go)  
- REST API endpoints:  
  - `/locker/check` (POST) → check if locker exists  
  - `/locker/create` (POST) → create new locker  
  - `/locker/open` (POST) → verify password and fetch data  
  - `/note/add` (POST) → add a note  
  - `/note/delete` (POST) → delete a note  
  - `/file/upload` (POST) → upload a file  
  - `/file/delete` (POST) → delete a file  
- Database: SQLite / PostgreSQL  
  - Table `lockers`: locker_name, password_hash, created_at  
  - Table `notes`: locker_id, note_id, note_name, encrypted_content  
  - Table `files`: note_id, file_id, encrypted_file_blob  

**Security:**  
- AES-256-GCM encryption client-side  
- Argon2id for password hashing and key derivation  
- HTTPS enforced  

**Deployment:**  
- Frontend: Vercel / Netlify  
- Backend: Railway / Fly.io / Render  
- Domain: `droplock.com`  

---

## 6. User Flow Diagram

```mermaid
flowchart TD
    A[User Visits DropLock] --> B{Enter Locker Name}
    B -->|Exists| C[Prompt for Password]
    B -->|Does not exist| D[Prompt to Create Password]
    C --> E{Password Correct?}
    E -->|Yes| F[Open Dashboard]
    E -->|No| C
    D --> G[Create Locker with Password]
    G --> F
    F --> H[Load Last Opened Note]
    F --> I[Sidebar: All Notes]
    I --> J[Create New Note]
    I --> K[Delete Note]
    H --> L[Add File via Drag & Drop]