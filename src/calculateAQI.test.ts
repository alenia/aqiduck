import calculateAQI from './calculateAQI';

test("It turns raw PM 2.5 numbers into AQI", () => {
  expect(calculateAQI(6).AQI).toEqual(25);
  expect(calculateAQI(6).category).toEqual("Good");
  expect(calculateAQI(6).colorRGB).toEqual("rgb(128,242,0)");
  expect(calculateAQI(12).AQI).toEqual(50);
  expect(calculateAQI(12).category).toEqual("Good");
  expect(calculateAQI(12).colorRGB).toEqual("rgb(255,255,0)");
  expect(calculateAQI(12).colorHex).toEqual("#ffff00");
  expect(calculateAQI(20).AQI).toEqual(68);
  expect(calculateAQI(20).category).toEqual("Moderate");
  expect(calculateAQI(20).colorRGB).toEqual("rgb(255,211,0)");
  expect(calculateAQI(35.46).AQI).toEqual(100);
  expect(calculateAQI(35.46).category).toEqual("Moderate");
  expect(calculateAQI(35.46).colorRGB).toEqual("rgb(255,126,0)");
  expect(calculateAQI(40).AQI).toEqual(112);
  expect(calculateAQI(40).category).toEqual("Unhealthy for Sensitive Groups");
  expect(calculateAQI(40).colorRGB).toEqual("rgb(255,98,0)");
  expect(calculateAQI(80).AQI).toEqual(164);
  expect(calculateAQI(80).category).toEqual("Unhealthy");
  expect(calculateAQI(80).colorRGB).toEqual("rgb(229,0,20)");
  expect(calculateAQI(200).AQI).toEqual(250);
  expect(calculateAQI(200).category).toEqual("Very Unhealthy");
  expect(calculateAQI(300).AQI).toEqual(350);
  expect(calculateAQI(300).category).toEqual("Hazardous");
  expect(calculateAQI(300).colorRGB).toEqual("rgb(126,0,35)");
  expect(calculateAQI(400).AQI).toEqual(434);
  expect(calculateAQI(600).AQI).toEqual(600); // Return raw PM when above 500
  expect(calculateAQI(600).category).toEqual("Unknown");
  expect(calculateAQI(600).colorRGB).toEqual("rgb(66,0,33)");
  expect(calculateAQI(600).colorHex).toEqual("#420021");
});
