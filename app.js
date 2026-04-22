const canvas = document.getElementById('bg-canvas');
let ctx, W, H;
if (canvas) {
  ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  W = canvas.width;
  H = canvas.height;
}

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    updateLogo();
  });
}

function updateLogo() {
  const logoImg = document.querySelector('.logo-img');
  if (!logoImg) return;
  
  if (document.body.classList.contains('light-mode')) {
    logoImg.src = 'images/droplock-black-logo.webp';
  } else {
    // Default logo for dark/stealth modes
    logoImg.src = 'images/DropLock_logo-.webp';
  }
}

function getThemeColors() {
  const isLight = document.body.classList.contains('light-mode');
  const isStealth = document.body.classList.contains('stealth-mode');

  if (isStealth) {
    return {
      line: 'rgba(212, 0, 255, 0.3)',
      dotBright: 'rgba(212, 0, 255, 0.95)',
      dotDim: 'rgba(100, 0, 120, 0.5)',
      bg: '#050505',
      cyan: 'rgba(212, 0, 255, 0.4)',
      cyanBright: 'rgba(212, 0, 255, 0.8)'
    };
  }
  
  return {
    line: isLight ? '#333333' : '#c8c8c8',
    dotBright: isLight ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
    dotDim: isLight ? 'rgba(50,50,50,0.5)' : 'rgba(200,200,200,0.5)',
    bg: isLight ? '#e6e6e6' : '#070707',
    cyan: isLight ? 'rgba(0, 139, 155, 0.4)' : 'rgba(0, 229, 255, 0.4)',
    cyanBright: isLight ? 'rgba(0, 139, 155, 0.8)' : 'rgba(0, 229, 255, 0.8)'
  };
}

const LINE_ALPHA_BRIGHT = 0.55;
const LINE_ALPHA_DIM = 0.18;

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max)); }
function pick(arr) { return arr[randInt(0, arr.length)]; }

const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];

class Circuit {
  constructor() { this.reset(); }

  reset() {
    this.x = rand(0, W);
    this.y = rand(0, H);
    this.segments = [];
    this.buildPath();
    this.progress = 0;
    this.speed = rand(0.3, 1.1);
    this.totalLen = this.segments.reduce((s, seg) => s + seg.len, 0);
    this.drawn = 0;
    this.alpha = rand(LINE_ALPHA_DIM, LINE_ALPHA_BRIGHT);
    this.glowing = Math.random() > 0.6;
    this.age = 0;
    this.maxAge = rand(180, 400);
    this.fadeIn = 30;
    this.fadeOut = 50;
    this.dots = [];
    this.buildDots();
  }

  buildPath() {
    let x = this.x, y = this.y;
    const count = randInt(3, 7);
    for (let i = 0; i < count; i++) {
      const dir = pick(DIRS);
      let len = dir[0] !== 0 ? rand(40, 160) : rand(20, 80);
      const nx = x + dir[0] * len;
      const ny = y + dir[1] * len;
      this.segments.push({ x1: x, y1: y, x2: nx, y2: ny, len });
      if (i < count - 1 && Math.random() > 0.4) {
        const cornerDir = pick(DIRS.filter(d => d[0] !== dir[0] || d[1] !== dir[1]));
        const clen = rand(15, 60);
        const cx2 = nx + cornerDir[0] * clen;
        const cy2 = ny + cornerDir[1] * clen;
        this.segments.push({ x1: nx, y1: ny, x2: cx2, y2: cy2, len: clen });
        x = cx2; y = cy2;
      } else {
        x = nx; y = ny;
      }
    }
  }

  buildDots() {
    this.dots.push({ x: this.x, y: this.y, r: rand(2, 4), bright: this.glowing });
    for (const seg of this.segments) {
      if (Math.random() > 0.5)
        this.dots.push({ x: seg.x2, y: seg.y2, r: rand(1.5, 3.5), bright: Math.random() > 0.5 });
    }
  }

  draw() {
    const colors = getThemeColors();
    this.age++;
    const lifeFrac = Math.min(1, Math.min(this.age / this.fadeIn, (this.maxAge - this.age) / this.fadeOut));
    if (lifeFrac <= 0) return false;

    this.drawn = Math.min(this.totalLen, this.drawn + this.speed * lifeFrac * 2.5);
    const a = this.alpha * lifeFrac;

    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';

    if (this.glowing) {
      ctx.shadowColor = colors.cyan;
      ctx.shadowBlur = 6;
    }

    let remaining = this.drawn;
    for (const seg of this.segments) {
      if (remaining <= 0) break;
      const frac = Math.min(1, remaining / seg.len);
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x1 + (seg.x2 - seg.x1) * frac, seg.y1 + (seg.y2 - seg.y1) * frac);
      ctx.stroke();
      remaining -= seg.len;
    }
    ctx.restore();

    // Draw dots
    let distSoFar = 0;
    for (const dot of this.dots) {
      if (this.drawn < distSoFar) continue;
      ctx.save();
      ctx.globalAlpha = a;
      if (dot.bright) {
        ctx.shadowColor = colors.cyanBright;
        ctx.shadowBlur = 10;
        ctx.fillStyle = colors.dotBright;
      } else {
        ctx.fillStyle = colors.dotDim;
      }
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      distSoFar += 40;
    }

    return this.age < this.maxAge;
  }
}

let circuits = [];
for (let i = 0; i < 20; i++) {
  const c = new Circuit();
  c.age = randInt(0, c.maxAge);
  c.drawn = c.totalLen * (c.age / c.maxAge);
  circuits.push(c);
}

function loop() {
  const colors = getThemeColors();
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);
  circuits = circuits.filter(c => c.draw());
  while (circuits.length < 30) circuits.push(new Circuit());
  requestAnimationFrame(loop);
}
if (canvas) requestAnimationFrame(loop);

if (canvas) {
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width;
    H = canvas.height;
  });
}

