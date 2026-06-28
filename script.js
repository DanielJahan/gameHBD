'use strict';

/* ═══════════════════════════════════════════
   STATE & PERSISTENCE
═══════════════════════════════════════════ */
const SAVE_KEY = 'treasure_hunt_progress';

function loadState() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
}

function saveState(patch) {
  const state = { ...loadState(), ...patch };
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

/* ═══════════════════════════════════════════
   QUESTIONS CONFIG
═══════════════════════════════════════════ */
const QUESTIONS = [
  {
    text: 'اسم نزدیک‌ترین مرکز خرید به محل اولین قرارمون چی بود؟',
    check: (a) => /مهستان/i.test(a),
  },
  {
    text: 'اولین چیزی که باهم خوردیم یا نوشیدیم چی بود؟',
    check: (a) => /چایی|چای|tea/i.test(a),
  },
  {
    text: 'اولین چیزی که برات گرفتم چی بود؟',
    check: (a) => /گل|رز|flower|rose/i.test(a),
  },
  {
    text: 'پارتنرت وقتی خونش دزد زد برای کشیک یک شب تا صبح جلوی در خونه خوابید. او برای محافظت از خودش از چه سلاحی استفاده می‌کرد؟',
    check: (a) => /چاقو|نون|knife/i.test(a),
  },
];

/* ═══════════════════════════════════════════
   PARTICLES
═══════════════════════════════════════════ */
(function spawnParticles() {
  const container = document.getElementById('particles');
  const COLORS = ['#f5c842', '#ff6b9d', '#c77dff', '#ffffff', '#ff9f43'];
  const SHAPES = ['♦', '★', '✦', '·', '❤'];

  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 14 + 4;
    const left = Math.random() * 100;
    const delay = Math.random() * 12;
    const dur = Math.random() * 10 + 8;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const isEmoji = Math.random() > 0.5;

    p.style.cssText = `
      left:${left}%;
      width:${size}px;
      height:${size}px;
      color:${color};
      font-size:${size}px;
      animation-delay:${delay}s;
      animation-duration:${dur}s;
      background:${isEmoji ? 'transparent' : color};
      border-radius:${isEmoji ? '0' : '50%'};
    `;
    if (isEmoji) p.textContent = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    container.appendChild(p);
  }
})();

/* ═══════════════════════════════════════════
   MUTE BUTTON (placeholder – no audio src)
═══════════════════════════════════════════ */
let muted = true;
document.getElementById('muteBtn').addEventListener('click', () => {
  muted = !muted;
  document.getElementById('muteBtn').textContent = muted ? '🔇' : '🔊';
});

/* ═══════════════════════════════════════════
   STAGE TRANSITIONS
═══════════════════════════════════════════ */
function showStage(id) {
  document.querySelectorAll('.stage').forEach(s => {
    if (!s.classList.contains('hidden')) {
      s.classList.add('fade-out');
      setTimeout(() => {
        s.classList.add('hidden');
        s.classList.remove('fade-out');
      }, 400);
    }
  });

  setTimeout(() => {
    const next = document.getElementById(id);
    next.classList.remove('hidden');
    next.classList.add('fade-in');
    setTimeout(() => next.classList.remove('fade-in'), 800);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 450);
}

/* ═══════════════════════════════════════════
   HIDDEN RESET (tap bottom-left corner 5x)
═══════════════════════════════════════════ */

function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

/* ═══════════════════════════════════════════
   STAGE 1 – DOOR
═══════════════════════════════════════════ */
function checkDoor() {
  const val = document.getElementById('doorPassword').value.trim();
  const errEl = document.getElementById('doorError');
  errEl.textContent = '';

  if (val === '04' || val === '4') {
    openDoor();
  } else {
    errEl.textContent = 'رمز اشتباه است. دوباره تلاش کن.';
    errEl.style.animation = 'none';
    requestAnimationFrame(() => { errEl.style.animation = ''; });
  }
}

function openDoor() {
  const door = document.getElementById('door');
  const frame = door.closest('.door-frame');
  door.classList.add('opening');
  frame.classList.add('glowing');

  setTimeout(() => {
    saveState({ stage: 2 });
    showStage('stage2');
    buildQuestions();
  }, 1200);
}

// Enter key support for door
document.getElementById('doorPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkDoor();
});

/* ═══════════════════════════════════════════
   STAGE 2 – GUARD
═══════════════════════════════════════════ */
function buildQuestions() {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = '';
  QUESTIONS.forEach((q, i) => {
    const block = document.createElement('div');
    block.className = 'question-block';
    block.innerHTML = `
      <label class="question-label">
        <span>${i + 1}</span>${q.text}
      </label>
      <input
        class="question-input"
        type="text"
        id="q${i}"
        placeholder="پاسخ خود را بنویسید..."
        autocomplete="off"
      />
    `;
    container.appendChild(block);
  });
}

