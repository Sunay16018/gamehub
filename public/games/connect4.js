function initConnect4(container) {
  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Sen: <span id="c4Player">0</span></div>
    <div class="lives">Bot: <span id="c4Bot">0</span></div>
    <div class="timer">Sıra: <span id="c4Turn" style="color:#ff6b6b;">Kırmızı</span></div>
  `;
  container.appendChild(ui);
  
  const board = document.createElement('div');
  board.style.cssText = 'width:420px;height:360px;margin:0 auto;background:#1e40af;border-radius:10px;padding:10px;display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(6,1fr);gap:5px;';
  container.appendChild(board);
  
  const ROWS = 6, COLS = 7;
  let grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
  let current = 1, playerScore = 0, botScore = 0, isGameOver = false;
  
  function render() {
    board.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        const val = grid[r][c];
        cell.style.cssText = `
          background:${val === 0 ? '#fff' : val === 1 ? '#ef4444' : '#eab308'};
          border-radius:50%;cursor:pointer;transition:all 0.3s;
          box-shadow:inset 0 2px 5px rgba(0,0,0,0.2);
        `;
        cell.dataset.col = c;
        cell.addEventListener('click', () => dropPiece(c));
        board.appendChild(cell);
      }
    }
  }
  
  function dropPiece(col) {
    if (isGameOver || current !== 1) return;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!grid[r][col]) {
        grid[r][col] = 1;
        current = 2;
        document.getElementById('c4Turn').textContent = 'Sarı';
        document.getElementById('c4Turn').style.color = '#eab308';
        render();
        const win = checkWin(1);
        if (win) { endGame(1); return; }
        if (isDraw()) { endGame(0); return; }
        setTimeout(botMove, 600);
        return;
      }
    }
  }
  
  function botMove() {
    if (isGameOver) return;
    
    // Try to win
    for (let c = 0; c < COLS; c++) {
      const r = getRow(c);
      if (r === -1) continue;
      grid[r][c] = 2;
      if (checkWin(2)) { grid[r][c] = 0; makeBotMove(c); return; }
      grid[r][c] = 0;
    }
    
    // Block
    for (let c = 0; c < COLS; c++) {
      const r = getRow(c);
      if (r === -1) continue;
      grid[r][c] = 1;
      if (checkWin(1)) { grid[r][c] = 0; makeBotMove(c); return; }
      grid[r][c] = 0;
    }
    
    // Center preference
    const order = [3,2,4,1,5,0,6];
    for (const c of order) if (getRow(c) !== -1) { makeBotMove(c); return; }
  }
  
  function getRow(col) {
    for (let r = ROWS - 1; r >= 0; r--) if (!grid[r][col]) return r;
    return -1;
  }
  
  function makeBotMove(col) {
    const r = getRow(col);
    if (r === -1) return;
    grid[r][col] = 2;
    current = 1;
    document.getElementById('c4Turn').textContent = 'Kırmızı';
    document.getElementById('c4Turn').style.color = '#ef4444';
    render();
    const win = checkWin(2);
    if (win) { endGame(2); return; }
    if (isDraw()) { endGame(0); return; }
  }
  
  function checkWin(player) {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (grid[r][c] === player && grid[r][c+1] === player && grid[r][c+2] === player && grid[r][c+3] === player) return true;
      }
    }
    // Vertical
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === player && grid[r+1][c] === player && grid[r+2][c] === player && grid[r+3][c] === player) return true;
      }
    }
    // Diagonal
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (grid[r][c] === player && grid[r+1][c+1] === player && grid[r+2][c+2] === player && grid[r+3][c+3] === player) return true;
        if (grid[r+3][c] === player && grid[r+2][c+1] === player && grid[r+1][c+2] === player && grid[r][c+3] === player) return true;
      }
    }
    return false;
  }
  
  function isDraw() {
    return grid[0].every(c => c !== 0);
  }
  
  function endGame(winner) {
    isGameOver = true;
    if (winner === 1) { playerScore++; document.getElementById('c4Player').textContent = playerScore; }
    else if (winner === 2) { botScore++; document.getElementById('c4Bot').textContent = botScore; }
    
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);padding:30px 50px;border-radius:20px;text-align:center;z-index:1000;';
    msg.innerHTML = `<h2 style="font-family:Orbitron;font-size:2rem;color:${winner === 1 ? '#ef4444' : winner === 2 ? '#eab308' : '#ffd700'};margin-bottom:15px;">${winner === 1 ? 'KAZANDIN!' : winner === 2 ? 'KAYBETTİN!' : 'BERABERE!'}</h2><button onclick="this.closest('div').remove();window.c4Reset()" style="padding:10px 30px;border:none;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7b2ff7);color:#fff;font-weight:700;cursor:pointer;">Yeniden Oyna</button>`;
    document.body.appendChild(msg);
    
    if (winner === 1 && typeof saveScore === 'function') saveScore('connect4', 200);
  }
  
  window.c4Reset = function() {
    grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    current = 1;
    isGameOver = false;
    document.getElementById('c4Turn').textContent = 'Kırmızı';
    document.getElementById('c4Turn').style.color = '#ef4444';
    render();
  };
  
  render();
  return { destroy() { delete window.c4Reset; } };
}
