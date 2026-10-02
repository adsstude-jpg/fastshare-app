import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Smartphone, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  roomCode?: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ roomCode, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Generate target URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const targetUrl = roomCode 
    ? `${origin}?room=${roomCode}` 
    : origin;

  useEffect(() => {
    QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#090a0f',
        light: '#ffffff'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('Error generating QR code:', err);
    });
  }, [targetUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center mb-4">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          {roomCode ? `Join Room #${roomCode}` : 'Pair with Smartphone'}
        </h3>
        <p className="text-xs text-neutral-400 mb-5">
          Scan this QR code with your phone camera to open FastShare and connect instantly.
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-3 rounded-2xl mx-auto inline-block shadow-inner mb-5">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="FastShare Connection QR Code" className="w-56 h-56 rounded-xl" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-neutral-400 text-xs">
              Generating code...
            </div>
          )}
        </div>

        {/* URL and Copy */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-left mb-3">
          <div className="flex-1 min-w-0 px-2 font-mono text-xs text-neutral-300 truncate">
            {targetUrl}
          </div>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-purple-900/50 text-neutral-200 hover:text-purple-300 transition-colors shrink-0"
            title="Copy URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-[11px] text-neutral-500">
          Make sure both devices have internet or are on the same Wi-Fi network.
        </p>
      </div>
    </div>
  );
};
