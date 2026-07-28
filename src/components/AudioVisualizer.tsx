import React, { useEffect, useRef } from 'react';
import { globalAudioEngine } from '../lib/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  compact?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, compact = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (isPlaying) {
        const freqData = globalAudioEngine.getAnalyserData();
        const barCount = compact ? 12 : 28;
        const barWidth = width / barCount - 2;

        for (let i = 0; i < barCount; i++) {
          const val = freqData[i] || Math.sin(Date.now() / 100 + i) * 30 + 30;
          const percent = Math.min(1, val / 255);
          const barHeight = Math.max(3, percent * (height - 4));
          const x = i * (barWidth + 2);
          const y = height - barHeight;

          // Pure crisp white or subtle monochrome gray
          ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#a1a1aa';
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      } else {
        // Idle subtle waveform line
        const barCount = compact ? 12 : 28;
        const barWidth = width / barCount - 2;
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + 2);
          const barHeight = 2;
          const y = height / 2 - 1;
          ctx.fillStyle = '#3f3f46';
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, compact]);

  return (
    <canvas
      ref={canvasRef}
      width={compact ? 120 : 280}
      height={compact ? 24 : 48}
      className={`rounded bg-zinc-950/80 border border-zinc-800/80 ${compact ? 'h-6' : 'h-12'}`}
    />
  );
};
