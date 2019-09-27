let socket = require("socket.io-client");

let speed = 0;

setInterval(() => {
  let nextMin = speed - 2 > 0 ? speed - 2 : 2;
  let nextMax = speed + 5 < 140 ? speed + 5 : Math.random() * (130 - 5 + 1) + 5;
  speed = Math.floor(Math.random() * (nextMax - nextMin + 1) + nextMin);

  //we emit the data. No need to JSON serialization!
  socket.emit("incoming data", speed);
}, 100);
