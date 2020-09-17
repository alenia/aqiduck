//  https://en.wikipedia.org/wiki/Air_quality_index#Computing_the_AQI

export interface breakpoint {
  name: string;
  pm2_5: [number, number]; // range
  AQI: [number, number]; // range
  color: [number, number, number]; // ['red','green','blue']
}

export const aqiBreakpoints:  Array<breakpoint> = [
  {
    name: "Good",
    AQI: [0,50],
    pm2_5: [0,12.0],
    color: [0,228,0] // rgb(0,228,0)
  },
  {
    name: "Moderate",
    AQI: [51,100],
    pm2_5: [12.1,35.4],
    color: [255,255,0] // rgb(255,255,0)
  },
  {
    name: "Unhealthy for Sensitive Groups",
    AQI: [101,150],
    pm2_5: [35.5,55.4],
    color: [255,126,0] // rgb(255,126,0)

  },
  {
    name: "Unhealthy",
    AQI: [151,200],
    pm2_5: [55.5,150.4],
    color: [255, 0, 0] // rgb(255,0,0)
  },
  {
    name: "Very Unhealthy",
    AQI: [201, 300],
    pm2_5: [150.5,250.4],
    color: [153, 0, 76] // rgb(156,0,76)
  },
  {
    name: "Hazardous",
    AQI: [301,400],
    pm2_5: [250.5, 350.4],
    color: [126,0,35] // rgb(126,0,35)
  },
  {
    name: "Hazardous",
    AQI: [401,500],
    pm2_5: [350.5,500.4],
    color: [126,0,35] // rgb(126,0,35)
  }
]