// --- Recovery Modal Interaction ---
function initRecoveryModal() {
  const recoveryToggle = document.getElementById('recovery-toggle');
  const recoveryModal = document.getElementById('recovery-modal');
  const closeModal = document.getElementById('close-modal');

  if (recoveryToggle && recoveryModal && closeModal) {
    recoveryToggle.style.cursor = 'pointer';
    
    recoveryToggle.addEventListener('click', (e) => {
      e.preventDefault();
      recoveryModal.classList.add('active');
    });

    closeModal.addEventListener('click', () => {
      recoveryModal.classList.remove('active');
    });

    // Exit modal on clicking the dark background
    recoveryModal.addEventListener('click', (e) => {
      if (e.target === recoveryModal) {
        recoveryModal.classList.remove('active');
      }
    });

    // Handle Submission
    const submitBtn = document.getElementById('submit-recovery');
    const nameInput = document.getElementById('recovery-locker-name');

    if (submitBtn && nameInput) {
      submitBtn.addEventListener('click', () => {
        const lockerName = nameInput.value.trim();
        if (!lockerName) {
          alert('ERROR: Please enter a valid LOCKER NAME.');
          return;
        }
        
        // Redirect to the recovery page with the identifier
        window.location.href = `recovery.html?locker=${encodeURIComponent(lockerName)}`;
      });
    }
  }
}

// Initialize on script load (now at end of body)
initRecoveryModal();

// --- Access Locker Flow ---
(function initLockerAccess() {
  const accessBtn = document.getElementById('access-locker-btn');
  const lockerNameInput = document.getElementById('locker-name-input');
  const accessModal = document.getElementById('access-locker-modal');
  const closeAccessModal = document.getElementById('close-access-modal');
  const accessModalTitle = document.getElementById('access-modal-title');
  const accessModalMessage = document.getElementById('access-modal-message');
  const accessPasswordInput = document.getElementById('access-password-input');
  const accessModalError = document.getElementById('access-modal-error');
  const submitAccessBtn = document.getElementById('submit-access-btn');

  if (!accessBtn || !lockerNameInput || !accessModal) return;

  let pendingLockerName = '';
  let pendingLockerExists = false;

  function showAccessModal() {
    accessModal.classList.add('active');
    accessPasswordInput.value = '';
    accessModalError.style.display = 'none';
    accessPasswordInput.focus();
  }

  function hideAccessModal() {
    accessModal.classList.remove('active');
    accessPasswordInput.value = '';
    accessModalError.style.display = 'none';
  }

  function showError(msg) {
    accessModalError.innerText = msg;
    accessModalError.style.display = 'block';
  }

  function saveToRecentVaults(name) {
    try {
      const key = 'droplock.recentVaults';
      let vaults = JSON.parse(localStorage.getItem(key) || '[]');
      vaults = vaults.filter(v => v !== name);
      vaults.unshift(name);
      if (vaults.length > 10) vaults = vaults.slice(0, 10);
      localStorage.setItem(key, JSON.stringify(vaults));
    } catch (e) {}
  }

  accessBtn.addEventListener('click', async () => {
    const name = lockerNameInput.value.trim();
    if (!name) {
      lockerNameInput.style.borderColor = '#ff4444';
      setTimeout(() => lockerNameInput.style.borderColor = '', 1500);
      return;
    }

    pendingLockerName = name;

    try {
      const res = await postJSON('/api/locker/check', { name });
      const body = await res.json();
      pendingLockerExists = body.exists;

      if (pendingLockerExists) {
        accessModalTitle.innerText = 'VERIFY_ACCESS';
        accessModalMessage.innerText = `Locker "${name}" exists. Enter your password to unlock it.`;
        submitAccessBtn.innerText = 'UNLOCK';
      } else {
        accessModalTitle.innerText = 'CREATE_LOCKER';
        accessModalMessage.innerText = `Locker "${name}" has not been used. Enter a password to create it.`;
        submitAccessBtn.innerText = 'CREATE';
      }
      showAccessModal();
    } catch (err) {
      // Backend unavailable — show modal in create mode as fallback
      pendingLockerExists = false;
      accessModalTitle.innerText = 'CREATE_LOCKER';
      accessModalMessage.innerText = `Enter a password to initialize locker "${name}".`;
      submitAccessBtn.innerText = 'CREATE';
      showAccessModal();
    }
  });

  submitAccessBtn.addEventListener('click', async () => {
    const password = accessPasswordInput.value.trim();
    if (!password) {
      showError('ERROR: PASSWORD_REQUIRED');
      return;
    }

    submitAccessBtn.disabled = true;
    submitAccessBtn.innerText = 'PROCESSING...';

    try {
      if (pendingLockerExists) {
        // Open existing locker
        const res = await fetch(apiUrl('/api/locker/open'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: pendingLockerName, password })
        });
        if (!res.ok) {
          showError('ERROR: INVALID_PASSWORD');
          submitAccessBtn.disabled = false;
          submitAccessBtn.innerText = 'UNLOCK';
          return;
        }
      } else {
        // Create new locker
        const res = await fetch(apiUrl('/api/locker/create'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: pendingLockerName, password })
        });
        if (!res.ok) {
          const errText = await res.text();
          if (res.status === 409) {
            showError('ERROR: LOCKER_ALREADY_EXISTS');
          } else {
            showError('ERROR: CREATION_FAILED');
          }
          submitAccessBtn.disabled = false;
          submitAccessBtn.innerText = 'CREATE';
          return;
        }
      }

      // Success — save to recent vaults and redirect
      saveToRecentVaults(pendingLockerName);
      hideAccessModal();
      window.location.href = `locker.html?name=${encodeURIComponent(pendingLockerName)}`;
    } catch (err) {
      showError('ERROR: BACKEND_UNAVAILABLE');
      submitAccessBtn.disabled = false;
      submitAccessBtn.innerText = pendingLockerExists ? 'UNLOCK' : 'CREATE';
    }
  });

  // Allow Enter key in password field
  accessPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitAccessBtn.click();
    }
  });

  // Allow Enter key in locker name input
  lockerNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      accessBtn.click();
    }
  });

  closeAccessModal.addEventListener('click', hideAccessModal);
  accessModal.addEventListener('click', (e) => {
    if (e.target === accessModal) hideAccessModal();
  });
})();

