const geolib = require('geolib');

// An example radius of 500 meters
const radius = 500;

// Test coordinates that are close to each other
const point1 = { latitude: 10.690154, longitude: -61.559144 };
const point2 = { latitude: 10.690155, longitude: -61.559145 };

const isWithinRadius = geolib.isPointWithinRadius(point1, point2, radius);

console.log(isWithinRadius); // Should log true
