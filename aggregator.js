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

module.exports = aggregator;
