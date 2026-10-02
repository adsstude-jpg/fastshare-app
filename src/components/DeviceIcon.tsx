import React from 'react';
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Apple, 
  Cpu
} from 'lucide-react';
import { DeviceOS, DeviceType } from '../types';

interface DeviceIconProps {
  deviceType: DeviceType;
  os?: DeviceOS;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  badge?: boolean;
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({
  deviceType,
  os,
  size = 'md',
  className = '',
  badge = true
}) => {
  const sizeMap = {
    xs: { box: 'w-7 h-7 rounded-xl', icon: 'w-3.5 h-3.5', badge: 'w-2.5 h-2.5 text-[8px]' },
    sm: { box: 'w-8 h-8 rounded-2xl', icon: 'w-4 h-4', badge: 'w-3 h-3 text-[9px]' },
    md: { box: 'w-11 h-11 rounded-2xl', icon: 'w-5 h-5', badge: 'w-3.5 h-3.5 text-[10px]' },
    lg: { box: 'w-14 h-14 rounded-2xl', icon: 'w-7 h-7', badge: 'w-4 h-4 text-xs' },
    xl: { box: 'w-20 h-20 rounded-3xl', icon: 'w-10 h-10', badge: 'w-5 h-5 text-sm' },
  };

  const getPrimaryIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className={sizeMap[size].icon} />;
      case 'tablet':
        return <Tablet className={sizeMap[size].icon} />;
      case 'desktop':
      default:
        return os === 'macOS' ? (
          <Laptop className={sizeMap[size].icon} />
        ) : (
          <Monitor className={sizeMap[size].icon} />
        );
    }
  };

  const getOSBadge = () => {
    if (!os || os === 'Other') return null;
    switch (os) {
      case 'macOS':
      case 'iOS':
        return <Apple className="w-2.5 h-2.5" />;
      case 'Windows':
        return <span className="font-bold text-[9px] leading-none">Win</span>;
      case 'Android':
        return <span className="font-bold text-[9px] leading-none">And</span>;
      case 'Linux':
        return <Cpu className="w-2.5 h-2.5" />;
      default:
        return null;
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-200 transition-transform ${sizeMap[size].box} ${className}`}>
      {getPrimaryIcon()}
      {badge && os && (
        <span 
          title={os}
          className={`absolute -bottom-1 -right-1 bg-purple-950/90 border border-purple-500/40 text-purple-300 rounded-full flex items-center justify-center p-0.5 shadow-sm`}
        >
          {getOSBadge()}
        </span>
      )}
    </div>
  );
};
