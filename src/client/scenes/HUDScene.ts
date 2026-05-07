import Phaser from 'phaser';
import { type LevelKey } from '../types';

export class HUDScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private startTime = 0;
  private levelKey: LevelKey = 'forest';

  constructor() {
    super('HUDScene');
  }

  init(data: { levelKey: LevelKey }) {
    this.levelKey = data.levelKey;
    this.startTime = this.time.now;
  }

  create() {
    this.timerText = this.add.text(8, 8, 'Time: 0.00', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 6, y: 2 },
    });

    this.add
      .text(this.cameras.main.width - 8, 8, this.levelKey.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffcc00',
      })
      .setOrigin(1, 0);
  }

  update() {
    const elapsed = (this.time.now - this.startTime) / 1000;
    this.timerText.setText(`Time: ${elapsed.toFixed(2)}`);
  }
}
