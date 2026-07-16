import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { Renderer } from '../renderer.js';
import { TEAMS } from '../data/teams.js';
import { loadData, isCharUnlocked } from '../storage.js';

export class TeamSelectScene {
  constructor(canvas, ctx, gameData, switchScene) {
    this.canvas = canvas; this.ctx = ctx;
    this.gameData = gameData; this.switchScene = switchScene;
    this.renderer = new Renderer(ctx);
    this.selectedTeam = 0; this.selectedChar = 0;
    this.saveData = loadData(); this.running = true;

    this._onKey = this._onKey.bind(this);
    window.addEventListener('keydown', this._onKey);
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _onKey(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.selectedTeam = (this.selectedTeam - 1 + TEAMS.length) % TEAMS.length; this.selectedChar = 0; }
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.selectedTeam = (this.selectedTeam + 1) % TEAMS.length; this.selectedChar = 0; }
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') this.selectedChar = Math.max(0, this.selectedChar - 1);
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') { const max = TEAMS[this.selectedTeam].characters.length - 1; this.selectedChar = Math.min(max, this.selectedChar + 1); }
    else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') { e.preventDefault(); this._confirm(); }
    else if (e.code === 'Escape') { this.running = false; window.removeEventListener('keydown', this._onKey); this.switchScene('menu'); }
  }

  _confirm() {
    const team = TEAMS[this.selectedTeam];
    const char = team.characters[this.selectedChar];
    if (!isCharUnlocked(this.saveData, char.id)) return;
    this.running = false; window.removeEventListener('keydown', this._onKey);
    const others = TEAMS.filter(t => t.id !== team.id);
    const opp = others[Math.floor(Math.random() * others.length)];
    this.switchScene('match', { playerTeam: team.id, opponentTeam: opp.id, playerCharIndex: this.selectedChar, opponentCharIndex: 0, round: 'qf', tournament: true });
  }

  _loop() { if (!this.running) return; this._render(); requestAnimationFrame(this._loop); }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.renderer.drawBackground();

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 55);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
    ctx.fillText('选择球队  ← → 切换  ↑↓ 选角色  Enter 确认  Esc 返回', CANVAS_WIDTH / 2, 38);
    ctx.textAlign = 'start';

    const team = TEAMS[this.selectedTeam];
    const cardX = CANVAS_WIDTH / 2 - 180; const cardY = 90;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(cardX, cardY, 360, 280);
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3;
    ctx.strokeRect(cardX, cardY, 360, 280);

    ctx.fillStyle = '#fff'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`${team.flag} ${team.name}`, CANVAS_WIDTH / 2, cardY + 60);

    ctx.fillStyle = team.colors.primary; ctx.fillRect(cardX + 50, cardY + 80, 100, 30);
    ctx.fillStyle = team.colors.secondary; ctx.fillRect(cardX + 180, cardY + 80, 100, 30);
    ctx.fillStyle = '#aaa'; ctx.font = '13px Arial'; ctx.fillText('主色 / 副色', CANVAS_WIDTH / 2, cardY + 135);

    ctx.fillStyle = '#ddd'; ctx.font = 'bold 16px Arial'; ctx.fillText('角色:', CANVAS_WIDTH / 2, cardY + 170);

    team.characters.forEach((char, i) => {
      const cy = cardY + 195 + i * 38;
      const unlocked = isCharUnlocked(this.saveData, char.id);
      const sel = i === this.selectedChar;
      if (sel) { ctx.fillStyle = 'rgba(255,215,0,0.3)'; ctx.fillRect(cardX + 40, cy - 12, 280, 28); ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.strokeRect(cardX + 40, cy - 12, 280, 28); }
      ctx.fillStyle = unlocked ? '#fff' : '#888';
      ctx.font = sel ? 'bold 18px Arial' : '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(unlocked ? char.name : `${char.name} 🔒`, CANVAS_WIDTH / 2, cy + 5);
    });
    ctx.textAlign = 'start';

    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(CANVAS_WIDTH - 190, CANVAS_HEIGHT - 55, 180, 42);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`🪙 ${this.saveData.coins}`, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 26);
    ctx.textAlign = 'start';
  }

  destroy() { this.running = false; window.removeEventListener('keydown', this._onKey); }
}
