jest.genMockFromModule('@slack/web-api');
jest.mock('@slack/web-api');

import { WebClient } from '@slack/web-api';

//const MockWebClient = WebClient as jest.Mock<WebClient>
const MockWebClient = WebClient as any;

let mockChannelList : Array<any> = [];
let mockChannelTopic = "";

const mockWebClient = {
  chat: {
    postMessage: jest.fn(() => Promise.resolve())
  },
  conversations: {
    info: jest.fn(() => {
      return Promise.resolve({
        channel: {
          id: "mock channel ID",
          name: "mock channel name",
          topic: {
            value: mockChannelTopic
          }
        }
      })
    })
  },
  users: {
    conversations: jest.fn(() => {
      return Promise.resolve({
        channels: mockChannelList
      })
    })
  }
}

MockWebClient.mockImplementation(() => mockWebClient);

import SlackReporter from './slackReporter';

function flushPromises() {
    return new Promise(resolve => setImmediate(resolve));
}

const basicChannel = {
  name: "this is my name",
  id: "this is my id"
}

describe("SlackReporter instances", () => {
  describe("postMessage", () => {
    it("Posts a string to slack", async() => {
      expect.assertions(1);
      const reporter = new SlackReporter(basicChannel);
      await reporter.postMessage("My slack message");
      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith({"channel": "this is my id", "text": "My slack message"});
    });
    it.todo("Does not post a string if the env is silent");
    it.todo("Errors properly if the message is not a string");
  });

  describe("getConfig", () => {
    it("returns the part of the topic that pertains to AqiDuck", async () => {
      expect.assertions(1);
      const reporter = new SlackReporter(basicChannel);
      mockChannelTopic = 'Here is some random information to ignore. ***{"sensors": [{"name": "readThisJSON"}]}***'

      //console.log(WebClient);
      const config = await reporter.getConfig();
      expect(config).toEqual('{"sensors": [{"name": "readThisJSON"}]}')
    });
  });
});

describe(".subscribeAll", () => {
  it.todo('add assertions');
  it('should not blow up', async () => {
    mockChannelList = [
      basicChannel
    ]
    await SlackReporter.subscribeAll();
    await flushPromises();
  });
});
