function initTictactoe(container) {
  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Sen: <span id="tttPlayer">0</span></div>
    <div class="lives">Bot: <span id="tttBot">0</span></div>
    <div class="timer">Berabere: <span id="tttDraw">0</span></div>
  `;
  container.appendChild(ui);
  
  const board = document.createElement('div');
  board.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:350px;margin:0 auto;padding:20px;';
  container.appendChild(board);
  
  let cells = Array(9).fill(null);
  let current = 'X', playerScore = 0, botScore = 0, draws = 0;
  let isGameOver = false;
  
  function render() {
    board.innerHTML = cells.map((c, i) => `
      <div class="ttt-cell" data-index="${i}" style="
        aspect-ratio:1;background:linear-gradient(145deg,#1a1a2e,#16213e);
        border-radius:15px;display:flex;align-items:center;justify-content:center;
        font-size:3rem;font-weight:700;cursor:pointer;border:2px solid rgba(0,212,255,0.2);
        color:${c === 'X' ? '#00d4ff' : c === 'O' ? '#ff6b6b' : 'transparent'};
        transition:all 0.3s;
      ">${c || ''}</div>
    `).join('');
    
    board.querySelectorAll('.ttt-cell').forEach(cell => {
      cell.addEventListener('click', () => makeMove(parseInt(cell.dataset.index)));
    });
  }
  
  function checkWin(board) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of wins) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    if (board.every(c => c)) return 'draw';
    return null;
  }
  
  function makeMove(idx) {
    if (isGameOver || cells[idx] || current !== 'X') return;
    cells[idx] = 'X';
    current = 'O';
    render();
    
    const result = checkWin(cells);
    if (result) { endGame(result); return; }
    setTimeout(botMove, 500);
  }
  
  function botMove() {
    if (isGameOver) return;
    
    const moves = [];
    for (let i = 0; i < 9; i++) {
      if (!cells[i]) {
        // Try to win
        const test = [...cells];
        test[i] = 'O';
        if (checkWin(test) === 'O') { makeBotMove(i); return; }
        
        // Block player
        test[i] = 'X';
        if (checkWin(test) === 'X') { makeBotMove(i); return; }
      }
    }
    
    // Center
    if (!cells[4]) { makeBotMove(4); return; }
    
    // Corner
    const corners = [0,2,6,8].filter(i => !cells[i]);
    if (corners.length) { makeBotMove(corners[Math.floor(Math.random() * corners.length)]); return; }
    
    // Random
    const empty = cells.map((c, i) => c === null ? i : null).filter(i => i !== null);
    if (empty.length) makeBotMove(empty[Math.floor(Math.random() * empty.length)]);
  }
  
  function makeBotMove(idx) {
    cells[idx] = 'O';
    current = 'X';
    render();
    const result = checkWin(cells);
    if (result) endGame(result);
  }
  
  function endGame(result) {
    isGameOver = true;
    if (result === 'X') { playerScore++; document.getElementById('tttPlayer').textContent = playerScore; }
    else if (result === 'O') { botScore++; document.getElementById('tttBot').textContent = botScore; }
    else { draws++; document.getElementById('tttDraw').textContent = draws; }
    
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);padding:30px 50px;border-radius:20px;text-align:center;z-index:1000;';
    msg.innerHTML = `<h2 style="font-family:Orbitron;font-size:2rem;color:${result === 'X' ? '#00d4ff' : result === 'O' ? '#ff6b6b' : '#ffd700'};margin-bottom:15px;">${result === 'X' ? 'KAZANDIN!' : result === 'O' ? 'KAYBETTİN!' : 'BERABERE!'}</h2><button onclick="this.closest('div').remove();window.tttReset()" style="padding:10px 30px;border:none;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7b2ff7);color:#fff;font-weight:700;cursor:pointer;">Yeniden Oyna</button>`;
    document.body.appendChild(msg);
    
    if (result === 'X' && typeof saveScore === 'function') saveScore('tictactoe', 100);
  }
  
  window.tttReset = function() {
    cells = Array(9).fill(null);
    current = 'X';
    isGameOver = false;
    render();
  };
  
  render();
  return { destroy() { delete window.tttReset; } };
}
