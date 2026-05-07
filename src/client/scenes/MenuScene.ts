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
    this.add
      .text(GAME_WIDTH / 2, 80, 'SUPER MARIO', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffcc00',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 130, '— Select a level —', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    LEVELS.forEach((lv, idx) => {
      const txt = this.add
        .text(GAME_WIDTH / 2, 200 + idx * 50, lv.label, {
          fontFamily: 'monospace',
          fontSize: '24px',
          color: '#ffffff',
          backgroundColor: '#333333',
          padding: { x: 16, y: 8 },
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
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'Arrows / WASD to move · Space jump · Z shoot', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#888888',
      })
      .setOrigin(0.5);
  }
}
