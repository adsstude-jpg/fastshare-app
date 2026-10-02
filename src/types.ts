export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type DeviceOS = 'macOS' | 'iOS' | 'Android' | 'Windows' | 'Linux' | 'Other';

export interface DeviceInfo {
  id: string;
  name: string;
  deviceType: DeviceType;
  os: DeviceOS;
  browser: string;
  avatarColor: string;
  ipSubnet?: string;
  isSelf?: boolean;
  isMock?: boolean;
  joinedAt: number;
  roomId?: string;
}

export interface FilePayload {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  dataUrl: string; // Base64 or Blob URL
  duration?: number; // audio duration in seconds
  waveform?: number[]; // simplified waveform visualization
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: DeviceType;
  senderOS?: DeviceOS;
  senderColor: string;
  type: 'text' | 'image' | 'audio' | 'file';
  content?: string;
  file?: FilePayload;
  timestamp: number;
  status: 'sent' | 'delivered';
}

export interface TransferProgress {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  progress: number; // 0 to 100
  speed: string;
  direction: 'upload' | 'download';
  status: 'transferring' | 'completed' | 'cancelled' | 'error';
  targetPeerName?: string;
}

export type ConnectionMode = 'local' | 'remote';

export type ConnectionStatus = 
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'room_created'
  | 'room_joined';

export interface WSMessage {
  type: 
    | 'identify'
    | 'peer_list'
    | 'peer_joined'
    | 'peer_left'
    | 'create_room'
    | 'room_created'
    | 'join_room'
    | 'room_joined'
    | 'room_error'
    | 'chat_message'
    | 'file_chunk'
    | 'file_complete'
    | 'pair_request'
    | 'pair_response'
    | 'webrtc_signal';
  payload: any;
}
