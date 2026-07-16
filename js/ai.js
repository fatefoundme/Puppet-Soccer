const STYLES = {
  aggressive: { aggressiveness: 0.90, defenseBias: 0.10, jumpFreq: 0.12, reactDelay: 12, kickRange: 85, lobChance: 0.10, desc: '猛攻型' },
  defensive:  { aggressiveness: 0.35, defenseBias: 0.80, jumpFreq: 0.05, reactDelay: 28, kickRange: 65, lobChance: 0.55, desc: '防守型' },
  balanced:   { aggressiveness: 0.65, defenseBias: 0.35, jumpFreq: 0.12, reactDelay: 20, kickRange: 75, lobChance: 0.20, desc: '均衡型' },
  dribbler:   { aggressiveness: 0.48, defenseBias: 0.20, jumpFreq: 0.04, reactDelay: 9,  kickRange: 52, lobChance: 0.05, desc: '盘带型' },
  aerial:     { aggressiveness: 0.55, defenseBias: 0.28, jumpFreq: 0.30, reactDelay: 16, kickRange: 90, lobChance: 0.75, desc: '高空型' },
  rusher:     { aggressiveness: 0.95, defenseBias: 0.05, jumpFreq: 0.15, reactDelay: 6,  kickRange: 92, lobChance: 0.05, desc: '冲锋型' },
  cautious:   { aggressiveness: 0.50, defenseBias: 0.55, jumpFreq: 0.08, reactDelay: 22, kickRange: 70, lobChance: 0.30, desc: '谨慎型' },
  chaotic:    { aggressiveness: 0.75, defenseBias: 0.25, jumpFreq: 0.22, reactDelay: 8,  kickRange: 80, lobChance: 0.40, desc: '乱战型' },
};

export class AIController {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty;
    this.actionTimer = 0;
    this.currentAction = 'chase';
    this._initStyle();
  }

  _initStyle() {
    const keys = Object.keys(STYLES);
    const key = keys[Math.floor(Math.random() * keys.length)];
    const p = STYLES[key];
    this._styleName = key;

    this.aggressiveness = this._jitter(p.aggressiveness, 0.20);
    this.defenseBias    = this._jitter(p.defenseBias, 0.25);
    this.jumpFrequency  = Math.max(0.02, this._jitter(p.jumpFreq, 0.25));
    this.reactionDelay  = Math.max(4, Math.round(this._jitter(p.reactDelay, 0.20)));
    this.kickRange      = Math.max(45, this._jitter(p.kickRange, 0.15));
    this.lobChance      = Math.max(0, Math.min(1, this._jitter(p.lobChance, 0.30)));

    // 随机个性
    this.hesitates   = Math.random() < 0.30;
    this.backpasses  = Math.random() < 0.20;
    this.wanders     = Math.random() < 0.25;
    this.jumpHappy   = Math.random() < 0.20;  // 没事也跳

    this._hesitateTimer = 0;
    this._wanderDir = 0;
    this._wanderTimer = 0;

    console.log(`AI风格: ${p.desc} (${key}) hesitates=${this.hesitates} backpasses=${this.backpasses} wanders=${this.wanders}`);
  }

  _jitter(value, amount) {
    return value * (1 - amount + Math.random() * amount * 2);
  }

  update(player, ball, dt) {
    this.actionTimer++;

    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // P2守右门 → 站位偏右; defenseBias越高越靠后
    const defendX = 1600 - 80 - this.defenseBias * 400;
    // 追球目标: 在球和防守位之间插值
    const chaseX = dist < 25 ? player.x : ball.x + (this.defenseBias - 0.5) * 180;
    const targetX = defendX * this.defenseBias + chaseX * (1 - this.defenseBias);

    // 决策
    if (this.actionTimer % this.reactionDelay === 0) {
      const r = Math.random();

      if (this.hesitates && r < 0.07 && dist > 70) {
        this._hesitateTimer = 10 + Math.random() * 30;
      }

      if (this._hesitateTimer > 0) {
        this.currentAction = 'idle';
      } else if (dist < this.kickRange && r < this.aggressiveness) {
        this.currentAction = 'kick';
      } else if (player.isOnGround() && (
        (dist < 160 && r < this.jumpFrequency) ||
        (this.jumpHappy && r < 0.04)
      )) {
        this.currentAction = 'jump';
      } else if (this.wanders && r < 0.05 && dist > 90) {
        this.currentAction = 'wander';
        this._wanderDir = Math.random() < 0.5 ? -1 : 1;
        this._wanderTimer = 18 + Math.random() * 40;
      } else {
        this.currentAction = 'chase';
      }
    }

    if (this._hesitateTimer > 0) this._hesitateTimer--;

    // 移动目标
    let moveTargetX = targetX;
    if (this.currentAction === 'idle') {
      moveTargetX = player.x;
    } else if (this.currentAction === 'wander') {
      moveTargetX = player.x + this._wanderDir * 100;
      this._wanderTimer--;
      if (this._wanderTimer <= 0) this.currentAction = 'chase';
    }

    const tdx = moveTargetX - player.x;
    const moveLeft = tdx < -10;
    const moveRight = tdx > 10;
    const jump = this.currentAction === 'jump';

    player.update(dt, moveLeft, moveRight, jump);

    // 踢球: P2攻左门 → 面朝左
    if (this.currentAction === 'kick' && dist < this.kickRange) {
      player.facingRight = false;

      if (this.backpasses && Math.random() < 0.10) {
        player.facingRight = true; // 回传踢反方向
      }

      player.iskick = true;
      this.currentAction = 'chase';
    }
  }
}
