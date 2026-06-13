function initSnake(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = 600; canvas.height = 400;

  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Skor: <span id="snakeScore">0</span></div>
    <div class="lives"><i class="fas fa-heart"></i> <span id="snakeLives">3</span></div>
    <div class="timer">Hız: <span id="snakeSpeed">1</span></div>
  `;

  container.appendChild(ui);
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const gridSize = 20;
  const cols = canvas.width / gridSize;
  const rows = canvas.height / gridSize;

  let snake = [{ x: 10, y: 10 }];
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let food = null;
  let score = 0;
  let lives = 3;
  let speed = 150;
  let level = 1;
  let gameLoop = null;
  let isPaused = false;
  let isGameOver = false;

  function spawnFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(0,212,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= cols; i++) {
      ctx.beginPath(); ctx.moveTo(i * gridSize, 0); ctx.lineTo(i * gridSize, canvas.height); ctx.stroke();
    }
    for (let i = 0; i <= rows; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * gridSize); ctx.lineTo(canvas.width, i * gridSize); ctx.stroke();
    }

    // Food
    if (food) {
      ctx.fillStyle = '#ff6b6b';
      ctx.shadowColor = '#ff6b6b';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Snake
    snake.forEach((seg, i) => {
      const alpha = 1 - (i / snake.length) * 0.5;
      ctx.fillStyle = i === 0 ? `rgba(0,212,255,${alpha})` : `rgba(0,180,220,${alpha})`;
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = i === 0 ? 10 : 0;
      ctx.fillRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2);
      ctx.shadowBlur = 0;

      // Eyes
      if (i === 0) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(seg.x * gridSize + 5, seg.y * gridSize + 5, 3, 3);
        ctx.fillRect(seg.x * gridSize + 12, seg.y * gridSize + 5, 3, 3);
      }
    });
  }

  function update() {
    if (isPaused || isGameOver) return;

    direction = { ...nextDirection };
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Wall collision
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      lives--;
      document.getElementById('snakeLives').textContent = lives;
      if (lives <= 0) { gameOver(); return; }
      // Reset position
      snake = [{ x: Math.floor(cols/2), y: Math.floor(rows/2) }];
      direction = { x: 1, y: 0 };
      nextDirection = { x: 1, y: 0 };
      return;
    }

    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      lives--;
      document.getElementById('snakeLives').textContent = lives;
      if (lives <= 0) { gameOver(); return; }
      snake = [{ x: Math.floor(cols/2), y: Math.floor(rows/2) }];
      direction = { x: 1, y: 0 };
      nextDirection = { x: 1, y: 0 };
      return;
    }

    snake.unshift(head);

    // Eat food
    if (food && head.x === food.x && head.y === food.y) {
      score += 10 * level;
      document.getElementById('snakeScore').textContent = score;

      if (score % 50 === 0) {
        level++;
        speed = Math.max(50, speed - 10);
        document.getElementById('snakeSpeed').textContent = level;
        clearInterval(gameLoop);
        gameLoop = setInterval(update, speed);
      }
      spawnFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 40px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('OYUN BİTTİ', canvas.width/2, canvas.height/2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Inter';
    ctx.fillText(`Skor: ${score}`, canvas.width/2, canvas.height/2 + 30);

    if (typeof saveScore === 'function') saveScore('snake', score);
  }

  function handleKey(e) {
    if (isGameOver) return;
    switch(e.key) {
      case 'ArrowUp': if (direction.y === 0) nextDirection = { x: 0, y: -1 }; break;
      case 'ArrowDown': if (direction.y === 0) nextDirection = { x: 0, y: 1 }; break;
      case 'ArrowLeft': if (direction.x === 0) nextDirection = { x: -1, y: 0 }; break;
      case 'ArrowRight': if (direction.x === 0) nextDirection = { x: 1, y: 0 }; break;
      case ' ': isPaused = !isPaused; break;
    }
  }

  // Touch controls
  let touchStartX = 0, touchStartY = 0;
  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });
  canvas.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && direction.x === 0) nextDirection = { x: 1, y: 0 };
      else if (dx < 0 && direction.x === 0) nextDirection = { x: -1, y: 0 };
    } else {
      if (dy > 0 && direction.y === 0) nextDirection = { x: 0, y: 1 };
      else if (dy < 0 && direction.y === 0) nextDirection = { x: 0, y: -1 };
    }
  });

  document.addEventListener('keydown', handleKey);
  spawnFood();
  draw();
  gameLoop = setInterval(update, speed);

  return {
    destroy() {
      clearInterval(gameLoop);
      document.removeEventListener('keydown', handleKey);
    }
  };
}