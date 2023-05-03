const express = require("express");
const app = express();
const server = require("http").createServer(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });
const rtsp = require("rtsp-ffmpeg");

const rtspUrl =
  "rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4"; // Replace with your IP camera RTSP URL

const stream = new rtsp.FFMpeg({
  input: rtspUrl,
  resolution: "640x480",
  quality: 3,
});

wss.on("connection", (socket) => {
  console.log("WebSocket connected.");

  stream.on("data", (data) => {
    socket.send(data, { binary: true }, (error) => {
      if (error) console.error(error);
    });
  });

  socket.on("close", () => {
    console.log("WebSocket disconnected.");
  });
});

app.use(express.static("public"));

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
