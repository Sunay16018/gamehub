function initChess(container) {
  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Sen: Beyaz</div>
    <div class="lives">Bot: Siyah</div>
    <div class="timer">Tıkla Seç, Tıkla Oyna</div>
  `;
  container.appendChild(ui);
  
  const board = document.createElement('div');
  board.style.cssText = 'width:400px;height:400px;margin:0 auto;display:grid;grid-template-columns:repeat(8,1fr);border:3px solid #8b4513;';
  container.appendChild(board);
  
  const PIECES = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
  };
  
  let grid = [
    ['br','bn','bb','bq','bk','bb','bn','br'],
    ['bp','bp','bp','bp','bp','bp','bp','bp'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['wp','wp','wp','wp','wp','wp','wp','wp'],
    ['wr','wn','wb','wq','wk','wb','wn','wr']
  ];
  let selected = null, current = 'w', isGameOver = false;
  
  function render() {
    board.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        const isDark = (r + c) % 2 === 1;
        const piece = grid[r][c];
        cell.style.cssText = `
          background:${isDark ? '#769656' : '#eeeed2'};
          display:flex;align-items:center;justify-content:center;
          font-size:2rem;cursor:pointer;
          ${selected && selected.r === r && selected.c === c ? 'box-shadow:inset 0 0 0 3px #00d4ff;' : ''}
        `;
        if (piece) {
          const color = piece[0] === 'w' ? 'w' : 'b';
          const type = piece[1];
          cell.textContent = PIECES[color][type];
        }
        cell.dataset.r = r; cell.dataset.c = c;
        cell.addEventListener('click', () => handleClick(r, c));
        board.appendChild(cell);
      }
    }
  }
  
  function handleClick(r, c) {
    if (isGameOver || current !== 'w') return;
    
    if (selected) {
      if (isValidMove(selected.r, selected.c, r, c)) {
        grid[r][c] = grid[selected.r][selected.c];
        grid[selected.r][selected.c] = '';
        selected = null;
        current = 'b';
        render();
        if (checkWin('w')) { endGame('w'); return; }
        setTimeout(botMove, 500);
      } else {
        selected = null;
        render();
      }
    } else if (grid[r][c] && grid[r][c][0] === 'w') {
      selected = { r, c };
      render();
    }
  }
  
  function isValidMove(fr, fc, tr, tc) {
    const piece = grid[fr][fc];
    const target = grid[tr][tc];
    if (!piece) return false;
    if (target && target[0] === piece[0]) return false;
    
    const type = piece[1];
    const dr = tr - fr, dc = tc - fc;
    
    switch(type) {
      case 'p':
        const dir = piece[0] === 'w' ? -1 : 1;
        const startRow = piece[0] === 'w' ? 6 : 1;
        if (dc === 0 && !target) {
          if (dr === dir) return true;
          if (fr === startRow && dr === 2 * dir && !grid[fr + dir][fc]) return true;
        }
        if (Math.abs(dc) === 1 && dr === dir && target) return true;
        return false;
      case 'r':
        if (dr !== 0 && dc !== 0) return false;
        return isPathClear(fr, fc, tr, tc);
      case 'b':
        if (Math.abs(dr) !== Math.abs(dc)) return false;
        return isPathClear(fr, fc, tr, tc);
      case 'q':
        if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;
        return isPathClear(fr, fc, tr, tc);
      case 'n':
        return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      case 'k':
        return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    }
    return false;
  }
  
  function isPathClear(fr, fc, tr, tc) {
    const dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);
    let r = fr + dr, c = fc + dc;
    while (r !== tr || c !== tc) {
      if (grid[r][c]) return false;
      r += dr; c += dc;
    }
    return true;
  }
  
  function botMove() {
    if (isGameOver) return;
    const moves = [];
    for (let fr = 0; fr < 8; fr++) {
      for (let fc = 0; fc < 8; fc++) {
        if (grid[fr][fc] && grid[fr][fc][0] === 'b') {
          for (let tr = 0; tr < 8; tr++) {
            for (let tc = 0; tc < 8; tc++) {
              if (isValidMove(fr, fc, tr, tc)) {
                const capture = grid[tr][tc] ? grid[tr][tc][1] : '';
                moves.push({ fr, fc, tr, tc, score: getPieceValue(capture) });
              }
            }
          }
        }
      }
    }
    if (moves.length === 0) { endGame('w'); return; }
    moves.sort((a, b) => b.score - a.score);
    const move = moves[0];
    grid[move.tr][move.tc] = grid[move.fr][move.fc];
    grid[move.fr][move.fc] = '';
    current = 'w';
    render();
    if (checkWin('b')) endGame('b');
  }
  
  function getPieceValue(p) {
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
    return values[p] || 0;
  }
  
  function checkWin(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (grid[r][c] === (color === 'w' ? 'bk' : 'wk')) return false;
      }
    }
    return true;
  }
  
  function endGame(winner) {
    isGameOver = true;
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);padding:30px 50px;border-radius:20px;text-align:center;z-index:1000;';
    msg.innerHTML = `<h2 style="font-family:Orbitron;font-size:2rem;color:${winner === 'w' ? '#00d4ff' : '#ff6b6b'};margin-bottom:15px;">${winner === 'w' ? 'KAZANDIN!' : 'KAYBETTİN!'}</h2><button onclick="this.closest('div').remove();window.chessReset()" style="padding:10px 30px;border:none;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7b2ff7);color:#fff;font-weight:700;cursor:pointer;">Yeniden Oyna</button>`;
    document.body.appendChild(msg);
    if (winner === 'w' && typeof saveScore === 'function') saveScore('chess', 500);
  }
  
  window.chessReset = function() {
    grid = [
      ['br','bn','bb','bq','bk','bb','bn','br'],
      ['bp','bp','bp','bp','bp','bp','bp','bp'],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['wp','wp','wp','wp','wp','wp','wp','wp'],
      ['wr','wn','wb','wq','wk','wb','wn','wr']
    ];
    selected = null; current = 'w'; isGameOver = false;
    render();
  };
  
  render();
  return { destroy() { delete window.chessReset; } };
}