// --- Recent Vaults Logic ---
(function initRecentVaults() {
  const recentToggle = document.getElementById('recent-vaults-toggle');
  const recentModal = document.getElementById('recent-vaults-modal');
  const closeRecentModal = document.getElementById('close-recent-modal');
  const recentList = document.getElementById('recent-vaults-list');
  const recentEmpty = document.getElementById('recent-vaults-empty');

  if (!recentToggle || !recentModal) return;

  function getRecentVaults() {
    try {
      return JSON.parse(localStorage.getItem('droplock.recentVaults') || '[]');
    } catch (e) {
      return [];
    }
  }

  function renderRecentVaults() {
    const vaults = getRecentVaults();
    recentList.innerHTML = '';

    if (vaults.length === 0) {
      recentEmpty.style.display = 'block';
      return;
    }

    recentEmpty.style.display = 'none';
    vaults.forEach(name => {
      const btn = document.createElement('button');
      btn.className = 'btn-outline';
      btn.style.textAlign = 'left';
      btn.style.padding = '10px 16px';
      btn.style.fontSize = '0.85rem';
      btn.innerText = name;
      btn.addEventListener('click', () => {
        recentModal.classList.remove('active');
        // Put the name into the locker input and trigger the access flow
        const lockerNameInput = document.getElementById('locker-name-input');
        const accessBtn = document.getElementById('access-locker-btn');
        if (lockerNameInput && accessBtn) {
          lockerNameInput.value = name;
          accessBtn.click();
        }
      });
      recentList.appendChild(btn);
    });
  }

  recentToggle.addEventListener('click', (e) => {
    e.preventDefault();
    renderRecentVaults();
    recentModal.classList.add('active');
  });

  closeRecentModal.addEventListener('click', () => {
    recentModal.classList.remove('active');
  });

  recentModal.addEventListener('click', (e) => {
    if (e.target === recentModal) recentModal.classList.remove('active');
  });
})();

// --- Stealth Mode Toggle (Local-Only Vault) ---
const stealthToggle = document.getElementById('stealth-toggle');
const vaultTitle = document.getElementById('vault-main-title');
const statusDisplay = document.getElementById('status-display');

if (stealthToggle && vaultTitle) {
  stealthToggle.addEventListener('click', () => {
    // Remove light mode if entering stealth
    document.body.classList.remove('light-mode');
    const isStealth = document.body.classList.toggle('stealth-mode');
    updateLogo();
    
    // Select the "How to use" items to update them
    const howToContent = document.querySelectorAll('.howto-content');
    
    if (isStealth) {
      vaultTitle.innerText = 'LOCAL_VAULT';
      if (statusDisplay) statusDisplay.innerText = 'OFFLINE_SECURITY_READY';
      
      if (howToContent.length >= 3) {
        howToContent[0].innerHTML = '<h3>LOCK</h3><p>Create a <strong>local-only vault</strong> bound to this browser profile and device.</p>';
        howToContent[1].innerHTML = '<h3>WORK_OFFLINE</h3><p>Stealth Mode keeps your activity in a <strong>network-isolated session</strong> while you prepare data.</p>';
        howToContent[2].innerHTML = '<h3>PURGE</h3><p>Close the session to clear temporary state and leave <strong>no cloud copy</strong> behind.</p>';
      }
    } else {
      vaultTitle.innerText = 'ACCESS_VAULT';
      if (statusDisplay) statusDisplay.innerText = 'AWAITING_INPUT';
      
      if (howToContent.length >= 3) {
        howToContent[0].innerHTML = '<h3>CREATE</h3><p>Enter any <strong>unique name</strong> to open your own private locker instantly.</p>';
        howToContent[1].innerHTML = '<h3>PROTECT</h3><p>Set a <strong>password</strong>. We never store this; used only to encrypt your data packets.</p>';
        howToContent[2].innerHTML = '<h3>STORE</h3><p>Save <strong>text and files</strong> securely. Access them from anywhere via the encrypted tunnel.</p>';
      }
    }

  });
}


// --- Intro Tour Logic ---
const introBtn = document.getElementById('intro-btn');
const tourOverlay = document.getElementById('tour-overlay');
const tourTooltip = document.getElementById('tour-tooltip');
const tourTitle = document.getElementById('tour-title');
const tourText = document.getElementById('tour-text');
const tourNextBtn = document.getElementById('tour-next');
const tourSkipBtn = document.getElementById('tour-skip');

// --- Identity Logic ---
const myDeviceNameEl = document.getElementById('my-device-name');
const identityPrefixes = ['NODE', 'TERMINAL', 'VAULT', 'LINK', 'GATEWAY', 'CORE'];
const DEVICE_NAME_STORAGE_KEY = 'droplock.deviceName';

function generateDeviceName() {
  return `${pick(identityPrefixes)}_${randInt(100, 1000)}`;
}

function getOrCreateDeviceName() {
  try {
    const existingName = localStorage.getItem(DEVICE_NAME_STORAGE_KEY);
    if (existingName && existingName.trim()) {
      return existingName;
    }
    const generatedName = generateDeviceName();
    localStorage.setItem(DEVICE_NAME_STORAGE_KEY, generatedName);
    return generatedName;
  } catch (err) {
    // localStorage can fail in strict privacy modes; fallback keeps transfer usable.
    return generateDeviceName();
  }
}

const myDeviceName = getOrCreateDeviceName();

if (myDeviceNameEl) {
    myDeviceNameEl.innerText = myDeviceName;
}

// Use explicitly set URL or default to the separated backend running on port 8080
const API_BASE_URL = window.__DROPLOCK_API_BASE_URL || 'http://localhost:8080';
const SESSION_ID_STORAGE_KEY = 'droplock.sessionId';

function generateSessionId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function getOrCreateSessionId() {
  try {
    const existingId = sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (existingId && existingId.trim()) {
      return existingId;
    }
    const sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
    return sessionId;
  } catch (err) {
    return generateSessionId();
  }
}

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function postJSON(path, payload, options = {}) {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: Boolean(options.keepalive)
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res;
}

