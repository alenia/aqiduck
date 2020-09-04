import { sensorData, Sensor } from './interfaces/sensor';
import sensorMap from './sensorMap';

interface labeledSensor {
  name: string;
  sensor: Sensor;
}

interface sensorJson {
  name: string;
  type: string;
  id: number;
}

const reportData = function({AQI, temperature} : sensorData, prefix : string) {
  let output = "";
  if(AQI) {
    output += `${prefix} AQI: ${AQI}\n`;
  }
  if(temperature) {
    output += `${prefix} Temperature: ${temperature}\n`;
  }
  return output;
}

class DecoratedSensor {
  name: string;
  sensor: Sensor;

  constructor({ name, sensor } : labeledSensor) {
    this.sensor = sensor;
    this.name = name;
  }

  async getReport() : Promise<string | Error> {
    try {
      const data = await this.sensor.getData();
      return reportData(data, this.name);
    } catch (e) {
      console.log('reporting error for sensor', this, e);
      throw(e);
    }
  }
}

class Aggregator {
  sensors: Array<DecoratedSensor>;

  constructor(sensors: Array<labeledSensor>) {
    this.sensors = sensors.map((s) => new DecoratedSensor(s));
    return this;
  }

  async report(): Promise<undefined | string> {
    try {
      const dataReports = this.sensors.map(async (s) => s.getReport());

      const strs = await Promise.all(dataReports);
      return strs.join();
    } catch (e) {
      console.log('reporting error', e);
    }
  }

  public static fromConfig(configString : string): Aggregator | undefined {
    let configJSON;
    try {
      configJSON = JSON.parse(configString);
    } catch(e) {
      console.log(`Error creating aggregator from config "${configString}"`);
      return;
    }

    const sensors = configJSON.sensors.map((sensorData : sensorJson) => {
      const Sensor = sensorMap[sensorData.type];
      if(Sensor) {
        return {
          name: sensorData.name,
          sensor: new Sensor(sensorData)
        }
      }
      console.log(`Unknown sensor "${sensorData.type}"`);
    }).filter((s: any) => !!s);

    return new Aggregator(sensors);
  }

}

export default Aggregator;
