import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY_Y } from './types';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { ForestScene } from './scenes/ForestScene';
import { HUDScene } from './scenes/HUDScene';

class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }
  create(data: { result?: string }) {
    this.add
      .text(400, 240, `${(data.result ?? '?').toUpperCase()}!`, {
        fontSize: '48px',
        color: '#fff',
      })
      .setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: GRAVITY_Y }, debug: false } },
  scene: [BootScene, MenuScene, ForestScene, HUDScene, GameOverScene],
});
