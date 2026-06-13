function initSudoku(container) {
  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Sudoku</div>
    <div class="lives">Hata: <span id="sdErrors">0</span>/3</div>
    <div class="timer">Seç ve Tıkla</div>
  `;
  container.appendChild(ui);

  const board = document.createElement('div');
  board.style.cssText = 'display:grid;grid-template-columns:repeat(9,1fr);gap:1px;max-width:450px;margin:0 auto;padding:20px;background:#333;border-radius:10px;';
  container.appendChild(board);

  const numPad = document.createElement('div');
  numPad.style.cssText = 'display:flex;gap:8px;justify-content:center;padding:15px;flex-wrap:wrap;';
  container.appendChild(numPad);

  let grid = Array(9).fill(null).map(() => Array(9).fill(0));
  let solution = Array(9).fill(null).map(() => Array(9).fill(0));
  let selectedCell = null;
  let errors = 0, isGameOver = false;

  function generateSudoku() {
    // Simple valid sudoku generator
    const base = [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9]
    ];

    // Shuffle rows within bands
    for (let band = 0; band < 3; band++) {
      const rows = [band * 3, band * 3 + 1, band * 3 + 2];
      for (let i = rows.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [base[rows[i]], base[rows[j]]] = [base[rows[j]], base[rows[i]]];
      }
    }

    // Shuffle columns within stacks
    for (let stack = 0; stack < 3; stack++) {
      const cols = [stack * 3, stack * 3 + 1, stack * 3 + 2];
      for (let i = cols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        for (let r = 0; r < 9; r++) {
          [base[r][cols[i]], base[r][cols[j]]] = [base[r][cols[j]], base[r][cols[i]]];
        }
      }
    }

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        solution[r][c] = base[r][c];
      }
    }

    // Remove cells
    grid = base.map(row => [...row]);
    let removed = 0;
    while (removed < 45) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (grid[r][c] !== 0) {
        grid[r][c] = 0;
        removed++;
      }
    }
  }

  function render() {
    board.innerHTML = '';
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        const isFixed = grid[r][c] !== 0 && !cell.classList?.contains?.('user');
        const isSelected = selectedCell && selectedCell.r === r && selectedCell.c === c;

        const isThickRight = (c + 1) % 3 === 0 && c !== 8;
        const isThickBottom = (r + 1) % 3 === 0 && r !== 8;

        cell.style.cssText = `
          aspect-ratio:1;display:flex;align-items:center;justify-content:center;
          font-size:1.4rem;font-weight:700;cursor:pointer;
          background:${isSelected ? 'rgba(0,212,255,0.3)' : '#1a1a2e'};
          color:${isFixed ? '#fff' : '#00d4ff'};
          border-right:${isThickRight ? '2px solid #555' : '1px solid #333'};
          border-bottom:${isThickBottom ? '2px solid #555' : '1px solid #333'};
          transition:all 0.2s;
        `;
        cell.textContent = grid[r][c] || '';
        cell.dataset.r = r; cell.dataset.c = c;

        if (grid[r][c] === 0 || cell.classList.contains('user')) {
          cell.addEventListener('click', () => { selectedCell = { r, c }; render(); });
        }

        board.appendChild(cell);
      }
    }
  }

  function renderNumPad() {
    numPad.innerHTML = '';
    for (let n = 1; n <= 9; n++) {
      const btn = document.createElement('button');
      btn.textContent = n;
      btn.style.cssText = `
        width:45px;height:45px;border:none;border-radius:8px;
        background:#2a2a4e;color:#fff;font-size:1.2rem;font-weight:700;
        cursor:pointer;transition:all 0.2s;
      `;
      btn.addEventListener('click', () => placeNumber(n));
      numPad.appendChild(btn);
    }

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'X';
    clearBtn.style.cssText = 'width:45px;height:45px;border:none;border-radius:8px;background:#ef4444;color:#fff;font-size:1.2rem;font-weight:700;cursor:pointer;';
    clearBtn.addEventListener('click', () => placeNumber(0));
    numPad.appendChild(clearBtn);
  }

  function placeNumber(num) {
    if (!selectedCell || isGameOver) return;
    const { r, c } = selectedCell;

    if (grid[r][c] !== 0 && grid[r][c] === solution[r][c]) return; // Fixed cell

    if (num !== 0 && num !== solution[r][c]) {
      errors++;
      document.getElementById('sdErrors').textContent = errors;
      if (errors >= 3) {
        isGameOver = true;
        showMessage('3 HATA! Oyun Bitti!', '#ef4444');
        return;
      }
    }

    grid[r][c] = num;
    render();

    // Check win
    let complete = true;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (grid[i][j] !== solution[i][j]) { complete = false; break; }
      }
    }

    if (complete) {
      isGameOver = true;
      const score = (3 - errors) * 500 + 1000;
      showMessage('TEBRİKLER! Sudoku Tamamlandı!', '#22c55e');
      if (typeof saveScore === 'function') saveScore('sudoku', score);
    }
  }

  function showMessage(text, color) {
    const msg = document.createElement('div');
    msg.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);padding:25px 40px;border-radius:15px;text-align:center;z-index:1000;border:2px solid ${color};`;
    msg.innerHTML = `<h3 style="color:${color};font-size:1.3rem;">${text}</h3><button onclick="this.closest('div').remove();window.sdReset()" style="margin-top:15px;padding:10px 25px;border:none;border-radius:8px;background:linear-gradient(135deg,#00d4ff,#7b2ff7);color:#fff;font-weight:700;cursor:pointer;">Yeniden Oyna</button>`;
    document.body.appendChild(msg);
  }

  window.sdReset = function() {
    errors = 0;
    isGameOver = false;
    selectedCell = null;
    document.getElementById('sdErrors').textContent = '0';
    generateSudoku();
    render();
  };

  document.addEventListener('keydown', e => {
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) placeNumber(num);
    if (e.key === 'Backspace' || e.key === 'Delete') placeNumber(0);
  });

  generateSudoku();
  render();
  renderNumPad();

  return { destroy() { delete window.sdReset; } };
}