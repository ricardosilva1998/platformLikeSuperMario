import Phaser from 'phaser';

const PATROL_SPEED = 50;
const SHOOT_COOLDOWN_MS = 2000;

export class CowGirl extends Phaser.Physics.Arcade.Sprite {
  private dir: -1 | 1 = -1;
  private lastShot = 0;
  public bullets: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'cowgirl');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setVelocityX(this.dir * PATROL_SPEED);
    this.bullets = scene.physics.add.group();
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.body!.blocked.left || this.body!.blocked.right) {
      this.dir = (this.dir * -1) as -1 | 1;
      this.setVelocityX(this.dir * PATROL_SPEED);
      this.setFlipX(this.dir === 1);
    }
    if (time - this.lastShot > SHOOT_COOLDOWN_MS) {
      this.lastShot = time;
      const b = this.scene.physics.add.image(this.x + this.dir * 16, this.y, 'bullet');
      (b.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      b.setVelocityX(this.dir * 300);
      this.bullets.add(b);
      this.scene.time.delayedCall(1500, () => b.destroy());
    }
  }
}
