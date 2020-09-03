jest.genMockFromModule('@slack/web-api');

jest.mock('./aggregator', () => {
  return { fromConfig: jest.fn().mockImplementation(() => {return {
    report: jest.fn().mockImplementation(() => { return Promise.resolve() })
  }}) };
});
import Aggregator from './aggregator';

import SlackReporter from './slackReporter';

it('.subscribe should not blow up', () => {
  SlackReporter.subscribe();
});

describe("subscribeToChannelFromInfo", () => {
  it('Should create a aggregator based on the JSON in the topic', () => {
    SlackReporter.subscribeToChannelFromInfo({
      id: "123",
      name: "thing",
      topic: {
        value: 'Here is some random information to ignore. ***{"sensors": [{"name": "readThisJSON"}]}***'
      }
    });
    expect(Aggregator.fromConfig).toHaveBeenCalledWith('{"sensors": [{"name": "readThisJSON"}]}');
  });
});

