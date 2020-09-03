import SlackReporter from './slackReporter.js';

export default async function index() {
  SlackReporter.subscribe();
};

index();
