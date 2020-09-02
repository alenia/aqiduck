const Aggregator = require('./aggregator');

let outdoorSensorData = {}, indoorSensorData = {};

const outdoorSensor = {
  getData: jest.fn(() => {
    return Promise.resolve(outdoorSensorData);
  }),
}
const indoorSensor = {
  getData: jest.fn(() => {
    return Promise.resolve(indoorSensorData);
  }),
}

let aggregator;


beforeEach(() => {
  aggregator = new Aggregator([{ name: "Outdoor", sensor: outdoorSensor}, {name: "Indoor", sensor: indoorSensor}]);
  indoorSensorData = {};
  outdoorSensorData = {};
})

describe('.report', () => {
  test("It lists the indoor AQI and temperature", async () => {
    expect.assertions(3);
    indoorSensorData = {
      AQI: 42,
      temperature: 75
    };
    let report = await aggregator.report();
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
    let report = await aggregator.report();
    expect(outdoorSensor.getData).toHaveBeenCalled();
    expect(report).toMatch('Outdoor AQI: 54');
    expect(report).toMatch('Outdoor Temperature: 82');
  });
  test("It does not list the indoor AQI if none provided", async () => {
    expect.assertions(2);
    indoorSensorData = {};
    let report = await aggregator.report();
    expect(indoorSensor.getData).toHaveBeenCalled();
    expect(report).not.toMatch('Indoor AQI');
  });
  test("It works without an indoor sensor", async () => {
    expect.assertions(2);
    let smallAggregator = new Aggregator([{ name: "Outdoor", sensor: outdoorSensor }]);
    indoorSensorData = {
      AQI: 42,
      temperature: 75
    };
    outdoorSensorData = {
      AQI: 54,
      temperature: 82
    };
    let report = await smallAggregator.report();
    expect(report).toMatch('Outdoor AQI');
    expect(report).not.toMatch('Indoor');
  });
});
