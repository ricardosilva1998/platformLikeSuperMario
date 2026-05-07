import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY_Y } from './types';

class HelloScene extends Phaser.Scene {
  constructor() {
    super('HelloScene');
  }
  create() {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading…', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffffff',
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
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: GRAVITY_Y }, debug: false },
  },
  scene: [HelloScene],
});
