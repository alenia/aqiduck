const { WebClient } = require('@slack/web-api');
const secrets = require('../secrets.json');
import Aggregator from './aggregator';

interface channel {
  name: string;
  id: string;
  topic?: {
    value: string;
  }
}

const web = new WebClient(secrets.SLACK_TOKEN);

class SlackReporter {
  channel: channel;
  aggregator: Aggregator;

  constructor({ aggregator, channel } : { aggregator: Aggregator, channel: channel }) {
    this.channel = channel;
    this.aggregator = aggregator;
  }

  report() : void {
    this.aggregator.report().then((report) => {
      this.postMessage(report);
    }).catch((error) => {
      console.log("error getting aggregator report", this.channel, error)
    });
  }

  postMessage(text: any) : void {
    if(typeof(text) !== "string") {
      console.log("Message not a string, not posting!", text, typeof(text));
      return;
    }

    if(process.env.SILENT) {
      console.log(`Would post to ${this.channel.name}:`);
      console.log(text);
      return;
    }

    web.chat.postMessage({
      channel: this.channel.id,
      text,
    }).then((s: any) => { console.log(`Message posted in ${this.channel.name}!`) })
    .catch((e: any) => { console.log(`ERROR posting in ${this.channel.name}`, e) });
  }

  static subscribeToChannelFromInfo(channel: channel) : SlackReporter | undefined {
    const topic = channel.topic.value;
    const config = topic.split('***')[1];
    if(!config) {
      console.log(`no config for channel ${channel.name}`, channel.topic);
      return;
    }

    const aggregator = Aggregator.fromConfig(config);

    const reporter = new SlackReporter({ aggregator, channel });

    reporter.report();

    return reporter;
  }

  static subscribe() : void {
    (() => {
      web.users.conversations()
        .then(({ channels } : { channels: Array<channel> }) => {
          channels.forEach((c) => {
            web.conversations.info({channel: c.id})
              .then(({ channel } : { channel : channel }) => {
                SlackReporter.subscribeToChannelFromInfo(channel)
              }).catch((error: any) => { console.log('ERROR', error) });
          })
        })
        .catch((error: any) => { console.log('ERROR', error) });
    })();
  };
}

export default SlackReporter;
