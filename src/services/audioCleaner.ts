/**
 * Tone - Clean Audio Processing Service
 * Client-side Web Audio API processing for removing unwanted intro/outro/middle voice speech sections.
 * 100% private, runs entirely offline inside browser.
 */

export interface TrimConfig {
  startTrim: number; // in seconds (audio before this is removed)
  endTrim: number; // in seconds (audio after this is removed)
  enableMiddleCut: boolean;
  middleStart: number; // in seconds (start of unwanted section)
  middleEnd: number; // in seconds (end of unwanted section)
}

export interface AutoCleanStartAnalysis {
  detectedStartTime: number;
  startTrim: number;
  confidence: 'high' | 'low';
}

export interface AnalyzeAutoCleanStartOptions {
  maxAnalysisSeconds?: number;
  windowSizeSeconds?: number;
  stepSeconds?: number;
  minQuietSeconds?: number;
  minSustainedSeconds?: number;
  safetyMarginSeconds?: number;
}

export type CleanMode = 'trim-start' | 'trim-end' | 'trim-both' | 'remove-middle' | 'custom';

let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext = new AudioContextClass();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

/**
 * Decodes an audio file Blob into an AudioBuffer
 */
export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = getAudioContext();

  return new Promise((resolve, reject) => {
    ctx.decodeAudioData(
      arrayBuffer.slice(0),
      (decoded) => resolve(decoded),
      (err) => reject(err || new Error('Failed to decode audio file.'))
    );
  });
}

/**
 * Generates normalized peak buckets for waveform visualization
 */
export function extractWaveformPeaks(buffer: AudioBuffer, numBuckets = 100): number[] {
  const channelData = buffer.getChannelData(0);
  const totalSamples = channelData.length;
  const bucketSize = Math.floor(totalSamples / numBuckets);
  const peaks: number[] = new Array(numBuckets).fill(0);

  if (bucketSize === 0) return peaks;

  let maxPeak = 0;
  for (let b = 0; b < numBuckets; b++) {
    const start = b * bucketSize;
    const end = Math.min(start + bucketSize, totalSamples);
    let sumSquares = 0;
    let count = 0;

    for (let i = start; i < end; i += 4) { // step by 4 for high performance
      const val = channelData[i];
      sumSquares += val * val;
      count++;
    }

    const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;
    peaks[b] = rms;
    if (rms > maxPeak) maxPeak = rms;
  }

  // Normalize between 0.05 and 1
  return peaks.map((p) => (maxPeak > 0 ? Math.max(0.08, p / maxPeak) : 0.08));
}

function averageRange(values: number[], startIndex: number, endIndex: number): number {
  if (startIndex > endIndex || startIndex < 0 || endIndex >= values.length) {
    return 0;
  }

  let total = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    total += values[i];
  }

  return total / (endIndex - startIndex + 1);
}

function findFirstSustainedRun(
  energies: number[],
  startIndex: number,
  musicThreshold: number,
  minSustainedWindows: number
): { startIndex: number; endIndex: number } | null {
  for (let i = startIndex; i < energies.length; i++) {
    if (energies[i] < musicThreshold) {
      continue;
    }

    let endIndex = i;
    while (endIndex + 1 < energies.length && energies[endIndex + 1] >= musicThreshold * 0.85) {
      endIndex++;
    }

    const runLength = endIndex - i + 1;
    if (runLength >= minSustainedWindows) {
      const runAverage = averageRange(energies, i, endIndex);
      if (runAverage >= musicThreshold) {
        return { startIndex: i, endIndex };
      }
    }

    i = endIndex;
  }

  return null;
}

/**
 * Detects a conservative starting cut point by looking only at the first 90 seconds.
 * This intentionally avoids aggressive cuts when the intro is not clearly silent.
 */
