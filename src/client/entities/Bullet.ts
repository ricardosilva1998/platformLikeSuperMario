import Phaser from 'phaser';

const BULLET_SPEED = 500;
const BULLET_LIFE_MS = 1500;
const BULLET_SCALE = 0.25;

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, direction: -1 | 1) {
    const initialFrame = direction < 0 ? 'BulletLeft_000.png' : 'BulletRight_000.png';
    super(scene, x, y, 'bullet', initialFrame);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(BULLET_SCALE);
    this.setVelocityX(BULLET_SPEED * direction);
    (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;

    const animKey = direction < 0 ? 'bullet-left' : 'bullet-right';
    if (scene.anims.exists(animKey)) {
      this.play(animKey);
    }

    scene.time.delayedCall(BULLET_LIFE_MS, () => this.destroy());
  }
}
