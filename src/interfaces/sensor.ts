export interface sensorData {
  AQI?: number;
  AQICategory?: string;
  AQIColorHex?: string;
  temperature?: number;
  error?: any;
}

export interface Sensor {
  sensorId: string | number;
  getData: () => Promise<sensorData>;
}

export enum monitoringTypes {
  dynamic = "dynamic",
  static = "static"
}

export interface labeledSensor {
  name: string;
  sensor: Sensor;
  AQIThresholds?: [number, number];
  AQIMonitoring?: monitoringTypes;
}

