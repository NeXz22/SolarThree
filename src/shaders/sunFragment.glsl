uniform float uTime;
uniform sampler2D uTexture;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// Noise functions from https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.y + o3.xz * (1.0 - d.y);

    return o4.y * d.x + o4.x * (1.0 - d.x);
}

void main() {
    // Sample the texture
    vec4 texColor = texture2D(uTexture, vUv);
    
    // Create animated noise for the fiery effect
    float noiseScale = 2.0;
    float noiseTime = uTime * 0.2;
    vec3 noiseCoord = vec3(vPosition.x * noiseScale, vPosition.y * noiseScale, vPosition.z * noiseScale + noiseTime);
    float noise1 = noise(noiseCoord);
    float noise2 = noise(noiseCoord * 2.0 + vec3(43.2, 12.7, 31.5));
    
    // Create color variations based on noise
    vec3 baseColor = texColor.rgb;
    vec3 hotColor = vec3(1.0, 0.8, 0.3); // Bright yellow
    vec3 coolColor = vec3(0.9, 0.3, 0.1); // Dark orange/red
    
    // Mix colors based on noise
    vec3 finalColor = mix(coolColor, hotColor, noise1);
    finalColor = mix(finalColor, baseColor, 0.5);
    
    // Add glow at the edges
    float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    finalColor += vec3(1.0, 0.6, 0.3) * fresnel * 0.5;
    
    // Add some flickering
    float flicker = sin(uTime * 5.0) * 0.5 + 0.5;
    finalColor *= 0.9 + flicker * 0.1;
    
    // Add noise-based highlights
    finalColor += vec3(1.0, 0.9, 0.5) * pow(noise2, 8.0) * 0.5;
    
    gl_FragColor = vec4(finalColor, 1.0);
} 