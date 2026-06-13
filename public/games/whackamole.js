function initWhackamole(container) {
  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Skor: <span id="wmScore">0</span></div>
    <div class="lives">Kalan: <span id="wmTime">30</span>s</div>
    <div class="timer">Köstebeklere Tıkla!</div>
  `;
  container.appendChild(ui);

  const gameArea = document.createElement('div');
  gameArea.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:15px;max-width:400px;margin:0 auto;padding:20px;';
  container.appendChild(gameArea);

  let holes = Array(9).fill(null);
  let score = 0, timeLeft = 30, isGameOver = false;
  let gameLoop = null, spawnLoop = null;

  function render() {
    gameArea.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const hole = document.createElement('div');
      hole.style.cssText = `
        aspect-ratio:1;background:linear-gradient(180deg,#5c4033 0%,#3d2b1f 50%,#1a1a2e 50%,#1a1a2e 100%);
        border-radius:50%;position:relative;overflow:hidden;cursor:pointer;
        border:3px solid #8b4513;transition:all 0.1s;
      `;

      if (holes[i]) {
        const mole = document.createElement('div');
        mole.style.cssText = `
          position:absolute;bottom:0;left:50%;transform:translateX(-50%);
          width:70%;height:70%;background:linear-gradient(180deg,#8b7355,#6b5344);
          border-radius:50% 50% 0 0;display:flex;align-items:center;justify-content:center;
          font-size:2rem;transition:all 0.1s;
        `;
        mole.innerHTML = '🐹';
        hole.appendChild(mole);

        hole.addEventListener('click', () => {
          if (!holes[i] || isGameOver) return;
          holes[i] = null;
          score += 10;
          document.getElementById('wmScore').textContent = score;
          render();

          // Hit effect
          hole.style.transform = 'scale(0.9)';
          setTimeout(() => hole.style.transform = 'scale(1)', 100);
        });
      }

      gameArea.appendChild(hole);
    }
  }

  function spawnMole() {
    if (isGameOver) return;

    // Hide existing moles randomly
    holes = holes.map(h => Math.random() < 0.3 ? null : h);

    // Spawn new moles
    const empty = holes.map((h, i) => h === null ? i : null).filter(i => i !== null);
    const count = Math.min(3, empty.length);
    for (let i = 0; i < count; i++) {
      const idx = empty.splice(Math.floor(Math.random() * empty.length), 1)[0];
      holes[idx] = { type: Math.random() < 0.1 ? 'golden' : 'normal' };
    }

    render();
  }

  function update() {
    if (isGameOver) return;
    timeLeft--;
    document.getElementById('wmTime').textContent = timeLeft;

    if (timeLeft <= 0) {
      gameOver();
    }
  }

  function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    clearInterval(spawnLoop);

    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);padding:30px 50px;border-radius:20px;text-align:center;z-index:1000;';
    msg.innerHTML = `
      <h2 style="font-family:Orbitron;font-size:2rem;color:#fbbf24;margin-bottom:15px;">SÜRE DOLDU!</h2>
      <p style="font-size:1.5rem;color:#fff;">Skor: ${score}</p>
      <button onclick="this.closest('div').remove();window.wmReset()" style="margin-top:20px;padding:12px 30px;border:none;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7b2ff7);color:#fff;font-weight:700;cursor:pointer;font-size:1.1rem;">Yeniden Oyna</button>
    `;
    document.body.appendChild(msg);

    if (typeof saveScore === 'function') saveScore('whackamole', score);
  }

  window.wmReset = function() {
    holes = Array(9).fill(null);
    score = 0; timeLeft = 30; isGameOver = false;
    document.getElementById('wmScore').textContent = '0';
    document.getElementById('wmTime').textContent = '30';
    render();
    gameLoop = setInterval(update, 1000);
    spawnLoop = setInterval(spawnMole, 800);
  };

  render();
  gameLoop = setInterval(update, 1000);
  spawnLoop = setInterval(spawnMole, 800);

  return { destroy() { clearInterval(gameLoop); clearInterval(spawnLoop); delete window.wmReset; } };
}