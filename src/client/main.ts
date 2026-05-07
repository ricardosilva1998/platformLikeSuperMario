import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY_Y } from './types';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { ForestScene } from './scenes/ForestScene';
import { HUDScene } from './scenes/HUDScene';
import { GameOverScene } from './scenes/GameOverScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: GRAVITY_Y }, debug: false } },
  scene: [BootScene, MenuScene, ForestScene, HUDScene, GameOverScene],
});
