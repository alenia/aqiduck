import SlackReporter from './slackReporter.js';
import Aggregator from './aggregator';

export default class AqiDuckController {
  aggregator: Aggregator;
  slackReporter: SlackReporter;

  constructor({ slackReporter, aggregator } : { slackReporter: SlackReporter, aggregator: Aggregator }) {
    this.slackReporter = slackReporter
    this.aggregator = aggregator
  }

  report() : void {
    this.aggregator.report().then((report) => {
      this.slackReporter.postMessage(report);
    }).catch((error) => {
      console.log("error getting aggregator report", this.slackReporter.channel, error)
    });
  }

  static async subscribeAll() : Promise<void> {
    const reporters = await SlackReporter.subscribeAll();
    reporters.forEach(async (slackReporter) => {
      const aggregatorConfig = await slackReporter.getConfig();
      //TODO: validate config here
      const aggregator = Aggregator.fromConfig(aggregatorConfig);
      const controller = new AqiDuckController({ slackReporter, aggregator });
      controller.report()
    })
  }
}
