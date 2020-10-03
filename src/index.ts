import dotenv from 'dotenv';
dotenv.config();

import AqiDuckController from './aqiDuckController';
import attachListeners from './slackListener';


export default async function index() : Promise<void> {
  AqiDuckController.subscribeAll();
  attachListeners();
}

index();
