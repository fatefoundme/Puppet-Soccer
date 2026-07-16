import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { MatchScene } from './scenes/match.js';
import { MenuScene } from './scenes/menu.js';
import { ResultScene } from './scenes/result.js';
import { TeamSelectScene } from './scenes/teamSelect.js';
import { ShopScene } from './scenes/shop.js';
import { loadData, saveData } from './storage.js';
import { TEAMS } from './data/teams.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

function resize() {
  const scale = Math.min(window.innerWidth / CANVAS_WIDTH, window.innerHeight / CANVAS_HEIGHT);
  canvas.style.width = CANVAS_WIDTH * scale + 'px';
  canvas.style.height = CANVAS_HEIGHT * scale + 'px';
}
window.addEventListener('resize', resize);
resize();

// 错误显示
window.addEventListener('error', function(e) {
  ctx.fillStyle = '#c00';
  ctx.font = '14px monospace';
  ctx.fillText('ERROR: ' + (e.message || 'unknown'), 20, 60);
  ctx.fillText('File: ' + (e.filename || ''), 20, 80);
  ctx.fillText('Line: ' + (e.lineno || ''), 20, 100);
});

// 初始化
try {
  const data = loadData();
  TEAMS.forEach(team => {
    team.characters.forEach(char => {
      if (!char.locked && data.unlockedChars[char.id] === undefined) {
        data.unlockedChars[char.id] = true;
      }
    });
  });
  saveData(data);
} catch(e) {
  ctx.fillText('INIT ERROR: ' + e.message, 20, 60);
}

let currentScene = null;
const gameData = {
  mode: 'ai', playerTeam: null, opponentTeam: null,
  playerCharIndex: 0, opponentCharIndex: 0,
  round: 'qf', score: { p1: 0, p2: 0 }, tournament: false,
};

function switchScene(name, d = {}) {
  Object.assign(gameData, d);
  if (currentScene && currentScene.destroy) {
    try { currentScene.destroy(); } catch(e) {}
  }
  currentScene = null;

  try {
    switch (name) {
      case 'menu': currentScene = new MenuScene(canvas, ctx, gameData, switchScene); break;
      case 'teamSelect': currentScene = new TeamSelectScene(canvas, ctx, gameData, switchScene); break;
      case 'match': currentScene = new MatchScene(canvas, ctx, gameData, switchScene); break;
      case 'result': currentScene = new ResultScene(canvas, ctx, gameData, switchScene); break;
      case 'shop': currentScene = new ShopScene(canvas, ctx, gameData, switchScene); break;
    }
  } catch(e) {
    ctx.fillStyle = '#c00';
    ctx.font = '16px monospace';
    ctx.fillText('SCENE ERROR: ' + e.message, 20, 60);
    ctx.fillText(e.stack || '', 20, 90);
  }
}

// 启动
try {
  switchScene('menu');
} catch(e) {
  ctx.fillText('START ERROR: ' + e.message, 20, 60);
}