function submitGuard() {
  const answers = QUESTIONS.map((q, i) => {
    const val = (document.getElementById(`q${i}`)?.value || '').trim();
    return q.check(val);
  });

  const wrongCount = answers.filter(a => !a).length;
  saveState({ stage: 'clue', wrongCount });

  let verdict;
  if (wrongCount === 0) {
    verdict = 'هویت تو برای من تایید شد.';
  } else {
    const nums = ['یک', 'دو', 'سه', 'چهار'];
    verdict = `با اینکه ${nums[wrongCount - 1]} سوال را اشتباه جواب دادی، هویت تو برای من تایید شد.`;
  }

  document.getElementById('guardVerdict').textContent = verdict;
  showStage('stageClue');
}

/* ═══════════════════════════════════════════
   STAGE 3 ENTRY
═══════════════════════════════════════════ */
function goToStage3() {
  saveState({ stage: 3 });
  showStage('stage3');
}

/* ═══════════════════════════════════════════
   DIGIT INPUTS – AUTO FOCUS
═══════════════════════════════════════════ */
function digitInput(el, nextId) {
  el.value = el.value.replace(/[^0-9]/g, '').slice(-1);
  if (el.value && nextId) {
    document.getElementById(nextId)?.focus();
  }
}

// Backspace navigation
['d1', 'd2', 'd3', 'd4'].forEach((id, idx, arr) => {
  document.getElementById(id)?.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && idx > 0) {
      document.getElementById(arr[idx - 1])?.focus();
    }
  });
});

/* ═══════════════════════════════════════════
   STAGE 3 – FINAL CODE
═══════════════════════════════════════════ */
function checkFinalCode() {
  const code = ['d1', 'd2', 'd3', 'd4'].map(id => document.getElementById(id)?.value || '').join('');
  const errEl = document.getElementById('finalError');
  errEl.textContent = '';

  if (code === '0408') {
    saveState({ stage: 'victory' });
    showStage('stageVictory');
    triggerVictory();
  } else {
    errEl.textContent = 'رمز اشتباه است.';
    errEl.style.animation = 'none';
    requestAnimationFrame(() => { errEl.style.animation = ''; });
    ['d1', 'd2', 'd3', 'd4'].forEach(id => {
      const el = document.getElementById(id);
      el.value = '';
    });
    document.getElementById('d1')?.focus();
  }
}

// Enter on last digit
document.getElementById('d4')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkFinalCode();
});

/* ═══════════════════════════════════════════
   VICTORY ANIMATION
═══════════════════════════════════════════ */
function triggerVictory() {
  setTimeout(() => {
    const chest = document.getElementById('treasureChest');
    chest.classList.add('open');

    setTimeout(() => {
      chest.querySelector('.chest-lid').classList.add('opened');
    }, 600);

    setTimeout(() => {
      document.getElementById('victoryMessage').classList.add('show');
      launchConfetti();
    }, 1200);
  }, 400);
}

function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  const COLORS = ['#f5c842', '#ff6b9d', '#c77dff', '#6bff9e', '#ff9f43', '#ffffff', '#ff6b6b'];
  const SHAPES = ['■', '●', '▲', '★', '♦', '❤'];

  function burst() {
    for (let i = 0; i < 8; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const dur = Math.random() * 2.5 + 2;
      const size = Math.random() * 12 + 6;

      piece.style.cssText = `
        left:${left}%;
        color:${color};
        font-size:${size}px;
        animation-duration:${dur}s;
        animation-delay:${delay}s;
        transform:rotate(${Math.random() * 360}deg);
      `;
      piece.textContent = shape;
      container.appendChild(piece);
      setTimeout(() => piece.remove(), (dur + delay + 0.5) * 1000);
    }
  }

  // Initial big burst
  for (let i = 0; i < 6; i++) setTimeout(burst, i * 150);

  // Sustained confetti
  let count = 0;
  const interval = setInterval(() => {
    burst();
    if (++count > 30) clearInterval(interval);
  }, 300);
}

/* ═══════════════════════════════════════════
   RESTORE PROGRESS ON LOAD
═══════════════════════════════════════════ */
(function restoreProgress() {
  const state = loadState();

  if (!state.stage) return; // start fresh

  if (state.stage === 2) {
    showStage('stage2');
    setTimeout(buildQuestions, 500);
    return;
  }

  if (state.stage === 'clue') {
    const wrongCount = state.wrongCount ?? 0;
    let verdict;
    if (wrongCount === 0) {
      verdict = 'هویت تو برای من تایید شد.';
    } else {
      const nums = ['یک', 'دو', 'سه', 'چهار'];
      verdict = `با اینکه ${nums[wrongCount - 1]} سوال را اشتباه جواب دادی، هویت تو برای من تایید شد.`;
    }
    document.getElementById('guardVerdict').textContent = verdict;
    showStage('stageClue');
    return;
  }

  if (state.stage === 3) {
    showStage('stage3');
    return;
  }

  if (state.stage === 'victory') {
    showStage('stageVictory');
    triggerVictory();
    return;
  }
})();
