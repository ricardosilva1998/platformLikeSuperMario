import Phaser from 'phaser';

export type InputState = {
  left: boolean;
  right: boolean;
  jump: boolean;
  shoot: boolean;
};

export function createInput(scene: Phaser.Scene) {
  const cursors = scene.input.keyboard!.createCursorKeys();
  const keys = scene.input.keyboard!.addKeys('A,D,W,SPACE,Z') as Record<
    'A' | 'D' | 'W' | 'SPACE' | 'Z',
    Phaser.Input.Keyboard.Key
  >;

  return (): InputState => ({
    left: cursors.left?.isDown || keys.A.isDown,
    right: cursors.right?.isDown || keys.D.isDown,
    jump:
      Phaser.Input.Keyboard.JustDown(cursors.up!) ||
      Phaser.Input.Keyboard.JustDown(keys.W) ||
      Phaser.Input.Keyboard.JustDown(keys.SPACE),
    shoot: Phaser.Input.Keyboard.JustDown(keys.Z),
  });
}
