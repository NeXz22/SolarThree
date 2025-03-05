import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { planetData } from './planetData.js';

// Import sun shaders
import sunVertexShader from './shaders/sunVertex.glsl?raw';
import sunFragmentShader from './shaders/sunFragment.glsl?raw';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Bloom effect for the sun and stars
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,    // strength
    0.4,    // radius
    0.85    // threshold
);
composer.addPass(bloomPass);

// FXAA pass for anti-aliasing
const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms['resolution'].value.set(
    1 / (window.innerWidth * renderer.getPixelRatio()),
    1 / (window.innerHeight * renderer.getPixelRatio())
);
composer.addPass(fxaaPass);

// Gamma correction pass
const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
composer.addPass(gammaCorrectionPass);

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
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
});

const starsVertices = [];
for (let i = 0; i < 15000; i++) {
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

// Sun with custom shader
const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
const sunTexture = textureLoader.load('/src/textures/sun.jpg');
const sunUniforms = {
    uTime: { value: 0 },
    uTexture: { value: sunTexture }
};

const sunMaterial = new THREE.ShaderMaterial({
    uniforms: sunUniforms,
    vertexShader: sunVertexShader,
    fragmentShader: sunFragmentShader,
    transparent: true
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
        roughness: 0.8,
        metalness: 0.1,
        envMapIntensity: 0.5
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
    const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0x444444,
        transparent: true,
        opacity: 0.3
    });
    
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
        // Create a container for all rings
        const ringsContainer = new THREE.Object3D();
        
        // Define ring colors and sizes
        const ringData = [
            { innerRadius: planet.size + 0.5, outerRadius: planet.size + 0.8, color: 0xf0e2c9, opacity: 0.6 },
            { innerRadius: planet.size + 0.9, outerRadius: planet.size + 1.2, color: 0xe0c9a0, opacity: 0.8 },
            { innerRadius: planet.size + 1.3, outerRadius: planet.size + 1.5, color: 0xd0b88c, opacity: 0.7 },
            { innerRadius: planet.size + 1.6, outerRadius: planet.size + 1.9, color: 0xc0a678, opacity: 0.9 },
            { innerRadius: planet.size + 2.0, outerRadius: planet.size + 2.2, color: 0xb09564, opacity: 0.7 },
            { innerRadius: planet.size + 2.3, outerRadius: planet.size + 2.5, color: 0xa08450, opacity: 0.5 }
        ];
        
        // Create each ring
        ringData.forEach(ring => {
            const ringGeometry = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: ring.color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: ring.opacity
            });
            
            const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
            ringsContainer.add(ringMesh);
        });
        
        // Rotate the rings container to be horizontal
        ringsContainer.rotation.x = -Math.PI / 2;
        
        // Add rings container to Saturn
        mesh.add(ringsContainer);
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

// Planet list elements
const planetListItems = document.querySelectorAll('#planet-menu li');
let activePlanetItem = null;

// Speed control elements
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
let speedMultiplier = 1.0;

// Camera animation properties
let isCameraAnimating = false;
let cameraAnimationStartTime = 0;
let cameraAnimationDuration = 1000; // 1 second
let cameraStartPosition = new THREE.Vector3();
let cameraEndPosition = new THREE.Vector3();
let controlsStartTarget = new THREE.Vector3();
let controlsEndTarget = new THREE.Vector3();

// Function to focus camera on a planet
function focusOnPlanet(planetName) {
    const planet = planets[planetName];
    if (!planet) return;
    
    // Find planet data
    const planetInfo = planetData.find(p => p.name.toLowerCase() === planetName);
    
    // Update active planet in the list
    if (activePlanetItem) {
        activePlanetItem.classList.remove('active');
    }
    
    // Find and set the active planet item
    planetListItems.forEach(item => {
        if (item.getAttribute('data-planet') === planetName) {
            item.classList.add('active');
            activePlanetItem = item;
        }
    });
    
    // Set up camera animation
    isCameraAnimating = true;
    cameraAnimationStartTime = performance.now();
    
    // Store start positions
    cameraStartPosition.copy(camera.position);
    controlsStartTarget.copy(controls.target);
    
    // Calculate end positions
    const planetPosition = new THREE.Vector3().copy(planet.position);
    controlsEndTarget.copy(planetPosition);
    
    // Calculate appropriate distance based on planet size
    const size = planetInfo ? planetInfo.size : 1;
    const distance = size * 15;
    
    // Position camera at an angle to the planet
    const angle = Math.random() * Math.PI * 2; // Random angle for variety
    cameraEndPosition.set(
        planetPosition.x + Math.cos(angle) * distance,
        planetPosition.y + distance * 0.5,
        planetPosition.z + Math.sin(angle) * distance
    );
    
    // Update info panel with planet information
    if (planetInfo) {
        planetNameElement.textContent = planetInfo.name;
        planetDescriptionElement.textContent = planetInfo.description;
        planetDistanceElement.textContent = `Distance from Sun: ${planetInfo.distanceFromSun}`;
        planetDiameterElement.textContent = `Diameter: ${planetInfo.diameter}`;
        planetDayLengthElement.textContent = `Day Length: ${planetInfo.dayLength}`;
        planetYearLengthElement.textContent = `Year Length: ${planetInfo.yearLength}`;
        
        // Show info panel
        infoPanel.classList.add('visible');
    }
}

// Add click event listeners to planet list items
planetListItems.forEach(item => {
    item.addEventListener('click', () => {
        const planetName = item.getAttribute('data-planet');
        focusOnPlanet(planetName);
    });
});

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
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer and composer
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    
    // Update FXAA pass
    fxaaPass.material.uniforms['resolution'].value.set(
        1 / (window.innerWidth * renderer.getPixelRatio()),
        1 / (window.innerHeight * renderer.getPixelRatio())
    );
});

// Handle mouse click for planet selection
window.addEventListener('click', (event) => {
    // Ignore clicks on UI elements
    if (event.target.closest('#planet-list') || 
        event.target.closest('#info-panel') || 
        event.target.closest('#speed-control') ||
        event.target.closest('#instructions')) {
        return;
    }
    
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
        
        // Find the planet name
        let selectedPlanetName = '';
        for (const [name, planet] of Object.entries(planets)) {
            if (planet === selectedPlanet) {
                selectedPlanetName = name;
                break;
            }
        }
        
        if (selectedPlanetName) {
            focusOnPlanet(selectedPlanetName);
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

// Easing function for smooth camera animation
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Calculate delta time in seconds
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Update sun shader uniforms
    sunUniforms.uTime.value += deltaTime;
    
    // Handle camera animation
    if (isCameraAnimating) {
        const elapsed = currentTime - cameraAnimationStartTime;
        const progress = Math.min(elapsed / cameraAnimationDuration, 1);
        const easedProgress = easeOutCubic(progress);
        
        // Interpolate camera position
        camera.position.lerpVectors(cameraStartPosition, cameraEndPosition, easedProgress);
        
        // Interpolate controls target
        controls.target.lerpVectors(controlsStartTarget, controlsEndTarget, easedProgress);
        
        // Check if animation is complete
        if (progress >= 1) {
            isCameraAnimating = false;
        }
    }
    
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
    
    // Render with post-processing
    composer.render();
}

// Set Earth as the initial focus
setTimeout(() => {
    focusOnPlanet('earth');
}, 1000);

animate(); 