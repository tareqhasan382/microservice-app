import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";

import config from "../config";
import logger from "../config/logger";

/** Server → client event names shared with the frontend realtime layer. */
export const REALTIME_EVENTS = {
  notificationNew: "notification:new",
  taskChanged: "task:changed",
} as const;

type Actor = { id: string; role: "admin" | "user" };
type TokenPayload = { userId?: string | number; role?: "admin" | "user" };
type SocketData = { user: Actor };

const ADMIN_ROOM = "role:admin";
const WORKSPACE_ROOM = "workspace:members";
const userRoom = (userId: string): string => `user:${userId}`;

let io: SocketServer | null = null;

const readToken = (socket: Socket): string | undefined => {
  const fromAuth = socket.handshake.auth?.token;
  if (typeof fromAuth === "string" && fromAuth.length > 0) return fromAuth;

  const header = socket.handshake.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length).trim();

  return undefined;
};

const authenticate = (socket: Socket, next: (err?: Error) => void): void => {
  const token = readToken(socket);
  if (!token) {
    next(new Error("Authentication token missing"));
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.jwt_access_secret || "") as TokenPayload;
    if (!decoded.userId) {
      next(new Error("Invalid token payload"));
      return;
    }
    (socket.data as SocketData).user = {
      id: String(decoded.userId),
      role: decoded.role === "admin" ? "admin" : "user",
    };
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
};

/**
 * Attaches the Socket.IO hub to the HTTP server and authenticates every
 * connection with the same JWT access token used by the REST API.
 * Call once at bootstrap.
 */
export const initRealtime = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    path: "/socket.io",
    cors: { origin: true, credentials: true },
  });

  io.use(authenticate);

  io.on("connection", (socket) => {
    const { user } = socket.data as SocketData;
    void socket.join(userRoom(user.id));
    void socket.join(WORKSPACE_ROOM);
    if (user.role === "admin") void socket.join(ADMIN_ROOM);

    logger.info(`🔌 Realtime client connected: user #${user.id} (socket ${socket.id})`);

    socket.on("disconnect", (reason) => {
      logger.debug(`🔌 Realtime client disconnected: ${socket.id} (${reason})`);
    });
  });

  logger.info("✅ Socket.IO realtime hub initialised");
  return io;
};

/** Pushes an event to every live connection belonging to a single user. */
export const emitToUser = (userId: string, event: string, payload: unknown): void => {
  io?.to(userRoom(userId)).emit(event, payload);
};

export const emitNotificationNew = (userId: string, notification: unknown): void =>
  emitToUser(userId, REALTIME_EVENTS.notificationNew, notification);

export const emitTaskChanged = (userId: string, action: string, task: unknown): void =>
  emitToUser(userId, REALTIME_EVENTS.taskChanged, { action, task });

/** Only use for unassigned tasks that are visible to every workspace member. */
export const emitTaskChangedToWorkspace = (action: string, task: unknown): void => {
  io?.to(WORKSPACE_ROOM).emit(REALTIME_EVENTS.taskChanged, { action, task });
};
