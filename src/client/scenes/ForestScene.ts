import Phaser from 'phaser';
import { LevelScene, type LevelConfig } from './LevelScene';
import { Hero } from '../entities/Hero';
import { Zombie } from '../entities/enemies/Zombie';
import { createInput } from '../systems/input';
import { Audio } from '../systems/audio';

export class ForestScene extends LevelScene {
  protected hero!: Hero;
  protected inputSampler!: ReturnType<typeof createInput>;
  private zombies!: Phaser.Physics.Arcade.Group;
  private audio!: Audio;

  constructor() {
    super('ForestScene');
  }

  protected getConfig(): LevelConfig {
    return {
      levelKey: 'forest',
      tilemapKey: 'forest-map',
      tilesetKey: 'forest-tiles',
      tilesetNameInTiled: 'ForestMapTS',
      groundLayerName: 'Platforms',
    };
  }

  create() {
    super.create();

    this.audio = new Audio(this);
    this.audio.playMusic('music-forest');

    this.inputSampler = createInput(this);

    this.hero = new Hero(this, 64, this.map.heightInPixels - 100);
    this.physics.add.collider(this.hero, this.groundLayer);
    this.physics.add.collider(this.hero.bullets, this.groundLayer, (b) =>
      (b as Phaser.GameObjects.GameObject).destroy(),
    );

    this.zombies = this.physics.add.group({ classType: Zombie, runChildUpdate: true });
    this.zombies.add(new Zombie(this, 400, this.map.heightInPixels - 100));
    this.zombies.add(new Zombie(this, 700, this.map.heightInPixels - 100));

    this.physics.add.collider(this.zombies, this.groundLayer);
    this.physics.add.collider(this.hero.bullets, this.zombies, (bullet, zombie) => {
      (bullet as Phaser.GameObjects.GameObject).destroy();
      (zombie as Phaser.GameObjects.GameObject).destroy();
    });
    this.physics.add.collider(this.hero, this.zombies, () => this.onHeroDeath());

    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);

    const goal = this.createGoalAt(this.map.widthInPixels - 64, this.map.heightInPixels - 64);
    this.physics.add.overlap(this.hero, goal, () => this.onLevelWin());
  }

  update() {
    if (!this.hero) return;
    this.hero.applyInput(this.inputSampler());
  }
}
