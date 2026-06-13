function initWordle(container) {
  const WORDS = ['KİTAP','MASA','EV','ARABA','KÖPEK','KEDİ','KUŞ','BALIK','AĞAÇ','ÇİÇEK',
    'GÜNEŞ','AY','YILDIZ','DENİZ','DAĞ','ORMAN','ŞEHİR','ÜLKE','DÜNYA','UZAY',
    'BİLGİ','BİLGİSAYAR','TELEFON','TELEVİZYON','RADYO','GAZETE','DERGİ','FİLM','MÜZİK','ŞARKI',
    'OYUN','SPOR','FUTBOL','BASKETBOL','VOLEYBOL','TENİS','YÜZME','KOŞU','BİSİKLET','YÜRÜYÜŞ',
    'YEMEK','SU','EKMEK','SÜT','PEYNİR','YOĞURT','ET','BALIK','MEYVE','SEBZE',
    'ELMA','ARMUT','PORTAKAL','MUZ','ÜZÜM','KARPUZ','ÇİLEK','KİRAZ','ŞEFTALİ','KAYISI',
    'DOMATES','SALATALIK','BİBER','PATATES','SOĞAN','SARIMSAK','HAVUÇ','LAHANA','ISPANAK','FASULYE',
    'KIRMIZI','MAVİ','YEŞİL','SARI','BEYAZ','SİYAH','TURUNCU','MOR','PEMBE','KAHVERENGİ',
    'BÜYÜK','KÜÇÜK','UZUN','KISA','GENİŞ','DAR','YÜKSEK','ALÇAK','KALIN','İNCE',
    'HIZLI','YAVAŞ','GÜÇLÜ','ZAYIF','SICAK','SOĞUK','YENİ','ESKİ','TEMİZ','KİRLİ',
    'GÜZEL','ÇİRKİN','MUTLU','ÜZGÜN','SİNİRLİ','SEVİNÇLİ','KORKMUŞ','CESUR','AKILLI','APTAL'];

  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Kelime Tahmini</div>
    <div class="lives">5 Harfli Kelime</div>
    <div class="timer">Enter: Tahmin</div>
  `;
  container.appendChild(ui);

  const gameArea = document.createElement('div');
  gameArea.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:center;padding:20px;';
  container.appendChild(gameArea);

  const keyboard = document.createElement('div');
  keyboard.style.cssText = 'display:flex;flex-direction:column;gap:5px;align-items:center;padding:15px;';
  container.appendChild(keyboard);

  let target = WORDS[Math.floor(Math.random() * WORDS.length)];
  let currentRow = 0, currentCol = 0;
  let grid = Array(6).fill(null).map(() => Array(5).fill(''));
  let isGameOver = false;

  function renderGrid() {
    gameArea.innerHTML = '';
    for (let r = 0; r < 6; r++) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;';
      for (let c = 0; c < 5; c++) {
        const cell = document.createElement('div');
        let bg = '#1a1a2e', border = 'rgba(0,212,255,0.2)';
        if (grid[r][c]) {
          if (r < currentRow) {
            const result = checkLetter(grid[r][c], c, target);
            if (result === 'correct') { bg = '#22c55e'; border = '#22c55e'; }
            else if (result === 'present') { bg = '#eab308'; border = '#eab308'; }
            else { bg = '#374151'; border = '#374151'; }
          } else {
            bg = '#1a1a2e'; border = '#00d4ff';
          }
        }
        cell.style.cssText = `
          width:55px;height:55px;display:flex;align-items:center;justify-content:center;
          font-size:1.5rem;font-weight:700;border-radius:8px;background:${bg};
          border:2px solid ${border};color:#fff;transition:all 0.3s;
        `;
        cell.textContent = grid[r][c] || '';
        row.appendChild(cell);
      }
      gameArea.appendChild(row);
    }
  }

  function renderKeyboard() {
    const rows = ['QWERTYUIOPĞÜ', 'ASDFGHJKLŞİ', 'ZXCVBNMÖÇ'];
    keyboard.innerHTML = '';
    rows.forEach(rowStr => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:4px;';
      rowStr.split('').forEach(key => {
        const btn = document.createElement('button');
        btn.textContent = key;
        btn.style.cssText = `
          padding:10px 12px;border:none;border-radius:6px;background:#2a2a4e;
          color:#fff;font-weight:600;cursor:pointer;font-size:0.9rem;transition:all 0.2s;
        `;
        btn.addEventListener('click', () => handleInput(key));
        row.appendChild(btn);
      });
      keyboard.appendChild(row);
    });

    const enterRow = document.createElement('div');
    enterRow.style.cssText = 'display:flex;gap:4px;';
    const enterBtn = document.createElement('button');
    enterBtn.textContent = 'ENTER';
    enterBtn.style.cssText = 'padding:10px 30px;border:none;border-radius:6px;background:#22c55e;color:#fff;font-weight:700;cursor:pointer;';
    enterBtn.addEventListener('click', () => handleInput('Enter'));
    enterRow.appendChild(enterBtn);

    const delBtn = document.createElement('button');
    delBtn.innerHTML = '<i class="fas fa-backspace"></i>';
    delBtn.style.cssText = 'padding:10px 20px;border:none;border-radius:6px;background:#ef4444;color:#fff;font-weight:700;cursor:pointer;';
    delBtn.addEventListener('click', () => handleInput('Backspace'));
    enterRow.appendChild(delBtn);
    keyboard.appendChild(enterRow);
  }

  function checkLetter(letter, pos, word) {
    if (word[pos] === letter) return 'correct';
    if (word.includes(letter)) return 'present';
    return 'absent';
  }

  function handleInput(key) {
    if (isGameOver) return;

    if (key === 'Enter') {
      if (currentCol < 5) return;
      const guess = grid[currentRow].join('');
      if (!WORDS.includes(guess)) {
        showMessage('Kelime listesinde yok!');
        return;
      }

      currentRow++;
      currentCol = 0;
      renderGrid();

      if (guess === target) {
        isGameOver = true;
        const score = (6 - currentRow + 1) * 200;
        showMessage(`TEBRİKLER! ${currentRow}. denemede buldun!`, '#22c55e');
        if (typeof saveScore === 'function') saveScore('wordle', score);
      } else if (currentRow >= 6) {
        isGameOver = true;
        showMessage(`KAYBETTİN! Kelime: ${target}`, '#ef4444');
      }
    } else if (key === 'Backspace') {
      if (currentCol > 0) {
        currentCol--;
        grid[currentRow][currentCol] = '';
        renderGrid();
      }
    } else if (currentCol < 5 && key.length === 1) {
      grid[currentRow][currentCol] = key.toUpperCase();
      currentCol++;
      renderGrid();
    }
  }

  function showMessage(text, color) {
    const msg = document.createElement('div');
    msg.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);padding:25px 40px;border-radius:15px;text-align:center;z-index:1000;border:2px solid ${color || '#00d4ff'};`;
    msg.innerHTML = `<h3 style="color:${color || '#fff'};font-size:1.3rem;">${text}</h3>`;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleInput('Enter');
    else if (e.key === 'Backspace') handleInput('Backspace');
    else if (e.key.length === 1 && /[a-zA-ZğüışöçĞÜİŞÖÇ]/.test(e.key)) handleInput(e.key);
  });

  renderGrid();
  renderKeyboard();

  return { destroy() {} };
}