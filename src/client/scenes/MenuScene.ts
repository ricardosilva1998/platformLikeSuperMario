import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, type LevelKey } from '../types';

const LEVELS: { key: LevelKey; label: string; sceneKey: string }[] = [
  { key: 'forest', label: '1. Forest', sceneKey: 'ForestScene' },
  { key: 'desert', label: '2. Desert', sceneKey: 'DesertScene' },
  { key: 'graveyard', label: '3. Graveyard', sceneKey: 'GraveyardScene' },
];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add
      .text(cx, cy - 280, 'SUPER MARIO', {
        fontFamily: 'monospace',
        fontSize: '96px',
        color: '#ffcc00',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 180, '— Select a level —', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    LEVELS.forEach((lv, idx) => {
      const txt = this.add
        .text(cx, cy - 60 + idx * 100, lv.label, {
          fontFamily: 'monospace',
          fontSize: '48px',
          color: '#ffffff',
          backgroundColor: '#333333',
          padding: { x: 32, y: 16 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      txt.on('pointerover', () => txt.setColor('#ffcc00'));
      txt.on('pointerout', () => txt.setColor('#ffffff'));
      txt.on('pointerdown', () => {
        this.scene.start(lv.sceneKey, { levelKey: lv.key });
      });
    });

    this.add
      .text(cx, GAME_HEIGHT - 40, 'Arrows / WASD to move · Space jump · Z shoot', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#888888',
      })
      .setOrigin(0.5);

    // Keyboard shortcuts: 1/2/3 → Forest/Desert/Graveyard
    const codes = ['ONE', 'TWO', 'THREE'];
    LEVELS.forEach((lv, idx) => {
      this.input.keyboard?.on(`keydown-${codes[idx]}`, () => {
        this.scene.start(lv.sceneKey, { levelKey: lv.key });
      });
    });
  }
}
