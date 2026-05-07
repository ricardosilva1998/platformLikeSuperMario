import { execSync } from 'node:child_process';
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const SRC = 'public/assets/audio/source';
const OUT = 'public/assets/audio';

if (!existsSync(SRC)) {
  console.error(`missing ${SRC}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

for (const file of readdirSync(SRC)) {
  const ext = path.extname(file).toLowerCase();
  if (!['.wav', '.mp3', '.flac', '.ogg'].includes(ext)) continue;
  const stem = path.basename(file, ext);
  const inFile = path.join(SRC, file);
  const mp3 = path.join(OUT, `${stem}.mp3`);
  const ogg = path.join(OUT, `${stem}.ogg`);

  if (!existsSync(mp3)) {
    console.log(`-> ${mp3}`);
    execSync(`ffmpeg -y -i "${inFile}" -codec:a libmp3lame -qscale:a 4 "${mp3}"`, { stdio: 'inherit' });
  }
  if (!existsSync(ogg)) {
    console.log(`-> ${ogg}`);
    // libopus in an Ogg container — broadly supported in all modern browsers.
    // Homebrew's bottled ffmpeg lacks libvorbis but ships libopus as a required dep.
    execSync(`ffmpeg -y -i "${inFile}" -codec:a libopus -b:a 96k "${ogg}"`, { stdio: 'inherit' });
  }
}

console.log('audio normalization complete');
