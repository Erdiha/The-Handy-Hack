// src/app/api/socket/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
  CustomSocket,
} from "@/types/socket";

declare global {
  var io:
    | ServerIO<ClientToServerEvents, ServerToClientEvents, never, SocketData>
    | undefined;
}

export async function GET(req: NextRequest) {
  if (!global.io) {
    console.log("🚀 Initializing Socket.io server...");

    // We'll initialize Socket.io here
    const httpServer = (
      req as NextRequest & {
        socket?: {
          server: NetServer;
        };
      }
    ).socket?.server;
    global.io = new ServerIO(httpServer, {
      path: "/api/socket",
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    global.io.on("connection", (socket: CustomSocket) => {
      console.log("👤 User connected:", socket.id);

      // For now, just basic connection handling
      socket.on("disconnect", () => {
        console.log("👤 User disconnected:", socket.id);
      });
    });

    console.log("✅ Socket.io server initialized");
  }

  return NextResponse.json({ message: "Socket.io server running" });
}
