import { DeviceInfo, WSMessage } from '../types';

type Listener = (payload: any) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Listener>> = new Map();
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private isConnecting = false;
  private currentDevice: DeviceInfo | null = null;
  private currentMode: 'local' | 'remote' = 'local';
  private currentRoomCode: string | null = null;

  public on(event: string, callback: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: Listener) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, payload: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (e) {
          console.error(`Error in socket listener for ${event}:`, e);
        }
      }
    }
  }

  public connect(device: DeviceInfo, mode: 'local' | 'remote' = 'local') {
    this.currentDevice = device;
    this.currentMode = mode;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.emit('connection_status', 'connected');
        
        // Identify self to server
        this.send('identify', {
          device: this.currentDevice,
          mode: this.currentMode,
          roomCode: this.currentRoomCode
        });

        // Start ping heartbeat
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          this.send('ping', {});
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.emit(msg.type, msg.payload);
        } catch (err) {
          console.error('Failed to parse incoming WS message:', err);
        }
      };

      this.ws.onclose = () => {
        this.emit('connection_status', 'disconnected');
        this.cleanup();
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket encountered error:', err);
        this.emit('connection_status', 'error');
      };
    } catch (err) {
      console.error('WebSocket connection setup failed:', err);
      this.scheduleReconnect();
    }
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.currentDevice) {
        this.connect(this.currentDevice, this.currentMode);
      }
    }, 3000);
  }

  public send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  public setMode(mode: 'local' | 'remote') {
    this.currentMode = mode;
    this.send('set_mode', { mode });
  }

  public scanLocal() {
    this.send('scan_local', {});
  }

  public createRoom() {
    this.send('create_room', {});
  }

  public joinRoom(code: string) {
    this.currentRoomCode = code;
    this.send('join_room', { code });
  }

  public leaveRoom() {
    this.send('leave_room', {});
    this.currentRoomCode = null;
  }

  public sendChatMessage(message: any) {
    this.send('chat_message', message);
  }

  public sendFileTransfer(fileData: any) {
    this.send('file_transfer', fileData);
  }

  public sendPairRequest(targetId: string) {
    this.send('pair_request', { targetId });
  }

  public sendPairResponse(targetId: string, accepted: boolean) {
    this.send('pair_response', { targetId, accepted });
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const socketService = new SocketService();
