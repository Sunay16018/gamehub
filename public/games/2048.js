function init2048(container) {
  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Skor: <span id="tfeScore">0</span></div>
    <div class="lives">En İyi: <span id="tfeBest">0</span></div>
    <div class="timer">Ok Tuşları/Sürükle</div>
  `;
  container.appendChild(ui);
  
  const board = document.createElement('div');
  board.style.cssText = 'width:400px;height:400px;margin:0 auto;background:#bbada0;border-radius:10px;padding:10px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:10px;';
  container.appendChild(board);
  
  const COLORS = {
    0: '#cdc1b4', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563',
    32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850',
    1024: '#edc53f', 2048: '#edc22e', 4096: '#3c3a32', 8192: '#3c3a32'
  };
  
  let grid = Array(4).fill(null).map(() => Array(4).fill(0));
  let score = 0, best = parseInt(localStorage.getItem('2048_best') || '0');
  let isGameOver = false;
  
  document.getElementById('tfeBest').textContent = best;
  
  function render() {
    board.innerHTML = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = grid[r][c];
        const cell = document.createElement('div');
        cell.style.cssText = `
          background:${COLORS[val] || '#3c3a32'};
          border-radius:5px;display:flex;align-items:center;justify-content:center;
          font-size:${val > 512 ? '1.5rem' : '2rem'};font-weight:700;
          color:${val <= 4 ? '#776e65' : '#f9f6f2'};
          transition:all 0.15s;
        `;
        cell.textContent = val || '';
        board.appendChild(cell);
      }
    }
  }
  
  function spawn() {
    const empty = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!grid[r][c]) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return false;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }
  
  function slide(row) {
    const filtered = row.filter(x => x);
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        score += filtered[i];
        filtered.splice(i + 1, 1);
      }
    }
    while (filtered.length < 4) filtered.push(0);
    return filtered;
  }
  
  function moveLeft() {
    let moved = false;
    for (let r = 0; r < 4; r++) {
      const old = [...grid[r]];
      grid[r] = slide(grid[r]);
      if (old.toString() !== grid[r].toString()) moved = true;
    }
    return moved;
  }
  
  function moveRight() {
    let moved = false;
    for (let r = 0; r < 4; r++) {
      const old = [...grid[r]];
      grid[r] = slide(grid[r].reverse()).reverse();
      if (old.toString() !== grid[r].toString()) moved = true;
    }
    return moved;
  }
  
  function moveUp() {
    let moved = false;
    for (let c = 0; c < 4; c++) {
      const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
      const old = [...col];
      const newCol = slide(col);
      for (let r = 0; r < 4; r++) grid[r][c] = newCol[r];
      if (old.toString() !== newCol.toString()) moved = true;
    }
    return moved;
  }
  
  function moveDown() {
    let moved = false;
    for (let c = 0; c < 4; c++) {
      const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
      const old = [...col];
      const newCol = slide(col.reverse()).reverse();
      for (let r = 0; r < 4; r++) grid[r][c] = newCol[r];
      if (old.toString() !== newCol.toString()) moved = true;
    }
    return moved;
  }
  
  function canMove() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!grid[r][c]) return true;
        if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
        if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
      }
    }
    return false;
  }
  
  function checkWin() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 2048) return true;
      }
    }
    return false;
  }
  
  function handleMove(direction) {
    if (isGameOver) return;
    let moved = false;
    switch(direction) {
      case 'left': moved = moveLeft(); break;
      case 'right': moved = moveRight(); break;
      case 'up': moved = moveUp(); break;
      case 'down': moved = moveDown(); break;
    }
    if (moved) {
      spawn();
      document.getElementById('tfeScore').textContent = score;
      if (score > best) {
        best = score;
        localStorage.setItem('2048_best', best);
        document.getElementById('tfeBest').textContent = best;
      }
      if (checkWin()) {
        isGameOver = true;
        showMessage('2048! KAZANDIN!', '#00d4ff');
        if (typeof saveScore === 'function') saveScore('2048', score);
      } else if (!canMove()) {
        isGameOver = true;
        showMessage('Oyun Bitti!', '#ff6b6b');
        if (typeof saveScore === 'function') saveScore('2048', score);
      }
      render();
    }
  }
  
  function showMessage(text, color) {
    const msg = document.createElement('div');
    msg.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);padding:30px 50px;border-radius:20px;text-align:center;z-index:1000;border:2px solid ${color || '#00d4ff'};`;
    msg.innerHTML = `<h3 style="color:${color || '#fff'};font-size:1.3rem;">${text}</h3>`;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  }
  
  let startX = 0, startY = 0;
  board.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  });
  board.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 0 ? 'right' : 'left');
    } else {
      handleMove(dy > 0 ? 'down' : 'up');
    }
  });
  
  document.addEventListener('keydown', e => {
    switch(e.key) {
      case 'ArrowLeft': e.preventDefault(); handleMove('left'); break;
      case 'ArrowRight': e.preventDefault(); handleMove('right'); break;
      case 'ArrowUp': e.preventDefault(); handleMove('up'); break;
      case 'ArrowDown': e.preventDefault(); handleMove('down'); break;
    }
  });
  
  spawn(); spawn();
  render();
  
  return { destroy() {} };
}
