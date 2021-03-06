import { mocked } from 'ts-jest/utils';
import SlackReporter from './slackReporter';

jest.useFakeTimers();

const monitorAggregator = jest.fn().mockImplementation(() => Promise.resolve('tick'))
jest.mock('./aggregator', () => {
  return {
    fromConfig: jest.fn().mockImplementation((config) => {
      return {
        report: jest.fn().mockImplementation(() => { return Promise.resolve(`I am a report for ${config}`) }),
        showMonitoringConfig: jest.fn().mockImplementation(() => "What are we watching?"),
        monitorAndNotify: monitorAggregator
      }
    }),
  };
});

jest.mock('./slackReporter');
const MockedSlackReporter = mocked(SlackReporter);
MockedSlackReporter.subscribeAll.mockImplementation(() => {
  return Promise.resolve([mockSlackReporterA, mockSlackReporterB]);
})

const mockSlackReporterA = new SlackReporter({name: 'Reporter A', id: 'ReporterA'}) as jest.Mocked<SlackReporter>;
mockSlackReporterA.id = "ReporterA";
mockSlackReporterA.getChannelName.mockImplementation(() => "Reporter A");
mockSlackReporterA.getConfig.mockImplementation(() => Promise.resolve("Mock config A"));

const mockSlackReporterB = new SlackReporter({name: 'Reporter B', id: 'ReporterB'}) as jest.Mocked<SlackReporter>;
mockSlackReporterB.id = "ReporterB";
mockSlackReporterB.getChannelName.mockImplementation(() => "Reporter B");
mockSlackReporterB.getConfig.mockImplementation(() => Promise.resolve("Mock config B"));

import AqiDuckController, { ControllerRegistry } from './aqiDuckController';

function flushPromises() {
    return new Promise(resolve => setImmediate(resolve));
}

beforeEach(() => {
  Object.keys(ControllerRegistry).forEach((key) => { delete ControllerRegistry[key] });
  monitorAggregator.mockClear();
  MockedSlackReporter.mockClear();
  MockedSlackReporter.subscribeAll.mockClear();
  mockSlackReporterA.postMessage.mockClear();
  mockSlackReporterB.postMessage.mockClear();
  mockSlackReporterA.getConfig.mockImplementation(() => {
    return Promise.resolve("Mock config A");
  })
});

describe(".subscribeAll", () => {
  it('should add two controllers to the registry', async () => {
    expect(Object.keys(ControllerRegistry).length).toEqual(0);
    await AqiDuckController.subscribeAll();
    await flushPromises();
    expect(Object.keys(ControllerRegistry).length).toEqual(2);
    expect(ControllerRegistry['ReporterA'].slackReporter).toEqual(mockSlackReporterA);
    expect(ControllerRegistry['ReporterB'].slackReporter).toEqual(mockSlackReporterB);
  });

  it('should report for each controller', async () => {
    expect.assertions(2);
    await AqiDuckController.subscribeAll();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A");
    expect(mockSlackReporterB.postMessage).toHaveBeenCalledWith("I am a report for Mock config B");
  });
});

describe(".findOrCreate", () => {
  beforeEach(() => {
    MockedSlackReporter.mockImplementation(({ name, id }) => {
      return {
        id: id,
        channel: { name, id },
        topic: { value: '' },
        getChannelName: jest.fn().mockReturnValue(name),
        getConfig: jest.fn().mockReturnValue(`Mock config for ${name}`),
        postMessage: jest.fn()
      }
    })
  })
  it('should get controller from the registry if it is already created', async () => {
    await AqiDuckController.subscribeAll();
    await flushPromises();
    expect(Object.keys(ControllerRegistry).length).toEqual(2);
    const reporter = await AqiDuckController.findOrCreate('ReporterA');
    expect(reporter.getChannelName()).toEqual('Reporter A');
    expect(Object.keys(ControllerRegistry).length).toEqual(2);
  });

  it('should create a new controller if it is not created', async () => {
    await AqiDuckController.subscribeAll();
    await flushPromises();
    expect(Object.keys(ControllerRegistry).length).toEqual(2);
    const reporter = await AqiDuckController.findOrCreate('ReporterC');
    expect(reporter.getChannelName()).toEqual('ReporterC');
    expect(Object.keys(ControllerRegistry).length).toEqual(3);
    expect(ControllerRegistry['ReporterC'].getChannelName()).toEqual('ReporterC');
  });
});

describe("unregister", () => {
  it('should remove the channel from the registry', async () => {
    await AqiDuckController.subscribeAll();
    await flushPromises();
    expect(Object.keys(ControllerRegistry).length).toEqual(2);
    expect(ControllerRegistry['ReporterA']).toBeTruthy();
    AqiDuckController.unregister('ReporterA');
    expect(ControllerRegistry['ReporterA']).toBeFalsy();
    expect(Object.keys(ControllerRegistry).length).toEqual(1);
  });

  it('should stop any timers', async () => {
    await AqiDuckController.subscribeAll();
    await flushPromises();
    const controller = ControllerRegistry['ReporterA'];
    controller.monitorAndNotify();
    jest.runOnlyPendingTimers();
    expect(monitorAggregator).toHaveBeenCalled();
    monitorAggregator.mockClear();

    AqiDuckController.unregister('ReporterA');

    jest.runOnlyPendingTimers();
    expect(monitorAggregator).not.toHaveBeenCalled();
  });
});

describe("handleChannelTopicChange", () => {
  it("Reloads the configuration", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    // initial setup
    await controller.setupAggregator();
    controller.postReport();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A")
    mockSlackReporterA.postMessage.mockClear()

    // config change, not reloaded yet
    mockSlackReporterA.getConfig.mockImplementation(() => {
      return Promise.resolve("Reloaded mock config A");
    })
    controller.postReport();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A")
    mockSlackReporterA.postMessage.mockClear()

    // Reloading happens
    controller.handleChannelTopicChange();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("Reloading configuration")

    // After reloading
    mockSlackReporterA.postMessage.mockClear()
    controller.postReport();
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

  it("Lets you know the version if you ask", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    await controller.setupAggregator();

    mockSlackReporterA.postMessage.mockClear()
    controller.handleAppMention({ text: '<@USERNAMETHING> Version' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith(expect.stringMatching(/\bv\d+\.\d+\.\d+\b/));
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
    controller.postReport();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A")
    mockSlackReporterA.postMessage.mockClear()

    // config change, not reloaded yet
    mockSlackReporterA.getConfig.mockImplementation(() => {
      return Promise.resolve("Reloaded mock config A");
    })
    controller.postReport();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Mock config A")
    mockSlackReporterA.postMessage.mockClear()

    // Reloading requested
    controller.handleAppMention({ text: '<@USERNAMETHING> Reload' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("Reloading configuration")

    // After reloading
    mockSlackReporterA.postMessage.mockClear()
    controller.postReport();
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith("I am a report for Reloaded mock config A")
  });

  it("Gives the status of the current monitoring", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    await controller.setupAggregator();
    controller.handleAppMention({ text: '<@USERNAMETHING> Status' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith(expect.stringContaining("Monitoring is stopped"))
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith(expect.stringContaining("What are we watching"))
  });

  it("Lets you know if the event text is unknown", async () => {
    const controller = new AqiDuckController(mockSlackReporterA);
    await controller.setupAggregator();
    controller.handleAppMention({ text: '<@USERNAMETHING> What' });
    await flushPromises();
    expect(mockSlackReporterA.postMessage).toHaveBeenCalledWith(expect.stringContaining("I'm not sure how to help with that."))
  });
});
