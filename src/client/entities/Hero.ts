import Phaser from 'phaser';
import { Bullet } from './Bullet';

const RUN_SPEED = 180;
const JUMP_VELOCITY = -380;
const HERO_SCALE = 0.2;

export class Hero extends Phaser.Physics.Arcade.Sprite {
  public bullets: Phaser.Physics.Arcade.Group;
  private facing: 'left' | 'right' = 'right';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero', 'IdleRight (1).png');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(HERO_SCALE);
    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);
    this.setMaxVelocity(RUN_SPEED, 1000);

    const body = this.body as Phaser.Physics.Arcade.Body;
    // Source frame is ~275×470 px. Tighten the hitbox to the character body.
    body.setSize(140, 380);
    body.setOffset(70, 90);

    this.bullets = scene.physics.add.group({ classType: Bullet, runChildUpdate: true });
    this.play('hero-idle-right');
  }

  applyInput(state: { left: boolean; right: boolean; jump: boolean; shoot: boolean }) {
    if (state.left) {
      this.setVelocityX(-RUN_SPEED);
      this.facing = 'left';
    } else if (state.right) {
      this.setVelocityX(RUN_SPEED);
      this.facing = 'right';
    } else {
      this.setVelocityX(0);
    }

    const onGround = this.body!.blocked.down;
    if (state.jump && onGround) {
      this.setVelocityY(JUMP_VELOCITY);
    }

    this.updateAnimation(state, onGround);

    if (state.shoot) this.shoot();
  }

  private updateAnimation(
    state: { left: boolean; right: boolean },
    onGround: boolean,
  ) {
    const dir = this.facing;
    let key: string;
    if (!onGround) {
      key = `hero-jump-${dir}`;
    } else if (state.left || state.right) {
      key = `hero-run-${dir}`;
    } else {
      key = `hero-idle-${dir}`;
    }
    if (this.anims.currentAnim?.key !== key) {
      this.play(key, true);
    }
  }

  shoot() {
    const dir: -1 | 1 = this.facing === 'left' ? -1 : 1;
    this.bullets.add(new Bullet(this.scene, this.x + dir * 16, this.y - 30, dir));
    this.scene.sound.play('sfx-shoot', { volume: 0.4 });
  }
}
