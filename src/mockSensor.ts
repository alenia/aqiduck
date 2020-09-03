import { Sensor, sensorData } from './interfaces/sensor';

export default class MockSensor implements Sensor {
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
}
