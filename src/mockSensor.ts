import { Sensor, sensorData } from './interfaces/sensor';

class MockSensor implements Sensor {
  sensorId: string | number;

  constructor({ id }: { id: string | number }) {
    this.sensorId = id
  }

  getData(): Promise<sensorData>  {
    return Promise.resolve({
      AQI: 123,
      temperature: 42
    });
  }
};

module.exports = MockSensor;
