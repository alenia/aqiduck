//  https://en.wikipedia.org/wiki/Air_quality_index#Computing_the_AQI

const aqiBreakpoints = require('./aqiBreakpoints.json');

const calculateAQI = function(basePM2_5) {
  let breakpoint = aqiBreakpoints.find(b => (
    b.pm2_5[0] <= basePM2_5 &&
    basePM2_5 <= b.pm2_5[1]
  ));

  if(!breakpoint) { return basePM2_5; };

  let m = (breakpoint.AQI[1] - breakpoint.AQI[0])/(breakpoint.pm2_5[1] - breakpoint.pm2_5[0]);
  return Math.round(m * (basePM2_5 - breakpoint.pm2_5[0]) + breakpoint.AQI[0]);
};

module.exports = calculateAQI;
