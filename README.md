# Puppet Soccer

1v1 双人对战小游戏，Canvas 2D 手写物理引擎。

## 在线玩

👉 https://fatefoundme.github.io/Puppet-Soccer

> 404 的话，去 Settings → Pages → Branch 选 `master` → Save。

## 操作

| 动作 | P1 | P2 |
|------|-----|-----|
| 移动 | A / D | ← / → |
| 跳跃 | W | ↑ |
| 踢球 | S | ↓ |

## 目录结构

```
├── index.html         入口页面，加载 canvas 和主脚本
├── css/
│   └── style.css      页面样式（body / canvas 布局）
├── js/
│   ├── main.js        启动入口，场景切换
│   ├── constants.js   物理参数、画布尺寸、按键映射
│   ├── player.js      球员类（移动 / 跳跃 / 踢球 / 碰撞检测）
│   ├── ball.js        足球类（重力 / 反弹 / 进球判定 / CCD）
│   ├── input.js       键盘输入管理
│   ├── ai.js          AI 对手逻辑（已弃用）
│   ├── renderer.js    画布渲染（场地 / 球员贴图 / HUD）
│   ├── storage.js     LocalStorage 存取
│   ├── data/
│   │   └── teams.js   球队配置（名称 / 颜色）
│   └── scenes/
│       ├── menu.js      主菜单
│       ├── match.js     比赛核心（倒计时 / 计分 / 开球）
│       ├── teamSelect.js  选队界面（已弃用）
│       ├── result.js    赛后结果（已弃用）
│       └── shop.js      角色商店（已弃用）
└── assets/
    ├── player_*.png   球员贴图（6个）
    ├── *.png          队徽（6个）
    ├── background.png 背景图
    └── soccer.png     足球贴图
```

## 素材

球员贴图来源于 B站 [james0602](https://space.bilibili.com/55873408)
