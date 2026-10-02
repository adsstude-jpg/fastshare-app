/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ChatMessage, 
  ConnectionMode, 
  ConnectionStatus, 
  DeviceInfo, 
  FilePayload, 
  TransferProgress 
} from './types';
import { getClientDeviceInfo } from './utils/deviceDetector';
import { socketService } from './services/socketService';
import { Header } from './components/Header';
import { LocalDiscoveryView } from './components/LocalDiscoveryView';
import { RemoteRoomView } from './components/RemoteRoomView';
import { ChatAndTransferArea } from './components/ChatAndTransferArea';
import { ImageLightbox } from './components/ImageLightbox';
import { QRCodeModal } from './components/QRCodeModal';

export default function App() {
  const [selfDevice, setSelfDevice] = useState<DeviceInfo>(() => getClientDeviceInfo());
  const [mode, setMode] = useState<ConnectionMode>('local');
  const [status, setStatus] = useState<ConnectionStatus>('scanning');
  const [statusMessage, setStatusMessage] = useState<string>('جاري البحث عن الأجهزة على شبكة الواي فاي...');
  
  // Real discovered peers only (NO mock devices)
  const [discoveredPeers, setDiscoveredPeers] = useState<DeviceInfo[]>([]);
  
  // Active connection session
  const [activePeer, setActivePeer] = useState<DeviceInfo | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomMembers, setRoomMembers] = useState<DeviceInfo[]>([]);
  const [roomError, setRoomError] = useState<string>('');
  const [isJoiningRoom, setIsJoiningRoom] = useState<boolean>(false);
  
  // Chat & Files state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTransfer, setActiveTransfer] = useState<TransferProgress | null>(null);
  const [lightboxFile, setLightboxFile] = useState<FilePayload | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'discovery' | 'room_hub' | 'chat'>('discovery');

  // Initialize socket connection and handle URL parameters
  useEffect(() => {
    socketService.connect(selfDevice, mode);

    // Check for room code in URL query string (e.g. from QR scan)
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setMode('remote');
      socketService.setMode('remote');
      socketService.joinRoom(roomParam);
      setIsJoiningRoom(true);
      setStatus('connecting');
      setStatusMessage(`جاري الدخول إلى غرفة #${roomParam}...`);
    }

    // Subscribe to socket events
    const unsubStatus = socketService.on('connection_status', (wsStatus) => {
      if (wsStatus === 'connected') {
        setStatusMessage(mode === 'local' ? 'جاري البحث عن أجهزة على الواي فاي...' : 'متصل بخادم FastShare');
      } else if (wsStatus === 'disconnected') {
        setStatus('disconnected');
        setStatusMessage('جاري إعادة الاتصال...');
      }
    });

    const unsubPeers = socketService.on('peer_list', (data) => {
      const realPeers = (data.peers || []).filter((p: DeviceInfo) => p.id !== selfDevice.id);
      setDiscoveredPeers(realPeers);
      if (mode === 'local' && !activePeer) {
        setStatus('scanning');
        setStatusMessage(
          realPeers.length > 0 
            ? `تم العثور على ${realPeers.length} جهاز على نفس الشبكة` 
            : 'جاري البحث عن أجهزة على الواي فاي...'
        );
      }
    });

    const unsubPeerJoined = socketService.on('peer_joined', (data) => {
      if (data.members) {
        setRoomMembers(data.members);
      }
      setStatusMessage(`انضم الجهاز: ${data.device?.name || 'جهاز جديد'}`);
    });

    const unsubPeerLeft = socketService.on('peer_left', (data) => {
      if (data.peerId) {
        setRoomMembers(prev => prev.filter(m => m.id !== data.peerId));
        setDiscoveredPeers(prev => prev.filter(m => m.id !== data.peerId));
        if (activePeer?.id === data.peerId) {
          setStatusMessage(`تم فصل ${data.device?.name || 'الجهاز'}`);
        }
      }
    });

    const unsubRoomCreated = socketService.on('room_created', (data) => {
      setRoomCode(data.code);
      setRoomMembers(data.members || [selfDevice]);
      setStatus('room_created');
      setStatusMessage(`تم إنشاء غرفة #${data.code}`);
      setCurrentView('room_hub');
    });

    const unsubRoomJoined = socketService.on('room_joined', (data) => {
      setRoomCode(data.code);
      setRoomMembers(data.members || []);
      setIsJoiningRoom(false);
      setStatus('room_joined');
      setStatusMessage(`متصل عبر الرمز #${data.code}`);
      setCurrentView('chat');
    });

    const unsubRoomError = socketService.on('room_error', (data) => {
      setRoomError(data.message || 'الغرفة غير موجودة. تأكد من الرمز.');
      setIsJoiningRoom(false);
      setStatus('idle');
    });

    const unsubChat = socketService.on('chat_message', (payload: ChatMessage) => {
      setMessages(prev => {
        if (prev.some(m => m.id === payload.id)) return prev;
        return [...prev, payload];
      });
      setCurrentView('chat');
      setStatus('connected');
    });

    const unsubFile = socketService.on('file_transfer', (payload: any) => {
      const newMsg: ChatMessage = {
        id: payload.id || 'msg_' + Date.now(),
        senderId: payload.senderId,
        senderName: payload.senderName,
        senderType: payload.senderType,
        senderOS: payload.senderOS,
        senderColor: payload.senderColor,
        type: payload.type || (payload.file.mimeType.startsWith('image/') ? 'image' : payload.file.mimeType.startsWith('audio/') ? 'audio' : 'file'),
        file: payload.file,
        timestamp: payload.timestamp || Date.now(),
        status: 'delivered'
      };

      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setCurrentView('chat');
      setStatus('connected');
    });

    return () => {
      unsubStatus();
      unsubPeers();
      unsubPeerJoined();
      unsubPeerLeft();
      unsubRoomCreated();
      unsubRoomJoined();
      unsubRoomError();
      unsubChat();
      unsubFile();
    };
  }, [selfDevice, mode]);

  // Mode change handler
  const handleModeChange = (newMode: ConnectionMode) => {
    setMode(newMode);
    socketService.setMode(newMode);
    setRoomError('');
    if (newMode === 'local') {
      setCurrentView(activePeer ? 'chat' : 'discovery');
      setStatus('scanning');
      setStatusMessage('جاري البحث عن أجهزة على الواي فاي...');
      socketService.scanLocal();
    } else {
      setCurrentView(roomCode ? (messages.length > 0 ? 'chat' : 'room_hub') : 'room_hub');
      setStatus(roomCode ? 'room_created' : 'idle');
      setStatusMessage(roomCode ? `غرفة #${roomCode}` : 'إنشاء أو إدخال رمز 6 أرقام');
    }
  };

  // Update device name
  const handleUpdateDeviceName = (newName: string) => {
    const updated = { ...selfDevice, name: newName };
    setSelfDevice(updated);
    localStorage.setItem('fastshare_device_name', newName);
    socketService.connect(updated, mode);
  };

  // Refresh scan
  const handleRefreshScan = () => {
    setStatus('scanning');
    setStatusMessage('جاري تحديث البحث على الشبكة...');
    socketService.scanLocal();
    setTimeout(() => {
      setStatusMessage(
        discoveredPeers.length > 0 
          ? `تم العثور على ${discoveredPeers.length} جهاز` 
          : 'اكتمل البحث. افتح FastShare على جهازك الآخر للاتصال.'
      );
    }, 1200);
  };

  // Connect to peer (Local Mode)
  const handleConnectToPeer = (peer: DeviceInfo) => {
    setActivePeer(peer);
    setCurrentView('chat');
    setStatus('connected');
    setStatusMessage(`متصل مع ${peer.name}`);
  };

  // Create room (Remote Mode)
  const handleCreateRoom = () => {
    setRoomError('');
    socketService.createRoom();
  };

  // Join room (Remote Mode)
  const handleJoinRoom = (code: string) => {
    setRoomError('');
    setIsJoiningRoom(true);
    socketService.joinRoom(code);
  };

  // Send text message with device details attached
  const handleSendMessage = (text: string) => {
    const msgId = 'msg_' + Date.now();
    const chatMsg: ChatMessage = {
      id: msgId,
      senderId: selfDevice.id,
      senderName: selfDevice.name,
      senderType: selfDevice.deviceType,
      senderOS: selfDevice.os,
      senderColor: selfDevice.avatarColor,
      type: 'text',
      content: text,
      timestamp: Date.now(),
      status: 'delivered'
    };

    // Add to local chat
    setMessages(prev => [...prev, chatMsg]);

    // Send over socket
    socketService.sendChatMessage({
      ...chatMsg,
      targetId: activePeer?.id,
      roomId: roomCode
    });
  };

  // Send file transfer with device details attached
  const handleSendFile = (file: FilePayload) => {
    const msgId = 'file_msg_' + Date.now();
    const fileType = file.mimeType.startsWith('image/') 
      ? 'image' 
      : file.mimeType.startsWith('audio/') 
        ? 'audio' 
        : 'file';

    const chatMsg: ChatMessage = {
      id: msgId,
      senderId: selfDevice.id,
      senderName: selfDevice.name,
      senderType: selfDevice.deviceType,
      senderOS: selfDevice.os,
      senderColor: selfDevice.avatarColor,
      type: fileType,
      file,
      timestamp: Date.now(),
      status: 'delivered'
    };

    // Visual transfer progress
    setActiveTransfer({
      id: 'trans_' + Date.now(),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.mimeType,
      progress: 35,
      speed: '14.2 MB/s',
      direction: 'upload',
      status: 'transferring'
    });

    setTimeout(() => {
      setActiveTransfer(prev => prev ? { ...prev, progress: 85, speed: '18.4 MB/s' } : null);
    }, 200);

    setTimeout(() => {
      setActiveTransfer(null);
      setMessages(prev => [...prev, chatMsg]);

      // Transmit to peer
      socketService.sendFileTransfer({
        id: msgId,
        senderId: selfDevice.id,
        senderName: selfDevice.name,
        senderType: selfDevice.deviceType,
        senderOS: selfDevice.os,
        senderColor: selfDevice.avatarColor,
        type: fileType,
        file,
        targetId: activePeer?.id,
        roomId: roomCode,
        timestamp: Date.now()
      });
    }, 450);
  };

  return (
    <div className="min-h-[100dvh] bg-[#090a0f] text-neutral-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      {/* Top Application Header */}
      <Header
        mode={mode}
        onModeChange={handleModeChange}
        status={status}
        statusMessage={statusMessage}
        selfDevice={selfDevice}
        onUpdateDeviceName={handleUpdateDeviceName}
        onOpenQR={() => setShowQRModal(true)}
        connectedPeerName={activePeer?.name}
        roomCode={roomCode || undefined}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {currentView === 'chat' ? (
          <ChatAndTransferArea
            selfDevice={selfDevice}
            targetPeer={activePeer || undefined}
            roomCode={roomCode || undefined}
            roomMembers={roomMembers}
            messages={messages}
            onSendMessage={handleSendMessage}
            onSendFile={handleSendFile}
            onBack={() => setCurrentView(mode === 'local' ? 'discovery' : 'room_hub')}
            activeTransfer={activeTransfer}
            onOpenLightbox={(file) => setLightboxFile(file)}
          />
        ) : mode === 'local' ? (
          <LocalDiscoveryView
            selfDevice={selfDevice}
            discoveredPeers={discoveredPeers}
            onConnectToPeer={handleConnectToPeer}
            onRefreshScan={handleRefreshScan}
            isScanning={status === 'scanning'}
            onOpenQR={() => setShowQRModal(true)}
            onSwitchToRemote={() => handleModeChange('remote')}
          />
        ) : (
          <RemoteRoomView
            selfDevice={selfDevice}
            roomCode={roomCode}
            roomMembers={roomMembers}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onEnterChat={() => setCurrentView('chat')}
            onOpenQR={() => setShowQRModal(true)}
            errorMessage={roomError}
            isJoining={isJoiningRoom}
          />
        )}
      </main>

      {/* Fullscreen Image Lightbox Modal */}
      {lightboxFile && (
        <ImageLightbox
          file={lightboxFile}
          onClose={() => setLightboxFile(null)}
        />
      )}

      {/* Cross-Device Phone QR Code Pairing Modal */}
      {showQRModal && (
        <QRCodeModal
          roomCode={roomCode || undefined}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}
