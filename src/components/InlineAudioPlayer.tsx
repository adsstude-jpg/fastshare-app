import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { formatDuration, formatFileSize } from '../utils/deviceDetector';
import { downloadFile } from '../services/fileTransfer';
import { FilePayload } from '../types';

interface InlineAudioPlayerProps {
  file: FilePayload;
  senderName?: string;
  isSelf?: boolean;
}

export const InlineAudioPlayer: React.FC<InlineAudioPlayerProps> = ({
  file,
  isSelf = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(file.duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate waveform bars fallback if not present
  const waveform = file.waveform && file.waveform.length > 0 
    ? file.waveform 
    : [0.3, 0.5, 0.8, 0.4, 0.6, 0.9, 0.7, 0.3, 0.5, 0.8, 0.6, 0.4, 0.7, 0.9, 0.5, 0.3, 0.6, 0.8, 0.4, 0.7, 0.5, 0.3];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleDownload = () => {
    downloadFile(file.name, file.dataUrl, file.mimeType);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`p-3.5 rounded-2xl border transition-all ${
      isSelf 
        ? 'bg-purple-950/40 border-purple-800/40 text-purple-100' 
        : 'bg-neutral-900/90 border-neutral-800 text-neutral-100'
    } max-w-sm sm:max-w-md w-full shadow-lg`}>
      <audio ref={audioRef} src={file.dataUrl} preload="metadata" playsInline />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold truncate text-neutral-200">
            {file.name}
          </span>
        </div>
        <span className="text-[11px] font-mono text-neutral-400 shrink-0">
          {formatFileSize(file.size)}
        </span>
      </div>

      {/* Player Main Controls & Interactive Waveform */}
      <div className="flex items-center gap-3">
        {/* Play / Pause button */}
        <button
          onClick={togglePlay}
          className="w-11 h-11 shrink-0 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-md shadow-purple-600/30"
          title={isPlaying ? 'Pause' : 'Play audio'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform Scrubber */}
        <div 
          onClick={handleSeek}
          className="flex-1 cursor-pointer py-2 group flex items-center gap-[3px] h-10 select-none relative"
          title="Click to seek"
        >
          {waveform.map((barHeight, idx) => {
            const barPercent = (idx / waveform.length) * 100;
            const isPlayed = barPercent <= progressPercent;

            return (
              <div
                key={idx}
                className="flex-1 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.max(15, barHeight * 100)}%`,
                  backgroundColor: isPlayed 
                    ? '#a855f7' 
                    : '#3f3f46',
                  opacity: isPlayed ? 1 : 0.6
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Footer Controls & Timestamps */}
      <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-800/60 text-[11px] text-neutral-400 font-mono">
        <div className="flex items-center gap-2">
          <span>{formatDuration(currentTime)} / {formatDuration(duration || 0)}</span>
          <button
            onClick={toggleSpeed}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-purple-900/40 text-neutral-300 hover:text-purple-300 border border-neutral-700/60 transition-all text-[11px]"
            title="Download Audio"
          >
            <Download className="w-3 h-3" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
