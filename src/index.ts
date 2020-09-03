import AqiDuckController from './aqiDuckController.js';

export default async function index() : Promise<void> {
  AqiDuckController.subscribeAll();
}

index();
