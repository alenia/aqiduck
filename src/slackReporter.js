const { WebClient } = require('@slack/web-api');
const secrets = require('../secrets.json');
const Aggregator = require('./aggregator');

const web = new WebClient(secrets.SLACK_TOKEN);

class SlackReporter {
  constructor({ aggregator, channel }) {
    this.channel = channel;
    this.aggregator = aggregator;
  }

  report() {
    this.aggregator.report().then((report) => {
      this.postMessage(report);
    }).catch((error) => {
      console.log("error getting aggregator report", this.channel, error)
    });
  }

  postMessage(text) {
    if(typeof(text) !== "string") {
      console.log("Message not a string, not posting!", text, typeof(text));
      return;
    }

    web.chat.postMessage({
      channel: this.channel.id,
      text,
    }).then((s) => { console.log(`Message posted in ${this.channel.name}!`) })
    .catch((e) => { console.log(`ERROR posting in ${this.channel.name}`, e) });
  }
}

SlackReporter.subscribeToChannelFromInfo = (channel) => {
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

SlackReporter.subscribe = (text) => {
  (() => {
    web.users.conversations()
    .then(({ channels }) => {
      channels.forEach((c) => {
        web.conversations.info({channel: c.id})
        .then(({ channel }) => {
          SlackReporter.subscribeToChannelFromInfo(channel)
        }).catch((error) => { console.log('ERROR', error) });
      })
    })
    .catch((error) => { console.log('ERROR', error) });
  })();
};

module.exports = SlackReporter;
