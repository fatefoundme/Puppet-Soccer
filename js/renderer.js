import {
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y,
  GOAL_WIDTH, GOAL_HEIGHT, GOAL_Y, GOAL_BAR_THICKNESS,
  BALL_RADIUS, PLAYER_RADIUS, PLAYER_BODY_W, PLAYER_BODY_H, PLAYER_HEIGHT,
  COLORS
} from './constants.js';

// 参考原版的6组球员贴图
const HEADS = ['player_1.png','player_2.png','player_3.png','player_4.png','player_5.png','player_6.png'];
const BODIES = ['CHE.png','ATM.png','ARS.png','MCI.png','PSG.png','FCB.png'];

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.headImages = {};
    this.bodyImages = {};
    this.ballSprite = new Image();
    this.bgImage = new Image();

    // 预加载所有贴图
    HEADS.forEach((fn, i) => {
      const img = new Image();
      img.src = 'assets/' + fn;
      this.headImages[i] = img;
    });
    BODIES.forEach((fn, i) => {
      const img = new Image();
      img.src = 'assets/' + fn;
      this.bodyImages[i] = img;
    });
    this.ballSprite.src = 'assets/soccer.png';
    this.bgImage.src = 'assets/background.png';
    this.bgLoaded = false;
    this.bgImage.onload = () => { this.bgLoaded = true; };
  }

  // 根据球队id哈希到贴图索引
  _texIndex(teamId) {
    let h = 0;
    for (let i = 0; i < (teamId || 'def').length; i++) h = ((h << 5) - h) + teamId.charCodeAt(i);
    return Math.abs(h) % 6;
  }

  drawBackground() {
    const ctx = this.ctx;
    const W = CANVAS_WIDTH;
    const H = CANVAS_HEIGHT;

    if (this.bgLoaded && this.bgImage.complete) {
      ctx.drawImage(this.bgImage, 0, 0, W, H);
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      skyGrad.addColorStop(0, '#1a1a2e');
      skyGrad.addColorStop(1, '#0f3460');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, GROUND_Y);
    }

    // 2D土地 — 顶部草皮 + 泥土层
    const groundH = H - GROUND_Y;
    // 泥土底色
    const dirtGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
    dirtGrad.addColorStop(0, '#8B6914');
    dirtGrad.addColorStop(0.3, '#7A5C12');
    dirtGrad.addColorStop(0.7, '#6B4E10');
    dirtGrad.addColorStop(1, '#5C3F0E');
    ctx.fillStyle = dirtGrad;
    ctx.fillRect(0, GROUND_Y, W, groundH);

    // 泥土纹理 — 随机小石块和斑点
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < W; i += 18) {
      for (let j = GROUND_Y + 20; j < H; j += 18) {
        if (Math.sin(i * 2.3 + j * 1.7) > 0.3) continue;
        const sz = 3 + Math.abs(Math.cos(i * 1.1 + j * 0.7)) * 4;
        ctx.beginPath();
        ctx.arc(i + Math.sin(j) * 8, j, sz, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // 浅色颗粒
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < W; i += 25) {
      for (let j = GROUND_Y + 30; j < H; j += 25) {
        if (Math.sin(i * 0.8 + j * 1.3) > 0) continue;
        ctx.fillRect(i, j, 3, 3);
      }
    }

    // 顶部草皮条
    ctx.fillStyle = '#3a9d23';
    ctx.fillRect(0, GROUND_Y, W, 8);
    ctx.fillStyle = '#4aad2a';
    ctx.fillRect(0, GROUND_Y, W, 3);

    // 场线
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, GROUND_Y + 15, W - 40, groundH - 35);

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(W / 2, GROUND_Y + 15);
    ctx.lineTo(W / 2, H - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(W / 2, GROUND_Y + groundH / 2, 70, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(W / 2, GROUND_Y + groundH / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGoals() {
    const ctx = this.ctx;
    const gh = GOAL_HEIGHT;
    const gy = GOAL_Y;
    const gw = GOAL_WIDTH;
    const bt = GOAL_BAR_THICKNESS;

    [0, CANVAS_WIDTH - gw].forEach(gx => {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      for (let y = gy; y < gy + gh; y += 15) {
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke();
      }
      for (let x = gx; x < gx + gw; x += 15) {
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy + gh); ctx.stroke();
      }
    });

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, gy, gw, gh);
    ctx.strokeRect(CANVAS_WIDTH - gw, gy, gw, gh);

    ctx.fillStyle = '#fff';
    [0, CANVAS_WIDTH - gw].forEach(gx => {
      ctx.fillRect(gx, gy - bt, gw, bt);
    });
  }

  drawBall(ball) {
    const ctx = this.ctx;
    const r = BALL_RADIUS;
    ctx.save();
    ctx.translate(ball.x, ball.y);

    if (this.ballSprite.complete && this.ballSprite.naturalWidth > 0) {
      ctx.drawImage(this.ballSprite, -r, -r, r * 2, r * 2);
    } else {
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawPlayer(player) {
    const ctx = this.ctx;
    const { x, y, color, facingRight } = player;
    const headR = PLAYER_RADIUS;
    const headX = x;
    const headY = y - PLAYER_HEIGHT + headR;  // y - 100
    const bw = PLAYER_BODY_W;
    const bh = PLAYER_BODY_H;
    const bodyTop = headY + headR;             // y - 50
    const bodyCY = (bodyTop + y) / 2;           // y - 25
    const dir = facingRight ? 1 : -1;

    const texIdx = this._texIndex(player.teamId || 'def');
    const headImg = this.headImages[texIdx];
    const bodyImg = this.bodyImages[texIdx];

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y, bw * 0.7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 腿 (静态)
    const legW = 6;
    const legH = bh * 0.25;
    ctx.fillStyle = '#222';
    ctx.fillRect(x - 7, y - legH, legW, legH);
    ctx.fillRect(x + 1, y - legH, legW, legH);

    // 身体 — 优先用球衣贴图
    if (bodyImg && bodyImg.complete && bodyImg.naturalWidth > 0) {
      // 镜像翻转
      ctx.save();
      if (dir < 0) {
        ctx.translate(x * 2, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(bodyImg, x - bw / 2, bodyCY - bh / 2, bw, bh);
      ctx.restore();
    } else {
      ctx.fillStyle = color.primary;
      ctx.fillRect(x - bw / 2, bodyCY - bh / 2, bw, bh);
      ctx.fillStyle = color.secondary;
      ctx.fillRect(x - bw / 2, bodyCY - bh / 2, bw, 8);
    }

    // 手臂 (静态，不摆动)
    const armW = 6;
    const armH = bh * 0.5;
    const shoulderY = bodyCY - bh / 2 + 6;

    ctx.fillStyle = color.primary;
    ctx.fillRect(x + dir * (bw / 2) - armW / 2, shoulderY, armW, armH);
    ctx.fillStyle = color.skin || '#f5c6a0';
    ctx.beginPath();
    ctx.arc(x + dir * (bw / 2), shoulderY + armH, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color.secondary || color.primary;
    ctx.fillRect(x - dir * (bw / 2) - armW / 2, shoulderY, armW, armH);

    // 头 — 优先用头像贴图
    if (headImg && headImg.complete && headImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(headX, headY, headR, 0, Math.PI * 2);
      ctx.clip();
      if (dir < 0) {
        ctx.translate(headX * 2, 0);
        ctx.scale(-1, 1);
      }
      const headSize = headR * 2;
      ctx.drawImage(headImg, headX - headSize / 2, headY - headSize / 2, headSize, headSize);
      ctx.restore();
    } else {
      ctx.fillStyle = color.skin || '#f5c6a0';
      ctx.beginPath();
      ctx.arc(headX, headY, headR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 3;
      ctx.stroke();
      // 眼睛
      const eyeX = facingRight ? headX + 8 : headX - 8;
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(eyeX, headY - 5, 5, 0, Math.PI * 2);
      ctx.fill();
      // 嘴
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(headX + (facingRight ? 3 : -3), headY + 10, 8, 0, Math.PI);
      ctx.stroke();
    }
  }

  drawHUD(score1, score2, timeLeft, team1Name, team2Name) {
    const ctx = this.ctx;
    const mins = Math.floor(timeLeft / 60);
    const secs = Math.floor(timeLeft % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 220, 8, 440, 50);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(timeStr, CANVAS_WIDTH / 2, 42);

    ctx.font = 'bold 16px Arial';
    ctx.fillText(team1Name, CANVAS_WIDTH / 2 - 140, 42);
    ctx.fillText(team2Name, CANVAS_WIDTH / 2 + 140, 42);

    ctx.font = 'bold 26px Arial';
    ctx.fillText(score1, CANVAS_WIDTH / 2 - 90, 43);
    ctx.fillText(score2, CANVAS_WIDTH / 2 + 90, 43);

    ctx.textAlign = 'start';
  }

  drawMessage(text) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 160, CANVAS_HEIGHT / 2 - 40, 320, 80);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 12);
    ctx.textAlign = 'start';
  }
}
