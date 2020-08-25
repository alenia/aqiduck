const pkg = require('./aggregator');

const outdoorSensor = {
  getData: jest.fn(),
}
const indoorSensor = {
  getData: jest.fn(),
}

const aggregator = pkg.initialize({ outdoorSensor, indoorSensor });

beforeEach(() => {
  indoorSensor.getData.mockReturnValue({})
  outdoorSensor.getData.mockReturnValue({})
})

describe('.report', () => {
  test("It lists the indoor AQI and temperature", () => {
    indoorSensor.getData.mockReturnValue({
      AQI: 42,
      temperature: 75
    });
    let report = aggregator.report();
    expect(indoorSensor.getData).toHaveBeenCalled();
    expect(report).toMatch('Indoor AQI: 42');
    expect(report).toMatch('Indoor Temperature: 75');
  });
  test("It lists the outdoor AQI and temperature", () => {
    outdoorSensor.getData.mockReturnValue({
      AQI: 54,
      temperature: 82
    });
    let report = aggregator.report();
    expect(outdoorSensor.getData).toHaveBeenCalled();
    expect(report).toMatch('Outdoor AQI: 54');
    expect(report).toMatch('Outdoor Temperature: 82');
  });
  test("It does not list the indoor AQI if none provided", () => {
    indoorSensor.getData.mockReturnValue({})
    let report = aggregator.report();
    expect(indoorSensor.getData).toHaveBeenCalled();
    expect(report).not.toMatch('Indoor AQI');
  });
});

describe(".shouldOpenWindow(thresholds)", () => {
  let thresholds = {};
  describe("when the outdoor temperature is significantly below the indoor temperature", () => {
    beforeEach(() => {
      indoorSensor.getData.mockReturnValue({
        temperature: 75,
      });
      outdoorSensor.getData.mockReturnValue({
        temperature: 65,
        AQI: 30,
      });
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
      indoorSensor.getData.mockReturnValue({
        temperature: 75,
      });
      outdoorSensor.getData.mockReturnValue({
        temperature: 76,
        AQI: 30,
      });
      expect(aggregator.shouldOpenWindow(thresholds)).toBe(false);
      outdoorSensor.getData.mockReturnValue({
        temperature: 80,
        AQI: 30,
      });
      expect(aggregator.shouldOpenWindow(thresholds)).toBe(false);
      outdoorSensor.getData.mockReturnValue({
        temperature: 75,
        AQI: 30,
      });
      expect(aggregator.shouldOpenWindow(thresholds)).toBe(false);
      outdoorSensor.getData.mockReturnValue({
        temperature: 70,
        AQI: 30,
      });
      expect(aggregator.shouldOpenWindow(thresholds)).toBe(true);
    });
    test.todo("It returns false if the outdoor temperature is too near the indoor temperature");
  });
});

xdescribe(".shouldCloseWindow(thresholds)");
