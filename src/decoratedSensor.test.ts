import { monitoringTypes } from './interfaces/sensor';
import DecoratedSensor from './decoratedSensor';

let outdoorSensorData = {};

const outdoorSensor = {
  sensorId: 5,
  getData: jest.fn(() => {
    return Promise.resolve(outdoorSensorData);
  }),
}

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
    it('resets the thresholds whenever a threshold is crossed', async () => {
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

