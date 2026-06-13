function initMinesweeper(container) {
  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Bayrak: <span id="msFlags">10</span></div>
    <div class="lives">Mayın: <span id="msMines">10</span></div>
    <div class="timer">Süre: <span id="msTime">0</span>s</div>
  `;
  container.appendChild(ui);
  
  const board = document.createElement('div');
  board.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr);gap:2px;max-width:400px;margin:0 auto;padding:20px;background:rgba(0,0,0,0.3);border-radius:10px;';
  container.appendChild(board);
  
  const ROWS = 8, COLS = 8, MINES = 10;
  let cells = [], revealed = 0, flags = 0, timer = 0;
  let timerInterval = null, isGameOver = false, firstClick = true;
  
  function init() {
    cells = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        cells.push({ r, c, mine: false, revealed: false, flagged: false, adjacent: 0 });
      }
    }
    render();
  }
  
  function placeMines(excludeR, excludeC) {
    let placed = 0;
    while (placed < MINES) {
      const idx = Math.floor(Math.random() * cells.length);
      const cell = cells[idx];
      if (!cell.mine && !(cell.r === excludeR && cell.c === excludeC)) {
        cell.mine = true;
        placed++;
      }
    }
    cells.forEach(cell => {
      if (cell.mine) return;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = cell.r + dr, nc = cell.c + dc;
          const neighbor = cells.find(c => c.r === nr && c.c === nc);
          if (neighbor && neighbor.mine) count++;
        }
      }
      cell.adjacent = count;
    });
  }
  
  function render() {
    board.innerHTML = '';
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const el = document.createElement('div');
      let bg = '#2a2a4e', content = '';
      
      if (cell.revealed) {
        bg = cell.mine ? '#ef4444' : '#1a1a2e';
        content = cell.mine ? '💣' : (cell.adjacent || '');
      } else if (cell.flagged) {
        content = '🚩';
      }
      
      const colors = ['','#3b82f6','#22c55e','#ef4444','#a855f7','#f97316','#06b6d4','#000','#888'];
      const textColor = cell.revealed && !cell.mine ? colors[cell.adjacent] || '#fff' : '#fff';
      
      el.style.cssText = `
        aspect-ratio:1;display:flex;align-items:center;justify-content:center;
        font-size:1rem;font-weight:700;cursor:pointer;user-select:none;
        background:${bg};color:${textColor};border-radius:4px;
      `;
      el.textContent = content;
      el.addEventListener('click', () => reveal(i));
      el.addEventListener('contextmenu', e => { e.preventDefault(); toggleFlag(i); });
      board.appendChild(el);
    }
  }
  
  function reveal(idx) {
    if (isGameOver) return;
    const cell = cells[idx];
    if (cell.revealed || cell.flagged) return;
    
    if (firstClick) {
      firstClick = false;
      placeMines(cell.r, cell.c);
      timerInterval = setInterval(() => {
        timer++;
        document.getElementById('msTime').textContent = timer;
      }, 1000);
    }
    
    cell.revealed = true;
    revealed++;
    
    if (cell.mine) {
      gameOver(false); return;
    }
    
    if (cell.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const neighbor = cells.find(c => c.r === cell.r + dr && c.c === cell.c + dc);
          if (neighbor) reveal(cells.indexOf(neighbor));
        }
      }
    }
    
    if (revealed === ROWS * COLS - MINES) gameOver(true);
    render();
  }
  
  function toggleFlag(idx) {
    if (isGameOver) return;
    const cell = cells[idx];
    if (cell.revealed) return;
    
    if (cell.flagged) {
      cell.flagged = false;
      flags--;
    } else if (flags < MINES) {
      cell.flagged = true;
      flags++;
    }
    
    document.getElementById('msFlags').textContent = MINES - flags;
    render();
  }
  
  function gameOver(won) {
    isGameOver = true;
    clearInterval(timerInterval);
    cells.forEach(c => { if (c.mine) c.revealed = true; });
    render();
    
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100;';
    const score = won ? Math.max(0, 5000 - timer * 10) : 0;
    overlay.innerHTML = `<div style="text-align:center;"><h2 style="font-family:Orbitron;font-size:2.5rem;color:${won ? '#00d4ff' : '#ef4444'};margin-bottom:20px;">${won ? 'KAZANDIN!' : 'PATLAMA!'}</h2><p style="font-size:1.3rem;color:#fff;">Süre: ${timer}s</p>${won ? `<p style="font-size:1.5rem;color:#ffd700;margin-top:15px;">Skor: ${score}</p>` : ''}</div>`;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 3000);
    
    if (won && typeof saveScore === 'function') saveScore('minesweeper', score);
  }
  
  init();
  return { destroy() { clearInterval(timerInterval); } };
}
