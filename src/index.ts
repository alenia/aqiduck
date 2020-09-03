import SlackReporter from './slackReporter.js';

export default async function index() : Promise<void> {
  SlackReporter.subscribe();
}

index();
