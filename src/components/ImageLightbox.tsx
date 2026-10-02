import React from 'react';
import { X, Download, ZoomIn, Copy, Check } from 'lucide-react';
import { downloadFile } from '../services/fileTransfer';
import { formatFileSize } from '../utils/deviceDetector';
import { FilePayload } from '../types';

interface ImageLightboxProps {
  file: FilePayload;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ file, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const handleDownload = () => {
    downloadFile(file.name, file.dataUrl, file.mimeType);
  };

  const handleCopy = async () => {
    try {
      const response = await fetch(file.dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copying image blob not supported on this browser:', e);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div 
        className="w-full max-w-5xl flex items-center justify-between pb-4 text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm truncate max-w-[200px] sm:max-w-md">{file.name}</span>
          <span className="text-xs text-neutral-400 font-mono">({formatFileSize(file.size)})</span>
        </div>

        <div className="flex items-center gap-2">
          {typeof ClipboardItem !== 'undefined' && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors"
              title="Copy Image to Clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Image</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Display */}
      <div 
        className="relative max-w-5xl max-h-[82vh] flex items-center justify-center overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={file.dataUrl}
          alt={file.name}
          className="max-h-[80vh] w-auto object-contain select-none transition-transform duration-200"
        />
      </div>

      <p className="mt-3 text-xs text-neutral-500 text-center">
        Tip: Tap 'Download Image' to save directly to your camera roll or downloads folder.
      </p>
    </div>
  );
};