const mySessionId = getOrCreateSessionId();

const tourSteps = [
  { 
    selector: '.vault-card', 
    title: 'ACCESS VAULT', 
    text: 'This is the core functional unit. Enter your locker identifier here to establish an ephemeral, encrypted tunnel. Your data never persists between sessions.', 
    position: 'right' 
  },
  { 
    selector: '#stealth-toggle', 
    title: 'STEALTH MODE', 
    text: 'Engage stealth protocols to switch to a localized, offline vault environment for maximum privacy.', 
    position: 'bottom' 
  },
  { 
    selector: '#recovery-toggle', 
    title: 'RECOVERY PROTOCOL', 
    text: 'Lost access? Trigger the recovery sequence here to regain control of your vault using your security identifiers.', 
    position: 'right' 
  },
  { 
    selector: '#theme-toggle', 
    title: 'THEME SHIFT', 
    text: 'Toggle between various visual modes: Dark, Light, and Stealth themes tailored for your environment.', 
    position: 'right' 
  },
  { 
    selector: '.nav-links', 
    title: 'SYSTEM NAVIGATION', 
    text: 'Quickly jump between the Terminal, File Transfer protocols, and system documentation.', 
    position: 'bottom' 
  }
];

let currentTourStep = 0;

function positionTooltip(targetEl, pos) {
  const rect = targetEl.getBoundingClientRect();
  const tooltipRect = tourTooltip.getBoundingClientRect();
  
  let top = 0;
  let left = 0;
  const padding = 20;

  if (pos === 'right') {
    left = rect.right + padding;
    top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
    // Boundary check for right
    if (left + tooltipRect.width > window.innerWidth) {
      left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
      top = rect.bottom + padding;
    }
  } else if (pos === 'bottom') {
    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    top = rect.bottom + padding;
  }
  
  // Outer screen boundaries fallback
  if (left < 10) left = 10;
  if (top < 10) top = 10;
  if (left + tooltipRect.width > window.innerWidth - 10) {
    left = window.innerWidth - tooltipRect.width - 10;
  }
  if (top + tooltipRect.height > window.innerHeight - 10) {
    top = window.innerHeight - tooltipRect.height - 10;
  }

  tourTooltip.style.left = left + 'px';
  tourTooltip.style.top = top + 'px';
}

function showTourStep(index) {
  // Clear previous
  document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
  
  if (index >= tourSteps.length) {
    endTour();
    return;
  }

  const step = tourSteps[index];
  const target = document.querySelector(step.selector);
  
  if (target) {
    // Add highlight
    target.classList.add('tour-highlight');
    
    // Update texts
    tourTitle.innerText = step.title;
    tourText.innerText = step.text;
    tourNextBtn.innerText = index === tourSteps.length - 1 ? 'FINISH' : 'NEXT';
    
    // Show and position
    tourTooltip.classList.add('active');
    
    // Small timeout to allow layout calc if needed
    setTimeout(() => {
      positionTooltip(target, step.position);
    }, 10);
    
  } else {
    // Element not found, skip
    showTourStep(index + 1);
  }
}

function startTour() {
  currentTourStep = 0;
  tourOverlay.classList.add('active');
  showTourStep(currentTourStep);
}

function endTour() {
  document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
  tourOverlay.classList.remove('active');
  tourTooltip.classList.remove('active');
}

if (introBtn) {
  introBtn.addEventListener('click', startTour);
}
if (tourNextBtn) {
  tourNextBtn.addEventListener('click', () => {
    currentTourStep++;
    showTourStep(currentTourStep);
  });
}
if (tourSkipBtn) {
  tourSkipBtn.addEventListener('click', endTour);
}

// Disallow clicking overlay to pass through
if (tourOverlay) {
  tourOverlay.addEventListener('click', (e) => {
    // Optional: Click overlay to skip/close
    // endTour();
  });
}

// --- Transfer Page Logic ---
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const stagedContainer = document.getElementById('staged-files-container');
const uploadProgressWrap = document.getElementById('upload-progress-wrap');
const uploadProgressBar = document.getElementById('upload-progress-bar');
const uploadProgressText = document.getElementById('upload-progress-text');
const transferTargetPanel = document.getElementById('transfer-target-panel');
const selectedDeviceNameEl = document.getElementById('selected-device-name');
const transferStartBtn = document.getElementById('transfer-start-btn');
const transferProgressWrap = document.getElementById('transfer-progress-wrap');
const transferProgressBar = document.getElementById('transfer-progress-bar');
const transferProgressText = document.getElementById('transfer-progress-text');
const transferCancelBtn = document.getElementById('transfer-cancel-btn');
const transferResult = document.getElementById('transfer-result');
const transferResultText = document.getElementById('transfer-result-text');
const unselectDeviceBtn = document.getElementById('unselect-device-btn');
const scanBtnWrapper = document.getElementById('scan-btn-wrapper');
const foundDevicesList = document.getElementById('found-devices-list');
const incomingTransfersEl = document.getElementById('incoming-transfers');
const incomingTransfersEmptyEl = document.getElementById('incoming-transfers-empty');
const scanStatusTextEl = document.getElementById('scan-status-text');
let stagedFiles = [];
let selectedDevice = null;
let transferTimer = null;
let transferPercent = 0;
let transferComplete = false;
let transferAbortController = null;
let presenceHeartbeatTimer = null;
let inboxPollTimer = null;
let inboxFingerprint = '';

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function clearTransferProgress() {
    if (transferTimer) {
      clearInterval(transferTimer);
      transferTimer = null;
    }
    transferPercent = 0;
    if (transferProgressBar) transferProgressBar.style.width = '0%';
    if (transferProgressText) transferProgressText.innerText = 'TRANSFER_PENDING';
    if (transferStartBtn) {
      transferStartBtn.disabled = false;
      transferStartBtn.innerText = stagedFiles.length > 1 ? 'TRANSFER_ALL' : 'TRANSFER';
    }
    if (transferProgressWrap) transferProgressWrap.classList.add('is-hidden');
    if (transferCancelBtn) {
        if (stagedFiles.length === 0) transferCancelBtn.classList.add('is-hidden');
        else transferCancelBtn.classList.remove('is-hidden');
    }
    if (transferResult) transferResult.classList.add('is-hidden');
    transferComplete = false;
    updateStepIndicator();
}

