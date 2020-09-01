const createPurpleAirSensor = require('./purpleAirSensor.js');
const aggregator = require('./aggregator.js');
const slackReporter = require('./slackReporter.js');
const secrets = require('./secrets.json');

const index = async () => {
  aggregator.initialize({
    outdoor: createPurpleAirSensor(secrets.PURPLE_AIR_SENSOR_ID)
  });

  slackReporter.post(await aggregator.report());
};

module.exports = index;

index();
