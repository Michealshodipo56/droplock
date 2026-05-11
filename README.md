# DropLock — Frontend

The DropLock frontend is a pure HTML/CSS/JavaScript single-page-style web application. It communicates with the DropLock Go backend over a REST API and is designed to be deployed as a static site (e.g. Vercel, Cloudflare Pages, or served directly by the backend).

---

## Table of Contents

- [Directory Structure](#directory-structure)
- [Pages](#pages)
- [Core JavaScript (app.js)](#core-javascript-appjs)
- [Design System (style.css)](#design-system-stylecss)
- [Theme System](#theme-system)
- [Page Transitions](#page-transitions)
- [API Integration](#api-integration)
- [Configuration](#configuration)
- [Running Locally](#running-locally)

---

## Directory Structure

```
droplock/
├── index.html          # Homepage — Vault access terminal
├── locker.html         # Private locker — notes, files, settings
├── transfer.html       # File transfer — Direct P2P & Encrypted Code modes
├── about.html          # How-to-use guide & platform overview
├── manifesto.html      # Privacy policy
├── recovery.html       # Account recovery redirect/flow
├── app.js              # Shared JavaScript — theme, canvas, transitions, tour
├── style.css           # Full design system — 4800+ lines, component-based
└── images/
    ├── DropLock_logo-.webp       # Dark mode logo
    ├── droplock-black-logo.webp  # Light mode logo
    ├── droplock-icon.png         # Favicon (PNG)
    ├── favicon.ico               # Favicon (ICO for legacy browsers)
    └── round logo.png            # Developer portrait
```

---

## Pages

### `index.html` — The Terminal (Homepage)
The entry point for the entire platform. Users type a **Locker Name** and click **ACCESS LOCKER**. The page prompts for a password via modal and either opens an existing locker or creates a new one.

**Key elements:**
- Animated canvas background (dot-grid mesh network)
- Vault access card with locker name input
- Password modal with locker create/open flow
- Recent vaults panel (from `localStorage`)
- Account recovery modal (OTP via email)
- System tour powered by Driver.js

### `locker.html` — The Private Locker
The main working environment after login. The layout is a three-panel interface.

**Panels:**
| Panel | Description |
|-------|-------------|
| Left Sidebar | Navigation tabs: NOTES / FILES / SETTINGS. Theme toggle at the bottom. |
| Centre Editor | Rich `contentEditable` note editor with per-note tabs |
| Right Column | File vault — drag-and-drop upload zone and asset list |

**Features:**
- Multi-note tabbed editor
- Ctrl+S keyboard shortcut to save
- Auto-save every 30 seconds with visual "AUTO-SAVED" flash
- File upload up to **2 GB** per file
- Per-note file scoping
- Change password, set recovery email, delete account (Settings dropdown)
- Light/Dark theme toggle in sidebar

### `transfer.html` — File Transfer
Two transfer modes selectable from the left sidebar:
1. **Direct P2P** — Radar-based device discovery, real-time connections
2. **Encrypted Code** — Upload files, receive a 6-digit code, auto-deleted after 5 minutes

### `about.html` — How It Works
A full explainer of all platform features using a brutalist editorial layout.

### `manifesto.html` — Privacy Policy
Four-section legal privacy policy styled to match the platform aesthetic.

---

## Core JavaScript (`app.js`)

`app.js` is loaded on every page and handles all shared functionality.

### Sections

| Responsibility | Description |
|----------------|-------------|
| **Canvas Background** | Animated dot-grid mesh that reacts to theme colour |
| **Theme Persistence** | Reads/writes `droplock.theme` key in `localStorage` |
| **Logo Swap** | Switches between dark/light logo on theme change |
| **Page Transitions** | Intercepts internal `<a href>` clicks, fades body out before navigating |
| **System Tour** | Driver.js-powered onboarding walkthrough |
| **Transfer UI** | P2P radar scan, device list, file staging, accept/reject incoming |
| **Encrypted Transfer** | File staging, code generation, code redemption & download |

### Key Constants & Storage Keys

```javascript
const THEME_KEY = 'droplock.theme';          // Saved theme ('light' | 'dark')
window.__DROPLOCK_API_BASE_URL               // Set in each page's <script> tag
```

### Page Transition

All `<a href>` links pointing to internal pages are intercepted. A `.page-exit` CSS class is applied to `document.body`, triggering a fade-out. After 200ms the browser navigates to the target URL. Each page fades in via `@keyframes pageFadeIn` on load.

---

## Design System (`style.css`)

The stylesheet is structured around CSS custom properties (design tokens) and a component-based class system.

### Design Tokens (`:root`)

```css
--cyan: #00e5ff          /* Primary accent */
--bg-dark: #070707       /* Page background */
--card-bg: rgba(15,15,15,0.85)
--border-color: #333
--text-main: #ffffff
--text-dim: #bbbbbb
--font-mono: 'Space Mono', monospace
--font-sans: 'Inter', sans-serif
```

### Light Mode Override (`body.light-mode`)

```css
--bg-dark: #f0f0f0
--card-bg: #ffffff
--border-color: #000000  /* Pure black outlines — brutalist aesthetic */
--text-main: #000000
--cyan: #008b9b
```

### Key Component Classes

| Class | Description |
|-------|-------------|
| `.vault-card` | Main login card on homepage |
| `.locker-sidebar` | Left nav panel inside the locker |
| `.locker-editor-wrapper` | Central note editing panel |
| `.locker-right-column` | File vault panel |
| `.asset-card` | Individual file card |
| `.asset-dropzone` | Drag-and-drop file area |
| `.transfer-sidebar` | Left nav panel on transfer page |
| `.grid-*` | About-page section layout classes |
| `.void-*` | Privacy-page section layout classes |

---

## Theme System

The theme is globally managed through `localStorage`:

1. On every page load, `app.js` reads `localStorage.getItem('droplock.theme')`.
2. If the value is `'light'`, `body.light-mode` is added immediately before page render (no flicker).
3. The toggle button (on `index.html`, `transfer.html`, `about.html` header, and `locker.html` sidebar) calls `body.classList.toggle('light-mode')` and writes back to `localStorage`.

---

## Page Transitions

```
User clicks link → JS intercepts → body.page-exit class added
  → CSS transition: opacity 0, translateY(-4px) over 180ms
  → setTimeout 200ms → browser navigates
  → new page loads → body@keyframes pageFadeIn: opacity 0→1, translateY(6px→0) over 250ms
```

---

## API Integration

The frontend connects to the Go backend via a single base URL:

```html
<!-- Set in each HTML page's <head> -->
<script>window.__DROPLOCK_API_BASE_URL = 'https://your-backend.onrender.com';</script>
```

All API calls use `fetch()` with JSON bodies. The base URL is accessed via:
```javascript
const API_BASE = window.__DROPLOCK_API_BASE_URL || 'http://localhost:8080';
```

### Key Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/locker/check` | GET | Check if a locker exists |
| `/api/locker/create` | POST | Create a new locker |
| `/api/locker/open` | POST | Authenticate and open a locker |
| `/api/locker/notes` | POST | Save a note |
| `/api/locker/notes/delete` | POST | Delete a note |
| `/api/locker/files/upload` | POST | Upload a file (multipart/form-data) |
| `/api/locker/files/download` | GET | Download a file |
| `/api/locker/files/delete` | POST | Delete a file |
| `/api/locker/change-password` | POST | Change locker password |
| `/api/locker/set-email` | POST | Set recovery email |
| `/api/locker/recover/send-code` | POST | Send OTP to recovery email |
| `/api/locker/recover/verify-code` | POST | Verify OTP |
| `/api/locker/recover/reset-password` | POST | Reset password with token |
| `/api/presence/register` | POST | Register a P2P session |
| `/api/presence/heartbeat` | POST | Keep session alive |
| `/api/devices/online` | GET | List online devices |
| `/api/transfers/encrypted/upload` | POST | Upload encrypted transfer |
| `/api/transfers/encrypted/check` | GET | Check code info |
| `/api/transfers/encrypted/download` | GET | Download via code |

---

## Configuration

| Setting | Where | Value |
|---------|-------|-------|
| Backend API URL | Each HTML `<head>` | `window.__DROPLOCK_API_BASE_URL` |
| Theme preference | `localStorage` | Key: `droplock.theme` |
| Session password | `sessionStorage` | Key: `droplock.lockerPassword:<name>` |
| Recent vaults | `localStorage` | Key: `droplock.recentVaults` |

---

## Running Locally

No build step is required. The frontend is pure static HTML/CSS/JS.

**Option 1 — Served by the backend:**
```bash
# The Go backend automatically serves the droplock/ folder
cd droplock-backend
go run cmd/server/main.go
# Then open http://localhost:8080 in your browser
```

**Option 2 — Direct file access:**
```bash
# Just open index.html in your browser directly
# (API calls will point to localhost:8080)
```

**Option 3 — VS Code Live Server / any static server:**
```bash
npx serve ./droplock
# Open http://localhost:3000
```

---

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome 90+ | ✅ Full support |
| Firefox 88+ | ✅ Full support |
| Safari 15+ | ✅ Full support |
| Edge 90+ | ✅ Full support |
| IE 11 | ❌ Not supported |
