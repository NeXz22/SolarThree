uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    // Add subtle vertex displacement for a more dynamic surface
    float displacement = sin(position.x * 10.0 + uTime) * sin(position.y * 10.0 + uTime) * sin(position.z * 10.0 + uTime) * 0.05;
    vec3 newPosition = position + normal * displacement;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
} 