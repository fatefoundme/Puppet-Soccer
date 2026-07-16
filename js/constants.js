// 画布
export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 900;

// 场地
export const GROUND_Y = 700;
export const CEILING_Y = 0;
export const LEFT_WALL_X = 0;
export const RIGHT_WALL_X = CANVAS_WIDTH;

// 球门
export const GOAL_WIDTH = 80;
export const GOAL_HEIGHT = 240;
export const GOAL_Y = GROUND_Y - GOAL_HEIGHT;
export const GOAL_BAR_THICKNESS = 15;

// 球员参数 (参考C++原版)
export const PLAYER_RADIUS = 50;        // 头半径
export const PLAYER_BODY_W = 40;
export const PLAYER_BODY_H = 50;
export const PLAYER_HEIGHT = 150;       // 总高度 (头顶到脚底)

// 球参数
export const BALL_RADIUS = 25;

// 物理 - 重力
export const GRAVITY = 0.38;

// 物理 - 球
export const BALL_AIR_DRAG = 0.999;
export const BALL_GROUND_FRICTION = 0.921;
export const BALL_RESTITUTION_GROUND = 0.5;
export const BALL_RESTITUTION_WALL = 0.75;
export const BALL_MAX_SPEED = 14.0;

// 物理 - 球员 (降速)
export const PLAYER_GROUND_ACCEL = 0.8;
export const PLAYER_AIR_ACCEL = 0.35;
export const PLAYER_GROUND_DRAG = 0.80;
export const PLAYER_AIR_DRAG = 0.98;
export const PLAYER_MAX_SPEED_GROUND = 6.5;
export const PLAYER_MAX_SPEED_AIR = 4.5;
export const JUMP_SPEED = 11.0;

// 踢球 (完全照搬原版)
export const KICK_MIN_STRENGTH = 29.0;
export const KICK_MAX_STRENGTH = 50.0;
export const KICK_RANGE_FORWARD = 100.0;
export const KICK_RANGE_BACKWARD = 25.0;
export const KICK_RANGE_VERTICAL = 100.0;
export const KICK_MIN_ANGLE_DEG = 22.0;
export const KICK_MAX_ANGLE_DEG = 50.0;
export const KICK_LIFT_BIAS = 0.35;

// 比赛
export const MATCH_DURATION = 90;
export const KICKOFF_Y = 200;

// 金币
export const COINS_PER_WIN = 100;
export const COINS_PER_MATCH = 30;
export const UNLOCK_COST = 300;

// 按键
export const KEYS = {
  P1_LEFT: 'KeyA', P1_RIGHT: 'KeyD', P1_JUMP: 'KeyW', P1_KICK: 'KeyS',
  P2_LEFT: 'ArrowLeft', P2_RIGHT: 'ArrowRight', P2_JUMP: 'ArrowUp', P2_KICK: 'ArrowDown',
};

// 颜色
export const COLORS = {
  grass: '#3a9d23', grassDark: '#2d7a1a',
  sky: '#87ceeb', ground: '#5a3a1a',
  goalNet: 'rgba(255,255,255,0.15)',
  hud: '#fff', hudBg: 'rgba(0,0,0,0.5)',
};
