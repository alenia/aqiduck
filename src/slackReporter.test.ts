jest.genMockFromModule('@slack/web-api');

//jest.mock('./aggregator', () => {
  //return { fromConfig: jest.fn().mockImplementation(() => {return {
    //report: jest.fn().mockImplementation(() => { return Promise.resolve() })
  //}}) };
//});
//import Aggregator from './aggregator';

import SlackReporter from './slackReporter';

describe("SlackReporter instances", () => {
  describe("postMessage", () => {
    it.todo("Posts a string to slack");
  });
});

describe(".subscribeAll", () => {
  it('should not blow up', () => {
    SlackReporter.subscribeAll(); //TODO this should be async
  });
});

describe(".subscribeToChannelFromInfo MOVE THIS TEST", () => {
  it.todo('Should create a aggregator based on the JSON in the topic')
    //, () => {
    //SlackReporter.subscribeToChannelFromInfo({
      //id: "123",
      //name: "thing",
      //topic: {
        //value: 'Here is some random information to ignore. ***{"sensors": [{"name": "readThisJSON"}]}***'
      //}
    //});
    //expect(Aggregator.fromConfig).toHaveBeenCalledWith('{"sensors": [{"name": "readThisJSON"}]}');
  //});
});
