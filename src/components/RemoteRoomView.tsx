import React, { useState, useRef } from 'react';
import { 
  KeyRound, 
  Copy, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  QrCode, 
  Users, 
  PlusCircle,
  LogIn
} from 'lucide-react';
import { DeviceInfo } from '../types';
import { DeviceIcon } from './DeviceIcon';

interface RemoteRoomViewProps {
  selfDevice: DeviceInfo;
  roomCode: string | null;
  roomMembers: DeviceInfo[];
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onEnterChat: () => void;
  onOpenQR: () => void;
  errorMessage?: string;
  isJoining: boolean;
}

export const RemoteRoomView: React.FC<RemoteRoomViewProps> = ({
  selfDevice,
  roomCode,
  roomMembers,
  onCreateRoom,
  onJoinRoom,
  onEnterChat,
  onOpenQR,
  errorMessage,
  isJoining
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Format code for display: 3 digits - 3 digits
  const formattedCode = roomCode 
    ? `${roomCode.slice(0, 3)} - ${roomCode.slice(3, 6)}` 
    : '';

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean && val !== '') return;

    const newDigits = [...digits];
    
    // Handle paste of whole code
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = chars[i] || '';
      }
      setDigits(newDigits);
      const nextFocus = Math.min(clean.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = clean.slice(-1);
    setDigits(newDigits);

    // Auto advance focus
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length === 6) {
      onJoinRoom(fullCode);
    }
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If user is already in a room with a code
  if (roomCode) {
    const otherMembers = roomMembers.filter(m => m.id !== selfDevice.id);

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-2xl mx-auto w-full text-center">
        <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4 sm:mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>الغرفة نشطة ومحمية</span>
          </div>

          <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">
            غرفة المشاركة الخاصة
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto mb-6">
            شارك هذا الرمز المكون من 6 أرقام مع الهاتف أو الكمبيوتر الآخر للاتصال فوراً عبر أي شبكة إنترنت.
          </p>

          {/* Large Room Code Display */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 sm:mb-8">
            <div className="px-5 py-3 sm:px-6 sm:py-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center gap-3 sm:gap-4">
              <span className="text-2xl sm:text-4xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-300">
                {formattedCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 sm:p-2.5 rounded-xl bg-neutral-900 hover:bg-purple-900/40 active:scale-95 text-neutral-300 hover:text-purple-300 border border-neutral-800 transition-colors"
                title="نسخ الرمز"
              >
                {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

            <button
              onClick={onOpenQR}
              className="px-4 py-3 sm:py-4 rounded-2xl bg-purple-600/10 hover:bg-purple-600/20 active:scale-95 border border-purple-500/30 text-purple-300 flex items-center gap-2 text-xs font-semibold transition-all"
            >
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>عرض رمز QR للهاتف</span>
            </button>
          </div>

          {/* Room Members Section */}
          <div className="pt-5 border-t border-neutral-800/80 mb-6">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-400 mb-3 sm:mb-4">
              <Users className="w-4 h-4 text-purple-400" />
              <span>الأجهزة المتصلة ({roomMembers.length})</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {roomMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-neutral-950 border border-neutral-800 text-right"
                >
                  <DeviceIcon deviceType={member.deviceType} os={member.os} size="sm" />
                  <div className="text-right">
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>{member.name}</span>
                      {member.id === selfDevice.id && (
                        <span className="text-[10px] text-purple-400 font-normal">(أنت)</span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {member.deviceType === 'mobile' ? 'هاتف ذكي' : 'كمبيوتر'} • {member.os}
                    </div>
                  </div>
                </div>
              ))}

              {otherMembers.length === 0 && (
                <div className="text-xs text-neutral-400 italic py-1">
                  في انتظار إدخال الرمز #{roomCode} على الجهاز الآخر...
                </div>
              )}
            </div>
          </div>

          {/* Action to enter chat */}
          <div className="flex justify-center">
            <button
              onClick={onEnterChat}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>فتح الشات ومشاركة الملفات</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not in room: Show Create or Join
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight mb-1.5">
          الاتصال عبر أي شبكة إنترنت
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
          أنشئ غرفة برمز سري مكون من 6 أرقام للمشاركة بين الهواتف وأجهزة الكمبيوتر حتى لو كانت الشبكات مختلفة.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Create Room */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 sm:p-7 flex flex-col justify-between backdrop-blur-md relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <KeyRound className="w-32 h-32 text-purple-400" />
          </div>

          <div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3 sm:mb-4">
              <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-1">
              إنشاء غرفة جديدة
            </h3>
            <p className="text-xs text-neutral-400 mb-4 sm:mb-6">
              توليد رمز تلقائي مكون من 6 أرقام ورمز QR للمشاركة الفورية.
            </p>

            <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 flex items-center gap-2.5 mb-4 sm:mb-6 text-right">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-neutral-300">
                اتصال مباشر آمن ومشفر بين الطرفين
              </span>
            </div>
          </div>

          <button
            onClick={onCreateRoom}
            className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>إنشاء غرفة (6 أرقام)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: Join with Code */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 sm:p-7 flex flex-col justify-between backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <LogIn className="w-32 h-32 text-emerald-400" />
          </div>

          <div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 sm:mb-4">
              <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-1">
              الانضمام برمز موجود
            </h3>
            <p className="text-xs text-neutral-400 mb-4 sm:mb-6">
              أدخل الرمز المكون من 6 أرقام المعروض على جهازك الآخر.
            </p>

            {/* 6 Digit Inputs */}
            <form onSubmit={handleJoinSubmit} id="join-form">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-4">
                {digits.map((digit, idx) => (
                  <React.Fragment key={idx}>
                    {idx === 3 && (
                      <span className="text-neutral-500 font-bold px-0.5">-</span>
                    )}
                    <input
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={idx === 0 ? 6 : 1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className="w-9 sm:w-12 h-11 sm:h-14 rounded-xl sm:rounded-2xl bg-neutral-950 border border-neutral-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-center font-mono text-base sm:text-xl font-black text-white focus:outline-none transition-all"
                    />
                  </React.Fragment>
                ))}
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs text-center mb-4">
                  {errorMessage}
                </div>
              )}
            </form>
          </div>

          <button
            type="submit"
            form="join-form"
            disabled={digits.join('').length !== 6 || isJoining}
            className={`w-full py-3 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              digits.join('').length === 6 && !isJoining
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 active:scale-95'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <span>{isJoining ? 'جاري الانضمام...' : 'دخول الغرفة'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
