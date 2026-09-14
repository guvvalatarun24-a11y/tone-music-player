import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeAutoCleanStartFromChannelData } from './audioCleaner';

function createTone(lengthSeconds: number, sampleRate: number, musicStartSeconds: number, amplitude = 0.5): Float32Array {
  const totalSamples = Math.max(1, Math.floor(lengthSeconds * sampleRate));
  const channelData = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    if (time >= musicStartSeconds) {
      const phase = (i / sampleRate) * 220;
      channelData[i] = Math.sin(phase) * amplitude;
    }
  }

  return channelData;
}

function createShortNoiseBeforeMusic(lengthSeconds: number, sampleRate: number, noiseStartSeconds: number, noiseLengthSeconds: number): Float32Array {
  const totalSamples = Math.max(1, Math.floor(lengthSeconds * sampleRate));
  const channelData = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    if (time >= noiseStartSeconds && time < noiseStartSeconds + noiseLengthSeconds) {
      channelData[i] = ((i % 13) - 6) / 6;
    } else if (time >= 8) {
      channelData[i] = Math.sin((i / sampleRate) * 220) * 0.6;
    }
  }

  return channelData;
}

test('detects a silent intro and returns a conservative safe start trim', () => {
  const sampleRate = 44100;
  const channelData = createTone(45, sampleRate, 30, 0.5);

  for (let i = 0; i < Math.floor(sampleRate * 30); i++) {
    channelData[i] = 0;
  }

  const result = analyzeAutoCleanStartFromChannelData(channelData, sampleRate);

  assert.equal(result.confidence, 'high');
  assert.ok(result.detectedStartTime >= 29.5 && result.detectedStartTime <= 30.5);
  assert.ok(result.startTrim > 0);
});

test('returns low confidence when music begins immediately', () => {
  const sampleRate = 44100;
  const channelData = createTone(20, sampleRate, 0, 0.5);

  const result = analyzeAutoCleanStartFromChannelData(channelData, sampleRate);

  assert.equal(result.confidence, 'low');
  assert.equal(result.startTrim, 0);
});

test('does not force a cut for short noise before music', () => {
  const sampleRate = 44100;
  const channelData = createShortNoiseBeforeMusic(20, sampleRate, 1.4, 0.8);

  const result = analyzeAutoCleanStartFromChannelData(channelData, sampleRate);

  assert.equal(result.confidence, 'low');
  assert.equal(result.startTrim, 0);
});

test('handles very quiet recordings conservatively', () => {
  const sampleRate = 44100;
  const totalSamples = Math.max(1, Math.floor(25 * sampleRate));
  const channelData = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    channelData[i] = Math.sin((i / sampleRate) * 220) * 0.0003;
  }

  const result = analyzeAutoCleanStartFromChannelData(channelData, sampleRate);

  assert.equal(result.confidence, 'low');
  assert.equal(result.startTrim, 0);
});

test('returns low confidence for corrupt or unsupported input shapes', () => {
  const result = analyzeAutoCleanStartFromChannelData(new Float32Array(0), 44100);

  assert.equal(result.confidence, 'low');
  assert.equal(result.startTrim, 0);
});

test('only analyzes the first 90 seconds of very long files', () => {
  const sampleRate = 44100;
  const totalSamples = Math.max(1, Math.floor(150 * sampleRate));
  const channelData = new Float32Array(totalSamples);

  for (let i = Math.floor(120 * sampleRate); i < totalSamples; i++) {
    channelData[i] = Math.sin((i / sampleRate) * 220) * 0.5;
  }

  const result = analyzeAutoCleanStartFromChannelData(channelData, sampleRate);

  assert.equal(result.confidence, 'low');
  assert.equal(result.startTrim, 0);
});
