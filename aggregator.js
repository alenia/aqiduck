const aggregator = {};

aggregator.initialize = function({ outdoorSensor, indoorSensor }) {
  this.outdoorSensor = outdoorSensor;
  this.indoorSensor = indoorSensor;
  return this;
}

let reportData = ({AQI, temperature}, prefix) => {
  let output = "";
  if(AQI) {
    output += `${prefix} AQI: ${AQI}\n`;
  }
  if(temperature) {
    output += `${prefix} Temperature: ${temperature}\n`;
  }
  return output
}

aggregator.report = function() {
  return reportData(this.outdoorSensor.getData(), "Outdoor") +
    reportData(this.indoorSensor.getData(), "Indoor");
};

aggregator.shouldOpenWindow = function(thresholds) {
  let outdoorSensorData = this.outdoorSensor.getData();
  let indoorSensorData = this.indoorSensor.getData();
  if(
    indoorSensorData.temperature < thresholds.lowTemperature ||
    outdoorSensorData.AQI > thresholds.AQI
  ) {
    return false;
  }
  return outdoorSensorData.temperature < indoorSensorData.temperature;
};

module.exports = aggregator;
