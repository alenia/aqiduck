import { sensorData, Sensor } from './interfaces/sensor';
import sensorMap from './sensorMap';

interface labeledSensor {
  name: string;
  sensor: Sensor;
  lowAQIThreshold?: number;
  highAQIThreshold?: number;
}

interface sensorJson {
  name: string;
  type: string;
  id: number;
  lowAQIThreshold?: number;
  highAQIThreshold?: number;
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

enum notifyBracket {
  low = "low",
  high = "high",
  none = "",
}

export class DecoratedSensor {
  name: string;
  sensor: Sensor;
  lowAQIThreshold?: number;
  highAQIThreshold?: number;
  private currentAQINotifyBracket: notifyBracket;

  constructor({ name, sensor, lowAQIThreshold, highAQIThreshold } : labeledSensor) {
    this.sensor = sensor;
    this.name = name;
    //TODO this should probably be an array of two values. Also do validation that low is below high
    this.lowAQIThreshold = lowAQIThreshold;
    this.highAQIThreshold = highAQIThreshold;
    this.currentAQINotifyBracket = notifyBracket.none;
  }

  async getData() {
    try {
      return await this.sensor.getData();
    } catch (e) {
      console.log('reporting error for sensor', this, e);
      throw(e);
    }
  }

  async monitorThresholds() : Promise<string> {
    const data = await this.getData();
    console.log(reportData(data, this.currentAQINotifyBracket));
    const newBracket = this.calculateAQINotifyBracket(data.AQI) || this.currentAQINotifyBracket;
    if(newBracket && newBracket !== this.currentAQINotifyBracket) {
      this.currentAQINotifyBracket = newBracket;
      return `QUACK!!! AQI is now ${newBracket}!!\n\n${reportData(data, this.name)}`
    }
    return ""
  }

  async getReport() : Promise<string | Error> {
    const data = await this.getData();
    // Reset thresholds brackets since we're reporting data anyway
    this.currentAQINotifyBracket = this.calculateAQINotifyBracket(data.AQI) || this.currentAQINotifyBracket;
    return reportData(data, this.name);
  }

  private calculateAQINotifyBracket(AQI : number): notifyBracket {
    if(!this.lowAQIThreshold || !this.highAQIThreshold) {
      console.log("no thresholds to notify for");
      return notifyBracket.none;
    }

    if(AQI < this.lowAQIThreshold) {
      return notifyBracket.low
    }
    if(AQI > this.highAQIThreshold) {
      return notifyBracket.high
    }
    return notifyBracket.none;
  }
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
      console.log("setting up sensor", sensorData);
      const Sensor = sensorMap[sensorData.type];
      if(Sensor) {
        return {
          name: sensorData.name,
          sensor: new Sensor(sensorData),
          lowAQIThreshold: sensorData.lowAQIThreshold,
          highAQIThreshold: sensorData.highAQIThreshold,
        }
      }
      console.log(`Unknown sensor "${sensorData.type}"`);
    }).filter((s: any) => !!s);

    return new Aggregator(sensors);
  }

}

export default Aggregator;
