import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { Renderer } from '../renderer.js';
import { TEAMS } from '../data/teams.js';

export class MenuScene {
  constructor(canvas, ctx, gameData, switchScene) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.gameData = gameData;
    this.switchScene = switchScene;
    this.renderer = new Renderer(ctx);
    this.selectedIndex = 0;
    this.options = [
      { label: '双人对战', action: () => this._quickMatch('2p') },
    ];
    this.running = true;
    this._onKey = this._onKey.bind(this);
    window.addEventListener('keydown', this._onKey);
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _onKey(e) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
    else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') { e.preventDefault(); this.options[this.selectedIndex].action(); }
  }

  _go(scene, extra = {}) {
    this.running = false; window.removeEventListener('keydown', this._onKey);
    this.switchScene(scene, extra);
  }

  _quickMatch(mode) {
    const playerTeam = TEAMS[Math.floor(Math.random() * TEAMS.length)];
    const others = TEAMS.filter(t => t.id !== playerTeam.id);
    const opponentTeam = others[Math.floor(Math.random() * others.length)];
    this._go('match', { mode, playerTeam: playerTeam.id, opponentTeam: opponentTeam.id, tournament: false });
  }

  _loop() {
    if (!this.running) return;
    this._render();
    requestAnimationFrame(this._loop);
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.renderer.drawBackground();

    // 标题
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 260, 40, 520, 140);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('傀儡足球', CANVAS_WIDTH / 2, 110);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('2026 世界杯', CANVAS_WIDTH / 2, 155);
    ctx.textAlign = 'start';

    // 菜单
    this.options.forEach((opt, i) => {
      const y = 220 + i * 60;
      const sel = i === this.selectedIndex;
      ctx.fillStyle = sel ? 'rgba(255,215,0,0.25)' : 'rgba(0,0,0,0.5)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 170, y, 340, 46);
      ctx.strokeStyle = sel ? '#ffd700' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = sel ? 3 : 1;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 170, y, 340, 46);
      ctx.fillStyle = sel ? '#ffd700' : '#ddd';
      ctx.font = sel ? 'bold 22px Arial' : '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(opt.label, CANVAS_WIDTH / 2, y + 32);
      ctx.textAlign = 'start';
    });

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('↑↓ 选择   Enter 确认', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);

    ctx.textAlign = 'start';
  }

  destroy() { this.running = false; window.removeEventListener('keydown', this._onKey); }
}
