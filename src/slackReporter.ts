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
  topic: {
    value: string;
  };

  constructor(channel : basicChannel) {
    this.channel = channel;
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

  async getConfig() : Promise<string | undefined> {
    const { channel: channelInfo } = await web.conversations.info({channel: this.channel.id}) as channelInfoResult;
    this.topic = channelInfo.topic;
    const config = this.topic.value.split('***')[1];
    if(!config) {
      console.log(`no config for channel ${this.channel.name}`, this.topic);
      return;
    }

    return config;
  }

  static async subscribeAll(): Promise<Array<SlackReporter>> {
    const { channels } = await web.users.conversations() as channelListResult;
    return channels.map((channel) => {
      return new SlackReporter(channel);
    })
  }
}

export default SlackReporter;
