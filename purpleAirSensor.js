const axios = require('axios');
const calculateAQI = require('./calculateAQI');

class PurpleAirSensor {
  constructor(sensorId) {
    this.sensorId = sensorId
  }

  async getData() {
    return axios.get(`https://www.purpleair.com/json?show=${this.sensorId}`)
      .then(function (response) {
        let results = response.data.results[0];
        let stats = JSON.parse(results.Stats);
        let currentPM2_5 = stats.v;
        let tenMinuteAveragePM2_5 = stats.v1;

        return {
          AQI: calculateAQI(tenMinuteAveragePM2_5),
          temperature: results.temp_f
        };
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
  }
}

module.exports = PurpleAirSensor;
