function initPacman(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = 560; canvas.height = 620;

  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Skor: <span id="pmScore">0</span></div>
    <div class="lives"><i class="fas fa-heart"></i> <span id="pmLives">3</span></div>
    <div class="timer">Ok Tuşları</div>
  `;
  container.appendChild(ui);
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const TILE = 28;
  const ROWS = 22, COLS = 20;

  // 0=empty, 1=wall, 2=dot, 3=power, 4=ghost house
  const MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
    [1,3,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,3,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1,1],
    [0,0,0,1,2,1,2,2,2,2,2,2,2,2,1,2,1,0,0,0],
    [1,1,1,1,2,1,2,1,1,4,4,1,1,2,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,1,4,4,4,4,1,2,2,2,2,2,2,1],
    [1,1,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,1,1],
    [0,0,0,1,2,1,2,2,2,2,2,2,2,2,1,2,1,0,0,0],
    [1,1,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1,2,3,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  let grid = MAP.map(row => [...row]);
  let pacman = { x: 9, y: 15, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouthOpen: 0 };
  let ghosts = [
    { x: 9, y: 9, color: '#ef4444', dir: { x: 0, y: -1 }, scared: 0 },
    { x: 10, y: 9, color: '#22c55e', dir: { x: 0, y: -1 }, scared: 0 },
    { x: 9, y: 10, color: '#f97316', dir: { x: -1, y: 0 }, scared: 0 },
    { x: 10, y: 10, color: '#a855f7', dir: { x: 1, y: 0 }, scared: 0 }
  ];
  let score = 0, lives = 3, dots = 0;
  let gameLoop = null, isGameOver = false, isPaused = false;

  function countDots() {
    dots = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === 2 || grid[r][c] === 3) dots++;
      }
    }
  }
  countDots();

  function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Walls
    ctx.fillStyle = '#1e3a5f';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === 1) {
          ctx.fillRect(c * TILE + 1, r * TILE + 1, TILE - 2, TILE - 2);
        } else if (grid[r][c] === 2) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath(); ctx.arc(c * TILE + TILE/2, r * TILE + TILE/2, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#1e3a5f';
        } else if (grid[r][c] === 3) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath(); ctx.arc(c * TILE + TILE/2, r * TILE + TILE/2, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#1e3a5f';
        }
      }
    }

    // Pacman
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    const cx = pacman.x * TILE + TILE/2, cy = pacman.y * TILE + TILE/2;
    let startAngle = 0.2 * Math.PI;
    if (pacman.dir.x === 1) startAngle = 0.2 * Math.PI;
    else if (pacman.dir.x === -1) startAngle = 1.2 * Math.PI;
    else if (pacman.dir.y === -1) startAngle = 1.7 * Math.PI;
    else if (pacman.dir.y === 1) startAngle = 0.7 * Math.PI;
    const mouth = 0.2 + 0.15 * Math.sin(pacman.mouthOpen);
    ctx.arc(cx, cy, TILE/2 - 2, startAngle + mouth, startAngle + 2 * Math.PI - mouth);
    ctx.lineTo(cx, cy); ctx.fill();

    // Ghosts
    ghosts.forEach(g => {
      ctx.fillStyle = g.scared > 0 ? '#3b82f6' : g.color;
      const gx = g.x * TILE + TILE/2, gy = g.y * TILE + TILE/2;
      ctx.beginPath();
      ctx.arc(gx, gy - 3, TILE/2 - 4, Math.PI, 0);
      ctx.lineTo(gx + TILE/2 - 4, gy + TILE/2 - 4);
      for (let i = 0; i < 3; i++) {
        ctx.lineTo(gx + TILE/2 - 4 - (i + 1) * (TILE - 8)/3, gy + TILE/2 - 8 + (i % 2) * 6);
      }
      ctx.lineTo(gx - TILE/2 + 4, gy + TILE/2 - 4);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(gx - 5, gy - 6, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(gx + 5, gy - 6, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(gx - 5 + (g.dir.x * 2), gy - 6 + (g.dir.y * 2), 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(gx + 5 + (g.dir.x * 2), gy - 6 + (g.dir.y * 2), 2, 0, Math.PI * 2); ctx.fill();
    });
  }

  function update() {
    if (isPaused || isGameOver) return;

    pacman.mouthOpen += 0.3;

    // Move pacman
    if (pacman.nextDir.x !== 0 || pacman.nextDir.y !== 0) {
      const nx = pacman.x + pacman.nextDir.x;
      const ny = pacman.y + pacman.nextDir.y;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && grid[ny][nx] !== 1) {
        pacman.dir = { ...pacman.nextDir };
      }
    }

    const newX = pacman.x + pacman.dir.x;
    const newY = pacman.y + pacman.dir.y;

    if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS && grid[newY][newX] !== 1) {
      pacman.x = newX; pacman.y = newY;

      if (grid[newY][newX] === 2) {
        grid[newY][newX] = 0;
        score += 10; dots--;
        document.getElementById('pmScore').textContent = score;
      } else if (grid[newY][newX] === 3) {
        grid[newY][newX] = 0;
        score += 50; dots--;
        ghosts.forEach(g => g.scared = 200);
        document.getElementById('pmScore').textContent = score;
      }
    }

    // Tunnel
    if (pacman.x < 0) pacman.x = COLS - 1;
    if (pacman.x >= COLS) pacman.x = 0;

    // Move ghosts
    ghosts.forEach(g => {
      if (g.scared > 0) g.scared--;

      const dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
      const valid = dirs.filter(d => {
        const nx = g.x + d.x, ny = g.y + d.y;
        return nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && grid[ny][nx] !== 1 && !(d.x === -g.dir.x && d.y === -g.dir.y);
      });

      if (valid.length > 0) {
        if (g.scared > 0) {
          g.dir = valid[Math.floor(Math.random() * valid.length)];
        } else {
          // Chase pacman
          let best = valid[0], bestDist = Infinity;
          valid.forEach(d => {
            const dist = Math.abs(g.x + d.x - pacman.x) + Math.abs(g.y + d.y - pacman.y);
            if (dist < bestDist) { bestDist = dist; best = d; }
          });
          g.dir = best;
        }
      }

      g.x += g.dir.x; g.y += g.dir.y;
      if (g.x < 0) g.x = COLS - 1;
      if (g.x >= COLS) g.x = 0;

      // Collision
      if (g.x === pacman.x && g.y === pacman.y) {
        if (g.scared > 0) {
          g.x = 9; g.y = 9; g.scared = 0;
          score += 200;
          document.getElementById('pmScore').textContent = score;
        } else {
          lives--;
          document.getElementById('pmLives').textContent = lives;
          if (lives <= 0) { gameOver(); return; }
          pacman.x = 9; pacman.y = 15;
          ghosts.forEach(g2 => { g2.x = 9 + Math.floor(Math.random()*2); g2.y = 9 + Math.floor(Math.random()*2); });
        }
      }
    });

    if (dots === 0) {
      score += 1000;
      document.getElementById('pmScore').textContent = score;
      gameOver(true);
    }

    draw();
  }

  function gameOver(won) {
    isGameOver = true;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = won ? '#00d4ff' : '#ff6b6b';
    ctx.font = 'bold 40px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText(won ? 'KAZANDIN!' : 'OYUN BİTTİ', canvas.width/2, canvas.height/2 - 20);
    ctx.fillStyle = '#fff'; ctx.font = '24px Inter';
    ctx.fillText(`Skor: ${score}`, canvas.width/2, canvas.height/2 + 30);
    if (typeof saveScore === 'function') saveScore('pacman', score);
  }

  function handleKey(e) {
    if (isGameOver) return;
    switch(e.key) {
      case 'ArrowUp': pacman.nextDir = { x: 0, y: -1 }; break;
      case 'ArrowDown': pacman.nextDir = { x: 0, y: 1 }; break;
      case 'ArrowLeft': pacman.nextDir = { x: -1, y: 0 }; break;
      case 'ArrowRight': pacman.nextDir = { x: 1, y: 0 }; break;
      case ' ': isPaused = !isPaused; break;
    }
  }

  document.addEventListener('keydown', handleKey);
  draw();
  gameLoop = setInterval(update, 150);

  return { destroy() { clearInterval(gameLoop); document.removeEventListener('keydown', handleKey); } };
}