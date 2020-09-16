import { sensorData, Sensor } from './interfaces/sensor';
import sensorMap from './sensorMap';

interface labeledSensor {
  name: string;
  sensor: Sensor;
  AQIThresholds?: [number, number];
}

interface sensorJson {
  name: string;
  type: string;
  id: number;
  AQIThresholds?: [number, number];
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
  AQIThresholds: [number,number];
  private currentAQINotifyBracket: notifyBracket;

  constructor({ name, sensor, AQIThresholds } : labeledSensor) {
    this.sensor = sensor;
    this.name = name;
    //TODO this should probably be an array of two values. Also do validation that low is below high
    this.AQIThresholds = AQIThresholds;
    this.currentAQINotifyBracket = notifyBracket.none;
  }

  async monitorThresholds() : Promise<string> {
    if(!this.AQIThresholds) {
      return "";
    }
    const data = await this.getData();
    console.log(this.name, reportData(data, this.currentAQINotifyBracket));
    const newBracket = this.calculateAQINotifyBracket(data.AQI) || this.currentAQINotifyBracket;
    if(newBracket && newBracket !== this.currentAQINotifyBracket) {
      this.currentAQINotifyBracket = newBracket;
      return `QUACK!!! AQI is getting ${newBracket}er!!\n\n${reportData(data, this.name)}`
    }
    return ""
  }

  async getReport() : Promise<string | Error> {
    const data = await this.getData();
    // Reset thresholds brackets since we're reporting data anyway
    this.currentAQINotifyBracket = this.calculateAQINotifyBracket(data.AQI) || this.currentAQINotifyBracket;
    return reportData(data, this.name);
  }

  private async getData() { //Only call this with getReport or monitorThresholds
    try {
      return await this.sensor.getData();
    } catch (e) {
      console.log('reporting error for sensor', this, e);
      throw(e);
    }
  }


  private calculateAQINotifyBracket(AQI : number): notifyBracket {
    if(!this.AQIThresholds || this.AQIThresholds.length < 2) {
      console.log("no thresholds to notify for");
      return notifyBracket.none;
    }

    if(AQI < this.AQIThresholds[0]) {
      return notifyBracket.low
    }
    if(AQI > this.AQIThresholds[1]) {
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
      const Sensor = sensorMap[sensorData.type];
      if(Sensor) {
        return {
          name: sensorData.name,
          sensor: new Sensor(sensorData),
          AQIThresholds: sensorData.AQIThresholds,
        }
      }
      console.log(`Unknown sensor "${sensorData.type}"`);
    }).filter((s: any) => !!s);

    return new Aggregator(sensors);
  }

}

export default Aggregator;
