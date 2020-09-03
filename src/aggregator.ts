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

class Aggregator {
  sensors: Array<labeledSensor>;

  constructor(sensors: Array<labeledSensor>) {
    this.sensors = sensors;
    return this;
  }

  async report() {
    try {
      const dataReports = this.sensors.map(async (s) => {
        try {
          const data = await s.sensor.getData();
          return reportData(data, s.name);
        } catch (e) {
          console.log('reporting error for sensor', s, e);
          throw(e);
        }
      })

      const strs = await Promise.all(dataReports);
      return strs.join();
    } catch (e) {
      console.log('reporting error', e);
    }
  }

  static fromConfig(configString : string) {
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
