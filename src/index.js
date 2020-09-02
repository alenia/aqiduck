const SlackReporter = require('./slackReporter.js');

const index = async () => {
  SlackReporter.subscribe();
};

module.exports = index;

index();
