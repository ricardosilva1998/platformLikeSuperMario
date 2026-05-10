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
    this.createAnimations();
    this.scene.start('MenuScene');
  }

  private createAnimations() {
    const make = (
      key: string,
      atlas: string,
      prefix: string,
      start: number,
      end: number,
      frameRate = 12,
      repeat = -1,
      zeroPad = 0,
    ) => {
      const frames = this.anims.generateFrameNames(atlas, {
        prefix,
        suffix: ').png',
        start,
        end,
        zeroPad,
      });
      this.anims.create({ key, frames, frameRate, repeat });
    };

    // Hero: "IdleRight (1).png" pattern
    make('hero-idle-right', 'hero', 'IdleRight (', 1, 10, 10);
    make('hero-idle-left', 'hero', 'IdleLeft (', 1, 10, 10);
    make('hero-run-right', 'hero', 'RunRight (', 1, 8, 14);
    make('hero-run-left', 'hero', 'RunLeft (', 1, 8, 14);
    make('hero-jump-right', 'hero', 'JumpRight (', 1, 10, 12, 0);
    make('hero-jump-left', 'hero', 'JumpLeft (', 1, 10, 12, 0);
    make('hero-shoot-right', 'hero', 'ShootRight (', 1, 4, 16, 0);
    make('hero-shoot-left', 'hero', 'ShootLeft (', 1, 4, 16, 0);

    // Zombie: "WalkLeft (1).png" / "AttackLeft (1).png"
    make('zombie-walk-right', 'zombie', 'WalkRight (', 1, 10, 10);
    make('zombie-walk-left', 'zombie', 'WalkLeft (', 1, 10, 10);
    make('zombie-attack-right', 'zombie', 'AttackRight (', 1, 8, 14, 0);
    make('zombie-attack-left', 'zombie', 'AttackLeft (', 1, 8, 14, 0);

    // CowGirl
    make('cowgirl-idle-right', 'cowgirl', 'IdleRight (', 1, 9, 10);
    make('cowgirl-idle-left', 'cowgirl', 'IdleLeft (', 1, 9, 10);
    make('cowgirl-run-right', 'cowgirl', 'RunRight (', 1, 8, 14);
    make('cowgirl-run-left', 'cowgirl', 'RunLeft (', 1, 8, 14);
    make('cowgirl-shoot-right', 'cowgirl', 'ShootRight (', 1, 3, 12, 0);
    make('cowgirl-shoot-left', 'cowgirl', 'ShootLeft (', 1, 3, 12, 0);

    // Ninja: "IdleRight__000.png" pattern (no parens, double underscore, zero-padded)
    const makeNinja = (
      key: string,
      prefix: string,
      start: number,
      end: number,
      frameRate = 12,
      repeat = -1,
    ) => {
      const frames = this.anims.generateFrameNames('ninja', {
        prefix,
        suffix: '.png',
        start,
        end,
        zeroPad: 3,
      });
      this.anims.create({ key, frames, frameRate, repeat });
    };
    makeNinja('ninja-idle-right', 'IdleRight__', 0, 9, 10);
    makeNinja('ninja-idle-left', 'IdleLeft__', 0, 9, 10);
    makeNinja('ninja-run-right', 'RunRight__', 0, 9, 14);
    makeNinja('ninja-run-left', 'RunLeft__', 0, 8, 14);
    makeNinja('ninja-attack-right', 'AttackRight__', 0, 9, 14, 0);
    makeNinja('ninja-attack-left', 'AttackLeft__', 0, 9, 14, 0);

    // Bullet animation (Bala atlas uses underscore + zero-padded numbers)
    const bulletLeft = this.anims.generateFrameNames('bullet', {
      prefix: 'BulletLeft_',
      suffix: '.png',
      start: 0,
      end: 4,
      zeroPad: 3,
    });
    this.anims.create({ key: 'bullet-left', frames: bulletLeft, frameRate: 16, repeat: -1 });
    const bulletRight = this.anims.generateFrameNames('bullet', {
      prefix: 'BulletRight_',
      suffix: '.png',
      start: 0,
      end: 4,
      zeroPad: 3,
    });
    this.anims.create({ key: 'bullet-right', frames: bulletRight, frameRate: 16, repeat: -1 });
  }
}