export function analyzeAutoCleanStartFromChannelData(
  channelData: Float32Array,
  sampleRate: number,
  options: AnalyzeAutoCleanStartOptions = {}
): AutoCleanStartAnalysis {
  if (!channelData || channelData.length === 0 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return { detectedStartTime: 0, startTrim: 0, confidence: 'low' };
  }

  const maxAnalysisSeconds = Math.max(0, Math.min(options.maxAnalysisSeconds ?? 90, channelData.length / sampleRate));
  const analysisSamples = Math.max(1, Math.min(channelData.length, Math.floor(maxAnalysisSeconds * sampleRate)));
  const analysisData = channelData.subarray(0, analysisSamples);

  const windowSizeSeconds = Math.min(Math.max(options.windowSizeSeconds ?? 0.5, 0.25), 1);
  const stepSeconds = Math.min(Math.max(options.stepSeconds ?? 0.25, 0.125), windowSizeSeconds);
  const minQuietSeconds = Math.max(options.minQuietSeconds ?? 1.5, 0.5);
  const minSustainedSeconds = Math.max(options.minSustainedSeconds ?? 2, 0.75);
  const safetyMarginSeconds = Math.max(0, Math.min(options.safetyMarginSeconds ?? 0.4, 1.5));

  const windowSizeSamples = Math.max(1, Math.floor(windowSizeSeconds * sampleRate));
  const stepSamples = Math.max(1, Math.floor(stepSeconds * sampleRate));
  const minQuietWindows = Math.max(2, Math.ceil(minQuietSeconds / stepSeconds));
  const minSustainedWindows = Math.max(3, Math.ceil(minSustainedSeconds / stepSeconds));

  if (analysisData.length < windowSizeSamples) {
    return { detectedStartTime: 0, startTrim: 0, confidence: 'low' };
  }

  const energies: number[] = [];
  for (let start = 0; start + windowSizeSamples <= analysisData.length; start += stepSamples) {
    const end = Math.min(start + windowSizeSamples, analysisData.length);
    let sumSquares = 0;
    let count = 0;

    for (let i = start; i < end; i++) {
      const sample = analysisData[i];
      sumSquares += sample * sample;
      count++;
    }

    const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;
    energies.push(rms);
  }

  if (energies.length === 0) {
    return { detectedStartTime: 0, startTrim: 0, confidence: 'low' };
  }

  const sortedEnergies = [...energies].sort((a, b) => a - b);
  const lowEnergyFloor = sortedEnergies[Math.min(sortedEnergies.length - 1, Math.floor(sortedEnergies.length * 0.35))] || 0;
  const quietThreshold = Math.max(lowEnergyFloor * 1.8, 0.0006);
  const musicThreshold = Math.max(lowEnergyFloor * 4.5, 0.0012);

  let quietRunStart = -1;
  let quietRunEnd = -1;

  for (let i = 0; i < energies.length; i++) {
    if (energies[i] <= quietThreshold) {
      if (quietRunStart === -1) {
        quietRunStart = i;
      }
      quietRunEnd = i;
      continue;
    }

    if (quietRunStart !== -1 && quietRunEnd - quietRunStart + 1 >= minQuietWindows) {
      break;
    }

    quietRunStart = -1;
    quietRunEnd = -1;
  }

  const hasClearQuietPrefix = quietRunStart !== -1 && quietRunEnd - quietRunStart + 1 >= minQuietWindows;

  if (!hasClearQuietPrefix) {
    return { detectedStartTime: 0, startTrim: 0, confidence: 'low' };
  }

  const startSearchIndex = quietRunEnd + 1;
  const candidateRun = findFirstSustainedRun(energies, startSearchIndex, musicThreshold, minSustainedWindows);

  if (!candidateRun) {
    return { detectedStartTime: 0, startTrim: 0, confidence: 'low' };
  }

  const detectedStartTime = Math.min(candidateRun.startIndex * stepSeconds, maxAnalysisSeconds);
  const startTrim = Math.max(0, detectedStartTime - safetyMarginSeconds);

  return {
    detectedStartTime,
    startTrim,
    confidence: 'high',
  };
}

export function analyzeAutoCleanStart(
  buffer: AudioBuffer,
  options: AnalyzeAutoCleanStartOptions = {}
): AutoCleanStartAnalysis {
  if (!buffer || !buffer.getChannelData || !buffer.sampleRate) {
    return { detectedStartTime: 0, startTrim: 0, confidence: 'low' };
  }

  return analyzeAutoCleanStartFromChannelData(buffer.getChannelData(0), buffer.sampleRate, options);
}

