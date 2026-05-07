import Phaser from 'phaser';
import { LevelScene, type LevelConfig } from './LevelScene';
import { Hero } from '../entities/Hero';
import { CowGirl } from '../entities/enemies/CowGirl';
import { createInput } from '../systems/input';

export class DesertScene extends LevelScene {
  private hero!: Hero;
  private inputSampler!: ReturnType<typeof createInput>;
  private enemies!: Phaser.Physics.Arcade.Group;

  constructor() {
    super('DesertScene');
  }

  protected getConfig(): LevelConfig {
    return {
      levelKey: 'desert',
      tilemapKey: 'desert-map',
      tilesetKey: 'desert-tiles',
      tilesetNameInTiled: 'DesertMapTS',
      groundLayerName: 'Platforms',
    };
  }

  create() {
    super.create();
    this.inputSampler = createInput(this);

    this.hero = new Hero(this, 64, this.map.heightInPixels - 100);
    this.physics.add.collider(this.hero, this.groundLayer);
    this.physics.add.collider(this.hero.bullets, this.groundLayer, (b) =>
      (b as Phaser.GameObjects.GameObject).destroy(),
    );

    this.enemies = this.physics.add.group({ classType: CowGirl, runChildUpdate: true });
    this.enemies.add(new CowGirl(this, 400, this.map.heightInPixels - 100));
    this.enemies.add(new CowGirl(this, 700, this.map.heightInPixels - 100));

    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.hero.bullets, this.enemies, (b, e) => {
      (b as Phaser.GameObjects.GameObject).destroy();
      (e as Phaser.GameObjects.GameObject).destroy();
    });
    this.physics.add.collider(this.hero, this.enemies, () => this.onHeroDeath());

    this.enemies.children.each((cg) => {
      const cow = cg as CowGirl;
      this.physics.add.collider(cow.bullets, this.groundLayer, (b) =>
        (b as Phaser.GameObjects.GameObject).destroy(),
      );
      this.physics.add.overlap(this.hero, cow.bullets, () => this.onHeroDeath());
      return true;
    });

    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);

    const goal = this.createGoalAt(this.map.widthInPixels - 64, this.map.heightInPixels - 64);
    this.physics.add.overlap(this.hero, goal, () => this.onLevelWin());
  }

  update() {
    if (this.hero) this.hero.applyInput(this.inputSampler());
  }
}
