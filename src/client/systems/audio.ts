import Phaser from 'phaser';

export type SoundKey = string;

export class Audio {
  private music?: Phaser.Sound.BaseSound;
  constructor(private scene: Phaser.Scene) {}

  playMusic(key: SoundKey, volume = 0.4) {
    this.music?.stop();
    this.music = this.scene.sound.add(key, { loop: true, volume });
    this.music.play();
  }

  stopMusic() {
    this.music?.stop();
  }

  sfx(key: SoundKey, volume = 0.6) {
    this.scene.sound.play(key, { volume });
  }
}
