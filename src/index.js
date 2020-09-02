const slackReporter = require('./slackReporter.js');

const index = async () => {
  slackReporter.subscribe();
};

module.exports = index;

index();
