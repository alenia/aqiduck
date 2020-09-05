import SlackReporter from './slackReporter';
import Aggregator from './aggregator';

export default class AqiDuckController {
  aggregator: Aggregator;
  slackReporter: SlackReporter;

  constructor({ slackReporter, aggregator } : { slackReporter: SlackReporter, aggregator: Aggregator }) {
    this.slackReporter = slackReporter
    this.aggregator = aggregator
  }

  monitorAndNotify() : void {
    this.aggregator.monitorAndNotify().then((notification) => {
      if(!notification) { return }
      this.slackReporter.postMessage(notification);
    }).catch((error) => {
      console.log("error getting aggregator notification", this.slackReporter.channel, error)
    });
  }

  report() : void {
    this.aggregator.report().then((report) => {
      this.slackReporter.postMessage(report);
    }).catch((error) => {
      console.log("error getting aggregator report", this.slackReporter.channel, error)
    });
  }

  introduce() : void {
    this.slackReporter.postMessage("Hello I'm AQIDuck. Let me tell you about the air quality.");
  }

  start() : void {
    this.introduce();
    if(process.env.NODE_ENV==="test") {
      console.log("testing");
      this.report();
    } else {
      this.report();
      setInterval(() => this.monitorAndNotify(), 5000)
    }
  }

  static async subscribeAll() : Promise<void> {
    const reporters = await SlackReporter.subscribeAll();
    reporters.forEach(async (slackReporter) => {
      const aggregatorConfig = await slackReporter.getConfig();
      //TODO: validate config here
      const aggregator = Aggregator.fromConfig(aggregatorConfig);
      const controller = new AqiDuckController({ slackReporter, aggregator });
      controller.start()
    })
  }
}
