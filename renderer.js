const { SerialPort } = require('serialport');
const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, 'sensor_data.csv');

let power = 0; // Variable global para almacenar la potencia
let timeCounter = 0; // Contador de tiempo en segundos

function appendToCSV(date, rpm, temperature, power) {
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
  return ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

window.addEventListener("DOMContentLoaded", function () {
  const temperatureDisplay = document.getElementById("temperature-display");
  const rpmDisplay = document.getElementById("rpm-display");
  const dutyCycleSlider_luz = document.getElementById("duty-cycle-slider-luz");
  // const dutyCycleSlider_fan = document.getElementById("duty-cycle-slider-fan"); // Comentado ya que no está en el HTML
  const watsDisplay = document.getElementById("wats-display");

  // Configuración inicial del gráfico
  const ctx = document.getElementById('myChart').getContext('2d');
  const data = {
    datasets: [{
      label: 'Temperatura (°C)',
      data: [], // Datos en formato { x: tiempo, y: temperatura }
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 2,
      fill: false,
      yAxisID: 'y',
    },
    {
      label: 'RPM',
      data: [], // Datos en formato { x: tiempo, y: rpm }
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2,
      fill: false,
      yAxisID: 'y1',
    }]
  };

  const myChart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'Tiempo (s)'
          },
          beginAtZero: true
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Temperatura (°C)'
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'RPM'
          },
          grid: {
            drawOnChartArea: false, // Solo mostrar una rejilla
          },
        },
      }
    }
  });

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

      if (temperature !== null && rpm !== null) {
        // Incrementar el contador de tiempo
        timeCounter += 1; // Suponiendo que recibes datos cada segundo

        // Agregar nuevos datos al gráfico
        data.datasets[0].data.push({ x: timeCounter, y: temperature });
        data.datasets[1].data.push({ x: timeCounter, y: rpm });

        // Limitar el número de puntos en el gráfico (opcional)
        const maxDataPoints = 50;
        if (data.datasets[0].data.length > maxDataPoints) {
          data.datasets[0].data.shift();
          data.datasets[1].data.shift();
        }

        myChart.update();

        // Guardar en CSV
        const date = new Date().toISOString(); // Puedes usar la marca de tiempo real si lo deseas
        appendToCSV(date, rpm, temperature, power);
      }
    });
  });

  dutyCycleSlider_luz.addEventListener("input", function () {
    const dutyCycle_luz = dutyCycleSlider_luz.value;
    console.log("Light Duty Cycle:", dutyCycle_luz);
    port.write(`L${dutyCycle_luz}\n`);

    const wats = map(dutyCycle_luz, 0, 255, 0, 18.6);
    power = wats.toFixed(2);
    watsDisplay.textContent = `${power} W`;
    console.log(`Wats: ${wats}`);
  });

  // Si tienes el control del ventilador, descomenta y ajusta según sea necesario
  /*
  dutyCycleSlider_fan.addEventListener("input", function () {
    const dutyCycle_fan = dutyCycleSlider_fan.value;
    console.log("Fan Duty Cycle:", dutyCycle_fan);
    port.write(`F${dutyCycle_fan}\n`);
  });
  */

});
