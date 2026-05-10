import Phaser from 'phaser';

const PATROL_SPEED = 50;
const SHOOT_COOLDOWN_MS = 2000;
const COWGIRL_SCALE = 0.2;

export class CowGirl extends Phaser.Physics.Arcade.Sprite {
  private dir: -1 | 1 = -1;
  private lastShot = 0;
  public bullets: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'cowgirl', 'IdleLeft (1).png');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(COWGIRL_SCALE);
    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(140, 380);
    body.setOffset(150, 90);

    this.setVelocityX(this.dir * PATROL_SPEED);
    this.bullets = scene.physics.add.group();
    if (scene.anims.exists('cowgirl-run-left')) {
      this.play('cowgirl-run-left');
    }
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.body!.blocked.left || this.body!.blocked.right) {
      this.dir = (this.dir * -1) as -1 | 1;
      this.setVelocityX(this.dir * PATROL_SPEED);
      const animKey = this.dir === -1 ? 'cowgirl-run-left' : 'cowgirl-run-right';
      if (this.scene.anims.exists(animKey) && this.anims.currentAnim?.key !== animKey) {
        this.play(animKey, true);
      }
    }
    if (time - this.lastShot > SHOOT_COOLDOWN_MS) {
      this.lastShot = time;
      const initialFrame = this.dir < 0 ? 'BulletLeft_000.png' : 'BulletRight_000.png';
      const b = this.scene.physics.add.sprite(this.x + this.dir * 16, this.y - 40, 'bullet', initialFrame);
      b.setScale(0.25);
      (b.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      b.setVelocityX(this.dir * 300);
      const animKey = this.dir < 0 ? 'bullet-left' : 'bullet-right';
      if (this.scene.anims.exists(animKey)) b.play(animKey);
      this.bullets.add(b);
      this.scene.time.delayedCall(1500, () => b.destroy());
    }
  }
}
