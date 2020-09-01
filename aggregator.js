const aggregator = {};

aggregator.initialize = function(sensors) {
  this.sensors = sensors;
  return this;
}

const reportData = ({AQI, temperature}, prefix) => {
  let output = "";
  if(AQI) {
    output += `${prefix} AQI: ${AQI}\n`;
  }
  if(temperature) {
    output += `${prefix} Temperature: ${temperature}\n`;
  }
  return output
}

const capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

aggregator.report = async function() {
  let report = ""

  // TODO: make the requests silmultaneously
  for (const [key, value] of Object.entries(this.sensors)) {
    report += reportData(await value.getData(), capitalize(key));
  }
  return report;
};

aggregator.shouldOpenWindow = async function(thresholds) {
  if(!this.sensors.outdoor || !this.sensors.indoor) { 
    console.log("wrong sensors");
    return false;
  }

  // TODO: make the requests silmultaneously
  let outdoorSensorData = await this.sensors.outdoor.getData();
  let indoorSensorData = await this.sensors.indoor.getData();
  if(
    indoorSensorData.temperature < thresholds.lowTemperature ||
    outdoorSensorData.AQI > thresholds.AQI
  ) {
    return false;
  }
  return outdoorSensorData.temperature < indoorSensorData.temperature;
};

module.exports = aggregator;
