// src/hooks/useSocket.ts
import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";

let socket: Socket;

export const useSocket = (matchId: number) => {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize socket only once per client session
    if (!socket) {
      socket = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"
      );
      setSocketInstance(socket);
    } else {
      setSocketInstance(socket);
    }

    // Join the match room
    if (socket && matchId) {
      socket.emit("joinMatch", { matchId });
    }

    // Clean up: leave the room when component unmounts
    return () => {
      if (socket && matchId) {
        socket.emit("leaveMatch", { matchId });
      }
    };
  }, [matchId]);

  return socketInstance;
};
