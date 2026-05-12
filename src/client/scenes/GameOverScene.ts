import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, type LevelKey } from '../types';
import { postScore, getTopScores } from '../systems/api';

interface Params {
  result: 'win' | 'lose';
  levelKey: LevelKey;
  timeMs?: number;
  score?: number;
}

export class GameOverScene extends Phaser.Scene {
  private params!: Params;

  constructor() {
    super('GameOverScene');
  }

  init(data: Params) {
    this.params = data;
  }

  create() {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    const title = this.params.result === 'win' ? 'YOU WIN!' : 'GAME OVER';
    const color = this.params.result === 'win' ? '#66ff66' : '#ff6666';

    this.add
      .text(w / 2, 160, title, { fontFamily: 'monospace', fontSize: '96px', color })
      .setOrigin(0.5);

    if (this.params.result === 'win' && typeof this.params.timeMs === 'number') {
      this.add
        .text(w / 2, 280, `Time: ${(this.params.timeMs / 1000).toFixed(2)}s`, {
          fontFamily: 'monospace',
          fontSize: '40px',
          color: '#ffffff',
        })
        .setOrigin(0.5);

      this.promptName().then(async (name) => {
        if (name) {
          try {
            await postScore({
              playerName: name,
              level: this.params.levelKey,
              timeMs: this.params.timeMs!,
              score: this.params.score ?? 0,
            });
          } catch (e) {
            console.error(e);
          }
        }
        await this.renderLeaderboard();
      });
    } else {
      this.renderLeaderboard();
    }

    const replay = this.add
      .text(w / 2, h - 140, 'Play again', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#66ff66',
        backgroundColor: '#222222',
        padding: { x: 20, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    replay.on('pointerdown', () => {
      const sceneKey =
        this.params.levelKey === 'forest'
          ? 'ForestScene'
          : this.params.levelKey === 'desert'
            ? 'DesertScene'
            : 'GraveyardScene';
      this.scene.start(sceneKey);
    });

    const menu = this.add
      .text(w / 2, h - 70, 'Back to menu', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  private promptName(): Promise<string | null> {
    return new Promise((resolve) => {
      const raw = window.prompt('Enter name (max 16 alphanumerics):', 'AAA');
      if (raw === null) return resolve(null);
      const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 16).toUpperCase();
      resolve(cleaned || null);
    });
  }

  private async renderLeaderboard() {
    try {
      const rows = await getTopScores(this.params.levelKey, 10);
      this.add
        .text(GAME_WIDTH / 2, 400, `TOP 10 — ${this.params.levelKey.toUpperCase()}`, {
          fontFamily: 'monospace',
          fontSize: '36px',
          color: '#ffcc00',
        })
        .setOrigin(0.5);
      rows.forEach((r, i) => {
        this.add
          .text(
            GAME_WIDTH / 2,
            460 + i * 36,
            `${String(i + 1).padStart(2)} ${r.playerName.padEnd(16)} ${(r.timeMs / 1000)
              .toFixed(2)
              .padStart(8)}s`,
            { fontFamily: 'monospace', fontSize: '28px', color: '#ffffff' },
          )
          .setOrigin(0.5);
      });
    } catch (err) {
      this.add
        .text(GAME_WIDTH / 2, 460, '(leaderboard unavailable)', {
          fontFamily: 'monospace',
          fontSize: '28px',
          color: '#888888',
        })
        .setOrigin(0.5);
    }
  }
}
