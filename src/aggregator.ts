import { monitoringTypes, labeledSensor } from './interfaces/sensor';
import sensorMap from './sensorMap';
import DecoratedSensor from './decoratedSensor';

interface sensorJson {
  name: string;
  type: string;
  id: number;
  AQIThresholds?: [number, number];
  AQIMonitoring?: monitoringTypes;
}

class Aggregator {
  sensors: Array<DecoratedSensor>;

  constructor(sensors: Array<labeledSensor>) {
    this.sensors = sensors.map((s) => new DecoratedSensor(s));
    return this;
  }

  async monitorAndNotify(): Promise<undefined | string> {
    try {
      const checks = this.sensors.map(async (s) => s.monitorThresholds());

      const strs = await Promise.all(checks);
      return strs.filter(s => s.length > 0).join();
    } catch (e) {
      console.log('reporting error', e);
    }
  }

  showMonitoringConfig(): string {
    return this.sensors.map((s) => s.showMonitoringConfig()).join('\n');
  }

  async report(): Promise<undefined | string> {
    try {
      const dataReports = this.sensors.map(async (s) => s.getReport());

      const strs = await Promise.all(dataReports);
      return strs.join("");
    } catch (e) {
      console.log('reporting error', e);
    }
  }

  public static fromConfig(configString : string): Aggregator | undefined {
    let configJSON;
    try {
      configJSON = JSON.parse(configString);
    } catch(e) {
      console.log(`Error parsing JSON "${configString}"`);
      return;
    }

    const sensors = configJSON.sensors.map((sensorData : sensorJson) => {
      console.log("setting up sensor", sensorData);
      //TODO: validate the fields on the sensor JSON

      const Sensor = sensorMap[sensorData.type];
      if(Sensor) {
        return {
          name: sensorData.name,
          sensor: new Sensor(sensorData),
          AQIThresholds: sensorData.AQIThresholds,
          AQIMonitoring: sensorData.AQIMonitoring,
        }
      }
      console.log(`Unknown sensor "${sensorData.type}"`);
    }).filter((s: any) => !!s);

    return new Aggregator(sensors);
  }

}

export default Aggregator;
