import Phaser from 'phaser';

const PATROL_SPEED = 60;
const ZOMBIE_SCALE = 0.2;

export class Zombie extends Phaser.Physics.Arcade.Sprite {
  private dir: -1 | 1 = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'zombie', 'WalkLeft (1).png');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(ZOMBIE_SCALE);
    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(160, 380);
    body.setOffset(130, 100);

    this.setVelocityX(this.dir * PATROL_SPEED);
    if (scene.anims.exists('zombie-walk-left')) {
      this.play('zombie-walk-left');
    }
  }

  flip() {
    this.dir = (this.dir * -1) as -1 | 1;
    this.setVelocityX(this.dir * PATROL_SPEED);
    const animKey = this.dir === -1 ? 'zombie-walk-left' : 'zombie-walk-right';
    if (this.scene.anims.exists(animKey) && this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.body!.blocked.left || this.body!.blocked.right) this.flip();
  }
}
