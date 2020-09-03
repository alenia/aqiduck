import MockSensor from './mockSensor';
import PurpleAirSensor from './purpleAirSensor';
//import { Sensor } from './interfaces/sensor'; //TODO

//TODO: use a record https://blog.ricardofilipe.com/understanding-typescript-records/
const sensorMap : { [key:string]:any } = {
  MockSensor,
  Mock: MockSensor,
  PurpleAirSensor,
  PurpleAir: PurpleAirSensor
};

export default sensorMap;
