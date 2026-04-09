const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let W = canvas.width, H = canvas.height;

const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
});

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
requestAnimationFrame(loop);

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  W = canvas.width;
  H = canvas.height;
});

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

// --- Stealth Mode Toggle (Local-Only Vault) ---
const stealthToggle = document.getElementById('stealth-toggle');
const vaultTitle = document.getElementById('vault-main-title');
const statusDisplay = document.getElementById('status-display');

if (stealthToggle && vaultTitle) {
  stealthToggle.addEventListener('click', () => {
    // Remove light mode if entering stealth
    document.body.classList.remove('light-mode');
    const isStealth = document.body.classList.toggle('stealth-mode');
    
    if (isStealth) {
      vaultTitle.innerText = 'LOCAL_VAULT';
      statusDisplay.innerText = 'OFFLINE_SECURITY_READY';
    } else {
      vaultTitle.innerText = 'ACCESS_VAULT';
      statusDisplay.innerText = 'AWAITING_INPUT';
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
tourOverlay.addEventListener('click', (e) => {
  // Optional: Click overlay to skip/close
  // endTour();
});

