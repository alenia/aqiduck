import Aggregator, { DecoratedSensor, monitoringTypes } from './aggregator';

let outdoorSensorData = {}, indoorSensorData = {};

const outdoorSensor = {
  sensorId: 5,
  getData: jest.fn(() => {
    return Promise.resolve(outdoorSensorData);
  }),
}
const indoorSensor = {
  sensorId: 6,
  getData: jest.fn(() => {
    return Promise.resolve(indoorSensorData);
  }),
}

//TODO: once I have aggregator.js converted to typescript set this type
let aggregator: Aggregator;

beforeEach(() => {
  aggregator = new Aggregator([{ name: "Outdoor", sensor: outdoorSensor}, {name: "Indoor", sensor: indoorSensor}]);
  indoorSensorData = {};
  outdoorSensorData = {};
})

describe("DecoratedSensor", () => {
  describe('.monitorThresholds', () => {
    it("alerts when it crosses under the low threshold the first time, and only alerts again after crossing over the high threshold and back down", async () => {
      const sensor = new DecoratedSensor({
        name: "Sensor",
        sensor: outdoorSensor,
        AQIThresholds: [50,60]
      });
      expect.assertions(12);
      outdoorSensorData = { AQI: 54 };
      let output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();
      outdoorSensorData = { AQI: 49 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("lower");
      expect(output).not.toMatch("higher");
      outdoorSensorData = { AQI: 49 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy()
      outdoorSensorData = { AQI: 48 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy()
      outdoorSensorData = { AQI: 52 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy()
      outdoorSensorData = { AQI: 48 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy()
      outdoorSensorData = { AQI: 61 };
      output = await sensor.monitorThresholds();
      expect(output).not.toMatch("lower");
      expect(output).toMatch("higher");
      outdoorSensorData = { AQI: 52 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy()
      outdoorSensorData = { AQI: 49 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("lower");
      expect(output).not.toMatch("higher");
    });
    it("alerts when it crosses under the high threshold the first time, and only alerts again after crossing over the high threshold and back down", async () => {
      const sensor = new DecoratedSensor({
        name: "Sensor",
        sensor: outdoorSensor,
        AQIThresholds: [50,60]
      });
      expect.assertions(11);
      outdoorSensorData = { AQI: 54 };
      let output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();
      outdoorSensorData = { AQI: 61 };
      output = await sensor.monitorThresholds();
      expect(output).not.toMatch("lower");
      expect(output).toMatch("higher");
      expect(output).toMatch('AQI: 61');
      outdoorSensorData = { AQI: 52 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy()
      outdoorSensorData = { AQI: 61 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy()
      outdoorSensorData = { AQI: 49 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("lower");
      expect(output).not.toMatch("higher");
      expect(output).toMatch('AQI: 49');
      outdoorSensorData = { AQI: 61 };
      output = await sensor.monitorThresholds();
      expect(output).not.toMatch("lower");
      expect(output).toMatch("higher");
    });
    it('Does not do anything if there are no thresholds to monitor', async () => {
      expect.assertions(3);
      const sensorWithThresholds = new DecoratedSensor({
        name: "Sensor",
        sensor: outdoorSensor,
        AQIThresholds: [50,60]
      });
      outdoorSensorData = { AQI: 61 };
      outdoorSensor.getData.mockClear();
      await sensorWithThresholds.monitorThresholds();
      expect(outdoorSensor.getData).toHaveBeenCalled();
      const sensorWithoutThresholds = new DecoratedSensor({
        name: "Sensor",
        sensor: outdoorSensor
      });
      outdoorSensor.getData.mockClear();
      expect(await sensorWithoutThresholds.monitorThresholds()).toBeFalsy();
      expect(outdoorSensor.getData).not.toHaveBeenCalled();
    });
    describe('Dynamic monitoring', () => {
      it.only('resets the thresholds whenever a threshold is crossed', async () => {
        const sensor = new DecoratedSensor({
          name: "Sensor",
          sensor: outdoorSensor,
          AQIMonitoring: monitoringTypes.dynamic
        });
        expect.assertions(14);
        outdoorSensorData = { AQI: 54 };
        let output = await sensor.getReport();
        outdoorSensorData = { AQI: 55 };
        output = await sensor.monitorThresholds();
        expect(output).toBeFalsy();
        // up a bunch
        outdoorSensorData = { AQI: 61 };
        output = await sensor.monitorThresholds();
        expect(output).not.toMatch("lower");
        expect(output).toMatch("higher");
        expect(output).toMatch('AQI: 61');
        // down a bunch
        outdoorSensorData = { AQI: 52 };
        output = await sensor.monitorThresholds();
        expect(output).toMatch("lower");
        expect(output).not.toMatch("higher");
        expect(output).toMatch('AQI: 52');
        // up a little
        outdoorSensorData = { AQI: 55 };
        output = await sensor.monitorThresholds();
        expect(output).toBeFalsy()
        // a little below the center of the threshold
        outdoorSensorData = { AQI: 49 };
        output = await sensor.monitorThresholds();
        expect(output).toBeFalsy()
        // further below the center of the threshold
        outdoorSensorData = { AQI: 47 };
        output = await sensor.monitorThresholds();
        expect(output).toMatch("lower");
        expect(output).not.toMatch("higher");
        expect(output).toMatch('AQI: 47');
        // up a bunch
        outdoorSensorData = { AQI: 61 };
        output = await sensor.monitorThresholds();
        expect(output).not.toMatch("lower");
        expect(output).toMatch("higher");
      });
    });
  });
  describe('.getReport', () => {
    it('Resets the thresholds for monitoring, and reports even when it does not cross a threshold', async () => {
      const sensor = new DecoratedSensor({
        name: "Sensor",
        sensor: outdoorSensor,
        AQIThresholds: [50,60]
      });
      expect.assertions(4);
      outdoorSensorData = { AQI: 54 };
      let output : string | Error = await sensor.monitorThresholds();
      expect(output).toBeFalsy();
      outdoorSensorData = { AQI: 61 };
      output = await sensor.getReport();
      expect(output).toMatch('AQI: 61');
      outdoorSensorData = { AQI: 62 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();
      output = await sensor.getReport();
      expect(output).toMatch('AQI: 62');
    });
  });
})

describe('.report', () => {
  test("It lists the indoor AQI and temperature", async () => {
    expect.assertions(3);
    indoorSensorData = {
      AQI: 42,
      temperature: 75
    };
    const report = await aggregator.report();
    expect(indoorSensor.getData).toHaveBeenCalled();
    expect(report).toMatch('Indoor AQI: 42');
    expect(report).toMatch('Indoor Temperature: 75');
  });
  test("It lists the outdoor AQI and temperature", async () => {
    expect.assertions(3);
    outdoorSensorData = {
      AQI: 54,
      temperature: 82
    };
    const report = await aggregator.report();
    expect(outdoorSensor.getData).toHaveBeenCalled();
    expect(report).toMatch('Outdoor AQI: 54');
    expect(report).toMatch('Outdoor Temperature: 82');
  });
  test("It does not list the indoor AQI if none provided", async () => {
    expect.assertions(2);
    indoorSensorData = {};
    const report = await aggregator.report();
    expect(indoorSensor.getData).toHaveBeenCalled();
    expect(report).not.toMatch('Indoor AQI');
  });
  test("It lists the AQI if it is zero", async () => {
    expect.assertions(2);
    indoorSensorData = {
      AQI: 0,
    };
    const report = await aggregator.report();
    expect(indoorSensor.getData).toHaveBeenCalled();
    expect(report).toMatch('Indoor AQI');
  });
  test("It works without an indoor sensor", async () => {
    expect.assertions(2);
    const smallAggregator = new Aggregator([{ name: "Outdoor", sensor: outdoorSensor }]);
    indoorSensorData = {
      AQI: 42,
      temperature: 75
    };
    outdoorSensorData = {
      AQI: 54,
      temperature: 82
    };
    const report = await smallAggregator.report();
    expect(report).toMatch('Outdoor AQI');
    expect(report).not.toMatch('Indoor');
  });
});

describe('Aggregator.fromConfig', () => {
  it('Creates an aggregator with sensors based on the configuration in the string', () => {
    const config = '{"sensors": [{"name": "Quackers", "type": "MockSensor", "id": 12345}, {"name": "Quackwaduck", "type": "PurpleAirSensor", "id": 54321}]}';
    aggregator = Aggregator.fromConfig(config);
    expect(aggregator.sensors.length).toEqual(2);
    expect(aggregator.sensors[0].sensor.constructor.name).toEqual("MockSensor");
  });
  it("Doesn't add a sensor if it doesn't recognize type", () => {
    const config = '{"sensors": [{"name": "Unknown", "type": "Fubara", "id": 12345}, {"name": "Quackwaduck", "type": "PurpleAirSensor", "id": 54321}]}';
    aggregator = Aggregator.fromConfig(config);
    expect(aggregator.sensors.length).toEqual(1);
  });
  it("Doesn't add blow up too badly if the string is poorly formatted", () => {
    const config = '{fhgwgads';
    Aggregator.fromConfig(config);
  });
});
