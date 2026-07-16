import {
  GROUND_Y, PLAYER_RADIUS, BALL_RADIUS, PLAYER_BODY_W, PLAYER_BODY_H, PLAYER_HEIGHT,
  PLAYER_GROUND_ACCEL, PLAYER_AIR_ACCEL,
  PLAYER_GROUND_DRAG, PLAYER_AIR_DRAG,
  PLAYER_MAX_SPEED_GROUND, PLAYER_MAX_SPEED_AIR,
  JUMP_SPEED, GRAVITY,
  KICK_MIN_STRENGTH, KICK_MAX_STRENGTH,
  KICK_RANGE_FORWARD, KICK_RANGE_BACKWARD, KICK_RANGE_VERTICAL,
  KICK_MIN_ANGLE_DEG, KICK_MAX_ANGLE_DEG, KICK_LIFT_BIAS,
  CANVAS_WIDTH, LEFT_WALL_X, RIGHT_WALL_X
} from './constants.js';

export class Player {
  constructor(x, y, color, facingRight = true) {
    this.x = x;
    this.y = y;            // 脚底位置 (地面)
    this.vx = 0;
    this.vy = 0;
    this.color = color;
    this.facingRight = facingRight;
    this.onGround = false;
    this.iskick = false;   // 踢球标志 (松键时设为true)
    this.chargeTime = 0;   // 蓄力时间
  }

  get headX() { return this.x; }
  get headY() { return this.y - PLAYER_HEIGHT + PLAYER_RADIUS; }
  get bodyCenterX() { return this.x; }
  get bodyCenterY() { return this.headY + PLAYER_RADIUS + PLAYER_BODY_H / 2; }
  get footX() { return this.x; }
  get footY() { return this.y; }

  update(dt, moveLeft, moveRight, jumpPressed) {
    this.onGround = this.y >= GROUND_Y;

    const accel = this.onGround ? PLAYER_GROUND_ACCEL : PLAYER_AIR_ACCEL;
    const maxSpeed = this.onGround ? PLAYER_MAX_SPEED_GROUND : PLAYER_MAX_SPEED_AIR;

    if (moveLeft) {
      this.vx -= accel;
      this.facingRight = false;
    }
    if (moveRight) {
      this.vx += accel;
      this.facingRight = true;
    }

    if (!moveLeft && !moveRight) {
      const drag = this.onGround ? PLAYER_GROUND_DRAG : PLAYER_AIR_DRAG;
      this.vx *= drag;
    }

    if (Math.abs(this.vx) > maxSpeed) {
      this.vx = Math.sign(this.vx) * maxSpeed;
    }

    if (jumpPressed && this.onGround) {
      this.vy = -JUMP_SPEED;
      this.onGround = false;
    }

    if (!this.onGround) {
      this.vy += GRAVITY;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      this.vy = 0;
      this.onGround = true;
    }

    const headTop = this.y - PLAYER_HEIGHT;
    if (headTop < 0) {
      this.y = PLAYER_HEIGHT;
      this.vy = 0;
    }

    if (this.x < LEFT_WALL_X + PLAYER_RADIUS) this.x = LEFT_WALL_X + PLAYER_RADIUS;
    if (this.x > RIGHT_WALL_X - PLAYER_RADIUS) this.x = RIGHT_WALL_X - PLAYER_RADIUS;
  }

  // 参考原版C++: 踢球力度叠加到球速上 (不是覆盖)
  canKickBall(ball) {
    if (!this.iskick) return null;

    // 踢球中心 = 脚底位置
    const kickCX = this.x;
    const kickCY = this.y;
    const toBallX = ball.x - kickCX;
    const toBallY = ball.y - kickCY;

    const forward = toBallX * (this.facingRight ? 1 : -1);
    const vertical = Math.abs(toBallY);

    if (forward < -KICK_RANGE_BACKWARD || forward > KICK_RANGE_FORWARD || vertical > KICK_RANGE_VERTICAL) {
      return null;
    }

    // 计算踢球角度 (参考原版)
    const fx = Math.max(0, Math.min(1, forward / KICK_RANGE_FORWARD));
    const vy = Math.max(0, Math.min(1, vertical / KICK_RANGE_VERTICAL));
    let loft = (1 - fx) * 0.75 + (1 - vy) * 0.25 + KICK_LIFT_BIAS;
    loft = Math.max(0, Math.min(1, loft));

    const angleDeg = KICK_MIN_ANGLE_DEG + (KICK_MAX_ANGLE_DEG - KICK_MIN_ANGLE_DEG) * loft;
    const angleRad = angleDeg * Math.PI / 180;

    const dir = this.facingRight ? 1 : -1;
    const kdx = dir * Math.cos(angleRad);
    const kdy = -Math.sin(angleRad);

    // 统一踢球力度
    const strength = 39;

    ball.vx += strength * kdx;
    ball.vy += strength * kdy;
    ball.vx += this.vx * 0.35;

    this.iskick = false;
    return true;
  }

