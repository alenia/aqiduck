// Initialize using signing secret from environment variables
const { createEventAdapter } = require('@slack/events-api'); //eslint-disable-line
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
const port = process.env.PORT || 3000;
import AqiDuckController from './aqiDuckController';

export default function attachListeners() : void {
  if(process.env.NODE_ENV === "test") {
    console.log('not starting a server in test');
    return
  }

  slackEvents.on('app_mention', async (event : any) => {
    console.log(`Received an app_mention event: user ${event.user} in channel ${event.channel} says ${event.text}`);
    const controller = await AqiDuckController.findOrCreate(event.channel);
    controller.handleAppMention(event);
  });

  // Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.channels
  slackEvents.on('message', async (event : any) => {
    if(event.subtype === 'channel_topic') {
      console.log(`Received a channel topic change event: user ${event.user} in channel ${event.channel} says ${event.text}`);
      const controller = await AqiDuckController.findOrCreate(event.channel);
      controller.handleChannelTopicChange();
    }
  });

  slackEvents.on('channel_left', (event : any) => {
    console.log(`Received a channel_left event ${event.channel}`);
    AqiDuckController.unregister(event.channel);
  });

  slackEvents.on('member_joined_channel', async (event : any) => {
    console.log(`Received a member_joined_channel event ${event.channel}`);
    console.log(event);
    await AqiDuckController.findOrCreate(event.channel);
  });

  // Handle errors (see `errorCodes` export)
  slackEvents.on('error', console.error);

  // Start a basic HTTP server
  console.log(`attempting to start a server with port ${port}`);
  slackEvents.start(port).then(() => {
    // Listening on path '/slack/events' by default
    console.log(`server listening on port ${port}`);
  });
}
