const mockSensor = require('./mockSensor.js');
const aggregator = require('./aggregator.js');
const slackReporter = require('./slackReporter.js');

const index = async () => {
  aggregator.initialize({
    outdoor: mockSensor
  });

  slackReporter.post(await aggregator.report());
};

module.exports = index;

index();
