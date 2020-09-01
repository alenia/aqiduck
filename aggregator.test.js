const aggregator = require('./aggregator');

let outdoorSensorData = {}, indoorSensorData = {};

const outdoorSensor = {
  getData: jest.fn(() => {
    return outdoorSensorData;
  }),
}
const indoorSensor = {
  getData: jest.fn(() => {
    return indoorSensorData;
  }),
}


beforeEach(() => {
  aggregator.initialize({ outdoor: outdoorSensor, indoor: indoorSensor });
  indoorSensorData = {};
  outdoorSensorData = {};
})

describe('.report', () => {
  test("It lists the indoor AQI and temperature", () => {
    indoorSensorData = {
      AQI: 42,
      temperature: 75
    };
    let report = aggregator.report();
    expect(indoorSensor.getData).toHaveBeenCalled();
    expect(report).toMatch('Indoor AQI: 42');
    expect(report).toMatch('Indoor Temperature: 75');
  });
  test("It lists the outdoor AQI and temperature", () => {
    outdoorSensorData = {
      AQI: 54,
      temperature: 82
    };
    let report = aggregator.report();
    expect(outdoorSensor.getData).toHaveBeenCalled();
    expect(report).toMatch('Outdoor AQI: 54');
    expect(report).toMatch('Outdoor Temperature: 82');
  });
  test("It does not list the indoor AQI if none provided", () => {
    indoorSensorData = {};
    let report = aggregator.report();
    expect(indoorSensor.getData).toHaveBeenCalled();
    expect(report).not.toMatch('Indoor AQI');
  });
  test("It works without an indoor sensor", () => {
    aggregator.initialize({ outdoor: outdoorSensor });
    indoorSensorData = {
      AQI: 42,
      temperature: 75
    };
    outdoorSensorData = {
      AQI: 54,
      temperature: 82
    };
    let report = aggregator.report();
    expect(report).toMatch('Outdoor AQI');
    expect(report).not.toMatch('Indoor');
  });
});

describe(".shouldOpenWindow(thresholds)", () => {
  let thresholds = {};
  describe("when the outdoor temperature is significantly below the indoor temperature", () => {
    beforeEach(() => {
      indoorSensorData = {
        temperature: 75,
      };
      outdoorSensorData = {
        temperature: 65,
        AQI: 30,
      };
    });
    test("It returns false if the indoor temperature is below the lowTemperature threshold", () => {
      thresholds = {
        lowTemperature: 76,
        AQI: 50,
      };
      expect(aggregator.shouldOpenWindow(thresholds)).toBe(false);
    });
    test("It returns false if the outdoor aqi is above the air quality threshold", () => {
      thresholds = {
        lowTemperature: 70,
        AQI: 29,
      };
      expect(aggregator.shouldOpenWindow(thresholds)).toBe(false);
    });
    test("It returns true if the outdoor aqi and indoor temperature are within limits", () => {
      thresholds = {
        lowTemperature: 70,
        AQI: 50,
      };
      expect(aggregator.shouldOpenWindow(thresholds)).toBe(true);
    });
  });
  describe("when the outdoor aqi and indoor temperature are within limits", () => {
    beforeEach(() => {
      thresholds = {
        lowTemperature: 70,
        AQI: 50
      }
    })
    test("It returns false if the outdoor temperature is above the indoor temperature", () => {
      indoorSensorData = {
        temperature: 75,
      };
      outdoorSensorData = {
        temperature: 76,
        AQI: 30,
      };
      expect(aggregator.shouldOpenWindow(thresholds)).toBe(false);
      outdoorSensorData = {
        temperature: 80,
        AQI: 30,
      };
      expect(aggregator.shouldOpenWindow(thresholds)).toBe(false);
      outdoorSensorData = {
        temperature: 75,
        AQI: 30,
      };
      expect(aggregator.shouldOpenWindow(thresholds)).toBe(false);
      outdoorSensorData = {
        temperature: 70,
        AQI: 30,
      };
      expect(aggregator.shouldOpenWindow(thresholds)).toBe(true);
    });
    test.todo("It returns false if the outdoor temperature is too near the indoor temperature");
  });
});

xdescribe(".shouldCloseWindow(thresholds)");
