import React, { useRef, useEffect, useState, useCallback } from 'react';
import { formatDuration } from '../services/metadata';
import { TrimConfig } from '../services/audioCleaner';

interface WaveformTimelineProps {
  peaks: number[];
  totalDuration: number;
  config: TrimConfig;
  onChangeConfig: (newConfig: TrimConfig) => void;
  previewTime?: number;
  isPreviewing?: boolean;
  onSeekPreview?: (time: number) => void;
  height?: number;
}

export const WaveformTimeline: React.FC<WaveformTimelineProps> = ({
  peaks,
  totalDuration,
  config,
  onChangeConfig,
  previewTime = 0,
  isPreviewing = false,
  onSeekPreview,
  height = 110,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dragging state
  type DragTarget = 'start' | 'end' | 'middleStart' | 'middleEnd' | 'none';
  const [activeDrag, setActiveDrag] = useState<DragTarget>('none');
  const [dragTooltip, setDragTooltip] = useState<{ time: number; x: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(360);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
  );

  // Observe theme changes on <html> to re-render canvas colors
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Time to pixel / pixel to time conversions
  const timeToPx = useCallback(
    (time: number) => {
      if (totalDuration <= 0) return 0;
      return (Math.max(0, Math.min(time, totalDuration)) / totalDuration) * containerWidth;
    },
    [totalDuration, containerWidth]
  );

  const pxToTime = useCallback(
    (px: number) => {
      if (containerWidth <= 0) return 0;
      const ratio = Math.max(0, Math.min(px / containerWidth, 1));
      return ratio * totalDuration;
    },
    [containerWidth, totalDuration]
  );

  // Render Canvas Waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, containerWidth, height);

    if (peaks.length === 0) {
      // Fallback empty background
      ctx.fillStyle = isDarkMode ? '#0f172a' : '#f1f5f9';
      ctx.fillRect(0, 0, containerWidth, height);
      return;
    }

    const startPx = timeToPx(config.startTrim);
    const endPx = timeToPx(config.endTrim);
    const midStartPx = config.enableMiddleCut ? timeToPx(config.middleStart) : -1;
    const midEndPx = config.enableMiddleCut ? timeToPx(config.middleEnd) : -1;

    // Draw background shaded zones for trimmed audio
    // Left removed region
    if (startPx > 0) {
      ctx.fillStyle = isDarkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(0, 0, startPx, height);
    }
    // Right removed region
    if (endPx < containerWidth) {
      ctx.fillStyle = isDarkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(endPx, 0, containerWidth - endPx, height);
    }
    // Middle cut region
    if (config.enableMiddleCut && midStartPx >= 0 && midEndPx > midStartPx) {
      ctx.fillStyle = isDarkMode ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.22)';
      ctx.fillRect(midStartPx, 0, midEndPx - midStartPx, height);
    }

    // Draw center line
    const centerY = height / 2;
    ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(containerWidth, centerY);
    ctx.stroke();

    // Draw soundwave bars
    const numBars = peaks.length;
    const barSpacing = containerWidth / numBars;
    const barWidth = Math.max(1.8, barSpacing * 0.68);
    const maxBarHeight = height * 0.85;

    for (let i = 0; i < numBars; i++) {
      const x = i * barSpacing + (barSpacing - barWidth) / 2;
      const bucketTime = (i / numBars) * totalDuration;

      // Check if kept or removed
      let isKept = bucketTime >= config.startTrim && bucketTime <= config.endTrim;
      if (config.enableMiddleCut && isKept) {
        if (bucketTime >= config.middleStart && bucketTime <= config.middleEnd) {
          isKept = false;
        }
      }

      const peakVal = Math.max(0.06, peaks[i] || 0.06);
      const barH = peakVal * maxBarHeight;
      const topY = centerY - barH / 2;

      // Color gradients
      if (isKept) {
        const grad = ctx.createLinearGradient(0, topY, 0, topY + barH);
        if (isDarkMode) {
          grad.addColorStop(0, '#34d399');
          grad.addColorStop(0.5, '#10b981');
          grad.addColorStop(1, '#059669');
        } else {
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(0.5, '#059669');
          grad.addColorStop(1, '#047857');
        }
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = isDarkMode ? 'rgba(244, 63, 94, 0.32)' : 'rgba(225, 29, 72, 0.35)';
      }

      // Draw rounded rectangle for bar
      const radius = Math.min(barWidth / 2, 2.5);
      ctx.beginPath();
      ctx.roundRect(x, topY, barWidth, barH, [radius, radius, radius, radius]);
      ctx.fill();
    }

    // Draw active playback needle if previewing
    if (isPreviewing && previewTime >= 0) {
      const playheadX = timeToPx(previewTime);
      ctx.strokeStyle = isDarkMode ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }
  }, [
    peaks,
    totalDuration,
    config,
    containerWidth,
    height,
    timeToPx,
    isPreviewing,
    previewTime,
    isDarkMode,
  ]);

  // Drag interaction handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickTime = pxToTime(clickX);

    // Hit-test handles within 18px radius
    const startPx = timeToPx(config.startTrim);
    const endPx = timeToPx(config.endTrim);
    const midStartPx = config.enableMiddleCut ? timeToPx(config.middleStart) : -999;
    const midEndPx = config.enableMiddleCut ? timeToPx(config.middleEnd) : -999;

    const hitDist = 20;

    let target: DragTarget = 'none';
    if (Math.abs(clickX - startPx) <= hitDist) {
      target = 'start';
    } else if (Math.abs(clickX - endPx) <= hitDist) {
      target = 'end';
    } else if (config.enableMiddleCut && Math.abs(clickX - midStartPx) <= hitDist) {
      target = 'middleStart';
    } else if (config.enableMiddleCut && Math.abs(clickX - midEndPx) <= hitDist) {
      target = 'middleEnd';
    } else {
      // Seek preview if clicked inside
      if (onSeekPreview) {
        onSeekPreview(clickTime);
      }
      return;
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveDrag(target);
    setDragTooltip({ time: clickTime, x: clickX });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDrag === 'none' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, containerWidth));
    const newTime = Math.round(pxToTime(currentX) * 10) / 10; // 0.1s precision

    setDragTooltip({ time: newTime, x: currentX });

    if (activeDrag === 'start') {
      const maxAllowed = config.endTrim - 0.5;
      const validTime = Math.max(0, Math.min(newTime, maxAllowed));
      onChangeConfig({ ...config, startTrim: validTime });
    } else if (activeDrag === 'end') {
      const minAllowed = config.startTrim + 0.5;
      const validTime = Math.max(minAllowed, Math.min(newTime, totalDuration));
      onChangeConfig({ ...config, endTrim: validTime });
    } else if (activeDrag === 'middleStart') {
      const minAllowed = config.startTrim;
      const maxAllowed = config.middleEnd - 0.2;
      const validTime = Math.max(minAllowed, Math.min(newTime, maxAllowed));
      onChangeConfig({ ...config, middleStart: validTime });
    } else if (activeDrag === 'middleEnd') {
      const minAllowed = config.middleStart + 0.2;
      const maxAllowed = config.endTrim;
      const validTime = Math.max(minAllowed, Math.min(newTime, maxAllowed));
      onChangeConfig({ ...config, middleEnd: validTime });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDrag !== 'none') {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
      setActiveDrag('none');
      setDragTooltip(null);
    }
  };

  const startPx = timeToPx(config.startTrim);
  const endPx = timeToPx(config.endTrim);
  const midStartPx = config.enableMiddleCut ? timeToPx(config.middleStart) : -1;
  const midEndPx = config.enableMiddleCut ? timeToPx(config.middleEnd) : -1;

  return (
    <div className="space-y-2 select-none">
      {/* Waveform Canvas & Handle Surface */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full rounded-2xl bg-slate-100 dark:bg-[#090d16] border border-slate-200 dark:border-white/[0.08] shadow-inner overflow-hidden cursor-crosshair touch-none"
        style={{ height: `${height}px` }}
      >
        {/* Canvas renderer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Start Trim Handle Pill */}
        <div
          className="absolute top-0 bottom-0 w-3 -ml-1.5 flex flex-col items-center justify-center cursor-ew-resize z-20 group"
          style={{ left: `${startPx}px` }}
          title={`Start Trim: ${formatDuration(config.startTrim)}`}
        >
          {/* Vertical line */}
          <div className="w-[3px] h-full bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-transform group-hover:scale-110" />
          {/* Grab chip */}
          <div className="absolute top-1/2 -translate-y-1/2 w-6 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-white/20 active:scale-95 transition-transform">
            <span>[</span>
          </div>
        </div>

        {/* End Trim Handle Pill */}
        <div
          className="absolute top-0 bottom-0 w-3 -ml-1.5 flex flex-col items-center justify-center cursor-ew-resize z-20 group"
          style={{ left: `${endPx}px` }}
          title={`End Trim: ${formatDuration(config.endTrim)}`}
        >
          {/* Vertical line */}
          <div className="w-[3px] h-full bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-transform group-hover:scale-110" />
          {/* Grab chip */}
          <div className="absolute top-1/2 -translate-y-1/2 w-6 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-white/20 active:scale-95 transition-transform">
            <span>]</span>
          </div>
        </div>

        {/* Middle Cut Handles (if enabled) */}
        {config.enableMiddleCut && midStartPx >= 0 && (
          <>
            <div
              className="absolute top-0 bottom-0 w-2.5 -ml-1 flex flex-col items-center justify-center cursor-ew-resize z-20"
              style={{ left: `${midStartPx}px` }}
              title={`Middle Cut Start: ${formatDuration(config.middleStart)}`}
            >
              <div className="w-[2px] h-full bg-rose-500 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
              <div className="absolute top-2 w-4 h-5 rounded bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow">
                ✂
              </div>
            </div>

            <div
              className="absolute top-0 bottom-0 w-2.5 -ml-1 flex flex-col items-center justify-center cursor-ew-resize z-20"
              style={{ left: `${midEndPx}px` }}
              title={`Middle Cut End: ${formatDuration(config.middleEnd)}`}
            >
              <div className="w-[2px] h-full bg-rose-500 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
              <div className="absolute bottom-2 w-4 h-5 rounded bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow">
                ✂
              </div>
            </div>
          </>
        )}

        {/* Active Drag Floating Tooltip */}
        {dragTooltip && (
          <div
            className="absolute -top-7 transform -translate-x-1/2 z-30 pointer-events-none px-2 py-0.5 rounded-md bg-white dark:bg-slate-950 border border-emerald-500/40 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-300 shadow-xl"
            style={{ left: `${dragTooltip.x}px` }}
          >
            {formatDuration(dragTooltip.time)}
          </div>
        )}
      </div>

      {/* Axis markers */}
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-slate-500 px-1">
        <span>0:00</span>
        <span className="text-slate-500 dark:text-slate-400">Drag handles `[` and `]` to trim</span>
        <span>{formatDuration(totalDuration)}</span>
      </div>
    </div>
  );
};
