import MockSensor from './mockSensor';
import PurpleAirSensor from './purpleAirSensor';
import { Sensor } from './interfaces/sensor';

const sensorMap : { [key:string]:any } = {
  MockSensor,
  Mock: MockSensor,
  PurpleAirSensor,
  PurpleAir: PurpleAirSensor
};

export default sensorMap;
