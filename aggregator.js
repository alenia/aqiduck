const aggregator = {};

aggregator.initialize = function({ outdoorSensor, indoorSensor }) {
  this.outdoorSensor = outdoorSensor;
  this.indoorSensor = indoorSensor;
  return this;
}

let reportData = ({AQI, temperature}, prefix) => {
  let output = "";
  if(AQI) {
    output += `${prefix} AQI: ${AQI}`;
  }
  if(temperature) {
    output += `${prefix} Temperature: ${temperature}`;
  }
  return output
}
aggregator.report = function() {
  return reportData(this.outdoorSensor.getData(), "Outdoor") +
    '\n' +
    reportData(this.indoorSensor.getData(), "Indoor");
}

module.exports = aggregator;
