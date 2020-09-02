const SlackReporter = require('./slackReporter.js');

export default async function index() {
  SlackReporter.subscribe();
};

index();
