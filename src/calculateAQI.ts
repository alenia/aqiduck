//  https://en.wikipedia.org/wiki/Air_quality_index#Computing_the_AQI

import { aqiBreakpoints, breakpoint } from './aqiBreakpoints';

export interface aqiData {
  category?: string;
  AQI: number,
  colorRGB?: string;
  colorHex?: string;
}

export default function(basePM2_5: number) : aqiData {
  const breakpointIndex = aqiBreakpoints.findIndex((b : breakpoint) : boolean => (
    b.pm2_5[0] <= basePM2_5 &&
    basePM2_5 < b.pm2_5[1] + .1
  ));

  const breakpoint = aqiBreakpoints[breakpointIndex];
  const unknownColor : [number, number, number] = [66,0,33]

  if(!breakpoint) {
    return {
      category: "Unknown",
      AQI: basePM2_5,
      colorRGB: colorRGBString(unknownColor),
      colorHex: colorHexString(unknownColor)
    }
  }

  const categoryAQIRange = breakpoint.AQI[1] - breakpoint.AQI[0];
  const pmProportion = (basePM2_5 - breakpoint.pm2_5[0])/(breakpoint.pm2_5[1] - breakpoint.pm2_5[0]);
  const aqi = Math.round(categoryAQIRange * pmProportion + breakpoint.AQI[0]);

  const nextCategoryColor = aqiBreakpoints[breakpointIndex + 1] ? aqiBreakpoints[breakpointIndex + 1].color : unknownColor;
  const blendedColor = blendRGBColors(breakpoint.color, nextCategoryColor, pmProportion)

  return {
    category: breakpoint.name,
    AQI: aqi,
    colorRGB: colorRGBString(blendedColor),
    colorHex: colorHexString(blendedColor)
  };
}

// Number ranges aren't yet supported in typescript
// Color 1 and Color 2 should be integers [0..255,0..255,0..255], weight should be 0.0..1.0
function blendRGBColors(color1: [number, number, number], color2: [number, number, number], weight: number) : [number, number, number] {
  return [
    weightedInteger(color1[0], color2[0], weight),
    weightedInteger(color1[1], color2[1], weight),
    weightedInteger(color1[2], color2[2], weight),
  ]
}

function weightedInteger(v1: number, v2: number, weight: number) : number {
  return Math.round(v1 * (1 - weight) + v2 * weight)
}

function colorRGBString(rgbArray: [number, number, number]) : string {
  return `rgb(${rgbArray.join(',')})`;
}

function colorHexString(rgbArray: [number, number, number]) : string {
  const convertValue = (value: number) : string => {
    return `0${value.toString(16)}`.slice(-2);
  }
  return `#${rgbArray.map(convertValue).join('')}`;
}
