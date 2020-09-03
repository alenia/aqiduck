const secrets = require('../secrets.json'); //eslint-disable-line
import Aggregator from './aggregator';
import { WebClient, WebAPICallResult } from '@slack/web-api';

interface channelWithTopic {
  name: string;
  id: string;
  topic: {
    value: string;
  }
}

interface channelListResult extends WebAPICallResult {
  channels: Array<{
    name: string;
    id: string;
  }>
}

interface channelInfoResult extends WebAPICallResult {
  channel: channelWithTopic;
}


interface reporterConstructorArgs {
  aggregator: Aggregator;
  channel: channelWithTopic;
}


const web = new WebClient(secrets.SLACK_TOKEN);

class SlackReporter {
  channel: channelWithTopic;
  aggregator: Aggregator;

  constructor({ aggregator, channel } : reporterConstructorArgs) {
    this.channel = channel;
    this.aggregator = aggregator;
  }

  postMessage(text: string) : void {
    //TODO: Sometimes I get things that aren't strings from the purpleAir JSON. fix this there instead of type checking
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
    }).then(() => { console.log(`Message posted in ${this.channel.name}!`) })
    .catch((e: Error) => { console.log(`ERROR posting in ${this.channel.name}`, e) });
  }

  //TODO: this method should be private but I want to test it
  static subscribeToChannelFromInfo(channel : channelWithTopic) : SlackReporter | undefined {
    const topic = channel.topic.value;
    const config = topic.split('***')[1];
    if(!config) {
      console.log(`no config for channel ${channel.name}`, channel.topic);
      return;
    }

    const aggregator = Aggregator.fromConfig(config);

    return new SlackReporter({ aggregator, channel });
  }

  static async subscribeAll(): Promise<Array<Promise<SlackReporter>>> {
    const { channels } = await web.users.conversations() as channelListResult;
    return channels.map(async (c) => {
      const { channel: channelInfo } = await web.conversations.info({channel: c.id}) as channelInfoResult;
      return SlackReporter.subscribeToChannelFromInfo(channelInfo);
    })
  }
}

export default SlackReporter;
