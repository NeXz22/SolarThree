// This script downloads planet textures from NASA's public domain images
// Run with: node download-textures.js

import fs from 'fs';
import https from 'https';
import path from 'path';

const TEXTURE_DIR = './src/textures';

// Create textures directory if it doesn't exist
if (!fs.existsSync(TEXTURE_DIR)) {
  fs.mkdirSync(TEXTURE_DIR, { recursive: true });
}

const textures = [
  {
    name: 'sun.jpg',
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/frames/730x730_1x1_30p/sun.jpg'
  },
  {
    name: 'mercury.jpg',
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004300/a004386/mercury_1k_color.jpg'
  },
  {
    name: 'venus.jpg',
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004300/a004386/venus_1k_color.jpg'
  },
  {
    name: 'earth.jpg',
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57735/land_ocean_ice_cloud_2048.jpg'
  },
  {
    name: 'mars.jpg',
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004300/a004386/mars_1k_color.jpg'
  },
  {
    name: 'jupiter.jpg',
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004300/a004386/jupiter_1k_color.jpg'
  },
  {
    name: 'saturn.jpg',
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004300/a004386/saturn_1k_color.jpg'
  },
  {
    name: 'saturn_rings.png',
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004300/a004386/saturnringcolor.jpg'
  },
  {
    name: 'uranus.jpg',
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004300/a004386/uranus_1k_color.jpg'
  },
  {
    name: 'neptune.jpg',
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004300/a004386/neptune_1k_color.jpg'
  }
];

// Download each texture
textures.forEach(texture => {
  const filePath = path.join(TEXTURE_DIR, texture.name);
  const file = fs.createWriteStream(filePath);
  
  console.log(`Downloading ${texture.name}...`);
  
  https.get(texture.url, response => {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${texture.name}`);
    });
  }).on('error', err => {
    fs.unlink(filePath, () => {}); // Delete the file if there's an error
    console.error(`Error downloading ${texture.name}: ${err.message}`);
  });
}); 