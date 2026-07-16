import { CANVAS_WIDTH, CANVAS_HEIGHT, UNLOCK_COST } from '../constants.js';
import { Renderer } from '../renderer.js';
import { TEAMS } from '../data/teams.js';
import { loadData, isCharUnlocked, unlockChar, spendCoins } from '../storage.js';

export class ShopScene {
  constructor(canvas, ctx, gameData, switchScene) {
    this.canvas = canvas; this.ctx = ctx;
    this.gameData = gameData; this.switchScene = switchScene;
    this.renderer = new Renderer(ctx);
    this.saveData = loadData();
    this.selectedRow = 0; this.selectedCol = 0;
    this.message = ''; this.messageTimer = 0; this.running = true;

    this._onKey = this._onKey.bind(this);
    window.addEventListener('keydown', this._onKey);
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _onKey(e) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') this.selectedRow = (this.selectedRow - 1 + TEAMS.length) % TEAMS.length;
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.selectedRow = (this.selectedRow + 1) % TEAMS.length;
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.selectedCol = 0;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.selectedCol = 1;
    else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') { e.preventDefault(); this._buy(); }
    else if (e.code === 'Escape') { this.running = false; window.removeEventListener('keydown', this._onKey); this.switchScene('menu'); }
  }

  _buy() {
    const char = TEAMS[this.selectedRow].characters[this.selectedCol];
    if (isCharUnlocked(this.saveData, char.id)) { this._msg('已解锁!'); return; }
    if (spendCoins(this.saveData, UNLOCK_COST)) { unlockChar(this.saveData, char.id); this.saveData = loadData(); this._msg(`解锁成功: ${char.name}!`); }
    else this._msg('金币不足!');
  }

  _msg(m) { this.message = m; this.messageTimer = 90; }

  _loop() {
    if (!this.running) return;
    if (this.messageTimer > 0) this.messageTimer--;
    this._render();
    requestAnimationFrame(this._loop);
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.renderer.drawBackground();

    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, CANVAS_WIDTH, 50);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`角色商店  |  解锁费用: 300🪙  |  Enter购买  Esc返回`, CANVAS_WIDTH / 2, 34);
    ctx.textAlign = 'start';

    TEAMS.forEach((team, i) => {
      const y = 65 + i * 54; const sel = i === this.selectedRow;
      ctx.fillStyle = sel ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.4)';
      ctx.fillRect(30, y, CANVAS_WIDTH - 60, 50);
      if (sel) { ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.strokeRect(30, y, CANVAS_WIDTH - 60, 50); }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.fillText(`${team.flag} ${team.name}`, 45, y + 32);

      team.characters.forEach((char, ci) => {
        const cx = 250 + ci * 400;
        const unlocked = isCharUnlocked(this.saveData, char.id);
        const cs = sel && ci === this.selectedCol;
        ctx.fillStyle = cs ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.06)';
        ctx.fillRect(cx, y + 5, 370, 40);
        if (cs) { ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.strokeRect(cx, y + 5, 370, 40); }
        ctx.fillStyle = unlocked ? '#fff' : '#888';
        ctx.font = '16px Arial';
        ctx.fillText(unlocked ? `✓ ${char.name}` : `🔒 ${char.name} - 300🪙`, cx + 12, y + 32);
      });
    });

    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(CANVAS_WIDTH - 200, CANVAS_HEIGHT - 55, 190, 45);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`🪙 ${this.saveData.coins}`, CANVAS_WIDTH - 105, CANVAS_HEIGHT - 26);
    ctx.textAlign = 'start';

    if (this.messageTimer > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 25, 300, 50);
      ctx.fillStyle = '#ffd700'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
      ctx.fillText(this.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 8);
      ctx.textAlign = 'start';
    }
  }

  destroy() { this.running = false; window.removeEventListener('keydown', this._onKey); }
}
