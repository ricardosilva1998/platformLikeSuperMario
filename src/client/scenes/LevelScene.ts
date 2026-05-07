import Phaser from 'phaser';
import { type LevelKey } from '../types';

export interface LevelConfig {
  levelKey: LevelKey;
  tilemapKey: string;
  tilesetKey: string;
  tilesetNameInTiled: string; // the name the tileset was given inside Tiled
  groundLayerName: string; // the Tiled tile layer with collidable tiles
  musicKey?: string;
}

export abstract class LevelScene extends Phaser.Scene {
  protected map!: Phaser.Tilemaps.Tilemap;
  protected groundLayer!: Phaser.Tilemaps.TilemapLayer;
  protected config!: LevelConfig;
  protected startedAt = 0;

  constructor(key: string) {
    super(key);
  }

  protected abstract getConfig(): LevelConfig;

  create() {
    this.config = this.getConfig();

    this.map = this.make.tilemap({ key: this.config.tilemapKey });
    const tileset = this.map.addTilesetImage(this.config.tilesetNameInTiled, this.config.tilesetKey);
    if (!tileset) throw new Error(`tileset ${this.config.tilesetKey} failed to load`);

    const ground = this.map.createLayer(this.config.groundLayerName, tileset, 0, 0);
    if (!ground) throw new Error(`ground layer ${this.config.groundLayerName} not found`);
    this.groundLayer = ground;
    this.groundLayer.setCollisionByExclusion([-1]);

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.scene.launch('HUDScene', { levelKey: this.config.levelKey });
    this.startedAt = this.time.now;
  }

  protected createGoalAt(x: number, y: number, w = 32, h = 64) {
    const goal = this.add.zone(x, y, w, h);
    this.physics.add.existing(goal, true);
    return goal;
  }

  protected onLevelWin() {
    const elapsed = Math.round(this.time.now - this.startedAt);
    this.scene.stop('HUDScene');
    this.scene.start('GameOverScene', {
      result: 'win',
      levelKey: this.config.levelKey,
      timeMs: elapsed,
      score: this.computeScore(elapsed),
    });
  }

  protected onHeroDeath() {
    this.scene.stop('HUDScene');
    this.scene.start('GameOverScene', { result: 'lose', levelKey: this.config.levelKey });
  }

  protected computeScore(elapsedMs: number): number {
    return Math.max(0, Math.round(100000 - (elapsedMs / 1000) * 100));
  }
}
