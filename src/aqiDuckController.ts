import SlackReporter from './slackReporter';
import Aggregator from './aggregator';

export const ControllerRegistry: Record<string, AqiDuckController> = {};

export default class AqiDuckController {
  aggregator: Aggregator;
  slackReporter: SlackReporter;
  channelId: string;
  error: boolean;
  interval: ReturnType<typeof setInterval>;

  //TODO: I can't figure out how to test this if they type is SlackReporter
  constructor(slackReporter: any) {
    this.slackReporter = slackReporter;
    this.channelId = slackReporter.id;
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
    if(!this.aggregator) { return }
    const monitoringFn = () => {
      this.aggregator.monitorAndNotify().then((notification) => {
        if(!notification) { return }
        this.slackReporter.postMessage(notification);
      }).catch((error) => {
        console.log("error getting aggregator notification", this.getChannelName(), error)
      })
    }
    this.interval = setInterval(monitoringFn, 5000);
  }

  report() : void {
    if(!this.aggregator) {
      this.slackReporter.postMessage("I'm not set up to give you a report!");
      return
    }
    this.aggregator.report().then((report) => {
      this.slackReporter.postMessage(report);
    }).catch((error) => {
      console.log("error getting aggregator report", this.getChannelName(), error)
    });
  }

  docs() : string {
    return `
You can ask me to:
  reload
  report
  stop monitoring
  resume monitoring`
  }

  //TODO figure out slack event type
  async handleChannelTopicChange(event: any) : Promise<void> {
    this.reload();
  }

  async reload() : Promise<void> {
    this.cleanup();
    await this.slackReporter.postMessage("Reloading configuration");
    this.start();
  }

  //TODO figure out slack event type
  handleAppMention(event : any) : void {
    if(event.text.match(/(\bhello\b|\bhi\b)/i)) {
      this.slackReporter.postMessage("Hello there!" + this.docs());
      return;
    }

    if(event.text.match(/report/i)) {
      this.report()
      return;
    }

    if(event.text.match(/(\bload\b|\breload\b)/i)) {
      this.reload()
      return;
    }

    if(event.text.match(/stop monitoring/i)) {
      if(!this.interval) {
        this.slackReporter.postMessage('Nothing to stop.');
        return;
      }
      this.cleanup();
      this.slackReporter.postMessage('Monitoring stopped.');
      return;
    }

    if(event.text.match(/resume monitoring/i)) {
      if(this.interval) {
        this.slackReporter.postMessage('Monitoring is already running');
        return;
      }
      if(!this.aggregator) {
        this.slackReporter.postMessage('Nothing to monitor');
        return;
      }
      this.monitorAndNotify();
      this.slackReporter.postMessage('Monitoring resumed');
      this.report();
      return;
    }

    this.slackReporter.postMessage("I'm not sure how to help with that." + this.docs());
  }

  greet() : void {
    console.log('saying hello to ', this.getChannelName());
    this.slackReporter.postMessage("Hello I'm AQIDuck. Let me tell you about the air quality.");
  }

  onExit() : Promise<void> {
    console.log('saying goodbye to ', this.getChannelName());
    return this.slackReporter.postMessage("Ducking out. See you!");
  }

  cleanup() : void {
    clearInterval(this.interval);
    this.interval = undefined;
  }

  async start() : Promise<void> {
    await this.setupAggregator();
    if(this.error) { return }
    if(process.env.NODE_ENV==="test") {
      this.report();
    } else {
      this.report();
      this.monitorAndNotify();
    }

  }

  static async startForReporter(slackReporter: SlackReporter) : Promise<AqiDuckController> {
    const controller = new AqiDuckController(slackReporter);
    ControllerRegistry[slackReporter.id] = controller;
    await controller.greet();
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
