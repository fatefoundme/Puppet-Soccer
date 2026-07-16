import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { Renderer } from '../renderer.js';
import { TEAMS } from '../data/teams.js';
import { loadData } from '../storage.js';

const ROUND_NAMES = { qf: '八强赛', sf: '半决赛', final: '决赛' };
const NEXT_ROUND = { qf: 'sf', sf: 'final', final: null };

export class ResultScene {
  constructor(canvas, ctx, gameData, switchScene) {
    this.canvas = canvas; this.ctx = ctx;
    this.gameData = gameData; this.switchScene = switchScene;
    this.renderer = new Renderer(ctx);
    this.saveData = loadData();
    this.selectedIndex = 0; this.running = true;

    const won = gameData.score.p1 > gameData.score.p2;
    this.advanced = won && gameData.tournament;
    this.options = [];
    if (this.advanced && gameData.round !== 'final') {
      this.options.push({ label: `下一场: ${ROUND_NAMES[NEXT_ROUND[gameData.round]]}`, action: 'next' });
    }
    this.options.push({ label: '返回主菜单', action: 'menu' });

    this._onKey = this._onKey.bind(this);
    window.addEventListener('keydown', this._onKey);
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _onKey(e) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
    else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
      e.preventDefault();
      const opt = this.options[this.selectedIndex];
      this.running = false; window.removeEventListener('keydown', this._onKey);
      if (opt.action === 'next') {
        const nextRound = NEXT_ROUND[this.gameData.round];
        const others = TEAMS.filter(t => t.id !== this.gameData.playerTeam);
        const opp = others[Math.floor(Math.random() * others.length)];
        this.switchScene('match', { mode: this.gameData.mode, playerTeam: this.gameData.playerTeam, opponentTeam: opp.id, round: nextRound, tournament: true });
      } else {
        this.switchScene('menu');
      }
    }
  }

  _loop() { if (!this.running) return; this._render(); requestAnimationFrame(this._loop); }

  _render() {
    const ctx = this.ctx; const gd = this.gameData;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.renderer.drawBackground();

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 220, 70, 440, 380);

    const p1Team = TEAMS.find(t => t.id === gd.playerTeam);
    const p2Team = TEAMS.find(t => t.id === gd.opponentTeam);
    const p1Name = p1Team ? p1Team.flag + ' ' + p1Team.name : '你';
    const p2Name = p2Team ? p2Team.flag + ' ' + p2Team.name : '对手';
    const won = gd.score.p1 > gd.score.p2;
    const isDraw = gd.score.p1 === gd.score.p2;

    ctx.fillStyle = won ? '#ffd700' : isDraw ? '#fff' : '#ff6b6b';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    const isFinal = gd.tournament && gd.round === 'final';
    ctx.fillText(isFinal && won ? '🏆 世界冠军! 🏆' : won ? '你赢了!' : isDraw ? '平局!' : '你输了!', CANVAS_WIDTH / 2, 130);

    if (gd.tournament) { ctx.fillStyle = '#aaa'; ctx.font = '18px Arial'; ctx.fillText(ROUND_NAMES[gd.round] || '', CANVAS_WIDTH / 2, 165); }

    ctx.fillStyle = '#fff'; ctx.font = 'bold 54px Arial';
    ctx.fillText(`${gd.score.p1} - ${gd.score.p2}`, CANVAS_WIDTH / 2, 235);
    ctx.font = '18px Arial';
    ctx.fillText(`${p1Name}  VS  ${p2Name}`, CANVAS_WIDTH / 2, 275);

    const coins = gd.coinsEarned || 0;
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 20px Arial';
    ctx.fillText(`获得: +${coins} 🪙      余额: ${this.saveData.coins} 🪙`, CANVAS_WIDTH / 2, 320);

    this.options.forEach((opt, i) => {
      const y = 370 + i * 44; const sel = i === this.selectedIndex;
      ctx.fillStyle = sel ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 160, y, 320, 36);
      if (sel) { ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.strokeRect(CANVAS_WIDTH / 2 - 160, y, 320, 36); }
      ctx.fillStyle = sel ? '#ffd700' : '#ddd';
      ctx.font = sel ? 'bold 18px Arial' : '16px Arial';
      ctx.fillText(opt.label, CANVAS_WIDTH / 2, y + 26);
    });
    ctx.textAlign = 'start';
  }

  destroy() { this.running = false; window.removeEventListener('keydown', this._onKey); }
}
