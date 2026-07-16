import {
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, MATCH_DURATION, KICKOFF_Y, KEYS
} from '../constants.js';
import { Player } from '../player.js';
import { Ball } from '../ball.js';
import { InputManager } from '../input.js';
import { AIController } from '../ai.js';
import { Renderer } from '../renderer.js';
import { loadData, addCoins } from '../storage.js';
import { TEAMS } from '../data/teams.js';

export class MatchScene {
  constructor(canvas, ctx, gameData, switchScene) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.gameData = gameData;
    this.switchScene = switchScene;
    this.renderer = new Renderer(ctx);
    this.ai = gameData.mode === 'ai' ? new AIController('normal') : null;

    this.score = { p1: 0, p2: 0 };
    this.timeLeft = MATCH_DURATION;
    this.state = 'countdown';
    this.stateTimer = 1.5;
    this.paused = false;
    this.pauseOption = 0;
    this._p1KickWasDown = false;
    this._p2KickWasDown = false;

    // 仅监听 ESC，不影响游戏按键
    this._onKey = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        if (this.state === 'playing' || this.state === 'countdown') {
          this.paused = !this.paused;
        } else if (this.paused) {
          this.paused = false;
        }
      }
      if (this.paused) {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          this.pauseOption = (this.pauseOption - 1 + 2) % 2;
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          this.pauseOption = (this.pauseOption + 1) % 2;
        } else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
          e.preventDefault();
          if (this.pauseOption === 0) {
            this.paused = false;
          } else {
            this.running = false;
            window.removeEventListener('keydown', this._onKey);
            this.input.destroy();
            this.switchScene('menu');
            return;
          }
        }
      }
    };
    window.addEventListener('keydown', this._onKey);

    this.input = new InputManager();
    this._createEntities();

    this.running = true;
    this.lastTime = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _createEntities() {
    const p1X = CANVAS_WIDTH * 0.3;
    const p2X = CANVAS_WIDTH * 0.7;
    const spawnY = GROUND_Y;

    const p1Team = TEAMS.find(t => t.id === this.gameData.playerTeam);
    const p2Team = TEAMS.find(t => t.id === this.gameData.opponentTeam);
    const p1Colors = p1Team ? p1Team.colors : { primary: '#4488ff', secondary: '#ffffff', skin: '#f5c6a0' };
    const p2Colors = p2Team ? p2Team.colors : { primary: '#ff4444', secondary: '#ffffff', skin: '#f5c6a0' };

    this.player1 = new Player(p1X, spawnY, p1Colors, true);
    this.player2 = new Player(p2X, spawnY, p2Colors, false);
    this.player1.teamId = this.gameData.playerTeam;
    this.player2.teamId = this.gameData.opponentTeam;
    this.ball = new Ball(CANVAS_WIDTH / 2, KICKOFF_Y);

    this.p1TeamName = p1Team ? p1Team.flag + ' ' + p1Team.name : 'P1';
    this.p2TeamName = p2Team ? p2Team.flag + ' ' + p2Team.name : 'P2';
  }

  _handleInput(stepDt) {
    if (this.state !== 'playing') return;

    const p1Left = this.input.isDown(KEYS.P1_LEFT);
    const p1Right = this.input.isDown(KEYS.P1_RIGHT);
    const p1Jump = this.input.isDown(KEYS.P1_JUMP);
    const p1KickDown = this.input.isDown(KEYS.P1_KICK);

    this.player1.update(stepDt, p1Left, p1Right, p1Jump);

    // 踢球: 按下即踢
    if (p1KickDown && !this._p1KickWasDown) {
      this.player1.iskick = true;
    }
    this._p1KickWasDown = p1KickDown;

    if (this.gameData.mode === '2p') {
      const p2Left = this.input.isDown(KEYS.P2_LEFT);
      const p2Right = this.input.isDown(KEYS.P2_RIGHT);
      const p2Jump = this.input.isDown(KEYS.P2_JUMP);
      const p2KickDown = this.input.isDown(KEYS.P2_KICK);

      this.player2.update(stepDt, p2Left, p2Right, p2Jump);

      if (p2KickDown && !this._p2KickWasDown) {
        this.player2.iskick = true;
      }
      this._p2KickWasDown = p2KickDown;
    } else if (this.ai) {
      this.ai.update(this.player2, this.ball, stepDt);
    }
  }

  _handleBallPlayerPhysics() {
    // 处理踢球 + 身体/头部碰撞 (参考原版)
    this._processPlayerBall(this.player1);
    this._processPlayerBall(this.player2);

    // 争球检测
    const scrambleRange = 80;
    const p1dx = this.ball.x - this.player1.bodyCenterX;
    const p1dy = this.ball.y - this.player1.bodyCenterY;
    const p1Dist = Math.sqrt(p1dx * p1dx + p1dy * p1dy);
    const p2dx = this.ball.x - this.player2.bodyCenterX;
    const p2dy = this.ball.y - this.player2.bodyCenterY;
    const p2Dist = Math.sqrt(p2dx * p2dx + p2dy * p2dy);

    if (p1Dist < scrambleRange && p2Dist < scrambleRange) {
      const p1Speed = Math.abs(this.player1.vx);
      const p2Speed = Math.abs(this.player2.vx);
      const diff = p1Speed - p2Speed;

      if (Math.abs(diff) < 0.6) {
        this.ball.vx *= 0.6;
        this.ball.vx += (Math.random() - 0.5) * 2.0;
        const midX = (this.player1.x + this.player2.x) / 2;
        this.ball.x += (midX - this.ball.x) * 0.2;
      } else if (diff > 0) {
        this.ball.vx += Math.min(diff * 0.8, 4.0);
      } else {
        this.ball.vx -= Math.min(-diff * 0.8, 4.0);
      }
      if (Math.abs(this.ball.vx) > 4) {
        this.ball.vx = Math.sign(this.ball.vx) * 4;
      }
    }
  }

  _processPlayerBall(player) {
    const kicked = player.canKickBall(this.ball);
    if (kicked) return;

    // 身体碰撞优先，命中则跳过头部（避免交界处双碰撞抖动）
    if (player.checkBodyCollision(this.ball)) return;
    player.checkHeadCollision(this.ball);
  }

  _checkPlayerCollision() {
    const dx = this.player2.x - this.player1.x;
    const dy = this.player2.y - this.player1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = 100;
    if (dist < minDist && dist > 0.01) {
      const overlap = minDist - dist;
      const nx = dx / dist; const ny = dy / dist;
      this.player1.x -= nx * overlap * 0.5;
      this.player2.x += nx * overlap * 0.5;
      const relVx = this.player1.vx - this.player2.vx;
      const relVy = this.player1.vy - this.player2.vy;
      const relVn = relVx * nx + relVy * ny;
      if (relVn > 0) {
        this.player1.vx -= relVn * nx * 0.5;
        this.player1.vy -= relVn * ny * 0.5;
        this.player2.vx += relVn * nx * 0.5;
        this.player2.vy += relVn * ny * 0.5;
      }
    }
  }

  _loop(timestamp) {
    if (!this.running) return;
    this._dt = Math.min((timestamp - this.lastTime) / 1000 * 60, 3);
    this.lastTime = timestamp;
    this._update();
    this._render();
    requestAnimationFrame(this._loop);
  }

  _update() {
    if (this.paused) return;
    const steps = Math.max(1, Math.round(this._dt));
    for (let step = 0; step < steps; step++) {
      this._step(1);
    }
  }

  _step(stepDt) {
    switch (this.state) {
      case 'countdown':
        this.stateTimer -= 1 / 60;
        if (this.stateTimer <= 0) this.state = 'playing';
        this.ball.update();
        break;

      case 'playing':
        this._handleInput(stepDt);
        this.ball.update();
        this.ball.checkCrossbar();
        this._handleBallPlayerPhysics();
        this._checkPlayerCollision();

        const goal = this.ball.checkGoal();
        if (goal) {
          if (goal === 'goalRight') { this.score.p2++; this._onGoal('p2'); }
          else if (goal === 'goalLeft') { this.score.p1++; this._onGoal('p1'); }
        }

        this.timeLeft -= 1 / 60;
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.state = 'finished';
          this.stateTimer = 2;
        }
        break;

      case 'goal':
        this.stateTimer -= 1 / 60;
        this.ball.update();
        this.ball.checkCrossbar();
        if (this.stateTimer <= 0) { this._resetAfterGoal(); this.state = 'playing'; }
        break;

      case 'finished':
        this.stateTimer -= 1 / 60;
        this.ball.update();
        if (this.stateTimer <= 0) {
          this.running = false;
          const won = this.score.p1 > this.score.p2;
          const saveData = loadData();
          addCoins(saveData, won ? 100 : 30);
          window.removeEventListener('keydown', this._onKey);
          this.input.destroy();
          this.switchScene('result', { score: { ...this.score }, coinsEarned: won ? 100 : 30 });
        }
        break;
    }
  }

  _onGoal(s) {
    this.state = 'goal';
    this.stateTimer = 1.5;
    this._lastScorer = s; // 记录进球方，决定开球位置
  }

  _resetAfterGoal() {
    // 失球方球门前开球，球在球员身前
    let kickoffX, p1X, p2X;
    if (this._lastScorer === 'p2') {
      // P2进球 → P1在左门（己方球门）前开球
      kickoffX = 260;
      p1X = 150;   // P1站在球和球门之间
      p2X = CANVAS_WIDTH * 0.6;
    } else if (this._lastScorer === 'p1') {
      // P1进球 → P2在右门（己方球门）前开球
      kickoffX = CANVAS_WIDTH - 260;
      p1X = CANVAS_WIDTH * 0.4;
      p2X = CANVAS_WIDTH - 150;  // P2站在球和球门之间
    } else {
      kickoffX = CANVAS_WIDTH / 2;
      p1X = CANVAS_WIDTH * 0.35;
      p2X = CANVAS_WIDTH * 0.65;
    }

    this.ball.reset(kickoffX, KICKOFF_Y);
    this.player1.x = p1X; this.player1.y = GROUND_Y;
    this.player2.x = p2X; this.player2.y = GROUND_Y;
    this.player1.vy = 0; this.player2.vy = 0;
    this.player1.vx = 0; this.player2.vx = 0;
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.renderer.drawBackground();
    this.renderer.drawGoals();
    this.renderer.drawPlayer(this.player1);
    this.renderer.drawPlayer(this.player2);
    this.renderer.drawBall(this.ball);
    this.renderer.drawHUD(this.score.p1, this.score.p2, this.timeLeft, this.p1TeamName, this.p2TeamName);

    if (this.state === 'countdown') {
      this.renderer.drawMessage('准备!');
    } else if (this.state === 'goal') {
      this.renderer.drawMessage('⚽ 进球!');
    } else if (this.state === 'finished') {
      if (this.score.p1 > this.score.p2) this.renderer.drawMessage(`${this.p1TeamName} 获胜!`);
      else if (this.score.p2 > this.score.p1) this.renderer.drawMessage(`${this.p2TeamName} 获胜!`);
      else this.renderer.drawMessage('平局!');
    }

    // 暂停菜单
    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('暂停', CANVAS_WIDTH / 2, 280);

      const opts = ['继续游戏', '返回主菜单'];
      opts.forEach((opt, i) => {
        const y = 370 + i * 55;
        const sel = i === this.pauseOption;
        ctx.fillStyle = sel ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)';
        ctx.fillRect(CANVAS_WIDTH / 2 - 160, y, 320, 42);
        if (sel) { ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.strokeRect(CANVAS_WIDTH / 2 - 160, y, 320, 42); }
        ctx.fillStyle = sel ? '#ffd700' : '#ddd';
        ctx.font = sel ? 'bold 22px Arial' : '18px Arial';
        ctx.fillText(opt, CANVAS_WIDTH / 2, y + 30);
      });

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '14px Arial';
      ctx.fillText('↑↓ 选择  Enter 确认  Esc 返回', CANVAS_WIDTH / 2, 500);
      ctx.textAlign = 'start';
    }
  }

  destroy() {
    this.running = false;
    window.removeEventListener('keydown', this._onKey);
    this.input.destroy();
  }
}
