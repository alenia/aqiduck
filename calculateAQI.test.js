const calculateAQI = require('./calculateAQI');

test("It turns raw PM 2.5 numbers into AQI", () => {
  expect(calculateAQI(6)).toEqual(25);
  expect(calculateAQI(12)).toEqual(50);
  expect(calculateAQI(20)).toEqual(68);
  expect(calculateAQI(40)).toEqual(112);
  expect(calculateAQI(80)).toEqual(164);
  expect(calculateAQI(200)).toEqual(250);
  expect(calculateAQI(300)).toEqual(350);
  expect(calculateAQI(400)).toEqual(434);
  expect(calculateAQI(600)).toEqual(600); // Return raw PM when above 500
});