async function registerPresence() {
  try {
    await postJSON('/api/presence/register', {
      sessionId: mySessionId,
      deviceName: myDeviceName
    });
  } catch (err) {
    // Keep UI usable even when backend is unavailable.
  }
}

async function heartbeatPresence() {
  try {
    await postJSON('/api/presence/heartbeat', { sessionId: mySessionId });
  } catch (err) {
    await registerPresence();
  }
}

function startPresenceLoop() {
  registerPresence();
  if (presenceHeartbeatTimer) {
    clearInterval(presenceHeartbeatTimer);
  }
  presenceHeartbeatTimer = setInterval(heartbeatPresence, 15000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      heartbeatPresence();
    }
  });

  window.addEventListener('beforeunload', () => {
    const payload = JSON.stringify({ sessionId: mySessionId });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(apiUrl('/api/presence/offline'), new Blob([payload], { type: 'application/json' }));
      return;
    }
    fetch(apiUrl('/api/presence/offline'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => {});
  });
}

function downloadIncomingFile(transferId, fileId) {
  const href = apiUrl(`/api/transfers/${encodeURIComponent(transferId)}/files/${encodeURIComponent(fileId)}/download?sessionId=${encodeURIComponent(mySessionId)}`);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.target = '_blank';
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function renderIncomingTransfers(transfers) {
  if (!incomingTransfersEl || !incomingTransfersEmptyEl) return;

  incomingTransfersEl.innerHTML = '';
  if (!transfers || transfers.length === 0) {
    incomingTransfersEmptyEl.classList.remove('is-hidden');
    return;
  }

  incomingTransfersEmptyEl.classList.add('is-hidden');

  transfers.forEach(transfer => {
    const item = document.createElement('div');
    item.className = 'incoming-item';

    const meta = document.createElement('div');
    meta.className = 'incoming-meta';
    meta.innerHTML = `
      <div class="incoming-from">FROM_${transfer.senderName}</div>
      <div class="incoming-size">${transfer.fileCount} FILE${transfer.fileCount > 1 ? 'S' : ''} // ${formatBytes(transfer.totalBytes)}</div>
    `;
    item.appendChild(meta);

    const fileList = document.createElement('div');
    fileList.className = 'incoming-file-list';
    transfer.files.forEach(file => {
      const row = document.createElement('div');
      row.className = 'incoming-file';
      row.innerHTML = `<div class="incoming-file-name">${file.name}</div>`;

      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'incoming-file-download';
      downloadBtn.type = 'button';
      downloadBtn.innerText = 'DOWNLOAD';
      downloadBtn.addEventListener('click', () => downloadIncomingFile(transfer.transferId, file.id));
      row.appendChild(downloadBtn);
      fileList.appendChild(row);
    });

    item.appendChild(fileList);
    incomingTransfersEl.appendChild(item);
  });
}

async function refreshInbox() {
  if (!incomingTransfersEl) return;
  try {
    const res = await fetch(apiUrl(`/api/transfers/inbox?sessionId=${encodeURIComponent(mySessionId)}`));
    if (!res.ok) return;
    const body = await res.json();
    const transfers = Array.isArray(body.transfers) ? body.transfers : [];
    const nextFingerprint = transfers.map(x => `${x.transferId}:${x.fileCount}`).join('|');
    if (nextFingerprint !== inboxFingerprint) {
      inboxFingerprint = nextFingerprint;
      renderIncomingTransfers(transfers);
    }
  } catch (err) {
    // Keep sender flow running even if inbox polling fails.
  }
}

function startInboxLoop() {
  if (!incomingTransfersEl) return;

  const cancelBtn = document.getElementById('cancel-incoming-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      // Clear the UI without resetting the fingerprint
      // This prevents the next 6-second poll from re-rendering the same canceled files
      renderIncomingTransfers([]);
    });
  }

  refreshInbox();
  if (inboxPollTimer) clearInterval(inboxPollTimer);
  inboxPollTimer = setInterval(refreshInbox, 6000);
}

function showScanButtonIfReady() {
    if (!scanBtnWrapper) return;
    if (!selectedDevice) {
      scanBtnWrapper.classList.remove('is-hidden');
    } else {
      scanBtnWrapper.classList.add('is-hidden');
    }
}

function updateStepIndicator() {
  const s1 = document.getElementById('step-1');
  const s2 = document.getElementById('step-2');
  const s3 = document.getElementById('step-3');
  const connectors = document.querySelectorAll('.step-connector');

  if (!s1 || !s2 || !s3) return;

  // Reset all
  [s1, s2, s3].forEach(s => s.classList.remove('step-active'));
  connectors.forEach(c => c.classList.remove('active'));

  // Step 1: Upload Complete
  if (stagedFiles.length > 0) {
    s1.classList.add('step-active');
  }

  // Step 2: Scan/Select Complete
  if (selectedDevice) {
    s2.classList.add('step-active');
    if (connectors[0]) connectors[0].classList.add('active');
  }

  // Step 3: Transfer Complete
  if (transferComplete) {
    s3.classList.add('step-active');
    if (connectors[1]) connectors[1].classList.add('active');
  }
}

function applySelectedDevice(device) {
    selectedDevice = device;
    if (selectedDeviceNameEl) selectedDeviceNameEl.innerText = device.deviceName;
    if (transferTargetPanel) transferTargetPanel.classList.remove('is-hidden');
    if (transferStartBtn) transferStartBtn.disabled = stagedFiles.length === 0;
    showScanButtonIfReady();
    updateStepIndicator();
    clearTransferProgress();
}

