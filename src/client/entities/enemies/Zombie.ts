import Phaser from 'phaser';

const PATROL_SPEED = 60;

export class Zombie extends Phaser.Physics.Arcade.Sprite {
  private dir: -1 | 1 = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'zombie');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setVelocityX(this.dir * PATROL_SPEED);
  }

  flip() {
    this.dir = (this.dir * -1) as -1 | 1;
    this.setVelocityX(this.dir * PATROL_SPEED);
    this.setFlipX(this.dir === 1);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.body!.blocked.left || this.body!.blocked.right) this.flip();
  }
}
