import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3001", {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
});

export default socket;
