jest.mock('./aggregator', () => {
  return { fromConfig: jest.fn().mockImplementation((config) => {return {
    report: jest.fn().mockImplementation(() => { return Promise.resolve(`I am a report for ${config}`) })
  }}) };
});

const mockSlackReporterA = {
  postMessage: jest.fn(),
  getChannelName: () => "Reporter A",
  getConfig: jest.fn().mockImplementation(() => {
    return Promise.resolve("Mock config A");
  })
}

const mockSlackReporterB = {
  postMessage: jest.fn(),
  getChannelName: () => "Reporter B",
  getConfig: jest.fn().mockImplementation(() => {
    return Promise.resolve("Mock config B");
  })
}

jest.mock('./slackReporter', () => {
  return { subscribeAll: jest.fn().mockImplementation(() => {
    return Promise.resolve([mockSlackReporterA, mockSlackReporterB]);
  }) };
});

import AqiDuckController from './aqiDuckController';

function flushPromises() {
    return new Promise(resolve => setImmediate(resolve));
}

describe(".subscribeAll", () => {
  it('should report for each controller', async () => {
    expect.assertions(2);
    await AqiDuckController.subscribeAll();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A")
    expect(mockSlackReporterB.postMessage).toHaveBeenCalledWith("I am a report for Mock config B")
  });
});
