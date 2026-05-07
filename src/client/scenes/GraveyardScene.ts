import Phaser from 'phaser';
import { LevelScene, type LevelConfig } from './LevelScene';
import { Hero } from '../entities/Hero';
import { Ninja } from '../entities/enemies/Ninja';
import { Fire } from '../entities/Fire';
import { createInput } from '../systems/input';
import { Audio } from '../systems/audio';

export class GraveyardScene extends LevelScene {
  private hero!: Hero;
  private inputSampler!: ReturnType<typeof createInput>;
  private enemies!: Phaser.Physics.Arcade.Group;
  private fires!: Phaser.Physics.Arcade.StaticGroup;
  private audio!: Audio;

  constructor() {
    super('GraveyardScene');
  }

  protected getConfig(): LevelConfig {
    return {
      levelKey: 'graveyard',
      tilemapKey: 'graveyard-map',
      tilesetKey: 'graveyard-tiles',
      tilesetNameInTiled: 'GraveyardTS',
      groundLayerName: 'Platforms',
    };
  }

  create() {
    super.create();

    this.audio = new Audio(this);
    this.audio.playMusic('music-graveyard');

    this.inputSampler = createInput(this);

    this.hero = new Hero(this, 64, this.map.heightInPixels - 100);
    this.physics.add.collider(this.hero, this.groundLayer);
    this.physics.add.collider(this.hero.bullets, this.groundLayer, (b) =>
      (b as Phaser.GameObjects.GameObject).destroy(),
    );

    this.enemies = this.physics.add.group({ classType: Ninja, runChildUpdate: true });
    this.enemies.add(new Ninja(this, 400, this.map.heightInPixels - 100));
    this.enemies.add(new Ninja(this, 700, this.map.heightInPixels - 100));
    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.hero.bullets, this.enemies, (b, e) => {
      (b as Phaser.GameObjects.GameObject).destroy();
      (e as Phaser.GameObjects.GameObject).destroy();
    });
    this.physics.add.collider(this.hero, this.enemies, () => this.onHeroDeath());

    this.fires = this.physics.add.staticGroup();
    this.fires.add(new Fire(this, 500, this.map.heightInPixels - 80));
    this.fires.add(new Fire(this, 800, this.map.heightInPixels - 80));
    this.physics.add.overlap(this.hero, this.fires, () => this.onHeroDeath());

    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);

    const goal = this.createGoalAt(this.map.widthInPixels - 64, this.map.heightInPixels - 64);
    this.physics.add.overlap(this.hero, goal, () => this.onLevelWin());
  }

  update() {
    if (this.hero) this.hero.applyInput(this.inputSampler());
  }
}
