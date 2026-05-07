import Phaser from 'phaser';

const FIRE_WIDTH = 28;
const FIRE_HEIGHT = 32;

/** A static, orange rectangle representing a fire hazard. No sprite required. */
export class Fire extends Phaser.GameObjects.Rectangle {
  declare body: Phaser.Physics.Arcade.StaticBody;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, FIRE_WIDTH, FIRE_HEIGHT, 0xff6600, 0.85);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body
  }
}
