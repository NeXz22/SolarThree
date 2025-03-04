import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { planetData } from './planetData.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 3, 0, 0);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 150;

// Camera initial position
camera.position.set(0, 30, 90);
controls.update();

// Background stars
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
});

const starsVertices = [];
for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starsVertices.push(x, y, z);
}

starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Create planets
const planets = {};
const planetOrbitLines = {};
const textureLoader = new THREE.TextureLoader();

// Track orbital angles for each planet
const planetOrbitalAngles = {};

// Sun
const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load('/src/textures/sun.jpg'),
    emissive: 0xffff00,
    emissiveIntensity: 0.5,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);
planets.sun = sun;

// Create planets from data
planetData.forEach(planet => {
    if (planet.name === 'Sun') return; // Skip sun as we already created it
    
    // Create planet
    const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        map: textureLoader.load(`/src/textures/${planet.texture}`),
        roughness: 1,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position planet at its orbital distance
    mesh.position.x = planet.distance;
    
    // Initialize orbital angle
    const planetName = planet.name.toLowerCase();
    planetOrbitalAngles[planetName] = Math.random() * Math.PI * 2; // Random starting position
    
    // Add planet to scene and store reference
    scene.add(mesh);
    planets[planetName] = mesh;
    
    // Create orbit line
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
    
    const orbitPoints = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        orbitPoints.push(
            Math.cos(theta) * planet.distance,
            0,
            Math.sin(theta) * planet.distance
        );
    }
    
    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbit);
    planetOrbitLines[planetName] = orbit;
    
    // Add rings for Saturn
    if (planet.name === 'Saturn') {
        const ringGeometry = new THREE.RingGeometry(planet.size + 0.5, planet.size + 2, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            map: textureLoader.load('/src/textures/saturn_rings.png'),
            side: THREE.DoubleSide,
            transparent: true,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
    }
});

// Raycaster for planet selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Info panel elements
const infoPanel = document.getElementById('info-panel');
const planetNameElement = document.getElementById('planet-name');
const planetDescriptionElement = document.getElementById('planet-description');
const planetDistanceElement = document.getElementById('planet-distance');
const planetDiameterElement = document.getElementById('planet-diameter');
const planetDayLengthElement = document.getElementById('planet-day-length');
const planetYearLengthElement = document.getElementById('planet-year-length');
const closeButton = document.getElementById('close-btn');

// Speed control elements
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
let speedMultiplier = 1.0;

// Update speed value display and multiplier when slider changes
speedSlider.addEventListener('input', (event) => {
    speedMultiplier = parseFloat(event.target.value);
    speedValue.textContent = `${speedMultiplier.toFixed(1)}x`;
});

// Close info panel when close button is clicked
closeButton.addEventListener('click', () => {
    infoPanel.classList.remove('visible');
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Handle mouse click for planet selection
window.addEventListener('click', (event) => {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Get all planet meshes
    const planetMeshes = Object.values(planets);
    
    // Check for intersections
    const intersects = raycaster.intersectObjects(planetMeshes);
    
    if (intersects.length > 0) {
        const selectedPlanet = intersects[0].object;
        
        // Find the planet data
        const planetInfo = planetData.find(p => 
            planets[p.name.toLowerCase()] === selectedPlanet
        );
        
        if (planetInfo) {
            // Update info panel
            planetNameElement.textContent = planetInfo.name;
            planetDescriptionElement.textContent = planetInfo.description;
            planetDistanceElement.textContent = `Distance from Sun: ${planetInfo.distanceFromSun}`;
            planetDiameterElement.textContent = `Diameter: ${planetInfo.diameter}`;
            planetDayLengthElement.textContent = `Day Length: ${planetInfo.dayLength}`;
            planetYearLengthElement.textContent = `Year Length: ${planetInfo.yearLength}`;
            
            // Show info panel
            infoPanel.classList.add('visible');
            
            // Move camera to focus on the selected planet
            const distance = selectedPlanet.geometry.parameters.radius * 5;
            const planetPosition = new THREE.Vector3().copy(selectedPlanet.position);
            
            // Animate camera movement
            const startPosition = camera.position.clone();
            const endPosition = new THREE.Vector3(
                planetPosition.x + distance,
                planetPosition.y + distance / 2,
                planetPosition.z + distance
            );
            
            // Set controls target to planet position
            controls.target.copy(planetPosition);
        }
    }
});

// Base animation speeds for planets
const basePlanetSpeeds = {
    mercury: 0.004,
    venus: 0.0015,
    earth: 0.001,
    mars: 0.0008,
    jupiter: 0.0004,
    saturn: 0.0002,
    uranus: 0.0001,
    neptune: 0.00007,
};

// Track the last timestamp for calculating delta time
let lastTime = performance.now();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Calculate delta time in seconds
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Rotate sun
    sun.rotation.y += 0.001 * speedMultiplier * deltaTime * 60;
    
    // Rotate and orbit planets
    Object.entries(planets).forEach(([name, planet]) => {
        if (name === 'sun') return;
        
        // Rotate planet
        planet.rotation.y += 0.01 * speedMultiplier * deltaTime * 60;
        
        // Orbit planet with speed multiplier
        if (basePlanetSpeeds[name]) {
            // Update orbital angle based on speed and delta time
            planetOrbitalAngles[name] += basePlanetSpeeds[name] * speedMultiplier * deltaTime * 60;
            
            const distance = planetData.find(p => p.name.toLowerCase() === name)?.distance || 0;
            
            // Update planet position based on its orbital angle
            planet.position.x = Math.cos(planetOrbitalAngles[name]) * distance;
            planet.position.z = Math.sin(planetOrbitalAngles[name]) * distance;
        }
    });
    
    controls.update();
    renderer.render(scene, camera);
}

animate(); 