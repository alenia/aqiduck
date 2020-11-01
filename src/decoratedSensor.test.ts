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
    it('monitors when crossing threshold by one', async () => {
      const sensor = new DecoratedSensor({
        name: "Sensor",
        sensor: outdoorSensor,
        AQIMonitoring: monitoringTypes.dynamic
      });
      outdoorSensorData = { AQI: 54 };
      let output = await sensor.getReport();
      outdoorSensorData = { AQI: 58 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();
      outdoorSensorData = { AQI: 59 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("higher");
    });
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

  describe('Category monitoring', () => {
    it('alerts going up whenever a category boundary is crossed', async () => {
      const sensor = new DecoratedSensor({
        name: "Sensor",
        sensor: outdoorSensor,
        AQIMonitoring: monitoringTypes.category
      });

      outdoorSensorData = { AQI: 12 };
      let output = await sensor.getReport();

      // good -> moderate
      outdoorSensorData = { AQI: 45 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();
      outdoorSensorData = { AQI: 51 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("higher");
      expect(output).toMatch('AQI: 51');

      // moderate -> usg
      outdoorSensorData = { AQI: 99 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();
      outdoorSensorData = { AQI: 101 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("higher");
      expect(output).toMatch('AQI: 101');

      // usg -> unhealthy
      outdoorSensorData = { AQI: 149 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy()
      outdoorSensorData = { AQI: 151 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("higher");
      expect(output).toMatch('AQI: 151');

      // very unhealthy
      outdoorSensorData = { AQI: 201 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("higher");
      expect(output).toMatch('AQI: 201');

      // somewhere in hazardous
      outdoorSensorData = { AQI: 350 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("higher");
      expect(output).toMatch('AQI: 350');

      // extra hazardous
      outdoorSensorData = { AQI: 480 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("higher");
      expect(output).toMatch('AQI: 480');

      // beyond it just notifies every 100
      outdoorSensorData = { AQI: 502 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("higher");
      expect(output).toMatch('AQI: 502');
      outdoorSensorData = { AQI: 599 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();
      outdoorSensorData = { AQI: 601 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("higher");
      expect(output).toMatch('AQI: 601');
    });
    it.todo('alerts going down whenever a category boundary is crossed');
    it('does not alert when the AQI is hovering around the category boundary', async () => {
      const sensor = new DecoratedSensor({
        name: "Sensor",
        sensor: outdoorSensor,
        AQIMonitoring: monitoringTypes.category
      });

      outdoorSensorData = { AQI: 95 };
      let output = await sensor.getReport();

      outdoorSensorData = { AQI: 101 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("higher");
      expect(output).toMatch('AQI: 101');
      // say down if it drops below 95, up if it rises above 150

      outdoorSensorData = { AQI: 99 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();

      outdoorSensorData = { AQI: 100 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();

      outdoorSensorData = { AQI: 101 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();

      outdoorSensorData = { AQI: 105 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();
      // say down if it drops below 100, up if it rises above 150

      outdoorSensorData = { AQI: 101 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();

      outdoorSensorData = { AQI: 99 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("lower");
      expect(output).toMatch('AQI: 99');
      // say down if it drops below 50, up if it rises above 105

      outdoorSensorData = { AQI: 100 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();

      outdoorSensorData = { AQI: 101 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();

      outdoorSensorData = { AQI: 105 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("higher");
      expect(output).toMatch('AQI: 105');
      // say down if it drops below 100, up if it rises above 150

      outdoorSensorData = { AQI: 99 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("lower");
      expect(output).toMatch('AQI: 99');
      // say down if it drops below 50, up if it rises above 105

      outdoorSensorData = { AQI: 95 };
      output = await sensor.monitorThresholds();
      expect(output).toBeFalsy();
      // say down if it drops below 50, up if it rises above 100

      outdoorSensorData = { AQI: 101 };
      output = await sensor.monitorThresholds();
      expect(output).toMatch("higher");
      expect(output).toMatch('AQI: 101');
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
    outdoorSensorData = { AQI: 55 };
    output = await sensor.getReport();
    expect(output).toMatch('AQI: 55');
    outdoorSensorData = { AQI: 62 };
    output = await sensor.monitorThresholds();
    expect(output).toMatch('AQI: 62');
    expect(output).toMatch('higher');
  });
});

