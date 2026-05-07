import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;

    const bg = this.add.rectangle(w / 2, h / 2, 400, 24, 0x222222);
    const bar = this.add.rectangle(w / 2 - 198, h / 2, 4, 20, 0x66ff66).setOrigin(0, 0.5);
    this.load.on('progress', (p: number) => bar.setSize(396 * p, 20));

    this.add
      .text(w / 2, h / 2 - 32, 'Super Mario — Loading', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Tilemaps
    this.load.tilemapTiledJSON('forest-map', 'assets/tilemaps/ForestMap.json');
    this.load.tilemapTiledJSON('desert-map', 'assets/tilemaps/DesertMap.json');
    this.load.tilemapTiledJSON('graveyard-map', 'assets/tilemaps/GraveyardMap.json');

    // Tilesets
    this.load.image('forest-tiles', 'assets/tilesets/ForestMapTileSheet.png');
    this.load.image('desert-tiles', 'assets/tilesets/DesertMapTileSheet.png');
    this.load.image('graveyard-tiles', 'assets/tilesets/GraveyardMapTileSheet.png');

    // Sprite + audio loads added in T20, T21, T26, T27, T28 as each is needed.
  }

  create() {
    this.scene.start('MenuScene');
  }
}
