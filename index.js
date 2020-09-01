const PurpleAirSensor = require('./purpleAirSensor.js');
const Aggregator = require('./aggregator.js');
const slackReporter = require('./slackReporter.js');
const secrets = require('./secrets.json');

const index = async () => {
  const aggregator = new Aggregator({
    outdoor: new PurpleAirSensor(secrets.PURPLE_AIR_SENSOR_ID)
  });

  slackReporter.subscribe(await aggregator.report());
};

module.exports = index;

index();
