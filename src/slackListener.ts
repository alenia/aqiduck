// Initialize using signing secret from environment variables
const { createEventAdapter } = require('@slack/events-api');
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
const port = process.env.PORT || 3000;

export default function attachListeners() : void {
  // Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
  slackEvents.on('app_mention', (event : any) => {
    console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
  });

  // Handle errors (see `errorCodes` export)
  slackEvents.on('error', console.error);

  // Start a basic HTTP server
  slackEvents.start(port).then(() => {
    // Listening on path '/slack/events' by default
    console.log(`server listening on port ${port}`);
  });
}
