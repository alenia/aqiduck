const { WebClient } = require('@slack/web-api');
const secrets = require('./secrets.json');
const Aggregator = require('./aggregator');

const web = new WebClient(secrets.SLACK_TOKEN);

const reporter = {};

reporter.subscribeToChannelFromInfo = (channel) => {
  const topic = channel.topic.value;
  const config = topic.split('***')[1];
  if(!config) {
    console.log(`no config for channel ${channel.name}`, channel.topic);
    return;
  }

  aggregator = Aggregator.fromConfig(config);

  aggregator.report().then((report) => {
    reporter.postMessage(channel, report);
  }).catch((error) => {
    console.log("error getting aggregator report", config, error)
  });
}

reporter.postMessage = (channel, text) => {
  if(typeof(text) !== "string") {
    console.log("Message not a string, not posting!", text, typeof(text));
    return;
  }

  web.chat.postMessage({
    channel: channel.id,
    text,
  }).then((s) => { console.log(`Message posted in ${channel.name}!`) })
  .catch((e) => { console.log(`ERROR posting in ${channel.name}`, e) });
}

reporter.subscribe = (text) => {
  (() => {
    web.users.conversations()
    .then(({ channels }) => {
      channels.forEach((c) => {
        web.conversations.info({channel: c.id})
        .then(({ channel }) => {
          reporter.subscribeToChannelFromInfo(channel)
        }).catch((error) => { console.log('ERROR', error) });
      })
    })
    .catch((error) => { console.log('ERROR', error) });
  })();
};

module.exports = reporter;