/**
 * Calculates audio segments to keep based on trim configuration
 */
export function calculateKeptIntervals(
  config: TrimConfig,
  totalDuration: number
): Array<{ start: number; end: number }> {
  const startTrim = Math.max(0, Math.min(config.startTrim, totalDuration));
  const endTrim = Math.max(startTrim, Math.min(config.endTrim, totalDuration));

  if (!config.enableMiddleCut) {
    return [{ start: startTrim, end: endTrim }];
  }

  const midStart = Math.max(startTrim, Math.min(config.middleStart, endTrim));
  const midEnd = Math.max(midStart, Math.min(config.middleEnd, endTrim));

  // If middle cut is negligible (< 0.1s) or outside bounds
  if (midEnd - midStart < 0.05) {
    return [{ start: startTrim, end: endTrim }];
  }

  const intervals: Array<{ start: number; end: number }> = [];
  if (midStart > startTrim) {
    intervals.push({ start: startTrim, end: midStart });
  }
  if (endTrim > midEnd) {
    intervals.push({ start: midEnd, end: endTrim });
  }

  return intervals.length > 0 ? intervals : [{ start: startTrim, end: endTrim }];
}

/**
 * Slices and stitches AudioBuffer based on kept intervals with anti-pop crossfading
 */
export function sliceAudioBuffer(
  sourceBuffer: AudioBuffer,
  config: TrimConfig
): AudioBuffer {
  const totalDuration = sourceBuffer.duration;
  const intervals = calculateKeptIntervals(config, totalDuration);
  const sampleRate = sourceBuffer.sampleRate;
  const channels = sourceBuffer.numberOfChannels;

  // Compute total sample count
  let totalOutputSamples = 0;
  const sampleIntervals = intervals.map((int) => {
    const s = Math.floor(int.start * sampleRate);
    const e = Math.floor(int.end * sampleRate);
    const len = Math.max(0, e - s);
    totalOutputSamples += len;
    return { startSample: s, endSample: e, length: len };
  });

  if (totalOutputSamples <= 0) {
    throw new Error('Trimmed audio length is zero. Please adjust your cut markers.');
  }

  const ctx = getAudioContext();
  const outputBuffer = ctx.createBuffer(channels, totalOutputSamples, sampleRate);

  // Micro fade length in samples (approx 3ms) to prevent boundary clicks
  const fadeLength = Math.min(150, Math.floor(sampleRate * 0.004));

  for (let ch = 0; ch < channels; ch++) {
    const sourceData = sourceBuffer.getChannelData(ch);
    const outputData = outputBuffer.getChannelData(ch);
    let outputOffset = 0;

    sampleIntervals.forEach((interval, idx) => {
      const { startSample, length } = interval;
      // Copy slice
      outputData.set(sourceData.subarray(startSample, startSample + length), outputOffset);

      // Micro fade-in at interval start
      const fadeStart = outputOffset;
      const actualFadeIn = Math.min(fadeLength, length);
      for (let f = 0; f < actualFadeIn; f++) {
        outputData[fadeStart + f] *= f / actualFadeIn;
      }

      // Micro fade-out at interval end
      const fadeEnd = outputOffset + length;
      const actualFadeOut = Math.min(fadeLength, length);
      for (let f = 0; f < actualFadeOut; f++) {
        outputData[fadeEnd - actualFadeOut + f] *= (actualFadeOut - f) / actualFadeOut;
      }

      outputOffset += length;
    });
  }

  return outputBuffer;
}

/**
 * Encodes an AudioBuffer into standard 16-bit PCM WAV Blob
 * Fully client-side, zero latency, offline compliant
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF identifier
  writeString(0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(8, 'WAVE');
  // format chunk identifier
  writeString(12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, channels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate
  view.setUint32(28, byteRate, true);
  // block align
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write interleaved PCM samples
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < channels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < channels; ch++) {
      let sample = channelData[ch][i];
      // Clamp [-1.0, 1.0]
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
