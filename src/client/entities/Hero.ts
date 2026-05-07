import Phaser from 'phaser';

const RUN_SPEED = 180;
const JUMP_VELOCITY = -380;

export class Hero extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setMaxVelocity(RUN_SPEED, 1000);
  }

  applyInput(state: { left: boolean; right: boolean; jump: boolean; shoot: boolean }) {
    if (state.left) {
      this.setVelocityX(-RUN_SPEED);
      this.setFlipX(true);
    } else if (state.right) {
      this.setVelocityX(RUN_SPEED);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if (state.jump && this.body!.blocked.down) {
      this.setVelocityY(JUMP_VELOCITY);
    }
    // shoot wired in T19
  }
}
