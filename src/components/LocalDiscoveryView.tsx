import React from 'react';
import { 
  Wifi, 
  RefreshCw, 
  Smartphone, 
  Laptop, 
  ArrowRight, 
  Radio, 
  ShieldCheck, 
  QrCode, 
  Globe2,
  Share2
} from 'lucide-react';
import { DeviceInfo } from '../types';
import { DeviceIcon } from './DeviceIcon';

interface LocalDiscoveryViewProps {
  selfDevice: DeviceInfo;
  discoveredPeers: DeviceInfo[];
  onConnectToPeer: (peer: DeviceInfo) => void;
  onRefreshScan: () => void;
  isScanning: boolean;
  onOpenQR: () => void;
  onSwitchToRemote: () => void;
}

export const LocalDiscoveryView: React.FC<LocalDiscoveryViewProps> = ({
  selfDevice,
  discoveredPeers,
  onConnectToPeer,
  onRefreshScan,
  isScanning,
  onOpenQR,
  onSwitchToRemote
}) => {
  // Only real devices connected on the network!
  const activePeers = discoveredPeers;

  // Calculate radar positions for real peers
  const getPositionStyles = (index: number, total: number) => {
    if (total === 1) {
      return { top: '22%', left: '72%' };
    }
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radiusX = 36;
    const radiusY = 32;
    const x = 50 + radiusX * Math.cos(angle);
    const y = 50 + radiusY * Math.sin(angle);
    return { top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' };
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-3 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Top Banner / Network Status Cue */}
      <div className="w-full flex items-center justify-between gap-3 bg-neutral-900/70 border border-neutral-800/80 rounded-2xl p-3 sm:p-4 backdrop-blur-md mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                شبكة الواي فاي المحلية (Wi-Fi)
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                اتصال مباشر
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-400 truncate">
              {activePeers.length > 0 
                ? `تم اكتشاف ${activePeers.length} جهاز على نفس الشبكة` 
                : 'جاري البحث عن أجهزة أخرى على نفس شبكة الواي فاي...'}
            </p>
          </div>
        </div>

        {/* Scan Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onRefreshScan}
            disabled={isScanning}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white border border-neutral-700/60 flex items-center gap-1.5 text-xs font-medium transition-all"
            title="تحديث البحث"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-purple-400' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </button>
        </div>
      </div>

      {/* Interactive Radar Scanning Visualizer */}
      <div className="relative w-full max-w-[340px] sm:max-w-md aspect-square my-auto flex items-center justify-center select-none py-2">
        {/* Concentric Radar Rings */}
        <div className="absolute inset-0 rounded-full border border-purple-500/10" />
        <div className="absolute inset-[15%] rounded-full border border-purple-500/15" />
        <div className="absolute inset-[30%] rounded-full border border-purple-500/20" />
        <div className="absolute inset-[45%] rounded-full border border-purple-500/30" />

        {/* Crosshair grid lines */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-px bg-purple-500/10" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-full w-px bg-purple-500/10" />
        </div>

        {/* Sweeping Radar Beam */}
        <div className="absolute inset-0 rounded-full radar-sweep pointer-events-none opacity-40" />

        {/* Center: SELF DEVICE */}
        <div className="relative z-10 flex flex-col items-center group">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring */}
            <div className="absolute -inset-3 sm:-inset-4 rounded-full bg-purple-600/20 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute -inset-2 rounded-full bg-purple-600/30 blur-sm pointer-events-none" />
            
            <div className="relative p-0.5 sm:p-1 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-xl shadow-purple-600/30">
              <div className="p-2 sm:p-3 bg-neutral-950 rounded-[18px] sm:rounded-[22px] flex items-center justify-center">
                <DeviceIcon 
                  deviceType={selfDevice.deviceType} 
                  os={selfDevice.os} 
                  size="md"
                  badge={false}
                />
              </div>
            </div>
          </div>

          <div className="mt-2 px-2.5 py-1 rounded-xl bg-neutral-900/90 border border-neutral-800 text-center shadow-md">
            <div className="text-[11px] sm:text-xs font-bold text-white flex items-center gap-1 justify-center">
              <span>{selfDevice.name}</span>
              <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 rounded-full">
                جهازك
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-neutral-400">
              {selfDevice.deviceType === 'mobile' ? 'هاتف ذكي' : 'كمبيوتر'} • {selfDevice.os}
            </div>
          </div>
        </div>

        {/* Real Discovered Peer Devices along the perimeter */}
        {activePeers.map((peer, idx) => {
          const style = getPositionStyles(idx, activePeers.length);

          return (
            <div
              key={peer.id}
              style={style}
              className="absolute z-20 transition-all duration-500"
            >
              <div 
                onClick={() => onConnectToPeer(peer)}
                className="group cursor-pointer flex flex-col items-center transition-transform hover:scale-105 active:scale-95"
              >
                {/* Device Icon Avatar with Glow */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute -inset-2 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/40 blur-md transition-all" />
                  
                  <div className="relative p-0.5 rounded-2xl bg-neutral-800 group-hover:bg-gradient-to-tr group-hover:from-emerald-500 group-hover:to-teal-400 transition-all shadow-lg">
                    <div className="p-1.5 sm:p-2 bg-neutral-900 rounded-[14px]">
                      <DeviceIcon 
                        deviceType={peer.deviceType} 
                        os={peer.os} 
                        size="md" 
                        badge={true}
                      />
                    </div>
                  </div>

                  {/* Pulsing indicator */}
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-neutral-950 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                </div>

                {/* Device Info Card */}
                <div className="mt-1.5 px-2.5 py-1 rounded-xl bg-neutral-900/95 border border-neutral-800 group-hover:border-emerald-500/50 text-center shadow-xl transition-all max-w-[130px]">
                  <div className="text-[11px] sm:text-xs font-bold text-neutral-100 truncate group-hover:text-emerald-300">
                    {peer.name}
                  </div>
                  <div className="text-[9px] text-neutral-400">
                    {peer.deviceType === 'mobile' ? 'هاتف' : 'كمبيوتر'}
                  </div>
                  
                  <div className="mt-1 pt-0.5 border-t border-neutral-800/80 flex items-center justify-center gap-1 text-[10px] font-semibold text-emerald-400">
                    <span>اتصال</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state when 0 peers found */}
        {activePeers.length === 0 && (
          <div className="absolute bottom-1 sm:bottom-4 z-20 px-3 py-2 rounded-2xl bg-neutral-900/95 border border-neutral-800 text-center max-w-xs shadow-xl backdrop-blur-md">
            <p className="text-xs text-neutral-300 font-semibold">
              جاري البحث عن الأجهزة على شبكتك...
            </p>
            <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-1">
              افتح FastShare على هاتفك أو جهاز الكمبيوتر للاتصال فوراً.
            </p>
          </div>
        )}
      </div>

      {/* Quick Action Connect Cards - Mobile Optimized */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 sm:mt-6">
        {/* Card 1: Scan with phone */}
        <div 
          onClick={onOpenQR}
          className="p-3.5 sm:p-4 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900/90 active:scale-[0.99] border border-neutral-800/80 hover:border-purple-500/40 cursor-pointer flex items-center justify-between gap-3 transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">امسح رمز QR بالهاتف</h4>
              <p className="text-[11px] text-neutral-400 truncate">
                افتح الكاميرا على هاتفك للربط الفوري
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-purple-400 shrink-0" />
        </div>

        {/* Card 2: Remote Room Code */}
        <div 
          onClick={onSwitchToRemote}
          className="p-3.5 sm:p-4 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900/90 active:scale-[0.99] border border-neutral-800/80 hover:border-emerald-500/40 cursor-pointer flex items-center justify-between gap-3 transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Globe2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">غرفة برمز 6 أرقام</h4>
              <p className="text-[11px] text-neutral-400 truncate">
                للاتصال عبر شبكات مختلفة أو بيانات الهاتف
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>
      </div>
    </div>
  );
};
