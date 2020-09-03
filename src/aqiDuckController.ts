import SlackReporter from './slackReporter.js';
import Aggregator from './aggregator';

export default class AqiDuckController {
  aggregator: Aggregator;
  slackReporter: SlackReporter;

  constructor({ slackReporter, aggregator } : { slackReporter: SlackReporter, aggregator: Aggregator }) {
    this.slackReporter = slackReporter
    this.aggregator = aggregator
  }

  static async subscribeAll() : Promise<void> {
    const reporters = await SlackReporter.subscribeAll();
    reporters.forEach(async (reporterPromise) => {
      (await reporterPromise).report()
    })
  }
}
