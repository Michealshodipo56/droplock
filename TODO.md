# DropLock Development Roadmap 🚀

This list tracks the remaining tasks for the DropLock privacy-first storage platform.

## 🎨 UI & Frontend Polish
- [ ] **About Page**: Implement the `about.html` page explaining the privacy mission.
- [ ] **Advanced Recovery Page**: Build out the `recovery.html` flow (Security Questions input).
- [ ] **Recent Vaults Logic**: Implement `localStorage` to save and display recently visited locker names in a dropdown/modal.
- [ ] **File Transfer Interface**: Design and build the "Logged In" view (Note editor + Drag-and-drop file uploader).
- [ ] **Micro-animations**: Add smoother transitions when switching between themes and opening modals.

## 🔐 Security (Client-Side)
- [ ] **Crypto Module**: Implement AES-256-GCM encryption using the Web Crypto API (`window.crypto.subtle`).
- [ ] **Key Derivation**: Use Argon2id (wasm) or PBKDF2 to derive encryption keys from locker passwords.
- [ ] **Zero-Knowledge Check**: Audit code to ensure passwords and unencrypted data never leave the browser.

## ⚙️ Backend Integration (Go)
- [ ] **Go API Setup**: Initialize the Go backend (Standard library or Gin/Echo).
- [ ] **Locker Endpoints**: Create REST API for locker initialization and identifier verification.
- [ ] **Storage Layer**: Implement secure storage for encrypted payloads (PostgreSQL or local file-based storage).
- [ ] **Ephemeral Logic**: Implement the auto-purge logic for old/inactive lockers.

## 🧪 Testing & Deployment
- [ ] **Connectivity Test**: Ensure the UI talks to the Go backend via `fetch()`.
- [ ] **Responsive Audit**: Final check of mobile/tablet viewing experience.
- [ ] **Security Audit**: Verify metadata stripping for uploaded files.
