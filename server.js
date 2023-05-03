const express = require("express");
const app = express();
const server = require("http").createServer(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });
const rtsp = require("rtsp-ffmpeg");
const fs = require("fs");

const connections = new Map();
const portFile = "port.txt";

const readPortFromFile = (filePath, defaultPort = 3000) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        if (err.code === "ENOENT") {
          // File doesn't exist, create it with the default port
          fs.writeFile(filePath, defaultPort.toString(), (writeErr) => {
            if (writeErr) {
              reject(writeErr);
            } else {
              resolve(defaultPort);
            }
          });
        } else {
          reject(err);
        }
      } else {
        const port = parseInt(data, 10);
        if (!isNaN(port)) {
          resolve(port);
        } else {
          reject(new Error("Invalid port number in file."));
        }
      }
    });
  });
};

wss.on("connection", (socket) => {
  console.log("WebSocket connected.");

  // Add a new event listener for the "rtspUrl" message
  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "rtspUrl") {
        const rtspUrl = data.url;
        const stream = new rtsp.FFMpeg({
          input: rtspUrl,
          resolution: "1080x720",
          quality: 10,
        });

        connections.set(socket, stream);

        stream.on("data", (data) => {
          socket.send(data, { binary: true }, (error) => {
            if (error) console.error(error);
          });
        });
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  });

  socket.on("close", () => {
    console.log("WebSocket disconnected.");
    const stream = connections.get(socket);
    if (stream) {
      stream.stop();
      connections.delete(socket);
    }
  });
});

app.use(express.static("public"));

readPortFromFile(portFile)
  .then((port) => {
    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error(`Error reading port from file (${portFile}):`, error.message);
  });
