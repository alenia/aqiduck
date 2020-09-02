jest.genMockFromModule('@slack/web-api');
const Aggregator = require('./aggregator');

jest.mock('./aggregator', () => {
  return { fromConfig: jest.fn().mockImplementation(() => {return {
    report: jest.fn().mockImplementation(() => { return Promise.resolve() })
  }}) };
});

const reporter = require('./slackReporter');

it('.subscribe should not blow up', () => {
  reporter.subscribe();
});

describe("subscribeToChannelFromInfo", () => {
  it('Should create a aggregator based on the JSON in the topic', () => {
    reporter.subscribeToChannelFromInfo({
      id: "123",
      name: "thing",
      topic: {
        value: 'Here is some random information to ignore. ***{"sensors": [{"name": "readThisJSON"}]}***'
      }
    });
    expect(Aggregator.fromConfig).toHaveBeenCalledWith('{"sensors": [{"name": "readThisJSON"}]}');
  });
});

