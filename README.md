# AQIDuck (WIP)
![Logo](assets/aqiduck.jpg)

This will:

* Pull data from PurpleAir
* Report to Slack about air quality and temperature based on the channel topic
* Monitor AQI to let you know when it's safe to go outside or no longer safe to go outside

Future additions:

* Pull data from Awair and Google Home (once Google Home becomes available for individual use)
* Monitor temp on an outdoor and an indoor sensor to let you know when it's cool enough to open the windows to cool down the house

To set up:

* create a slackbot with the permissions `app_mentions:read`, `channels:read`, `chat:write`
* invite the slackbot to various channels
* set the channel topic to include a JSON string about which PurpleAir sensors should be monitored

To find your PurpleAir sensor ID:

* On the PurpleAir map, click on the sensor you're interested in
* At the bottom of the widget with the air quality, hover over "Get This Widget"
* The ID in the div of the widget contains the sensor ID
![How to find PurpleAir ID](assets/purple_air_id.png)

