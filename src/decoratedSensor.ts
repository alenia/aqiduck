import { sensorData, Sensor, monitoringTypes, labeledSensor } from './interfaces/sensor';

enum notifyBracket {
  low = "low",
  high = "high",
  none = "",
}

export default class DecoratedSensor {
  name: string;
  sensor: Sensor;
  AQIThresholds: [number,number];
  AQIMonitoring?: monitoringTypes;
  private currentAQINotifyBracket: notifyBracket;

  constructor({ name, sensor, AQIThresholds, AQIMonitoring } : labeledSensor) {
    this.sensor = sensor;
    this.name = name;
    //TODO this should probably be an array of two values. Also do validation that low is below high
    this.AQIThresholds = AQIThresholds;
    this.AQIMonitoring = AQIThresholds ? monitoringTypes.static : AQIMonitoring;
    this.currentAQINotifyBracket = notifyBracket.none;
  }

  async monitorThresholds() : Promise<string> {
    if(!this.AQIThresholds) {
      return "";
    }
    const data = await this.getData();
    console.log(this.currentAQINotifyBracket, this.formatReport(data));
    const newBracket = this.calculateAQINotifyBracket(data.AQI) || this.currentAQINotifyBracket;
    if(newBracket && newBracket !== this.currentAQINotifyBracket) {
      this.resetAQIThresholds(data.AQI);
      this.currentAQINotifyBracket = this.calculateAQINotifyBracket(data.AQI);
      const prefix = newBracket === notifyBracket.high ? ":arrow_up: QUACK!!!" : ":arrow_down: quack!"
      return `${prefix} ${this.name} AQI is getting ${newBracket}er!!\n\n${this.formatReport(data)}`
    }
    return ""
  }

  showMonitoringConfig() : string {
    if(!this.AQIMonitoring) {
      return `${this.name}: not monitoring`
    }
    let out = `${this.name}: ${this.AQIMonitoring} monitoring`;
    if(this.AQIThresholds) {
      out += ` [${this.AQIThresholds}]`;
    }
    return out;
  }

  async getReport() : Promise<string | Error> {
    const data = await this.getData();
    // Reset thresholds and brackets since we're reporting data anyway
    this.resetAQIThresholds(data.AQI);
    this.currentAQINotifyBracket = this.calculateAQINotifyBracket(data.AQI) || this.currentAQINotifyBracket;
    return this.formatReport(data);
  }

  private formatReport({AQI, AQICategory, AQIColorHex, temperature} : sensorData) {
    let output = "";
    if(AQI === 0 || AQI) {
      output += `${this.name} AQI: ${AQI}`;
      if(AQICategory && AQIColorHex) {
        output += ` (${AQICategory} ${AQIColorHex})`
      }
      output += '\n'
    }
    if(temperature) {
      output += `${this.name} Temperature: ${temperature}\n`;
    }
    return output;
  }

  private async getData() { //Only call this with getReport or monitorThresholds
    try {
      return await this.sensor.getData();
    } catch (e) {
      console.log('reporting error for sensor', this, e);
      throw(e);
    }
  }

  private resetAQIThresholds(AQI : number): void {
    if(this.AQIMonitoring !== monitoringTypes.dynamic) { return }
    console.log("resetting thresholds", [AQI - 4, AQI + 4]);
    this.AQIThresholds = [AQI - 4, AQI + 4];
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

