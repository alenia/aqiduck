class MockSensor {
  constructor({ id }) {
    this.sensorId = id
  }

  getData()  {
    return {
      AQI: "MOCK AQI",
      temperature: "MOCK TEMPERATURE"
    }
  }
};

module.exports = MockSensor;
