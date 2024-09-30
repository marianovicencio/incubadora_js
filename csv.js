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
