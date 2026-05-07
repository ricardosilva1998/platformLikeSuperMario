import Phaser from 'phaser';

const BULLET_SPEED = 500;
const BULLET_LIFE_MS = 1500;

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, direction: -1 | 1) {
    super(scene, x, y, 'bullet');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVelocityX(BULLET_SPEED * direction);
    (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    scene.time.delayedCall(BULLET_LIFE_MS, () => this.destroy());
  }
}
