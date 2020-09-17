import { Sensor, sensorData } from './interfaces/sensor';
import calculateAQI from './calculateAQI';
import axios from 'axios';

export default class PurpleAirSensor implements Sensor {
  sensorId: number;

  constructor({ id }: { id: number }) {
    this.sensorId = id;
  }

  async getData(): Promise<sensorData> {
    let response
    try {
      response = await axios.get(`https://api.purpleair.com/v1/sensors/${this.sensorId}`, {
        headers: { "X-API-Key": process.env.PURPLEAIR_API_READ_KEY }
      });
      const results = response.data.sensor;
      if(!results) {
        // TODO: post a message to slack about this error state
        console.log(`Empty results for PurpleAir Sensor ${this.sensorId}`);
        return { error: "No results" }
      }
      const stats = results.stats_a;
      const currentPM2_5 = stats["pm2.5"];
      const tenMinuteAveragePM2_5 = stats["pm2.5_10minute"];

      const aqiData = calculateAQI(tenMinuteAveragePM2_5)

      return {
        AQICategory: aqiData.category,
        AQIColorHex: aqiData.colorHex,
        AQI: aqiData.AQI,
        temperature: results.temperature_a - 8
      };
    } catch(error) {
        console.log("Error getting data for PurpleAir sensor", this);
        console.log("Response:", response && response.data);
        console.log("Error:", error);
        return { error };
    }
  }
}
