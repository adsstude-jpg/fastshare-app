import React, { useState } from 'react';
import { 
  Zap, 
  Wifi, 
  Globe2, 
  QrCode, 
  Edit3, 
  Check, 
  Sparkles
} from 'lucide-react';
import { ConnectionMode, ConnectionStatus, DeviceInfo } from '../types';
import { DeviceIcon } from './DeviceIcon';

interface HeaderProps {
  mode: ConnectionMode;
  onModeChange: (mode: ConnectionMode) => void;
  status: ConnectionStatus;
  statusMessage?: string;
  selfDevice: DeviceInfo;
  onUpdateDeviceName: (newName: string) => void;
  onOpenQR: () => void;
  connectedPeerName?: string;
  roomCode?: string;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  status,
  statusMessage,
  selfDevice,
  onUpdateDeviceName,
  onOpenQR,
  connectedPeerName,
  roomCode
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(selfDevice.name);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim()) {
      onUpdateDeviceName(editedName.trim());
      setIsEditingName(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
      case 'room_joined':
        return 'bg-emerald-500';
      case 'connecting':
      case 'scanning':
        return 'bg-amber-400 animate-ping';
      case 'room_created':
        return 'bg-purple-500';
      default:
        return 'bg-neutral-500';
    }
  };

  return (
    <header className="border-b border-neutral-800/80 bg-neutral-950/85 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-18 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Connection State */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 p-0.5 shadow-md shadow-purple-600/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-neutral-950 rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 fill-emerald-400" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-lg font-black tracking-tight text-white flex items-center">
                Fast<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">Share</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300">
                <Sparkles className="w-2.5 h-2.5" /> P2P
              </span>
            </div>

            {/* Subtitle / Status indicator */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor()}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusColor()}`} />
              </span>
              <span className="truncate max-w-[110px] sm:max-w-xs text-[10px] sm:text-[11px] font-medium text-neutral-300">
                {statusMessage || (connectedPeerName ? `متصل مع ${connectedPeerName}` : mode === 'local' ? 'شبكة الواي فاي' : roomCode ? `غرفة #${roomCode}` : 'اتصال عن بعد')}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Mode Switcher (Local Wi-Fi vs Remote Room) */}
        <div className="bg-neutral-900/90 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-neutral-800 flex items-center shrink-0">
          <button
            onClick={() => onModeChange('local')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all ${
              mode === 'local'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">واي فاي محلي</span>
            <span className="sm:hidden">واي فاي</span>
          </button>
          
          <button
            onClick={() => onModeChange('remote')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all ${
              mode === 'remote'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">غرفة برمز (عن بعد)</span>
            <span className="sm:hidden">غرفة رمز</span>
          </button>
        </div>

        {/* Right: Device Badge & QR code trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* QR Code Button */}
          <button
            onClick={onOpenQR}
            className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 border border-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all"
            title="مسح رمز QR بالهاتف"
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline text-xs font-medium">ربط بالهاتف</span>
          </button>

          {/* Self Device Info Card */}
          <div className="relative group">
            <div className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-neutral-900/90 border border-neutral-800 text-left">
              <DeviceIcon deviceType={selfDevice.deviceType} os={selfDevice.os} size="xs" />
              
              <div className="hidden sm:block min-w-0">
                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="bg-neutral-950 border border-purple-500 px-2 py-0.5 text-xs text-white rounded w-24 focus:outline-none"
                      autoFocus
                    />
                    <button type="submit" className="p-0.5 text-emerald-400 hover:text-emerald-300">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-neutral-100 truncate max-w-[90px]" title={selfDevice.name}>
                      {selfDevice.name}
                    </span>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-neutral-500 hover:text-purple-400 transition-colors"
                      title="تغيير اسم الجهاز"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                <div className="text-[9px] text-neutral-400 truncate">
                  هذا الجهاز ({selfDevice.os})
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
