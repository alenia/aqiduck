import SlackReporter from './slackReporter.js';

export default async function index() : Promise<void> {
  SlackReporter.subscribeAll({
    onCreate: (reporter: SlackReporter) => reporter.report()
  });
}

index();
