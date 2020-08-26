const mockSensor = require('./mockSensor.js');
const aggregator = require('./aggregator.js');
const slackReporter = require('./slackReporter.js');

const index = () => {
  aggregator.initialize({
    indoorSensor: mockSensor,
    outdoorSensor: mockSensor
  });

  slackReporter.post(aggregator.report());
};

module.exports = index;

index();
