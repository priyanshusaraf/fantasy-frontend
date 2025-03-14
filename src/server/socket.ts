// src/server/socket.ts
import { Server } from "socket.io";
import { createServer } from "http";
import prisma from "../lib/prisma";

// Create HTTP server
const httpServer = createServer();

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("New client connected");

  // Join a match room
  socket.on("joinMatch", (matchId) => {
    console.log(`Client joined match: ${matchId}`);
    socket.join(`match-${matchId}`);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Function to broadcast match score updates
export const broadcastScoreUpdate = async (matchId: number) => {
  try {
    // Get updated match data
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
        tournament: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!match) {
      console.error(`Match not found: ${matchId}`);
      return;
    }

    // Format data for broadcast
    const matchData = {
      id: match.id,
      player1: {
        id: match.player1.id,
        name: match.player1.name,
        imageUrl: match.player1.imageUrl,
      },
      player2: {
        id: match.player2.id,
        name: match.player2.name,
        imageUrl: match.player2.imageUrl,
      },
      player1Score: match.player1Score,
      player2Score: match.player2Score,
      status: match.status,
      round: match.round,
      tournamentId: match.tournamentId,
      tournamentName: match.tournament.name,
    };

    // Broadcast update to all clients in match room
    io.to(`match-${matchId}`).emit("scoreUpdate", matchData);

    console.log(
      `Score update broadcast for match ${matchId}: ${match.player1Score}-${match.player2Score}`
    );
  } catch (error) {
    console.error("Error broadcasting score update:", error);
  }
};

// Function to broadcast match completion
export const broadcastMatchEnd = async (matchId: number) => {
  try {
    // Get match data
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
        tournament: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!match) {
      console.error(`Match not found: ${matchId}`);
      return;
    }

    // Format data for broadcast
    const matchData = {
      id: match.id,
      player1: {
        id: match.player1.id,
        name: match.player1.name,
        imageUrl: match.player1.imageUrl,
      },
      player2: {
        id: match.player2.id,
        name: match.player2.name,
        imageUrl: match.player2.imageUrl,
      },
      player1Score: match.player1Score,
      player2Score: match.player2Score,
      status: match.status,
      round: match.round,
      tournamentId: match.tournamentId,
      tournamentName: match.tournament.name,
    };

    // Broadcast end to all clients in match room
    io.to(`match-${matchId}`).emit("matchEnd", matchData);

    console.log(
      `Match ${matchId} ended: ${match.player1Score}-${match.player2Score}`
    );
  } catch (error) {
    console.error("Error broadcasting match end:", error);
  }
};

// Start HTTP server
const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

export { io };
