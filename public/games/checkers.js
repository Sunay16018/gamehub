function initCheckers(container) {
  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Sen: Beyaz</div>
    <div class="lives">Bot: Siyah</div>
    <div class="timer">Tıkla Seç ve Oyna</div>
  `;
  container.appendChild(ui);

  const board = document.createElement('div');
  board.style.cssText = 'width:400px;height:400px;margin:0 auto;display:grid;grid-template-columns:repeat(8,1fr);border:3px solid #8b4513;';
  container.appendChild(board);

  let grid = Array(8).fill(null).map(() => Array(8).fill(null));
  let selected = null, current = 'w', isGameOver = false;

  function init() {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          if (r < 3) grid[r][c] = 'b';
          else if (r > 4) grid[r][c] = 'w';
        }
      }
    }
  }

  function render() {
    board.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        const isDark = (r + c) % 2 === 1;
        const piece = grid[r][c];
        const isSelected = selected && selected.r === r && selected.c === c;

        cell.style.cssText = `
          background:${isDark ? '#769656' : '#eeeed2'};
          display:flex;align-items:center;justify-content:center;
          cursor:${isDark ? 'pointer' : 'default'};
          ${isSelected ? 'box-shadow:inset 0 0 0 4px #00d4ff;' : ''}
        `;

        if (piece) {
          const color = piece === 'w' || piece === 'W' ? '#fff' : '#2d2d2d';
          const isKing = piece === 'W' || piece === 'B';
          cell.innerHTML = `<div style="
            width:35px;height:35px;border-radius:50%;background:${color};
            border:3px solid ${color === '#fff' ? '#ccc' : '#555'};
            box-shadow:${isKing ? '0 0 10px #ffd700' : 'none'};
            display:flex;align-items:center;justify-content:center;
          ">${isKing ? '<span style="color:#ffd700;font-size:1rem;">👑</span>' : ''}</div>`;
        }

        if (isDark) {
          cell.addEventListener('click', () => handleClick(r, c));
        }

        board.appendChild(cell);
      }
    }
  }

  function handleClick(r, c) {
    if (isGameOver || current !== 'w') return;

    if (selected) {
      if (isValidMove(selected.r, selected.c, r, c)) {
        const wasKing = grid[selected.r][selected.c] === 'W';
        grid[r][c] = (r === 0 || wasKing) ? 'W' : 'w';
        grid[selected.r][selected.c] = null;

        // Capture
        const dr = Math.sign(r - selected.r);
        const dc = Math.sign(c - selected.c);
        if (Math.abs(r - selected.r) === 2) {
          grid[selected.r + dr][selected.c + dc] = null;
        }

        selected = null;
        current = 'b';
        render();

        if (checkWin('w')) { endGame('w'); return; }
        setTimeout(botMove, 600);
      } else {
        selected = null;
        render();
      }
    } else if (grid[r][c] && (grid[r][c] === 'w' || grid[r][c] === 'W')) {
      selected = { r, c };
      render();
    }
  }

  function isValidMove(fr, fc, tr, tc) {
    if (grid[tr][tc]) return false;
    const piece = grid[fr][fc];
    const isKing = piece === 'W' || piece === 'B';
    const dr = tr - fr, dc = tc - fc;

    if (!isKing && dr > 0) return false; // White can only go up

    if (Math.abs(dr) === 1 && Math.abs(dc) === 1) return true;
    if (Math.abs(dr) === 2 && Math.abs(dc) === 2) {
      const midR = fr + dr/2, midC = fc + dc/2;
      const mid = grid[midR][midC];
      return mid && (mid === 'b' || mid === 'B');
    }
    return false;
  }

  function botMove() {
    if (isGameOver) return;

    const moves = [];
    for (let fr = 0; fr < 8; fr++) {
      for (let fc = 0; fc < 8; fc++) {
        if (grid[fr][fc] && (grid[fr][fc] === 'b' || grid[fr][fc] === 'B')) {
          for (let tr = 0; tr < 8; tr++) {
            for (let tc = 0; tc < 8; tc++) {
              if (isValidBotMove(fr, fc, tr, tc)) {
                const isCapture = Math.abs(tr - fr) === 2;
                moves.push({ fr, fc, tr, tc, score: isCapture ? 10 : 0 });
              }
            }
          }
        }
      }
    }

    if (moves.length === 0) { endGame('w'); return; }

    // Prefer captures and forward moves
    moves.sort((a, b) => b.score - a.score);
    const move = moves[0];

    const wasKing = grid[move.fr][move.fc] === 'B';
    grid[move.tr][move.tc] = (move.tr === 7 || wasKing) ? 'B' : 'b';
    grid[move.fr][move.fc] = null;

    if (Math.abs(move.tr - move.fr) === 2) {
      grid[move.fr + Math.sign(move.tr - move.fr)][move.fc + Math.sign(move.tc - move.fc)] = null;
    }

    current = 'w';
    render();
    if (checkWin('b')) endGame('b');
  }

  function isValidBotMove(fr, fc, tr, tc) {
    if (grid[tr][tc]) return false;
    const piece = grid[fr][fc];
    const isKing = piece === 'W' || piece === 'B';
    const dr = tr - fr, dc = tc - fc;

    if (!isKing && dr < 0) return false;

    if (Math.abs(dr) === 1 && Math.abs(dc) === 1) return true;
    if (Math.abs(dr) === 2 && Math.abs(dc) === 2) {
      const midR = fr + dr/2, midC = fc + dc/2;
      const mid = grid[midR][midC];
      return mid && (mid === 'w' || mid === 'W');
    }
    return false;
  }

  function checkWin(color) {
    const target = color === 'w' ? ['b', 'B'] : ['w', 'W'];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (target.includes(grid[r][c])) return false;
      }
    }
    return true;
  }

  function endGame(winner) {
    isGameOver = true;
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);padding:30px 50px;border-radius:20px;text-align:center;z-index:1000;';
    msg.innerHTML = `<h2 style="font-family:Orbitron;font-size:2rem;color:${winner === 'w' ? '#00d4ff' : '#ff6b6b'};margin-bottom:15px;">${winner === 'w' ? 'KAZANDIN!' : 'KAYBETTİN!'}</h2><button onclick="this.closest('div').remove();window.chkReset()" style="padding:10px 30px;border:none;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7b2ff7);color:#fff;font-weight:700;cursor:pointer;">Yeniden Oyna</button>`;
    document.body.appendChild(msg);
    if (winner === 'w' && typeof saveScore === 'function') saveScore('checkers', 500);
  }

  window.chkReset = function() {
    grid = Array(8).fill(null).map(() => Array(8).fill(null));
    selected = null; current = 'w'; isGameOver = false;
    init();
    render();
  };

  init();
  render();

  return { destroy() { delete window.chkReset; } };
}