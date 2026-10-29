// Generates small WAV feedback sounds for practice mode (correct / incorrect).
const fs = require('fs');
const path = require('path');

const RATE = 22050;

function tone(freq, ms, vol = 0.5, type = 'sine') {
  const n = Math.floor((RATE * ms) / 1000);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const env = Math.min(1, i / (RATE * 0.01)) * Math.pow(1 - i / n, 1.5);
    const phase = 2 * Math.PI * freq * t;
    const s = type === 'saw' ? 2 * ((freq * t) % 1) - 1 : Math.sin(phase);
    out[i] = s * env * vol;
  }
  return out;
}

function toWav(chunks) {
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const buf = Buffer.alloc(44 + total * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + total * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(total * 2, 40);
  let o = 44;
  for (const c of chunks) {
    for (let i = 0; i < c.length; i++) {
      buf.writeInt16LE(Math.max(-1, Math.min(1, c[i])) * 32767, o);
      o += 2;
    }
  }
  return buf;
}

const dir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'correct.wav'), toWav([tone(659, 110), tone(880, 190)]));
fs.writeFileSync(path.join(dir, 'incorrect.wav'), toWav([tone(220, 140, 0.4, 'saw'), tone(165, 220, 0.4, 'saw')]));
console.log('Generated sounds in', dir);

