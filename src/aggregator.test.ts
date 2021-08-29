import Aggregator from "./aggregator"

import * as aggregator from "./aggregator"
import * as sensor from "./interfaces/sensor"
let outdoorSensorData = {}, indoorSensorData = {};

const outdoorSensor = {
  sensorId: 5,
  getData: jest.fn(() => {
    return Promise.resolve(outdoorSensorData);
  }),
}
const indoorSensor = {
  sensorId: 6,
  getData: jest.fn(() => {
    return Promise.resolve(indoorSensorData);
  }),
}

let aggregator

beforeEach(() => {
  aggregator = new Aggregator([{ name: "Outdoor", sensor: outdoorSensor}, {name: "Indoor", sensor: indoorSensor}]);
  indoorSensorData = {};
  outdoorSensorData = {};
})

describe('.showMonitoringConfig', () => {
  it("lists the monitoring type and current thresholds for the component sensors", () => {
    const config = '{"sensors": [{"name": "Oversharer", "type": "MockSensor", "id": 12345, "AQIMonitoring": "dynamic"}, {"name": "Bounded", "type": "MockSensor", "id": 13245, "AQIThresholds": [10,20]}, {"name": "Dark horse", "type": "MockSensor", "id": 54321}]}';
    aggregator = Aggregator.fromConfig(config);
    expect(aggregator.showMonitoringConfig()).toEqual("Oversharer: dynamic monitoring\nBounded: static monitoring [10,20]\nDark horse: not monitoring");
  });
});
describe('.report', () => {
  test("It lists the indoor AQI and temperature", async () => {
    expect.assertions(3);
    indoorSensorData = {
      AQI: 42,
      temperature: 75
    };
    const report = await aggregator.report();
    expect(indoorSensor.getData).toHaveBeenCalled();
    expect(report).toMatch('Indoor AQI: 42');
    expect(report).toMatch('Indoor Temperature: 75');
  });
  test("It lists the outdoor AQI and temperature", async () => {
    expect.assertions(3);
    outdoorSensorData = {
      AQI: 54,
      temperature: 82
    };
    const report = await aggregator.report();
    expect(outdoorSensor.getData).toHaveBeenCalled();
    expect(report).toMatch('Outdoor AQI: 54');
    expect(report).toMatch('Outdoor Temperature: 82');
  });
  test("It does not list the indoor AQI if none provided", async () => {
    expect.assertions(2);
    indoorSensorData = {};
    const report = await aggregator.report();
    expect(indoorSensor.getData).toHaveBeenCalled();
    expect(report).not.toMatch('Indoor AQI');
  });
  test("It lists the AQI if it is zero", async () => {
    expect.assertions(2);
    indoorSensorData = {
      AQI: 0,
    };
    const report = await aggregator.report();
    expect(indoorSensor.getData).toHaveBeenCalled();
    expect(report).toMatch('Indoor AQI');
  });
  test("It works without an indoor sensor", async () => {
    expect.assertions(2);
    const smallAggregator = new Aggregator([{ name: "Outdoor", sensor: outdoorSensor }]);
    indoorSensorData = {
      AQI: 42,
      temperature: 75
    };
    outdoorSensorData = {
      AQI: 54,
      temperature: 82
    };
    const report = await smallAggregator.report();
    expect(report).toMatch('Outdoor AQI');
    expect(report).not.toMatch('Indoor');
  });
});

describe('Aggregator.fromConfig', () => {
  it('Creates an aggregator with sensors based on the configuration in the string', () => {
    const config = '{"sensors": [{"name": "Quackers", "type": "MockSensor", "id": 12345}, {"name": "Quackwaduck", "type": "PurpleAirSensor", "id": 54321}]}';
    aggregator = Aggregator.fromConfig(config);
    expect(aggregator.sensors.length).toEqual(2);
    expect(aggregator.sensors[0].sensor.constructor.name).toEqual("MockSensor");
  });
  it("Doesn't add a sensor if it doesn't recognize type", () => {
    const config = '{"sensors": [{"name": "Unknown", "type": "Fubara", "id": 12345}, {"name": "Quackwaduck", "type": "PurpleAirSensor", "id": 54321}]}';
    aggregator = Aggregator.fromConfig(config);
    expect(aggregator.sensors.length).toEqual(1);
  });
  it("Doesn't add blow up too badly if the string is poorly formatted", () => {
    const config = '{fhgwgads';
    Aggregator.fromConfig(config);
  });
});

