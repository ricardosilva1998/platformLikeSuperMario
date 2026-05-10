import Phaser from 'phaser';

const PATROL_SPEED = 80;
const NINJA_SCALE = 0.2;

export class Ninja extends Phaser.Physics.Arcade.Sprite {
  private dir: -1 | 1 = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'ninja', 'IdleLeft__000.png');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(NINJA_SCALE);
    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(140, 380);
    body.setOffset(150, 90);

    this.setVelocityX(this.dir * PATROL_SPEED);
    if (scene.anims.exists('ninja-run-left')) {
      this.play('ninja-run-left');
    }
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.body!.blocked.left || this.body!.blocked.right) {
      this.dir = (this.dir * -1) as -1 | 1;
      this.setVelocityX(this.dir * PATROL_SPEED);
      const animKey = this.dir === -1 ? 'ninja-run-left' : 'ninja-run-right';
      if (this.scene.anims.exists(animKey) && this.anims.currentAnim?.key !== animKey) {
        this.play(animKey, true);
      }
    }
  }
}
