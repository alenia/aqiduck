const { WebClient } = require('@slack/web-api');
const secrets = require('./secrets.json');

const web = new WebClient(secrets.SLACK_TOKEN);

const reporter = {};

reporter.post = (text) => {
  (async () => {

    try {
      // Use the `chat.postMessage` method to send a message from this app
      await web.chat.postMessage({
        channel: '#aerobot',
        text,
      });
    } catch (error) {
      console.log(error);
    }

    console.log('Message posted!');
  })();
};

module.exports = reporter;