function resetSelectedDevice() {
    selectedDevice = null;
    if (transferTargetPanel) transferTargetPanel.classList.add('is-hidden');
    clearTransferProgress();
    showScanButtonIfReady();
    updateStepIndicator();
}

function simulateUploadProgress(files) {
    if (!uploadProgressWrap || !uploadProgressBar || !uploadProgressText) {
      return Promise.resolve();
    }

    uploadProgressWrap.classList.remove('is-hidden');
    uploadProgressBar.style.width = '0%';
    uploadProgressText.innerText = 'PREPARING_FILES... 0%';

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const sizeInMb = Math.max(1, Math.round(totalSize / (1024 * 1024)));
    const durationMs = Math.min(3800, Math.max(1000, 800 + files.length * 350 + sizeInMb * 4));
    const tickMs = 70;
    const totalTicks = Math.ceil(durationMs / tickMs);
    let tick = 0;

    return new Promise(resolve => {
      const timer = setInterval(() => {
        tick++;
        const progress = Math.min(100, Math.round((tick / totalTicks) * 100));
        uploadProgressBar.style.width = `${progress}%`;
        uploadProgressText.innerText = `UPLOADING_FILES... ${progress}%`;

        if (progress >= 100) {
          clearInterval(timer);
          uploadProgressText.innerText = `UPLOAD_COMPLETE // ${files.length} FILE${files.length > 1 ? 'S' : ''} STAGED`;
          setTimeout(() => {
            uploadProgressWrap.classList.add('is-hidden');
            resolve();
          }, 350);
        }
      }, tickMs);
    });
}

async function processFiles(files) {
    if (!files || files.length === 0) return;

    const incomingFiles = Array.from(files);
    await simulateUploadProgress(incomingFiles);

    // Add to state safely converting FileList to Array
    stagedFiles = [...stagedFiles, ...incomingFiles];

    // Update button visual
    uploadBtn.innerText = 'ADD_MORE_FILES';
    uploadBtn.style.color = 'var(--bg-dark)';
    uploadBtn.style.background = 'var(--cyan)';
    uploadBtn.style.borderColor = 'var(--cyan)';

    renderStagedFiles();
    showScanButtonIfReady();
    updateStepIndicator();
}

function renderStagedFiles() {
    stagedContainer.innerHTML = '';
    
    stagedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'staged-file-item';
        
        // Conditional send button (only if > 1 file staged)
        const sendBtnHtml = stagedFiles.length > 1 
            ? `<button class="staged-file-send" data-index="${index}">SEND</button>` 
            : '';

        item.innerHTML = `
            <div class="staged-file-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              <div>
                 <div class="staged-file-name">${file.name}</div>
                 <div class="staged-file-size">${formatBytes(file.size)}</div>
              </div>
            </div>
            <div class="staged-file-actions">
              ${sendBtnHtml}
              <button class="staged-file-remove" data-index="${index}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
        `;
        stagedContainer.appendChild(item);
    });
    
    // Update main transfer button text
    if (transferStartBtn) {
        if (!selectedDevice) {
            transferStartBtn.innerText = 'TRANSFER';
        } else {
            transferStartBtn.innerText = stagedFiles.length > 1 ? 'TRANSFER_ALL' : 'TRANSFER';
        }
    }

    // Handle removes
    const removeBtns = stagedContainer.querySelectorAll('.staged-file-remove');
    removeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-index'));
            stagedFiles.splice(idx, 1);
            if (stagedFiles.length === 0) {
               uploadBtn.innerText = 'UPLOAD_FILES';
               uploadBtn.style.color = 'var(--cyan)';
               uploadBtn.style.background = 'transparent';
               uploadBtn.style.borderColor = 'var(--cyan)';
               resetSelectedDevice();
            }
            renderStagedFiles();
            if (transferStartBtn) transferStartBtn.disabled = stagedFiles.length === 0;
            if (transferCancelBtn) {
                if (stagedFiles.length > 0) transferCancelBtn.classList.remove('is-hidden');
                else transferCancelBtn.classList.add('is-hidden');
            }
            showScanButtonIfReady();
            updateStepIndicator();
        });
    });

    // Handle cancel button visibility
    if (transferCancelBtn) {
        if (stagedFiles.length > 0) transferCancelBtn.classList.remove('is-hidden');
        else transferCancelBtn.classList.add('is-hidden');
    }

    // Handle single send
    const sendBtns = stagedContainer.querySelectorAll('.staged-file-send');
    sendBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!selectedDevice) {
                alert('ERROR: Please select a target device first.');
                return;
            }
            const idx = parseInt(e.currentTarget.getAttribute('data-index'));
            const file = stagedFiles[idx];
            startTransfer([file]);
        });
    });
}

if (uploadBtn && fileInput && dropZone) {
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        processFiles(e.target.files);
        fileInput.value = ''; 
    });
    
    // Prevent default browser drop anywhere
    window.addEventListener('dragover', e => e.preventDefault(), false);
    window.addEventListener('drop', e => e.preventDefault(), false);
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
    });
    
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        processFiles(files);
    });
}

