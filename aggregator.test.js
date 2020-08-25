const pkg = require('./aggregator');

const outdoorSensor = {
  getData: jest.fn(),
}
const indoorSensor = {
  getData: jest.fn(),
}

const aggregator = pkg.initialize({ outdoorSensor, indoorSensor });

describe('.report', () => {
  beforeEach(() => {
    indoorSensor.getData.mockReturnValue({})
    outdoorSensor.getData.mockReturnValue({})
  })
  test('It lists the indoor AQI and temperature', () => {
    indoorSensor.getData.mockReturnValue({
      AQI: 42,
      temperature: 75
    });
    let report = aggregator.report();
    expect(indoorSensor.getData).toHaveBeenCalled();
    expect(report).toMatch('Indoor AQI: 42');
    expect(report).toMatch('Indoor Temperature: 75');
  });
  test('It lists the outdoor AQI and temperature', () => {
    outdoorSensor.getData.mockReturnValue({
      AQI: 54,
      temperature: 82
    });
    let report = aggregator.report();
    expect(outdoorSensor.getData).toHaveBeenCalled();
    expect(report).toMatch('Outdoor AQI: 54');
    expect(report).toMatch('Outdoor Temperature: 82');
  });
  test('It does not list the indoor AQI if none provided', () => {
    indoorSensor.getData.mockReturnValue({})
    let report = aggregator.report();
    expect(indoorSensor.getData).toHaveBeenCalled();
    expect(report).not.toMatch('Indoor AQI');
  });
});
