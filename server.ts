import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '100mb' }));

interface ClientSession {
  ws: WebSocket;
  id: string;
  ip: string;
  device?: any;
  roomId?: string;
  pairedWith?: string;
  mode: 'local' | 'remote';
  lastPing: number;
}

const clients = new Map<WebSocket, ClientSession>();
const rooms = new Map<string, { code: string; hostId: string; created: number; members: Set<WebSocket> }>();

// Generate 6-digit room code
function generateRoomCode(): string {
  let code = '';
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(code));
  return code;
}

// WebSocket server setup
const wss = new WebSocketServer({ server, path: '/ws' });

function send(ws: WebSocket, type: string, payload: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

function broadcastLocalPeers() {
  const localClients = Array.from(clients.values()).filter(c => c.device && c.mode === 'local');
  for (const client of localClients) {
    // List of peers excluding self
    const peerList = localClients
      .filter(other => other.id !== client.id)
      .map(other => other.device);
    
    send(client.ws, 'peer_list', {
      peers: peerList,
      count: peerList.length
    });
  }
}

function broadcastToRoom(roomCode: string, excludeWs: WebSocket | null, type: string, payload: any) {
  const room = rooms.get(roomCode);
  if (!room) return;
  for (const memberWs of room.members) {
    if (memberWs !== excludeWs && memberWs.readyState === WebSocket.OPEN) {
      send(memberWs, type, payload);
    }
  }
}

wss.on('connection', (ws: WebSocket, req) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  const session: ClientSession = {
    ws,
    id: 'dev_' + Math.random().toString(36).substring(2, 9),
    ip,
    mode: 'local',
    lastPing: Date.now()
  };
  clients.set(ws, session);

  ws.on('message', (data: Buffer | string) => {
    try {
      const msg = JSON.parse(data.toString());
      const { type, payload } = msg;

      switch (type) {
        case 'identify': {
          session.device = {
            ...payload.device,
            id: payload.device?.id || session.id,
            ipSubnet: ip.split('.').slice(0, 3).join('.') + '.*'
          };
          session.id = session.device.id;
          session.mode = payload.mode || 'local';

          send(ws, 'identified', {
            id: session.id,
            device: session.device,
            ipSubnet: session.device.ipSubnet
          });

          if (session.mode === 'local') {
            broadcastLocalPeers();
          }
          break;
        }

        case 'set_mode': {
          session.mode = payload.mode;
          if (session.mode === 'local') {
            broadcastLocalPeers();
          }
          break;
        }

        case 'scan_local': {
          const localPeers = Array.from(clients.values())
            .filter(c => c.device && c.id !== session.id && c.mode === 'local')
            .map(c => c.device);
          send(ws, 'peer_list', { peers: localPeers, count: localPeers.length });
          break;
        }

        case 'create_room': {
          const code = generateRoomCode();
          const room = {
            code,
            hostId: session.id,
            created: Date.now(),
            members: new Set<WebSocket>([ws])
          };
          rooms.set(code, room);
          session.roomId = code;
          session.mode = 'remote';

          send(ws, 'room_created', {
            code,
            hostId: session.id,
            members: [session.device]
          });
          break;
        }

        case 'join_room': {
          const targetCode = String(payload.code).trim().replace(/[-\s]/g, '');
          const room = rooms.get(targetCode);

          if (!room) {
            send(ws, 'room_error', { message: `Room #${targetCode} not found. Please verify the 6-digit code.` });
            return;
          }

          room.members.add(ws);
          session.roomId = targetCode;
          session.mode = 'remote';

          // Get all member devices
          const memberDevices: any[] = [];
          for (const mWs of room.members) {
            const memberSession = clients.get(mWs);
            if (memberSession?.device) {
              memberDevices.push(memberSession.device);
            }
          }

          // Acknowledge join to the user
          send(ws, 'room_joined', {
            code: targetCode,
            members: memberDevices
          });

          // Notify other room members that peer joined
          broadcastToRoom(targetCode, ws, 'peer_joined', {
            device: session.device,
            members: memberDevices
          });
          break;
        }

        case 'leave_room': {
          if (session.roomId) {
            const room = rooms.get(session.roomId);
            if (room) {
              room.members.delete(ws);
              broadcastToRoom(session.roomId, ws, 'peer_left', {
                peerId: session.id,
                device: session.device
              });
              if (room.members.size === 0) {
                rooms.delete(session.roomId);
              }
            }
            session.roomId = undefined;
          }
          break;
        }

        case 'chat_message': {
          // If in room, broadcast to room members
          if (session.roomId) {
            broadcastToRoom(session.roomId, ws, 'chat_message', payload);
          } else if (payload.targetId) {
            // Direct peer message
            for (const client of clients.values()) {
              if (client.id === payload.targetId) {
                send(client.ws, 'chat_message', payload);
                break;
              }
            }
          } else {
            // Local broadcast
            for (const client of clients.values()) {
              if (client.id !== session.id && client.mode === 'local') {
                send(client.ws, 'chat_message', payload);
              }
            }
          }
          break;
        }

        case 'file_transfer': {
          // File payload (image, audio, document)
          if (session.roomId) {
            broadcastToRoom(session.roomId, ws, 'file_transfer', payload);
          } else if (payload.targetId) {
            for (const client of clients.values()) {
              if (client.id === payload.targetId) {
                send(client.ws, 'file_transfer', payload);
                break;
              }
            }
          } else {
            for (const client of clients.values()) {
              if (client.id !== session.id && client.mode === 'local') {
                send(client.ws, 'file_transfer', payload);
              }
            }
          }
          break;
        }

        case 'pair_request': {
          const { targetId } = payload;
          for (const client of clients.values()) {
            if (client.id === targetId) {
              send(client.ws, 'pair_request', {
                fromDevice: session.device
              });
              break;
            }
          }
          break;
        }

        case 'pair_response': {
          const { targetId, accepted } = payload;
          for (const client of clients.values()) {
            if (client.id === targetId) {
              if (accepted) {
                session.pairedWith = targetId;
                client.pairedWith = session.id;
              }
              send(client.ws, 'pair_response', {
                fromDevice: session.device,
                accepted
              });
              break;
            }
          }
          break;
        }

        case 'webrtc_signal': {
          const { targetId, signal } = payload;
          for (const client of clients.values()) {
            if (client.id === targetId) {
              send(client.ws, 'webrtc_signal', {
                fromId: session.id,
                signal
              });
              break;
            }
          }
          break;
        }

        case 'ping': {
          session.lastPing = Date.now();
          send(ws, 'pong', { time: Date.now() });
          break;
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    // Remove from room if any
    if (session.roomId) {
      const room = rooms.get(session.roomId);
      if (room) {
        room.members.delete(ws);
        broadcastToRoom(session.roomId, ws, 'peer_left', {
          peerId: session.id,
          device: session.device
        });
        if (room.members.size === 0) {
          rooms.delete(session.roomId);
        }
      }
    }

    clients.delete(ws);
    if (session.mode === 'local') {
      broadcastLocalPeers();
    }
  });
});

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeClients: clients.size,
    activeRooms: rooms.size,
    timestamp: Date.now()
  });
});

app.get('/api/network-info', (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  const subnet = ip.split('.').slice(0, 3).join('.') + '.*';
  res.json({
    clientIp: ip,
    subnet,
    connectedDevicesCount: clients.size
  });
});

// In dev mode, attach Vite middleware. In production, serve dist folder.
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`FastShare server running on http://0.0.0.0:${port}`);
  });
}

setupServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
