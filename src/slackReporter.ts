import { WebClient, WebAPICallResult } from '@slack/web-api';

interface basicChannel {
  name: string;
  id: string;
}

interface channelListResult extends WebAPICallResult {
  channels: Array<basicChannel>
}

interface channelInfoResult extends WebAPICallResult {
  channel: {
    name: string;
    id: string;
    topic: {
      value: string;
    }
  }
}

const web = new WebClient(process.env.SLACK_TOKEN);

class SlackReporter {
  channel: basicChannel;
  id: string;
  topic: {
    value: string;
  };

  constructor(channel : basicChannel) {
    this.channel = channel;
    this.id = channel.id;
  }

  async postMessage(text: string) : Promise<void> {
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

    return web.chat.postMessage({
      channel: this.channel.id,
      text,
    }).then(() => { console.log(`Message posted in ${this.channel.name}!`) })
    .catch((e: Error) => { console.log(`ERROR posting in ${this.channel.name}`, e) });
  }

  async getConfig() : Promise<string | undefined> {
    const { channel: channelInfo } = await web.conversations.info({channel: this.channel.id}) as channelInfoResult;
    this.channel.name = channelInfo.name;
    const topic = channelInfo.topic;
    const config = topic.value.split('***')[1];
    if(!config) {
      console.log(`no config for channel ${this.channel.name}`, topic);
      return;
    }

    return config;
  }

  getChannelName() : string {
    return this.channel.name;
  }

  static async subscribeAll(): Promise<Array<SlackReporter>> {
    const { channels } = await web.users.conversations() as channelListResult;
    return channels.map((channel) => {
      return new SlackReporter(channel);
    })
  }
}

export default SlackReporter;