describe("monitorAndNotify", () => {
    let object: any
    let inst: any

    beforeEach(() => {
        object = { 0: { name: "Jean-Philippe", sensor: { sensorId: 12345, getData: () => ({ AQI: 400, AQICategory: "Dwarf Crocodile", AQIColorHex: "Foo bar", temperature: -5.48, error: 500 }) }, AQIThresholds: [12, 987650], AQIMonitoring: sensor.monitoringTypes.static }, 1: { name: "Anas", sensor: { sensorId: "user123", getData: () => ({ AQI: 400, AQICategory: "Nile Crocodile", AQIColorHex: "Foo bar", temperature: -5.48, error: false }) }, AQIThresholds: [987650, 987650], AQIMonitoring: sensor.monitoringTypes.dynamic }, 2: { name: "Jean-Philippe", sensor: { sensorId: "username", getData: () => ({ AQI: 520, AQICategory: "Dwarf Crocodile", AQIColorHex: "Hello, world!", temperature: 1, error: "Message box: foo; bar\n" }) }, AQIThresholds: [56784, "bc23a9d531064583ace8f67dad60f6bb"], AQIMonitoring: sensor.monitoringTypes.category }, 3: { name: "Michael", sensor: { sensorId: 12345, getData: () => ({ AQI: 30, AQICategory: "Spectacled Caiman", AQIColorHex: "foo bar", temperature: 0, error: 500 }) }, AQIThresholds: [12, 987650], AQIMonitoring: sensor.monitoringTypes.static }, 4: { name: "Michael", sensor: { sensorId: 12345, getData: () => ({ AQI: 4, AQICategory: "Spectacled Caiman", AQIColorHex: "foo bar", temperature: -5.48, error: "invalid choice" }) }, AQIThresholds: [12, 56784], AQIMonitoring: sensor.monitoringTypes.static } }
        inst = new aggregator.default(object)
    })

    test("0", async () => {
        await inst.monitorAndNotify()
    })
})

describe("showMonitoringConfig", () => {
    let object: any
    let inst: any

    beforeEach(() => {
        object = { 0: { name: "Michael", sensor: { sensorId: 56784, getData: () => ({ AQI: 320, AQICategory: "Nile Crocodile", AQIColorHex: "This is a Text", temperature: -5.48, error: "Message box: foo; bar\n" }) }, AQIThresholds: ["bc23a9d531064583ace8f67dad60f6bb", "bc23a9d531064583ace8f67dad60f6bb"], AQIMonitoring: sensor.monitoringTypes.dynamic } }
        inst = new aggregator.default(object)
    })

    test("0", () => {
        let callFunction: any = () => {
            inst.showMonitoringConfig()
        }
    
        expect(callFunction).not.toThrow()
    })
})

describe("report", () => {
    let object: any
    let inst: any

    beforeEach(() => {
        object = { 0: { name: "Pierre Edouard", sensor: { sensorId: 12, getData: () => ({ AQI: 380, AQICategory: "Nile Crocodile", AQIColorHex: "Hello, world!", temperature: -100, error: "ValueError" }) }, AQIThresholds: ["bc23a9d531064583ace8f67dad60f6bb", 12345], AQIMonitoring: sensor.monitoringTypes.static }, 1: { name: "Michael", sensor: { sensorId: 56784, getData: () => ({ AQI: 1, AQICategory: "Saltwater Crocodile", AQIColorHex: "foo bar", temperature: -5.48, error: 400 }) }, AQIThresholds: [12, 56784], AQIMonitoring: sensor.monitoringTypes.static }, 2: { name: "Michael", sensor: { sensorId: "a1969970175", getData: () => ({ AQI: 350, AQICategory: "Dwarf Crocodile", AQIColorHex: "foo bar", temperature: 1, error: 429 }) }, AQIThresholds: [12345, 12], AQIMonitoring: sensor.monitoringTypes.category }, 3: { name: "Edmond", sensor: { sensorId: "user123", getData: () => ({ AQI: 520, AQICategory: "Australian Freshwater Crocodile", AQIColorHex: "Hello, world!", temperature: -100, error: 400 }) }, AQIThresholds: [12, 56784], AQIMonitoring: sensor.monitoringTypes.dynamic } }
        inst = new aggregator.default(object)
    })

    test("0", async () => {
        await inst.report()
    })
})

// @ponicode
describe("aggregator.default.fromConfig", () => {
    test("0", () => {
        let callFunction: any = () => {
            aggregator.default.fromConfig("This is a Text")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction: any = () => {
            aggregator.default.fromConfig("Foo bar")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction: any = () => {
            aggregator.default.fromConfig("foo bar")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction: any = () => {
            aggregator.default.fromConfig("Hello, world!")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction: any = () => {
            aggregator.default.fromConfig("")
        }
    
        expect(callFunction).not.toThrow()
    })
})
