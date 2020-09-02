const slackReporter = require('./slackReporter.js');
const secrets = require('./secrets.json');

const index = async () => {
  slackReporter.subscribe();
};

module.exports = index;

index();
