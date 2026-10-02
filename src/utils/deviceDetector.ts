import { DeviceInfo, DeviceOS, DeviceType } from '../types';

export function getClientDeviceInfo(): DeviceInfo {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = typeof navigator !== 'undefined' ? (navigator as any).userAgentData?.platform || navigator.platform || '' : '';

  let deviceType: DeviceType = 'desktop';
  let os: DeviceOS = 'Other';
  let browser = 'Browser';

  // Detect Device Type
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
    (typeof window !== 'undefined' && window.innerWidth <= 768);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent) ||
    (typeof window !== 'undefined' && window.innerWidth > 768 && window.innerWidth <= 1024 && /Touch/i.test(userAgent));

  if (isTablet) {
    deviceType = 'tablet';
  } else if (isMobile) {
    deviceType = 'mobile';
  } else {
    deviceType = 'desktop';
  }

  // Detect OS
  if (/Macintosh|Mac OS X/i.test(userAgent) || /Mac/i.test(platform)) {
    os = 'macOS';
  } else if (/iPhone|iPod/i.test(userAgent)) {
    os = 'iOS';
  } else if (/iPad/i.test(userAgent)) {
    os = 'iOS';
  } else if (/Android/i.test(userAgent)) {
    os = 'Android';
  } else if (/Windows/i.test(userAgent) || /Win/i.test(platform)) {
    os = 'Windows';
  } else if (/Linux/i.test(userAgent) || /Linux/i.test(platform)) {
    os = 'Linux';
  }

  // Detect Browser
  if (/Edg/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/Chrome|CriOS/i.test(userAgent) && !/Edg/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(userAgent) && !/Chrome|CriOS/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/Firefox|FxiOS/i.test(userAgent)) {
    browser = 'Firefox';
  }

  // Generate a Friendly Name
  const defaultNames: Record<DeviceOS, string[]> = {
    macOS: ['MacBook Pro', 'MacBook Air', 'iMac Studio', 'Mac Mini'],
    iOS: ['iPhone 15 Pro', 'iPhone 14', 'iPad Pro', 'iPhone 13 mini'],
    Android: ['Galaxy S24 Ultra', 'Pixel 8 Pro', 'OnePlus 12', 'Galaxy Tab S9'],
    Windows: ['Windows PC', 'Surface Laptop', 'Dell XPS', 'ThinkPad X1'],
    Linux: ['Linux Workstation', 'Ubuntu Dev PC', 'Arch Machine'],
    Other: ['FastShare Device', 'Connected Client']
  };

  const pool = defaultNames[os] || defaultNames.Other;
  // Use persistent storage or pick a predictable name with random index stored in localStorage
  let savedName = '';
  let savedId = '';
  let savedColor = '';

  if (typeof localStorage !== 'undefined') {
    savedName = localStorage.getItem('fastshare_device_name') || '';
    savedId = localStorage.getItem('fastshare_device_id') || '';
    savedColor = localStorage.getItem('fastshare_device_color') || '';
  }

  if (!savedId) {
    savedId = 'dev_' + Math.random().toString(36).substring(2, 10);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fastshare_device_id', savedId);
    }
  }

  if (!savedName) {
    const picked = pool[Math.floor(Math.random() * pool.length)];
    savedName = picked;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fastshare_device_name', savedName);
    }
  }

  const vibrantColors = [
    '#8b5cf6', // Violet
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#6366f1', // Indigo
  ];

  if (!savedColor) {
    savedColor = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fastshare_device_color', savedColor);
    }
  }

  return {
    id: savedId,
    name: savedName,
    deviceType,
    os,
    browser,
    avatarColor: savedColor,
    isSelf: true,
    joinedAt: Date.now()
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