async function startTransfer(filesToTransfer = null) {
  const targetFiles = filesToTransfer || stagedFiles;
  if (!selectedDevice || targetFiles.length === 0 || !transferProgressBar || !transferProgressText) return;

  clearTransferProgress();
  transferProgressWrap.classList.remove('is-hidden');
  if (transferCancelBtn) {
    transferCancelBtn.classList.remove('is-hidden');
    transferCancelBtn.innerText = 'STOP_TRANSFER';
  }
  transferStartBtn.disabled = true;
  transferStartBtn.innerText = targetFiles.length > 1 ? 'TRANSFERRING_ALL' : 'TRANSFERRING';
  transferAbortController = new AbortController();

  const totalBytes = targetFiles.reduce((sum, file) => sum + file.size, 0);
  const totalLabel = formatBytes(totalBytes);
  transferProgressText.innerText = `TRANSFER_TO_${selectedDevice.deviceName}... 5%`;
  transferPercent = 5;
  transferProgressBar.style.width = `${transferPercent}%`;

  transferTimer = setInterval(() => {
    transferPercent = Math.min(90, transferPercent + Math.max(2, Math.round(Math.random() * 8)));
    transferProgressBar.style.width = `${transferPercent}%`;
    transferProgressText.innerText = `TRANSFER_TO_${selectedDevice.deviceName}... ${transferPercent}% // ${totalLabel}`;
  }, 170);

  try {
    const formData = new FormData();
    formData.append('senderSessionId', mySessionId);
    formData.append('senderName', myDeviceName);
    formData.append('targetSessionId', selectedDevice.sessionId);
    formData.append('targetName', selectedDevice.deviceName);
    targetFiles.forEach(file => formData.append('files', file));

    const res = await fetch(apiUrl('/api/transfers'), {
      method: 'POST',
      body: formData,
      signal: transferAbortController.signal
    });

    if (!res.ok) {
      if (res.status === 410) {
        resetSelectedDevice();
        throw new Error('Target device is now offline. Scan again.');
      }
      throw new Error(`Transfer failed (${res.status})`);
    }

    if (transferTimer) {
      clearInterval(transferTimer);
      transferTimer = null;
    }
    transferPercent = 100;
    transferProgressBar.style.width = '100%';
    transferProgressText.innerText = `TRANSFER_TO_${selectedDevice.deviceName}... 100% // ${totalLabel}`;
    transferStartBtn.innerText = 'TRANSFER_COMPLETE';

    if (transferResult && transferResultText) {
      transferResultText.innerText = `TRANSFER_COMPLETE // ${targetFiles.length} FILE${targetFiles.length > 1 ? 'S' : ''} SENT TO ${selectedDevice.deviceName}`;
      transferResult.classList.remove('is-hidden');
    }

    transferComplete = true;
    updateStepIndicator();
  } catch (err) {
    if (transferTimer) {
      clearInterval(transferTimer);
      transferTimer = null;
    }
    transferProgressText.innerText = err.name === 'AbortError' ? 'TRANSFER_STOPPED' : `TRANSFER_FAILED // ${err.message}`;
    transferStartBtn.disabled = false;
    transferStartBtn.innerText = targetFiles.length > 1 ? 'TRANSFER_ALL' : 'TRANSFER';
  } finally {
    transferAbortController = null;
    if (transferCancelBtn) transferCancelBtn.innerText = 'CANCEL_SESSION';
  }
}

function cancelTransfer() {
  if (transferAbortController || transferTimer) {
    if (transferAbortController) {
      transferAbortController.abort();
    }
    if (transferTimer) {
      clearInterval(transferTimer);
      transferTimer = null;
    }
    if (transferProgressText) {
      transferProgressText.innerText = 'TRANSFER_STOPPED';
      setTimeout(() => {
        if (!transferTimer && transferProgressWrap) transferProgressWrap.classList.add('is-hidden');
        if (transferStartBtn) {
          transferStartBtn.disabled = false;
          transferStartBtn.innerText = stagedFiles.length > 1 ? 'TRANSFER_ALL' : 'TRANSFER';
        }
      }, 1000);
    }
    transferAbortController = null;
    if (transferCancelBtn) transferCancelBtn.innerText = 'CANCEL_SESSION';
    return;
  }

  // Otherwise, reset the whole session
  stagedFiles = [];
  resetSelectedDevice();
  renderStagedFiles();
  
  uploadBtn.innerText = 'UPLOAD_FILES';
  uploadBtn.style.color = 'var(--cyan)';
  uploadBtn.style.background = 'transparent';
  uploadBtn.style.borderColor = 'var(--cyan)';

  clearTransferProgress();
  if (transferProgressText) {
    transferProgressText.innerText = 'SESSION_RESET';
    transferProgressWrap.classList.remove('is-hidden');
    setTimeout(() => {
      if (transferProgressWrap) transferProgressWrap.classList.add('is-hidden');
    }, 1000);
  }
}

if (transferStartBtn) {
  transferStartBtn.addEventListener('click', () => startTransfer());
}

if (transferCancelBtn) {
  transferCancelBtn.addEventListener('click', cancelTransfer);
}

if (unselectDeviceBtn) {
  unselectDeviceBtn.addEventListener('click', resetSelectedDevice);
}

// --- New Scan Button + Radar Overlay Logic ---
const scanBtn = document.getElementById('scan-btn');
const scanOverlay = document.getElementById('scan-overlay');
const scanCancelBtn = document.getElementById('scan-cancel-btn');
const radarUsersGroup = document.getElementById('radar-users');

function setScanStatus(text) {
  if (scanStatusTextEl) {
    scanStatusTextEl.innerText = text;
  }
}

async function getDiscoverablePeers() {
  const res = await fetch(apiUrl(`/api/devices/online?excludeSessionId=${encodeURIComponent(mySessionId)}`));
  if (!res.ok) {
    throw new Error(`scan failed (${res.status})`);
  }
  const body = await res.json();
  const devices = Array.isArray(body.devices) ? body.devices : [];
  return devices.map(device => ({
    sessionId: device.sessionId,
    deviceName: device.deviceName,
    // Distribute among better rings (avoiding the innermost one)
    ring: Math.floor(Math.random() * 4) + 1 
  }));
}

const ringRadii = [260, 210, 160, 110]; // removed the innermost 60px ring
let scanAnimFrame = null;
let scanActive = false;
let userNodes = [];
let userTimers = [];

