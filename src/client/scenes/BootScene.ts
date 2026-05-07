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

    // Sprite atlases (PNG + JSON; T12 migrated them as Phaser-compatible atlases)
    this.load.atlas('hero', 'assets/sprites/Hero.png', 'assets/sprites/Hero.json');
    this.load.atlas('bullet', 'assets/sprites/Bala.png', 'assets/sprites/Bala.json');
    this.load.atlas('zombie', 'assets/sprites/ZombieBoy.png', 'assets/sprites/ZombieBoy.json');
    this.load.atlas('cowgirl', 'assets/sprites/CowGirl.png', 'assets/sprites/CowGirl.json');
    this.load.atlas('ninja', 'assets/sprites/NinjaBoy.png', 'assets/sprites/NinjaBoy.json');
    // More sprite atlases added in T21, T26, T27 as needed.

    // Audio (T28): per-level music + global SFX
    const audioPairs: [string, string][] = [
      ['music-forest', 'forest-at-dawn'],
      ['music-desert', 'western-themetune'],
      ['music-graveyard', 'scary-background-4'],
      ['sfx-shoot', 'laser-one-shot-2'],
      ['sfx-hit', 'zombie-attack'],
      ['sfx-win', 'you-win'],
      ['sfx-lose', 'you-lose-evil'],
    ];
    for (const [key, file] of audioPairs) {
      this.load.audio(key, [`assets/audio/${file}.mp3`, `assets/audio/${file}.ogg`]);
    }
  }

  create() {
    this.scene.start('MenuScene');
  }
}
