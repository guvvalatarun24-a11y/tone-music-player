import React, { useRef, useState } from 'react';
import { Plus, FolderPlus, Sparkles, Upload, Loader2, Music, X, Info } from 'lucide-react';

interface AddSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFiles: (files: FileList | File[]) => Promise<{ added: number; skipped: number }>;
  onLoadSamples: () => Promise<void>;
  isProcessing: boolean;
}

export const AddSongsModal: React.FC<AddSongsModalProps> = ({
  isOpen,
  onClose,
  onAddFiles,
  onLoadSamples,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  React.useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, []);

  if (!isOpen) return null;

  const handleFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await onAddFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
      onClose();
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await onAddFiles(e.dataTransfer.files);
      onClose();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden">
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          id="audio-files-input"
          type="file"
          multiple
          accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/flac,audio/ogg,.mpeg,.mp3,.wav,.m4a,.aac,.flac,.ogg,audio/*"
          className="hidden"
          onChange={handleFilesChosen}
        />
        <input
          ref={folderInputRef}
          id="audio-folder-input"
          type="file"
          multiple
          accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/flac,audio/ogg,.mpeg,.mp3,.wav,.m4a,.aac,.flac,.ogg,audio/*"
          className="hidden"
          onChange={handleFilesChosen}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Add Songs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Local device audio storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-5 p-7 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700/80 hover:border-emerald-500 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/30'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            {isProcessing ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Tap to open Device File Picker
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            or drag & drop audio files here
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-[10px] font-mono text-slate-600 dark:text-slate-500">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">MP3</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">MPEG</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">WAV</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">M4A</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">AAC</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">FLAC</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">OGG</span>
          </div>
        </div>

        {/* Secondary Options */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            id="choose-folder-btn"
            onClick={() => folderInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-200 transition active:scale-98"
          >
            <FolderPlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>Select Folder</span>
          </button>

          <button
            id="load-sample-tracks-btn"
            onClick={async () => {
              await onLoadSamples();
              onClose();
            }}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Add Demo Tracks</span>
          </button>
        </div>

        {/* Privacy & Storage reminder */}
        <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
          <p>
            Songs are stored securely in your browser's IndexedDB and never uploaded to any remote server.
          </p>
        </div>
      </div>
    </div>
  );
};
