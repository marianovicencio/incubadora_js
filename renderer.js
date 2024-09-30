const { SerialPort } = require('serialport');
const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, 'sensor_data.csv');

function appendToCSV(date, rpm,temperature ,power) {
  const row = `${date};${rpm};${temperature};${power}\n`;

  if (!fs.existsSync(csvFilePath)) {
    const header = 'Date;RPM;Temperatura;Potencia\n';
    fs.writeFileSync(csvFilePath, header);
  }

  fs.appendFileSync(csvFilePath, row, (err) => {
    if (err) throw err;
    console.log('Data appended to CSV');
  });
}

function map(value, in_min, in_max, out_min, out_max) {
  return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

window.addEventListener("DOMContentLoaded", function () {
  const temperatureDisplay = document.getElementById("temperature-display");
  const rpmDisplay = document.getElementById("rpm-display");
  const dutyCycleSlider_luz = document.getElementById("duty-cycle-slider-luz");
  const dutyCycleSlider_fan = document.getElementById("duty-cycle-slider-fan");
  const watsDisplay = document.getElementById("wats-display");

  const port = new SerialPort({ path: 'COM5', baudRate: 9600 });

  port.on("open", function () {
    console.log("Serial port opened");
  });
///hola mundo
  port.on("error", function (err) {
    console.error("Error: ", err.message);
  });

  port.on("readable", function () {
    const data = port.read().toString();
    console.log("Serial data received:", data); 
    
    const parts = data.split(/(?=[T;R])/); 
    let temperature = null;
    let rpm = null;
    //let power = null;

    parts.forEach(part => {
      if (part.startsWith('T')) {
        temperature = parseInt(part.slice(1), 10); 
        console.log("Temperature:", temperature);
        temperatureDisplay.textContent = `${temperature}°C`;
      } else if (part.startsWith('R')) {
        rpm = parseInt(part.slice(1), 10);
        console.log("RPM:", rpm);
        rpmDisplay.textContent = `${rpm} RPM`;
      }
    });

    if (temperature !== null && rpm !== null) {
      const date = new Date().toISOString(); 
      appendToCSV(date, rpm, temperature, power);
    }
  });

  dutyCycleSlider_luz.addEventListener("input", function () {
    const dutyCycle_luz = dutyCycleSlider_luz.value;
    console.log("Light Duty Cycle:", dutyCycle_luz);
    port.write(`L${dutyCycle_luz}\n`); 

    const wats = map(dutyCycle_luz, 0, 255, 0, 18.6);
    power = wats.toFixed(2)
    watsDisplay.textContent = `${wats.toFixed(2)} W`;
    console.log(`Wats: ${wats}`);
  });

  dutyCycleSlider_fan.addEventListener("input", function () {
    const dutyCycle_fan = dutyCycleSlider_fan.value;
    console.log("Fan Duty Cycle:", dutyCycle_fan);
    port.write(`F${dutyCycle_fan}\n`); 
  });

});
