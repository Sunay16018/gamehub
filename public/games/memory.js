function initMemory(container) {
  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Hamle: <span id="memoryMoves">0</span></div>
    <div class="lives">Eşleşme: <span id="memoryMatches">0</span></div>
    <div class="timer">Süre: <span id="memoryTime">0</span>s</div>
  `;
  container.appendChild(ui);
  
  const gameArea = document.createElement('div');
  gameArea.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:15px;max-width:500px;margin:0 auto;padding:20px;';
  container.appendChild(gameArea);
  
  const ICONS = ['🎮','🎯','🎲','🎪','🎨','🎭','🎸','🎺'];
  let cards = [], flipped = [], matched = [], moves = 0, matches = 0;
  let timer = 0, timerInterval = null, isLocked = false, isGameOver = false;
  
  function init() {
    const pairs = [...ICONS, ...ICONS];
    cards = pairs.sort(() => Math.random() - 0.5).map((icon, i) => ({
      id: i, icon, flipped: false, matched: false
    }));
    
    gameArea.innerHTML = cards.map((c, i) => `
      <div class="memory-card" data-index="${i}" style="
        aspect-ratio:1;background:linear-gradient(145deg,#1a1a2e,#16213e);
        border-radius:15px;display:flex;align-items:center;justify-content:center;
        font-size:2.5rem;cursor:pointer;border:2px solid rgba(0,212,255,0.2);
        transition:all 0.3s;user-select:none;
      ">
        <span style="opacity:0;transition:opacity 0.3s;">${c.icon}</span>
      </div>
    `).join('');
    
    gameArea.querySelectorAll('.memory-card').forEach(card => {
      card.addEventListener('click', () => flipCard(parseInt(card.dataset.index)));
    });
  }
  
  function flipCard(index) {
    if (isLocked || cards[index].flipped || cards[index].matched || isGameOver) return;
    
    const card = gameArea.children[index];
    card.style.borderColor = '#00d4ff';
    card.style.transform = 'rotateY(180deg)';
    card.querySelector('span').style.opacity = '1';
    cards[index].flipped = true;
    flipped.push(index);
    
    if (flipped.length === 2) {
      moves++;
      document.getElementById('memoryMoves').textContent = moves;
      isLocked = true;
      
      const [a, b] = flipped;
      if (cards[a].icon === cards[b].icon) {
        cards[a].matched = cards[b].matched = true;
        matched.push(a, b);
        gameArea.children[a].style.borderColor = '#22c55e';
        gameArea.children[b].style.borderColor = '#22c55e';
        matches++;
        document.getElementById('memoryMatches').textContent = matches;
        flipped = [];
        isLocked = false;
        
        if (matched.length === cards.length) gameOver();
      } else {
        setTimeout(() => {
          [a, b].forEach(i => {
            cards[i].flipped = false;
            gameArea.children[i].style.borderColor = 'rgba(0,212,255,0.2)';
            gameArea.children[i].style.transform = 'rotateY(0deg)';
            gameArea.children[i].querySelector('span').style.opacity = '0';
          });
          flipped = [];
          isLocked = false;
        }, 800);
      }
    }
  }
  
  function gameOver() {
    isGameOver = true;
    clearInterval(timerInterval);
    const score = Math.max(0, 1000 - moves * 10 - timer);
    
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100;';
    overlay.innerHTML = `
      <div style="text-align:center;">
        <h2 style="font-family:Orbitron;font-size:2.5rem;color:#00d4ff;margin-bottom:20px;">TEBRİKLER!</h2>
        <p style="font-size:1.3rem;color:#fff;">Hamle: ${moves} | Süre: ${timer}s</p>
        <p style="font-size:1.5rem;color:#ffd700;margin-top:15px;">Skor: ${score}</p>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 3000);
    
    if (typeof saveScore === 'function') saveScore('memory', score);
  }
  
  timerInterval = setInterval(() => {
    timer++;
    document.getElementById('memoryTime').textContent = timer;
  }, 1000);
  
  init();
  
  return { destroy() { clearInterval(timerInterval); } };
}
