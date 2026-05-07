import Phaser from 'phaser';
import { Bullet } from './Bullet';

const RUN_SPEED = 180;
const JUMP_VELOCITY = -380;

export class Hero extends Phaser.Physics.Arcade.Sprite {
  public bullets: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setMaxVelocity(RUN_SPEED, 1000);
    this.bullets = scene.physics.add.group({ classType: Bullet, runChildUpdate: true });
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

    if (state.shoot) this.shoot();
  }

  shoot() {
    const dir: -1 | 1 = this.flipX ? -1 : 1;
    this.bullets.add(new Bullet(this.scene, this.x + dir * 16, this.y, dir));
    this.scene.sound.play('sfx-shoot', { volume: 0.4 });
  }
}
