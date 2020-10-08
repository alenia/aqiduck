import SlackReporter from './slackReporter';

jest.useFakeTimers();

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

jest.mock('./slackReporter');
const MockedSlackReporter = SlackReporter as jest.Mocked<typeof SlackReporter>;
MockedSlackReporter.subscribeAll.mockImplementation(() => {
  return Promise.resolve([mockSlackReporterA, mockSlackReporterB]);
})

const mockSlackReporterA = new MockedSlackReporter({name: 'Reporter A', id: 'ReporterA'}) as jest.Mocked<SlackReporter>
mockSlackReporterA.getChannelName.mockImplementation(() => "Reporter A");
mockSlackReporterA.getConfig.mockImplementation(() => Promise.resolve("Mock config A"));

const mockSlackReporterB = new MockedSlackReporter({name: 'Reporter B', id: 'ReporterB'}) as jest.Mocked<SlackReporter>;
mockSlackReporterB.getChannelName.mockImplementation(() => "Reporter B");
mockSlackReporterB.getConfig.mockImplementation(() => Promise.resolve("Mock config B"));


import AqiDuckController from './aqiDuckController';

function flushPromises() {
    return new Promise(resolve => setImmediate(resolve));
}

beforeEach(() => {
  mockSlackReporterA.postMessage.mockClear()
  mockSlackReporterB.postMessage.mockClear()
  mockSlackReporterA.getConfig.mockImplementation(() => {
    return Promise.resolve("Mock config A");
  })
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

describe("handleChannelTopicChange", () => {
  it("Reloads the configuration", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    // initial setup
    await controller.setupAggregator();
    controller.report();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A")
    mockSlackReporterA.postMessage.mockClear()

    // config change, not reloaded yet
    mockSlackReporterA.getConfig.mockImplementation(() => {
      return Promise.resolve("Reloaded mock config A");
    })
    controller.report();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A")
    mockSlackReporterA.postMessage.mockClear()

    // Reloading happens
    controller.handleChannelTopicChange();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("Reloading configuration")

    // After reloading
    mockSlackReporterA.postMessage.mockClear()
    controller.report();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Reloaded mock config A")
  });

  it("Resets the timer", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    // initial setup
    await controller.setupAggregator();
    await flushPromises();

    // start the timer
    controller.monitorAndNotify();

    jest.runOnlyPendingTimers();
    expect(monitorAggregator).toHaveBeenCalled();
    monitorAggregator.mockClear();

    expect(controller.interval).not.toBeFalsy();

    // change config
    mockSlackReporterA.getConfig.mockImplementation(() => {
      return Promise.resolve("Reloaded mock config A");
    })

    // Reload
    controller.handleChannelTopicChange();
    await flushPromises();

    jest.runOnlyPendingTimers();
    expect(monitorAggregator).not.toHaveBeenCalled();
    expect(controller.interval).toBeFalsy();
  });
});

describe("handleAppMention", () => {
  it("sends a report if the event text says report", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    controller.handleAppMention({ text: '<@USERNAMETHING>REPORT' });
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I'm not set up to give you a report!")
    mockSlackReporterA.postMessage.mockClear()
    await controller.setupAggregator();
    controller.handleAppMention({ text: '<@USERNAMETHING> report' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A")
  });

  it("says hello if the event text says hello", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    await controller.setupAggregator();

    mockSlackReporterA.postMessage.mockClear()
    controller.handleAppMention({ text: '<@USERNAMETHING> Hello' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith(expect.stringMatching("Hello there!"));

    mockSlackReporterA.postMessage.mockClear()
    controller.handleAppMention({ text: '<@USERNAMETHING> hi there' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith(expect.stringMatching("Hello there!"));

    mockSlackReporterA.postMessage.mockClear()
    controller.handleAppMention({ text: '<@USERNAMETHING> high' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).not.toHaveBeenCalledWith(expect.stringMatching("Hello there!"));
  });

  it("Stops reporting if you say stop monitoring, and resumes and reports when you say resume", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    await controller.setupAggregator();
    controller.monitorAndNotify();
    jest.runOnlyPendingTimers();
    expect(monitorAggregator).toHaveBeenCalled();
    monitorAggregator.mockClear();
    mockSlackReporterA.postMessage.mockClear()
    controller.handleAppMention({ text: '<@USERNAMETHING> Stop monitoring' });
    jest.runOnlyPendingTimers();
    expect(monitorAggregator).not.toHaveBeenCalled();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledTimes(1);
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("Monitoring stopped.");
    mockSlackReporterA.postMessage.mockClear()
    controller.handleAppMention({ text: '<@USERNAMETHING> Resume monitoring' });
    jest.runOnlyPendingTimers();
    expect(monitorAggregator).toHaveBeenCalled();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("Monitoring resumed");
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A")
  });

  it("Doesn't stop monitoring if there's nothing to stop", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    await controller.setupAggregator();
    controller.handleAppMention({ text: '<@USERNAMETHING> Stop monitoring' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("Nothing to stop.")
  })

  it("Doesn't resume monitoring if there's a running timer", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    await controller.setupAggregator();
    controller.monitorAndNotify();
    controller.handleAppMention({ text: '<@USERNAMETHING> Resume monitoring' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("Monitoring is already running")
  })

  it("Doesn't resume monitoring if there's no aggregator set up", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    controller.handleAppMention({ text: '<@USERNAMETHING> Resume monitoring' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("Nothing to monitor")
  })

  it("Reloads when the user says to reload", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    // initial setup
    await controller.setupAggregator();
    controller.report();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A")
    mockSlackReporterA.postMessage.mockClear()

    // config change, not reloaded yet
    mockSlackReporterA.getConfig.mockImplementation(() => {
      return Promise.resolve("Reloaded mock config A");
    })
    controller.report();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A")
    mockSlackReporterA.postMessage.mockClear()

    // Reloading requested
    controller.handleAppMention({ text: '<@USERNAMETHING> Reload' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("Reloading configuration")

    // After reloading
    mockSlackReporterA.postMessage.mockClear()
    controller.report();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Reloaded mock config A")
  });

  it("Lets you know if the event text is unknown", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    await controller.setupAggregator();
    controller.handleAppMention({ text: '<@USERNAMETHING> What' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith(expect.stringContaining("I'm not sure how to help with that."))
  });
});
