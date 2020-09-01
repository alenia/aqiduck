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

aggregator.report = function() {
  let report = ""
  for (const [key, value] of Object.entries(this.sensors)) {
    report += reportData(value.getData(), capitalize(key));
  }
  return report;
};

aggregator.shouldOpenWindow = function(thresholds) {
  if(!this.sensors.outdoor || !this.sensors.indoor) { 
    console.log("wrong sensors");
    return false;
  }
  let outdoorSensorData = this.sensors.outdoor.getData();
  let indoorSensorData = this.sensors.indoor.getData();
  if(
    indoorSensorData.temperature < thresholds.lowTemperature ||
    outdoorSensorData.AQI > thresholds.AQI
  ) {
    return false;
  }
  return outdoorSensorData.temperature < indoorSensorData.temperature;
};

module.exports = aggregator;
