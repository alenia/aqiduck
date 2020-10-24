import { sensorData, Sensor, monitoringTypes, labeledSensor } from './interfaces/sensor';
import { aqiBreakpoints } from './aqiBreakpoints';

enum notifyBracket {
  low = "low",
  high = "high",
  none = "",
}

interface monitoringState {
  thresholds : [number, number];
  notifyBracket: notifyBracket;
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

    if(data.AQI === undefined) { return "" }

    console.log(this.currentAQINotifyBracket, this.formatReport(data));

    const stateChanges = this.updateAQIMonitoringState(data.AQI);
    if(stateChanges.changed && stateChanges.bracketChange) {
      const newBracket = stateChanges.bracketChange
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

    if(data.AQI === undefined) { return "" }

    this.updateAQIMonitoringState(data.AQI, true);

    return this.formatReport(data);
  }

  //TODO: figure out how to get rid of the bracketChange flag? it has to do with threshold crossing direction
  private updateAQIMonitoringState(AQI: number, forceReset = false) : { old: monitoringState; new: monitoringState, bracketChange: notifyBracket, changed: boolean } {
    const oldThresholds : [number,number] | undefined = this.AQIThresholds ? [...this.AQIThresholds] : undefined;
    const old : monitoringState = { thresholds: oldThresholds, notifyBracket: this.currentAQINotifyBracket }

    // Need to calculate and expose whether above or below the PREVIOUS bracket
    // Figure out how to refactor this later so it's clearer
    const oldThresholdNotifyBracket = this.calculateAQINotifyBracket(AQI) || this.currentAQINotifyBracket;

    const thresholds = this.calculateAQIThresholds(AQI, forceReset) || oldThresholds;

    const shouldChange = oldThresholdNotifyBracket !== this.currentAQINotifyBracket || thresholds !== oldThresholds;

    this.AQIThresholds = thresholds;

    // only change the bracket if other things changed
    const notifyBracket = shouldChange || forceReset ? this.calculateAQINotifyBracket(AQI) : this.currentAQINotifyBracket;
    this.currentAQINotifyBracket = notifyBracket;

    const stateChanges = { old, new: { thresholds, notifyBracket }, bracketChange: oldThresholdNotifyBracket, changed: shouldChange}

    if(stateChanges.changed) { console.log(this.name, 'monitoring state changing', AQI, stateChanges) }

    return stateChanges;
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

  private calculateAQIThresholds(AQI : number, forceReset = false): [number, number] {
    if(this.AQIMonitoring === monitoringTypes.dynamic) {
      return this.thresholdForDynamicMonitoring(AQI, forceReset);
    }

    if(this.AQIMonitoring === monitoringTypes.category) {
      return this.thresholdForCategoryMonitoring(AQI, forceReset);
    }
  }

  private thresholdForDynamicMonitoring(AQI : number, forceReset : boolean) : [number, number] | undefined {
    if(!forceReset && this.AQIThresholds && this.AQIThresholds[0] <= AQI && AQI <= this.AQIThresholds[1]) {
      return;
    }

    return [AQI - 4, AQI + 4];
  }

  private thresholdForCategoryMonitoring(AQI : number, forceReset : boolean) : [number, number] | undefined {
    const breakpoint = aqiBreakpoints.find((b) : boolean => (
      b.AQI[0] <= AQI &&
      AQI <= b.AQI[1]
    ))
    let newThresholds : [number, number];

    if(breakpoint) {
      newThresholds = [breakpoint.AQI[0], breakpoint.AQI[1]];
    } else {
      const low = Math.floor(AQI/100)*100;
      newThresholds = [low, low + 100]
    }
    if(AQI - newThresholds[0] < 4) {
      newThresholds[0] = AQI - 4
    }
    if(newThresholds[1] - AQI < 4) {
      newThresholds[1] = AQI + 4
    }
    if(!forceReset && this.AQIThresholds && this.AQIThresholds[0] <= AQI && AQI <= this.AQIThresholds[1]) {
      if(newThresholds[0] > this.AQIThresholds[0] && this.AQIThresholds[1] === newThresholds[1]) {
        // if the new lower bound is higher than the old lower bound, change the lower bound
      } else if(newThresholds[1] < this.AQIThresholds[1] && this.AQIThresholds[0] === newThresholds[0]) {
        // if the new upper bound is lower than the old upper bound, change the upper bound
      } else {
        console.log(this.name, "not changing thresholds", { AQI, provisional: newThresholds, current: this.AQIThresholds })
        return
      }
    }

    return newThresholds;
  }

  private calculateAQINotifyBracket(AQI : number): notifyBracket {
    if(!this.AQIThresholds || this.AQIThresholds.length < 2) {
      console.log("no thresholds to notify for", this.name);
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

