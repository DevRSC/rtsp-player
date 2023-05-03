const canvas = document.getElementById("videoCanvas");
const context = canvas.getContext("2d");

const socket = new WebSocket("ws://" + window.location.host);
socket.binaryType = "arraybuffer";

const drawFrame = (frame) => {
  const uint8Array = new Uint8Array(frame);
  const blob = new Blob([uint8Array], { type: "image/jpeg" });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
  };

  img.src = url;
};

const sendRtspUrl = (url) => {
  socket.send(
    JSON.stringify({
      type: "rtspUrl",
      url: url,
    })
  );
};

socket.onmessage = (event) => {
  const frame = event.data;
  drawFrame(frame);
};

socket.onopen = () => {
  console.log("WebSocket connected.");
  const url = prompt("Please enter the RTSP stream URL:");
  if (url) {
    sendRtspUrl(url);
  } else {
    alert("No RTSP URL provided. Refresh the page to try again.");
  }
};

socket.onerror = (error) => {
  console.error("WebSocket error:", error);
};

socket.onclose = () => {
  console.log("WebSocket disconnected.");
};
