import {
  BALL_RADIUS, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT,
  GRAVITY, BALL_AIR_DRAG, BALL_GROUND_FRICTION,
  BALL_RESTITUTION_GROUND, BALL_RESTITUTION_WALL, BALL_MAX_SPEED,
  GOAL_WIDTH, GOAL_HEIGHT, GOAL_Y, GOAL_BAR_THICKNESS,
  LEFT_WALL_X, RIGHT_WALL_X
} from './constants.js';

export class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = BALL_RADIUS;
    this.prevX = x;
    this.prevY = y;
  }

  update() {
    // 保存上一帧位置 (用于CCD防穿模)
    this.prevX = this.x;
    this.prevY = this.y;

    // 重力
    this.vy += GRAVITY;

    // 空气阻力
    this.vx *= BALL_AIR_DRAG;
    this.vy *= BALL_AIR_DRAG;

    // 更新位置
    this.x += this.vx;
    this.y += this.vy;

    // 限速
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > BALL_MAX_SPEED) {
      const s = BALL_MAX_SPEED / speed;
      this.vx *= s;
      this.vy *= s;
    }

    // 地面碰撞
    if (this.y + this.radius > GROUND_Y) {
      this.y = GROUND_Y - this.radius;
      this.vy = -Math.abs(this.vy) * BALL_RESTITUTION_GROUND;
      this.vx *= BALL_GROUND_FRICTION;
      if (Math.abs(this.vy) < 0.9) this.vy = 0;
    }

    // 天花板
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = Math.abs(this.vy) * BALL_RESTITUTION_WALL;
    }

    // 左右墙
    if (this.x - this.radius < LEFT_WALL_X) {
      this.x = LEFT_WALL_X + this.radius;
      this.vx = Math.abs(this.vx) * BALL_RESTITUTION_WALL;
    }
    if (this.x + this.radius > RIGHT_WALL_X) {
      this.x = RIGHT_WALL_X - this.radius;
      this.vx = -Math.abs(this.vx) * BALL_RESTITUTION_WALL;
    }
  }

  // 检查是否进球门（左门=右方得分，右门=左方得分）
  checkGoal() {
    if (this.y + this.radius > GOAL_Y && this.y - this.radius < GOAL_Y + GOAL_HEIGHT) {
      if (this.x - this.radius < GOAL_WIDTH) return 'goalRight';  // 进左门 → 右方(对手)得分
      if (this.x + this.radius > CANVAS_WIDTH - GOAL_WIDTH) return 'goalLeft';  // 进右门 → 左方(玩家)得分
    }
    return null;
  }

  // 球门横梁碰撞
  checkCrossbar() {
    const checkBar = (barX, barTop) => {
      const closestX = Math.max(barX, Math.min(this.x, barX + GOAL_WIDTH));
      const closestY = Math.max(barTop, Math.min(this.y, barTop + GOAL_BAR_THICKNESS));
      const dx = this.x - closestX;
      const dy = this.y - closestY;
      if (dx * dx + dy * dy < this.radius * this.radius) {
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        this.x = closestX + dx * this.radius / dist;
        this.y = closestY + dy * this.radius / dist;
        this.vx = Math.abs(this.vx) * 0.5 * Math.sign(dx);
        this.vy = Math.abs(this.vy) * 0.5 * Math.sign(dy);
      }
    };

    // 左门横梁
    const leftBarTop = GOAL_Y - GOAL_BAR_THICKNESS;
    checkBar(0, leftBarTop);
    // 右门横梁
    const rightBarTop = GOAL_Y - GOAL_BAR_THICKNESS;
    checkBar(CANVAS_WIDTH - GOAL_WIDTH, rightBarTop);
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
  }
}
