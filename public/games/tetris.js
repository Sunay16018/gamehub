function initTetris(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = 300; canvas.height = 600;

  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Skor: <span id="tetrisScore">0</span></div>
    <div class="lives">Satır: <span id="tetrisLines">0</span></div>
    <div class="timer">Seviye: <span id="tetrisLevel">1</span></div>
  `;
  container.appendChild(ui);
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const COLS = 10, ROWS = 20, BLOCK = 30;

  const SHAPES = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1]], // T
    [[1,1,0],[0,1,1]], // S
    [[0,1,1],[1,1,0]], // Z
    [[1,0,0],[1,1,1]], // L
    [[0,0,1],[1,1,1]]  // J
  ];
  const COLORS = ['#00f0f0','#f0f000','#a000f0','#00f000','#f00000','#f0a000','#0000f0'];

  let board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
  let current = null, currentX = 0, currentY = 0, currentColor = 0;
  let score = 0, lines = 0, level = 1, speed = 800;
  let gameLoop = null, isGameOver = false, isPaused = false;

  function newPiece() {
    const type = Math.floor(Math.random() * SHAPES.length);
    current = SHAPES[type];
    currentColor = type + 1;
    currentX = Math.floor((COLS - current[0].length) / 2);
    currentY = 0;
    if (collides(currentX, currentY, current)) { gameOver(); }
  }

  function collides(x, y, shape) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const nx = x + c, ny = y + r;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
      }
    }
    return false;
  }

  function merge() {
    for (let r = 0; r < current.length; r++) {
      for (let c = 0; c < current[r].length; c++) {
        if (current[r][c]) {
          board[currentY + r][currentX + c] = currentColor;
        }
      }
    }
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(c => c !== 0)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared > 0) {
      lines += cleared;
      score += [0,100,300,500,800][cleared] * level;
      document.getElementById('tetrisScore').textContent = score;
      document.getElementById('tetrisLines').textContent = lines;
      if (lines >= level * 10) {
        level++;
        speed = Math.max(100, 800 - (level - 1) * 70);
        document.getElementById('tetrisLevel').textContent = level;
        clearInterval(gameLoop);
        gameLoop = setInterval(update, speed);
      }
    }
  }

  function rotate(shape) {
    const rows = shape.length, cols = shape[0].length;
    const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = shape[r][c];
      }
    }
    return rotated;
  }

  function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Board
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) {
          ctx.fillStyle = COLORS[board[r][c] - 1];
          ctx.fillRect(c * BLOCK + 1, r * BLOCK + 1, BLOCK - 2, BLOCK - 2);
        }
      }
    }

    // Current piece
    if (current) {
      ctx.fillStyle = COLORS[currentColor - 1];
      for (let r = 0; r < current.length; r++) {
        for (let c = 0; c < current[r].length; c++) {
          if (current[r][c]) {
            ctx.fillRect((currentX + c) * BLOCK + 1, (currentY + r) * BLOCK + 1, BLOCK - 2, BLOCK - 2);
          }
        }
      }
    }

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * BLOCK, 0); ctx.lineTo(i * BLOCK, canvas.height); ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * BLOCK); ctx.lineTo(canvas.width, i * BLOCK); ctx.stroke();
    }
  }

  function update() {
    if (isPaused || isGameOver) return;
    if (!collides(currentX, currentY + 1, current)) {
      currentY++;
    } else {
      merge();
      clearLines();
      newPiece();
    }
    draw();
  }

  function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 30px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('OYUN BİTTİ', canvas.width/2, canvas.height/2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Inter';
    ctx.fillText(`Skor: ${score}`, canvas.width/2, canvas.height/2 + 30);
    if (typeof saveScore === 'function') saveScore('tetris', score);
  }

  function handleKey(e) {
    if (isGameOver) return;
    switch(e.key) {
      case 'ArrowLeft': if (!collides(currentX - 1, currentY, current)) currentX--; break;
      case 'ArrowRight': if (!collides(currentX + 1, currentY, current)) currentX++; break;
      case 'ArrowDown': if (!collides(currentX, currentY + 1, current)) currentY++; break;
      case 'ArrowUp': {
        const rotated = rotate(current);
        if (!collides(currentX, currentY, rotated)) current = rotated;
        break;
      }
      case ' ': isPaused = !isPaused; break;
    }
    draw();
  }

  // Touch
  let touchStartX = 0, touchStartY = 0;
  canvas.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; });
  canvas.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30 && !collides(currentX + 1, currentY, current)) currentX++;
      else if (dx < -30 && !collides(currentX - 1, currentY, current)) currentX--;
    } else {
      if (dy > 30) { if (!collides(currentX, currentY + 1, current)) currentY++; }
      else if (dy < -30) { const r = rotate(current); if (!collides(currentX, currentY, r)) current = r; }
    }
    draw();
  });

  document.addEventListener('keydown', handleKey);
  newPiece();
  draw();
  gameLoop = setInterval(update, speed);

  return { destroy() { clearInterval(gameLoop); document.removeEventListener('keydown', handleKey); } };
}