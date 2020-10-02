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

  onSetup() : void {
    console.log('saying hello to ', this.slackReporter.getChannelName());
    this.slackReporter.postMessage("Hello I'm AQIDuck. Let me tell you about the air quality.");
  }

  onExit() : Promise<void> {
    console.log('saying goodbye to ', this.slackReporter.getChannelName());
    return this.slackReporter.postMessage("Ducking out. See you!");
  }

  start() : void {
    this.onSetup();
    if(process.env.NODE_ENV==="test") {
      this.report();
    } else {
      this.report();
      setInterval(() => this.monitorAndNotify(), 5000)
    }

  }

  static async subscribeToAggregatorsForReporter(slackReporter: SlackReporter) : Promise<AqiDuckController> {
    const aggregatorConfig = await slackReporter.getConfig();
    if(!aggregatorConfig) {
      slackReporter.postMessage(`Trying to set up AQIDuck but there is no aggregator config`);
      return;
    }
    //TODO: validate config here
    const aggregator = Aggregator.fromConfig(aggregatorConfig);
    if(!aggregator) {
      slackReporter.postMessage(`Error setting up reporter from config ${aggregatorConfig}`)
      return;
    }
    const controller = new AqiDuckController({ slackReporter, aggregator });
    controller.start();
    return controller;
  }

  static async subscribeAll() : Promise<void> {
    const reporters = await SlackReporter.subscribeAll();
    const controllerPromises = reporters.map(AqiDuckController.subscribeToAggregatorsForReporter);

    process.on('SIGINT', async function() {
      console.log("Caught interrupt signal");
      try {
        await Promise.all(controllerPromises.map((cp) => cp.then((c) => c.onExit())));
        process.exit();
      } catch {
        console.log("error in postMessage, exiting");
        process.exit();
      }
    });
  }
}
