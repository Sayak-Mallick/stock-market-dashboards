import express from "express";

const app = express();
const PORT = 4000;

app.get("/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*", // Allow requests from any origin
  });

  const intervalId = setInterval(() => {
    const data = JSON.stringify({ time: new Date().toLocaleTimeString() });
    res.write(`data: ${data}\n\n`);
  }, 100);

  req.on("close", () => {
    clearInterval(intervalId);
    console.log("Client disconnected");
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/events`);
});
