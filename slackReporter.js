const { WebClient } = require('@slack/web-api');
const secrets = require('./secrets.json');

const web = new WebClient(secrets.SLACK_TOKEN);

const reporter = {};

reporter.subscribe = (text) => {
  (() => {
    web.users.conversations()
    .then(({ channels }) => {
      channels.forEach((c) => {
        //web.conversations.info({channel: c.id})
        //.then(({ channel }) => {
          // TODO parse JSON in channel.topic.value between ** in order to determine sensor name and type
          // I want to make sure to do this part with good test coverage because of all the promises
          // And so that I can document what the channel topic should look like
        //}).catch((error) => { console.log('ERROR', error) });
        web.chat.postMessage({
          channel: c.id,
          text,
        }).then((s) => { console.log(`Message posted in ${c.name}!`) })
        .catch((e) => { console.log(`ERROR posting in ${c.name}`, e) });
      })
    })
    .catch((error) => { console.log('ERROR', error) });
    console.log('Done');
  })();
};

module.exports = reporter;
