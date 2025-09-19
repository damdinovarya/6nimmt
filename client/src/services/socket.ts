import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../../../shared/types";

export const SERVER_URL = import.meta.env.PROD
  ? window.location.origin
  : "http://localhost:3000";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  SERVER_URL,
  {
    autoConnect: true,
  }
);
