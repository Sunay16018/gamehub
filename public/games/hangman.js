function initHangman(container) {
  const WORDS = ['BİLGİSAYAR','TELEFON','ARABA','EV','OKUL','ÖĞRETMEN','ÖĞRENCİ','KİTAP','KALEM','DEFTER',
    'MASA','SANDALYE','KAPI','PENCERE','DUVAR','TAVAN','ZEMİN','BAHÇE','SOKAK','CADDE',
    'ŞEHİR','KÖY','KASABA','ÜLKE','KITA','DÜNYA','AY','GÜNEŞ','YILDIZ','GÖKYÜZÜ',
    'DENİZ','OKYANUS','NEHİR','GÖL','DAĞ','TEPE','VADİ','ORMAN','ÇÖL','KUTUP',
    'HAYVAN','BİTKİ','KUŞ','BALIK','KÖPEK','KEDİ','AT','İNEK','KOYUN','KEÇİ',
    'MEYVE','SEBZE','ELMA','ARMUT','PORTAKAL','MUZ','ÜZÜM','KARPUZ','ÇİLEK','KİRAZ',
    'SPOR','FUTBOL','BASKETBOL','VOLEYBOL','TENİS','YÜZME','KOŞU','BİSİKLET','YÜRÜYÜŞ','DAĞCILIK',
    'RENK','KIRMIZI','MAVİ','YEŞİL','SARI','BEYAZ','SİYAH','MOR','PEMBE','TURUNCU'];

  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Kalan Hak: <span id="hmLives">6</span></div>
    <div class="lives">Kelime: <span id="hmWord">_ _ _ _ _</span></div>
    <div class="timer">Harf Tıkla</div>
  `;
  container.appendChild(ui);

  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = 300; canvas.height = 350;
  container.appendChild(canvas);

  const keyboard = document.createElement('div');
  keyboard.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:15px;max-width:500px;margin:0 auto;';
  container.appendChild(keyboard);

  const ctx = canvas.getContext('2d');
  let target = WORDS[Math.floor(Math.random() * WORDS.length)];
  let guessed = new Set();
  let wrong = 0, maxWrong = 6;
  let isGameOver = false;

  function drawHangman() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 4;

    // Base
    ctx.beginPath(); ctx.moveTo(50, 320); ctx.lineTo(150, 320); ctx.stroke();
    // Pole
    ctx.beginPath(); ctx.moveTo(100, 320); ctx.lineTo(100, 50); ctx.stroke();
    // Top
    ctx.beginPath(); ctx.moveTo(100, 50); ctx.lineTo(200, 50); ctx.stroke();
    // Rope
    ctx.beginPath(); ctx.moveTo(200, 50); ctx.lineTo(200, 80); ctx.stroke();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;

    if (wrong >= 1) { // Head
      ctx.beginPath(); ctx.arc(200, 100, 20, 0, Math.PI * 2); ctx.stroke();
    }
    if (wrong >= 2) { // Body
      ctx.beginPath(); ctx.moveTo(200, 120); ctx.lineTo(200, 200); ctx.stroke();
    }
    if (wrong >= 3) { // Left arm
      ctx.beginPath(); ctx.moveTo(200, 140); ctx.lineTo(160, 170); ctx.stroke();
    }
    if (wrong >= 4) { // Right arm
      ctx.beginPath(); ctx.moveTo(200, 140); ctx.lineTo(240, 170); ctx.stroke();
    }
    if (wrong >= 5) { // Left leg
      ctx.beginPath(); ctx.moveTo(200, 200); ctx.lineTo(170, 250); ctx.stroke();
    }
    if (wrong >= 6) { // Right leg
      ctx.beginPath(); ctx.moveTo(200, 200); ctx.lineTo(230, 250); ctx.stroke();
      // Face
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath(); ctx.moveTo(190, 95); ctx.lineTo(195, 100); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(195, 95); ctx.lineTo(190, 100); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(205, 95); ctx.lineTo(210, 100); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(210, 95); ctx.lineTo(205, 100); ctx.stroke();
      ctx.beginPath(); ctx.arc(200, 110, 8, 0, Math.PI); ctx.stroke();
    }
  }

  function updateWord() {
    let display = '';
    let allGuessed = true;
    for (const char of target) {
      if (guessed.has(char)) {
        display += char + ' ';
      } else {
        display += '_ ';
        allGuessed = false;
      }
    }
    document.getElementById('hmWord').textContent = display.trim();
    document.getElementById('hmLives').textContent = maxWrong - wrong;

    if (allGuessed) {
      isGameOver = true;
      const score = (maxWrong - wrong) * 100 + target.length * 50;
      showMessage('TEBRİKLER! Kelimeyi buldun!', '#22c55e');
      if (typeof saveScore === 'function') saveScore('hangman', score);
    } else if (wrong >= maxWrong) {
      isGameOver = true;
      showMessage(`KAYBETTİN! Kelime: ${target}`, '#ef4444');
    }
  }

  function renderKeyboard() {
    keyboard.innerHTML = '';
    const letters = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';
    letters.split('').forEach(letter => {
      const btn = document.createElement('button');
      btn.textContent = letter;
      const isGuessed = guessed.has(letter);
      const isWrong = isGuessed && !target.includes(letter);
      const isCorrect = isGuessed && target.includes(letter);

      btn.style.cssText = `
        width:40px;height:40px;border:none;border-radius:8px;
        font-weight:700;cursor:pointer;font-size:1rem;transition:all 0.2s;
        background:${isCorrect ? '#22c55e' : isWrong ? '#ef4444' : '#2a2a4e'};
        color:#fff;
      `;
      btn.disabled = isGuessed;
      if (!isGuessed) {
        btn.addEventListener('click', () => guess(letter));
      }
      keyboard.appendChild(btn);
    });
  }

  function guess(letter) {
    if (isGameOver || guessed.has(letter)) return;
    guessed.add(letter);

    if (!target.includes(letter)) {
      wrong++;
    }

    drawHangman();
    updateWord();
    renderKeyboard();
  }

  function showMessage(text, color) {
    const msg = document.createElement('div');
    msg.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);padding:25px 40px;border-radius:15px;text-align:center;z-index:1000;border:2px solid ${color};`;
    msg.innerHTML = `<h3 style="color:${color};font-size:1.3rem;">${text}</h3><button onclick="this.closest('div').remove();window.hmReset()" style="margin-top:15px;padding:10px 25px;border:none;border-radius:8px;background:linear-gradient(135deg,#00d4ff,#7b2ff7);color:#fff;font-weight:700;cursor:pointer;">Yeniden Oyna</button>`;
    document.body.appendChild(msg);
  }

  window.hmReset = function() {
    target = WORDS[Math.floor(Math.random() * WORDS.length)];
    guessed = new Set();
    wrong = 0;
    isGameOver = false;
    drawHangman();
    updateWord();
    renderKeyboard();
  };

  document.addEventListener('keydown', e => {
    const key = e.key.toUpperCase();
    if (/[A-ZÇĞİÖŞÜ]/.test(key)) guess(key);
  });

  drawHangman();
  updateWord();
  renderKeyboard();

  return { destroy() { delete window.hmReset; } };
}