async function startScan() {
  scanActive = true;
  scanOverlay.classList.add('active');
  setScanStatus('SCANNING_FOR_ONLINE_DEVICES...');
  
  // Clear previous users
  radarUsersGroup.innerHTML = '';
  userNodes = [];
  
  try {
    const onlineUsers = await getDiscoverablePeers();
    if (!scanActive) return;

    if (onlineUsers.length === 0) {
      setScanStatus('NO_ONLINE_DEVICES_FOUND');
      return;
    }

    const shuffled = [...onlineUsers].sort(() => Math.random() - 0.5);
    
    // Create a pool of available slots per ring to prevent overlap
    // Ring 1 (260): 16 slots, Ring 2 (210): 12 slots, Ring 3 (160): 8 slots, Ring 4 (110): 6 slots
    const ringSlots = [
      { radius: 260, count: 16, current: 0 },
      { radius: 210, count: 12, current: 0 },
      { radius: 160, count: 8, current: 0 },
      { radius: 110, count: 6, current: 0 }
    ];

    shuffled.forEach((user, i) => {
      // Pick a ring with available slots, or fallback to busiest if full
      let ringIndex = user.ring - 1;
      if (ringSlots[ringIndex].current >= ringSlots[ringIndex].count) {
        ringIndex = ringSlots.findIndex(r => r.current < r.count);
        if (ringIndex === -1) ringIndex = i % 4; // all full, just distribute
      }
      
      const slotIndex = ringSlots[ringIndex].current++;
      const angle = (slotIndex / ringSlots[ringIndex].count) * Math.PI * 2 + (Math.random() * 0.2); // grid + slight jitter

      const timer = setTimeout(() => {
        if (!scanActive) return;
        addUserToRadar(user, ringRadii[ringIndex], angle);
      }, 700 + i * 400);
      userTimers.push(timer);
    });

    setScanStatus(`ONLINE_DEVICES_FOUND: ${onlineUsers.length}`);
    
    // Solution for many users: Show a scrollable list at the bottom
    const radarListWrap = document.getElementById('radar-list-fallback');
    const radarListItems = document.getElementById('radar-list-items');
    
    if (onlineUsers.length > 5 && radarListWrap && radarListItems) {
      radarListWrap.classList.remove('is-hidden');
      radarListItems.innerHTML = '';
      shuffled.forEach(user => {
        const item = document.createElement('div');
        item.className = 'radar-list-item';
        item.innerText = user.deviceName;
        item.addEventListener('click', () => {
          applySelectedDevice(user);
          stopScan();
        });
        radarListItems.appendChild(item);
      });
    } else if (radarListWrap) {
      radarListWrap.classList.add('is-hidden');
    }

    if (onlineUsers.length > 15) {
      scanStatusTextEl.innerHTML += `<br><span style="font-size: 0.6rem; color: var(--text-dim);">DENSE_TRAFFIC_MODE_ACTIVE</span>`;
    }
    animateUsers();
  } catch (err) {
    setScanStatus('SCAN_ERROR // BACKEND_UNAVAILABLE');
  }
}

function addUserToRadar(user, radius, startAngle) {
  const cx = 300;
  const cy = 300;
  const speed = (0.2 + Math.random() * 0.3) * (Math.random() > 0.5 ? 1 : -1); 
  
  // Calculate initial position
  const x = cx + radius * Math.cos(startAngle);
  const y = cy + radius * Math.sin(startAngle);
  
  // Create SVG group
  const ns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('class', 'radar-user-group appearing');

  // Outer pulse ring
  const pulseRing = document.createElementNS(ns, 'circle');
  pulseRing.setAttribute('cx', x);
  pulseRing.setAttribute('cy', y);
  pulseRing.setAttribute('r', '18');
  pulseRing.setAttribute('class', 'radar-user-ring');
  // randomize pulse timing
  pulseRing.style.animationDelay = (Math.random() * 2).toFixed(1) + 's';
  g.appendChild(pulseRing);

  // Main dot
  const circle = document.createElementNS(ns, 'circle');
  circle.setAttribute('cx', x);
  circle.setAttribute('cy', y);
  circle.setAttribute('r', '6');
  circle.setAttribute('class', 'radar-user-circle');
  g.appendChild(circle);

  radarUsersGroup.appendChild(g);

  // Name Label
  const text = document.createElementNS(ns, 'text');
  text.setAttribute('x', x);
  text.setAttribute('y', y + 30); // Position below the circle
  text.setAttribute('class', 'radar-user-name');
  text.textContent = user.deviceName;
  g.appendChild(text);

  // Click interaction
  g.style.cursor = 'pointer';
  g.style.pointerEvents = 'all';
  g.addEventListener('click', () => {
    applySelectedDevice(user);
    stopScan();
  });

  // Store node data for orbit animation
  userNodes.push({
    group: g,
    circle: circle,
    pulseRing: pulseRing,
    text: text,
    cx: cx,
    cy: cy,
    radius: radius,
    angle: startAngle,
    speed: speed * 0.002, // radians per frame (reduced from 0.004)
  });
}

function animateUsers() {
  if (!scanActive) return;
  
  userNodes.forEach(node => {
    node.angle += node.speed;
    
    const x = node.cx + node.radius * Math.cos(node.angle);
    const y = node.cy + node.radius * Math.sin(node.angle);
    
    node.circle.setAttribute('cx', x);
    node.circle.setAttribute('cy', y);
    node.pulseRing.setAttribute('cx', x);
    node.pulseRing.setAttribute('cy', y);
    node.text.setAttribute('x', x);
    node.text.setAttribute('y', y + 30);
  });
  
  scanAnimFrame = requestAnimationFrame(animateUsers);
}

function stopScan() {
  scanActive = false;
  scanOverlay.classList.remove('active');
  const radarListWrap = document.getElementById('radar-list-fallback');
  if (radarListWrap) radarListWrap.classList.add('is-hidden');
  
  if (scanAnimFrame) {
    cancelAnimationFrame(scanAnimFrame);
    scanAnimFrame = null;
  }
  userTimers.forEach(t => clearTimeout(t));
  userTimers = [];
  
  // Clear users after overlay fades
  setTimeout(() => {
    radarUsersGroup.innerHTML = '';
    userNodes = [];
  }, 500);
}

if (scanBtn) {
  scanBtn.addEventListener('click', startScan);
}

if (scanCancelBtn) {
  scanCancelBtn.addEventListener('click', stopScan);
}

// ESC key to close scan overlay
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && scanActive) {
    stopScan();
  }
});

startPresenceLoop();
startInboxLoop();
showScanButtonIfReady();
updateStepIndicator();
