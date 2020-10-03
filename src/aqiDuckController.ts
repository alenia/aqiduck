import SlackReporter from './slackReporter';
import Aggregator from './aggregator';

export default class AqiDuckController {
  aggregator: Aggregator;
  slackReporter: SlackReporter;
  error: boolean;

  constructor(slackReporter: SlackReporter) {
    this.slackReporter = slackReporter;
    this.error = false;
  }

  async setupAggregator() : Promise<void> {
    const aggregatorConfig = await this.slackReporter.getConfig();
    if(!aggregatorConfig) {
      console.log('Trying to set up AQIDuck but there is no aggregator config', this.getChannelName());
      this.slackReporter.postMessage('Trying to set up AQIDuck but there is no aggregator config');
      this.error = true;
      return;
    }
    //TODO: validate config here
    this.aggregator = Aggregator.fromConfig(aggregatorConfig);
    if(!this.aggregator) {
      console.log(`Error setting up reporter from config ${aggregatorConfig}`, this.getChannelName());
      this.slackReporter.postMessage(`Error setting up reporter from config ${aggregatorConfig}`);
      this.error = true;
      return;
    }
  }

  getChannelName() : string {
    return this.slackReporter.getChannelName();
  }

  monitorAndNotify() : void {
    this.aggregator.monitorAndNotify().then((notification) => {
      if(!notification) { return }
      this.slackReporter.postMessage(notification);
    }).catch((error) => {
      console.log("error getting aggregator notification", this.getChannelName(), error)
    });
  }

  report() : void {
    this.aggregator.report().then((report) => {
      this.slackReporter.postMessage(report);
    }).catch((error) => {
      console.log("error getting aggregator report", this.getChannelName(), error)
    });
  }

  onStart() : void {
    console.log('saying hello to ', this.getChannelName());
    this.slackReporter.postMessage("Hello I'm AQIDuck. Let me tell you about the air quality.");
  }

  onExit() : Promise<void> {
    console.log('saying goodbye to ', this.getChannelName());
    return this.slackReporter.postMessage("Ducking out. See you!");
  }

  async start() : Promise<void> {
    await this.setupAggregator();
    if(this.error) { return }
    this.onStart();
    if(process.env.NODE_ENV==="test") {
      this.report();
    } else {
      this.report();
      setInterval(() => this.monitorAndNotify(), 5000)
    }

  }

  static async startForReporter(slackReporter: SlackReporter) : Promise<AqiDuckController> {
    const controller = new AqiDuckController(slackReporter);
    await controller.start();
    return controller;
  }

  static async subscribeAll() : Promise<void> {
    const reporters = await SlackReporter.subscribeAll();
    const controllerPromises = reporters.map(AqiDuckController.startForReporter);

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
