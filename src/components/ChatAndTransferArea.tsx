import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Mic, 
  Download, 
  FileText, 
  CheckCheck, 
  ArrowLeft, 
  Maximize2, 
  Sparkles,
  Volume2,
  Trash2,
  AlertCircle,
  X,
  Share2
} from 'lucide-react';
import { ChatMessage, DeviceInfo, FilePayload, TransferProgress } from '../types';
import { DeviceIcon } from './DeviceIcon';
import { InlineAudioPlayer } from './InlineAudioPlayer';
import { downloadFile, processFile, VoiceRecorder } from '../services/fileTransfer';
import { formatFileSize } from '../utils/deviceDetector';

interface ChatAndTransferAreaProps {
  selfDevice: DeviceInfo;
  targetPeer?: DeviceInfo;
  roomCode?: string;
  roomMembers?: DeviceInfo[];
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendFile: (payload: FilePayload) => void;
  onBack: () => void;
  activeTransfer?: TransferProgress | null;
  onOpenLightbox: (file: FilePayload) => void;
}

export const ChatAndTransferArea: React.FC<ChatAndTransferAreaProps> = ({
  selfDevice,
  targetPeer,
  roomCode,
  roomMembers = [],
  messages,
  onSendMessage,
  onSendFile,
  onBack,
  activeTransfer,
  onOpenLightbox
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const voiceRecorderRef = useRef<VoiceRecorder>(new VoiceRecorder());
  const recordIntervalRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const payload = await processFile(file);
        onSendFile(payload);
      } catch (err) {
        console.error('Error processing file:', err);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      try {
        const payload = await processFile(files[i]);
        onSendFile(payload);
      } catch (err) {
        console.error('Drop file processing error:', err);
      }
    }
  };

  // Voice Note Recording with mobile-safe handling
  const handleToggleVoiceRecord = async () => {
    setMicError(null);

    if (isRecording) {
      // Stop and send
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      setIsRecording(false);
      try {
        const audioPayload = await voiceRecorderRef.current.stop();
        if (audioPayload) {
          onSendFile(audioPayload);
        }
      } catch (err) {
        console.error('Failed to stop recording:', err);
      }
      setRecordDuration(0);
    } else {
      // Start recording
      const result = await voiceRecorderRef.current.start();
      if (result.success) {
        setIsRecording(true);
        setRecordDuration(0);
        recordIntervalRef.current = setInterval(() => {
          setRecordDuration(prev => prev + 1);
        }, 1000);
      } else {
        setMicError(result.error || 'تعذر تشغيل الميكروفون على هذا الجهاز');
        setTimeout(() => setMicError(null), 5000);
      }
    }
  };

  const handleCancelVoiceRecord = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    voiceRecorderRef.current.cancel();
    setIsRecording(false);
    setRecordDuration(0);
  };

  // Determine peer title
  const otherDevice = targetPeer || (roomMembers.length > 1 ? roomMembers.find(m => m.id !== selfDevice.id) : null);

  return (
    <div 
      className={`flex-1 flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100vh-5rem)] max-w-4xl mx-auto w-full relative transition-all ${
        isDragOver ? 'ring-4 ring-purple-500/50 bg-purple-950/20' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & drop overlay cue */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 bg-neutral-950/85 backdrop-blur-sm rounded-3xl border-2 border-dashed border-purple-500 flex flex-col items-center justify-center pointer-events-none">
          <Paperclip className="w-16 h-16 text-purple-400 animate-bounce mb-3" />
          <h3 className="text-xl font-bold text-white">أفلت الملفات للإرسال المباشر</h3>
          <p className="text-xs text-neutral-400 mt-1">صور، تسجيلات صوتية، مستندات، وملفات</p>
        </div>
      )}

      {/* Top Header / Connected Device Bar */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3.5 bg-neutral-900/80 border-b border-neutral-800/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white transition-colors shrink-0"
            title="رجوع"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Connected Device Info */}
          {otherDevice ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <DeviceIcon 
                deviceType={otherDevice.deviceType} 
                os={otherDevice.os} 
                size="sm" 
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    {otherDevice.name}
                  </h3>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    متصل
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-neutral-400 truncate">
                  {otherDevice.deviceType === 'mobile' ? 'هاتف ذكي' : 'كمبيوتر'} • {otherDevice.os}
                  {roomCode ? ` • غرفة #${roomCode}` : ' • واي فاي مباشر'}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                {roomCode ? `غرفة #${roomCode}` : 'مساحة المشاركة المباشرة'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-400">
                في انتظار اتصال الطرف الآخر...
              </p>
            </div>
          )}
        </div>

        {/* Quick Attachment action */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 border border-neutral-700/60 text-xs transition-colors"
            title="إرسال ملف أو صورة"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">إرسال ملف</span>
          </button>
        </div>
      </div>

      {/* Microphone Error Alert (if permission was blocked on mobile) */}
      {micError && (
        <div className="bg-red-950/80 border-b border-red-800/80 px-4 py-2.5 flex items-center justify-between text-xs text-red-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{micError}</span>
          </div>
          <button 
            onClick={() => setMicError(null)}
            className="p-1 hover:bg-red-900/50 rounded-lg text-red-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Transfer Progress Banner */}
      {activeTransfer && (
        <div className="bg-purple-950/60 border-b border-purple-800/40 px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-purple-200">
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span className="font-semibold truncate">جاري نقل {activeTransfer.fileName}</span>
            <span className="text-[10px] sm:text-[11px] text-purple-400 font-mono">({activeTransfer.speed})</span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="font-mono text-xs font-bold">{activeTransfer.progress}%</span>
            <div className="w-16 sm:w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-200"
                style={{ width: `${activeTransfer.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Messages & Files Feed */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-500">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 mb-3 shadow-inner">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400/80" />
            </div>
            <h4 className="text-sm font-bold text-neutral-200 mb-1">
              تم بدء جلسة المشاركة الفورية
            </h4>
            <p className="text-xs text-neutral-400 max-w-sm">
              أرسل رسائل، صور، أو تسجيلات صوتية بين الهاتف والكمبيوتر بسرعة فائقة وبدون أي قيود.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.senderId === selfDevice.id;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isSelf ? 'flex-row-reverse' : 'flex-row'} group`}
              >
                {/* DEVICE ICON BESIDE EVERY MESSAGE (Requirement: صورة الجهاز جانب كل رسالة) */}
                <div 
                  className="shrink-0 mb-1" 
                  title={`${msg.senderName} (${msg.senderType === 'mobile' ? 'هاتف ذكي' : 'كمبيوتر'})`}
                >
                  <DeviceIcon 
                    deviceType={msg.senderType} 
                    os={msg.senderOS} 
                    size="xs" 
                    badge={true}
                    className="shadow-md border-neutral-700/60"
                  />
                </div>

                {/* Message Bubble Column */}
                <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[82%] sm:max-w-[75%]`}>
                  {/* Sender Tag & Timestamp */}
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] sm:text-[11px] text-neutral-400">
                    <span className="font-semibold text-neutral-300">
                      {isSelf ? 'أنت' : msg.senderName}
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Content according to type */}
                  {msg.type === 'text' && (
                    <div
                      className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                        isSelf
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-purple-600/20'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                  )}

                  {msg.type === 'image' && msg.file && (
                    <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/90 shadow-xl group/img relative max-w-xs sm:max-w-sm">
                      <div 
                        className="cursor-pointer relative overflow-hidden bg-neutral-950 aspect-[4/3] flex items-center justify-center"
                        onClick={() => onOpenLightbox(msg.file!)}
                      >
                        <img
                          src={msg.file.dataUrl}
                          alt={msg.file.name}
                          className="w-full h-full object-cover transition-transform group-hover/img:scale-105 duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenLightbox(msg.file!);
                            }}
                            className="p-2 rounded-xl bg-neutral-900/90 text-white hover:bg-black shadow-lg"
                            title="عرض بالحجم الكامل"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Prominent Direct Download Button & Details */}
                      <div className="p-2.5 sm:p-3 bg-neutral-900 flex items-center justify-between gap-2 border-t border-neutral-800">
                        <div className="min-w-0">
                          <p className="text-[11px] sm:text-xs font-semibold text-neutral-200 truncate">{msg.file.name}</p>
                          <p className="text-[9px] sm:text-[10px] text-neutral-400 font-mono">{formatFileSize(msg.file.size)}</p>
                        </div>
                        
                        {/* Direct Download Button */}
                        <button
                          onClick={() => downloadFile(msg.file!.name, msg.file!.dataUrl, msg.file!.mimeType)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition-all shrink-0"
                          title="حفظ إلى استوديو الصور / التنزيلات"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تحميل</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.type === 'audio' && msg.file && (
                    <InlineAudioPlayer 
                      file={msg.file} 
                      isSelf={isSelf} 
                    />
                  )}

                  {msg.type === 'file' && msg.file && (
                    <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3 shadow-lg max-w-xs sm:max-w-sm w-full">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-neutral-200 truncate">{msg.file.name}</p>
                          <p className="text-[10px] text-neutral-400 font-mono">{formatFileSize(msg.file.size)}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => downloadFile(msg.file!.name, msg.file!.dataUrl, msg.file!.mimeType)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-purple-900/50 active:scale-95 text-xs font-semibold text-purple-300 border border-neutral-700/60 transition-colors shrink-0"
                        title="تحميل الملف"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تحميل</span>
                      </button>
                    </div>
                  )}

                  {/* Delivery checkmark */}
                  {isSelf && (
                    <div className="mt-0.5 px-1 flex items-center gap-1 text-[9px] sm:text-[10px] text-neutral-500">
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                      <span>تم الإرسال</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message & File Input Bar (Optimized for Mobile Keyboards and Touch) */}
      <div className="p-2 sm:p-3.5 bg-neutral-900/95 border-t border-neutral-800 backdrop-blur-md shrink-0">
        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {isRecording ? (
          /* Live Voice Recording Bar on Mobile */
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-purple-950/70 border border-purple-700 animate-pulse">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="text-xs font-bold text-white truncate">جاري تسجيل الصوت...</span>
              <span className="text-xs font-mono font-bold text-purple-300 shrink-0">
                0:{recordDuration < 10 ? '0' : ''}{recordDuration}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCancelVoiceRecord}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-400 hover:text-white transition-colors"
                title="إلغاء التسجيل"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
              <button
                type="button"
                onClick={handleToggleVoiceRecord}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
                title="إرسال التسجيل"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال</span>
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Bar */
          <form onSubmit={handleSendText} className="flex items-center gap-1.5 sm:gap-2">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 sm:p-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-purple-400 transition-colors shrink-0"
              title="إرفاق ملفات أو صور"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Voice Recorder Button - Mobile Friendly Tap */}
            <button
              type="button"
              onClick={handleToggleVoiceRecord}
              className="p-2.5 sm:p-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-red-400 transition-colors shrink-0"
              title="تسجيل رسالة صوتية"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب رسالتك أو شارك ملفاً..."
              className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2.5 sm:p-3 rounded-2xl font-bold transition-all shrink-0 ${
                inputText.trim()
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 active:scale-95'
                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
              }`}
              title="إرسال"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