  // 带头球 (离散检测 + 位置修正，避免粘球)
  checkHeadCollision(ball) {
    const hx = this.headX;
    const hy = this.headY;
    const combinedR = PLAYER_RADIUS + BALL_RADIUS;
    const dx = ball.x - hx;
    const dy = ball.y - hy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= combinedR || dist < 0.01) return false;

    // 法线方向
    const nx = dx / dist;
    const ny = dy / dist;

    // 强制分离球到头外
    ball.x = hx + nx * (combinedR + 2);
    ball.y = hy + ny * (combinedR + 2);

    // 相对速度
    const vRelX = ball.vx - this.vx;
    const vRelY = ball.vy - this.vy;
    const vn = vRelX * nx + vRelY * ny;

    // 只在球向头运动时反弹 (纯反射，不加方向性力量)
    if (vn < 0) {
      ball.vx -= (1 + 0.15) * vn * nx;
      ball.vy -= (1 + 0.15) * vn * ny;
      // 带上球员的一点动量
      ball.vx += this.vx * 0.15;
      ball.vy += this.vy * 0.05;
    }
    return true;
  }

  // 身体碰球 (CCD防穿模)
  checkBodyCollision(ball) {
    const r = BALL_RADIUS;
    // 身体矩形 (参考原版: 从头下方到脚底)
    const bodyLeft = this.x - PLAYER_BODY_W * 0.5;
    const bodyTop = this.headY + PLAYER_RADIUS;
    const bodyRight = bodyLeft + PLAYER_BODY_W;
    const bodyBottom = this.y;

    // 扩展矩形 (加上球半径)
    const exLeft = bodyLeft - r;
    const exTop = bodyTop - r;
    const exRight = bodyRight + r;
    const exBottom = bodyBottom + r;

    // 离散: 球心到身体矩形的最近点
    const clampX = Math.max(bodyLeft, Math.min(ball.x, bodyRight));
    const clampY = Math.max(bodyTop, Math.min(ball.y, bodyBottom));
    const ddx = ball.x - clampX;
    const ddy = ball.y - clampY;
    const dist2 = ddx * ddx + ddy * ddy;

    let nx = 0, ny = 0;
    let hit = false;

    if (dist2 < r * r) {
      // 离散命中
      const dist = Math.sqrt(dist2) || 0.01;
      nx = ddx / dist;
      ny = ddy / dist;
      ball.x += nx * (r - dist + 2);
      ball.y += ny * (r - dist + 2);
      hit = true;
    } else {
      // CCD: 球心 vs 扩展AABB
      const p0x = ball.prevX, p0y = ball.prevY;
      const p1x = ball.x, p1y = ball.y;
      const ddx2 = p1x - p0x, ddy2 = p1y - p0y;

      // X轴扫掠
      let tEnter = -Infinity, tExit = Infinity;
      let nxCand = 0, nyCand = 0;
      if (Math.abs(ddx2) > 1e-9) {
        const tx1 = (exLeft - p0x) / ddx2;
        const tx2 = (exRight - p0x) / ddx2;
        const txNear = Math.min(tx1, tx2);
        const txFar = Math.max(tx1, tx2);
        if (txNear > tEnter) { tEnter = txNear; nxCand = ddx2 > 0 ? -1 : 1; nyCand = 0; }
        tExit = Math.min(tExit, txFar);
      } else if (p0x < exLeft || p0x > exRight) {
        return false;
      }
      // Y轴扫掠
      if (Math.abs(ddy2) > 1e-9) {
        const ty1 = (exTop - p0y) / ddy2;
        const ty2 = (exBottom - p0y) / ddy2;
        const tyNear = Math.min(ty1, ty2);
        const tyFar = Math.max(ty1, ty2);
        if (tyNear > tEnter) { tEnter = tyNear; nxCand = 0; nyCand = ddy2 > 0 ? -1 : 1; }
        tExit = Math.min(tExit, tyFar);
      } else if (p0y < exTop || p0y > exBottom) {
        return false;
      }

      if (tEnter <= tExit && tEnter >= 0 && tEnter <= 1 && tExit >= 0) {
        nx = nxCand;
        ny = nyCand;
        ball.x = p0x + ddx2 * tEnter + nx * 2;
        ball.y = p0y + ddy2 * tEnter + ny * 2;
        hit = true;
      }
    }

    if (hit) {
      const playerSpeed = Math.abs(this.vx);
      const vRelX = ball.vx - this.vx;
      const vRelY = ball.vy - this.vy;
      const vn = vRelX * nx + vRelY * ny;
      if (vn < 0 && playerSpeed > 2) {
        ball.vx -= 0.05 * vn * nx;
        ball.vy -= 0.05 * vn * ny;
      }
      return true;
    }
    return false;
  }

  isOnGround() { return this.onGround; }
}
