export interface sensorData {
  AQI?: number;
  temperature?: number;
  error?: any;
}

export interface Sensor {
  sensorId: string | number;
  getData: () => Promise<sensorData>;
}

