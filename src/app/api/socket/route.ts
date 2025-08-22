// server.js
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server, Socket } from "socket.io";

// Extend Socket interface to include custom properties
declare module "socket.io" {
  interface Socket {
    userId?: string;
    userName?: string;
  }
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    await handler(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Store io globally
  global.io = io;

  io.on("connection", (socket) => {
    console.log("👤 User connected:", socket.id);

    socket.on("authenticate", (data) => {
      socket.userId = data.userId;
      socket.userName = data.userName;
      console.log("🔐 User authenticated:", data.userName);
    });

    socket.on("disconnect", () => {
      console.log("👤 User disconnected:", socket.id);
    });
  });

  httpServer.listen(port, (err?: Error) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
