const monitorAggregator = jest.fn().mockImplementation(() => Promise.resolve('tick'))
jest.mock('./aggregator', () => {
  return {
    fromConfig: jest.fn().mockImplementation((config) => {
      return {
        report: jest.fn().mockImplementation(() => { return Promise.resolve(`I am a report for ${config}`) }),
        monitorAndNotify: monitorAggregator
      }
    }),
  };
});

jest.useFakeTimers();

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

beforeEach(() => {
  mockSlackReporterA.postMessage.mockClear()
  mockSlackReporterB.postMessage.mockClear()
});

describe(".subscribeAll", () => {
  it('should report for each controller', async () => {
    expect.assertions(2);
    await AqiDuckController.subscribeAll();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A")
    expect(mockSlackReporterB.postMessage).toHaveBeenCalledWith("I am a report for Mock config B")
  });
});

describe("handleEvent", () => {
  it("sends a report if the event text says report", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    controller.handleEvent({ text: '<@USERNAMETHING>REPORT' });
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I'm not set up to give you a report!")
    mockSlackReporterA.postMessage.mockClear()
    await controller.setupAggregator();
    controller.handleEvent({ text: '<@USERNAMETHING> report' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A")
  });

  it("says hello if the event text says hello", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    await controller.setupAggregator();

    mockSlackReporterA.postMessage.mockClear()
    controller.handleEvent({ text: '<@USERNAMETHING> Hello' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("Hello there!")

    mockSlackReporterA.postMessage.mockClear()
    controller.handleEvent({ text: '<@USERNAMETHING> hi there' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("Hello there!")

    mockSlackReporterA.postMessage.mockClear()
    controller.handleEvent({ text: '<@USERNAMETHING> high' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).not.toHaveBeenCalledWith("Hello there!")
  });

  it("Stops reporting if you say stop monitoring, and resumes when you say resume", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    await controller.setupAggregator();
    controller.monitorAndNotify();
    jest.runOnlyPendingTimers();
    expect(monitorAggregator).toHaveBeenCalled();
    monitorAggregator.mockClear();
    controller.handleEvent({ text: '<@USERNAMETHING> Stop monitoring' });
    jest.runOnlyPendingTimers();
    expect(monitorAggregator).not.toHaveBeenCalled();
    controller.handleEvent({ text: '<@USERNAMETHING> Resume monitoring' });
    jest.runOnlyPendingTimers();
    expect(monitorAggregator).toHaveBeenCalled();
  });

  it.todo("Reports dynamically if you tell it to with the phrase 'Dynamic AQI monitoring'");
  //controller.handleEvent({ text: '<@USERNAMETHING> Dynamic AQI monitoring' });

  it.todo("Reports statically if you tell it to");
  //controller.handleEvent({ text: '<@USERNAMETHING> Monitor AQI [40,50]' });

  it("Lets you know if the event text is unknown", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    await controller.setupAggregator();
    controller.handleEvent({ text: '<@USERNAMETHING> What' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I'm not sure how to help with that.")
  });
});
