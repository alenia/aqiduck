const reportData = function({AQI, temperature}, prefix) {
  let output = "";
  if(AQI) {
    output += `${prefix} AQI: ${AQI}\n`;
  }
  if(temperature) {
    output += `${prefix} Temperature: ${temperature}\n`;
  }
  return output;
}

class Aggregator {
  constructor(sensors) {
    this.sensors = sensors;
    return this;
  }

  async report() {
    const dataReports = this.sensors.map(async (s) => {
      const data = await s.sensor.getData();
      return reportData(data, s.name);
    })

    const strs = await Promise.all(dataReports);
    return strs.join();
  }
}

module.exports = Aggregator;
