const { SerialPort } = require('serialport');

window.addEventListener("DOMContentLoaded", function () {
    const temperatureDisplay = document.getElementById("temperature-display");
    const rpmDisplay = document.getElementById("rpm-display");

    const port = new SerialPort({ path: 'COM6', baudRate: 9600 });

  port.on("open", function () {
    console.log("Serial port opened");
  });
  port.on("error", function (err) {
    console.error("Error: ", err.message);
  });

  let serialData = '';

  port.on("data", function (chunk) {
    serialData += chunk.toString();
    let lines = serialData.split('\n');
    serialData = lines.pop(); // La última línea puede no estar completa

    lines.forEach((line) => {
      console.log("Serial data received:", line);

      const parts = line.trim().split(';');
      let temperature = null;
      let rpm = null;

      parts.forEach(part => {
        if (part.startsWith('T')) {
          temperature = parseFloat(part.slice(1));
          temperatureDisplay.textContent = `${temperature.toFixed(1)}°C`;
        } else if (part.startsWith('R')) {
          rpm = parseInt(part.slice(1), 10);
          rpmDisplay.textContent = `${rpm} RPM`;
        }
      });
    });
  });
});