import { Song } from '../types/music';
import { generateCoverArt } from './metadata';

/**
 * Encodes an AudioBuffer into a WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF header
  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');

  // FMT sub-chunk
  writeString('fmt ');
  setUint32(16); // subchunk1size (16 for PCM)
  setUint16(1); // audio format (1 = PCM)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample

  // data sub-chunk
  writeString('data');
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

/**
 * Synthesizes a melodic music loop track using Web Audio API
 */
async function synthesizeTrack(
  scaleFrequencies: number[],
  tempo: number,
  durationSec: number,
  chordBase: number
): Promise<Blob> {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);

  const beatLen = 60 / tempo;
  const totalBeats = Math.floor(durationSec / beatLen);

  // Bass drone / pad
  const bassOsc = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bassOsc.type = 'triangle';
  bassOsc.frequency.setValueAtTime(chordBase, 0);
  bassGain.gain.setValueAtTime(0.12, 0);
  bassGain.gain.exponentialRampToValueAtTime(0.01, durationSec);
  bassOsc.connect(bassGain);
  bassGain.connect(ctx.destination);
  bassOsc.start(0);
  bassOsc.stop(durationSec);

  // Melody arpeggio
  for (let b = 0; b < totalBeats; b++) {
    const time = b * beatLen;
    const noteFreq = scaleFrequencies[b % scaleFrequencies.length];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = b % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(noteFreq, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.2, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, time + beatLen * 0.85);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + beatLen);
  }

  const renderedBuffer = await ctx.startRendering();
  return audioBufferToWav(renderedBuffer);
}

/**
 * Creates 4 high quality sample royalty-free songs for instant testing
 */
export async function createDemoTracks(): Promise<Song[]> {
  const now = Date.now();

  const trackDefs = [
    {
      title: 'Neon Pulse',
      artist: 'Cyber Dream',
      album: 'Tone Originals',
      scale: [261.63, 329.63, 392.0, 523.25, 440.0, 349.23, 392.0, 293.66],
      tempo: 120,
      duration: 12,
      bass: 130.81,
    },
    {
      title: 'Midnight Breeze',
      artist: 'Lofi Horizons',
      album: 'Tone Chill',
      scale: [220.0, 261.63, 329.63, 392.0, 440.0, 493.88, 392.0, 329.63],
      tempo: 95,
      duration: 14,
      bass: 110.0,
    },
    {
      title: 'Solar Echoes',
      artist: 'Aura Collective',
      album: 'Ambient Waves',
      scale: [293.66, 369.99, 440.0, 554.37, 440.0, 369.99, 293.66, 220.0],
      tempo: 108,
      duration: 12,
      bass: 146.83,
    },
    {
      title: 'Electric Velvet',
      artist: 'Starlight Groove',
      album: 'Synth Odyssey',
      scale: [329.63, 392.0, 493.88, 587.33, 493.88, 392.0, 329.63, 246.94],
      tempo: 128,
      duration: 11,
      bass: 164.81,
    },
  ];

  const songs: Song[] = [];

  for (let i = 0; i < trackDefs.length; i++) {
    const def = trackDefs[i];
    const blob = await synthesizeTrack(def.scale, def.tempo, def.duration, def.bass);
    const id = `sample-track-${i + 1}-${now}`;

    songs.push({
      id,
      title: def.title,
      artist: def.artist,
      album: def.album,
      duration: def.duration,
      filename: `${def.title.toLowerCase().replace(/\s+/g, '_')}.wav`,
      size: blob.size,
      type: 'audio/wav',
      dateAdded: now - (trackDefs.length - i) * 60000,
      coverArt: generateCoverArt(def.title, def.artist),
      audioBlob: blob,
    });
  }

  return songs;
}
