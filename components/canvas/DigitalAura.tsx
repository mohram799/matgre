'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// ── GLSL: Liquid Gold Plasma Shader ──────────────────────────────
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;

  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + 2.0*C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0*C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_*D.wyz - D.xzx;
    vec4 j = p - 49.0*floor(p*ns.z*ns.z);
    vec4 x_ = floor(j*ns.z);
    vec4 y_ = floor(j - 7.0*x_);
    vec4 x = x_*ns.x + ns.yyyy;
    vec4 y = y_*ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m*m;
    return 42.0*dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float noise = snoise(vec3(pos.x * 1.5 + uTime * 0.15, pos.y * 1.5 + uTime * 0.1, uTime * 0.08));
    pos.z += noise * 0.35;
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uScrollY;
  uniform vec2 uMouse;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    // Deep obsidian → liquid gold
    vec3 obsidian  = vec3(0.04, 0.04, 0.06);
    vec3 gold      = vec3(0.83, 0.68, 0.21);
    vec3 roseGold  = vec3(0.92, 0.76, 0.46);

    float dist = length(vUv - 0.5);
    float mouseInfluence = 1.0 - smoothstep(0.0, 0.5, length(vUv - uMouse));
    float mixVal = (vPosition.z * 2.0 + uScrollY * 0.4 + mouseInfluence * 0.3);
    mixVal = smoothstep(-0.3, 0.7, mixVal);

    vec3 color = mix(obsidian, gold, mixVal);
    color = mix(color, roseGold, mouseInfluence * 0.4);

    // Specular gleam
    float spec = pow(max(0.0, mixVal - 0.3), 6.0) * 0.8;
    color += spec * vec3(1.0, 0.95, 0.7);

    // Vignette
    float vignette = smoothstep(0.9, 0.4, dist);
    color *= vignette * 0.6 + 0.4;

    // Subtle animated shimmer
    float shimmer = sin(vUv.x * 20.0 + uTime * 2.0) * sin(vUv.y * 20.0 - uTime * 1.5) * 0.04;
    color += shimmer * gold;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ── Gold Plasma Mesh ─────────────────────────────────────────────
function GoldPlasmaMesh({ scrollY }: { scrollY: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef([0.5, 0.5]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight];
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const uniforms = useMemo(() => ({
    uTime:    { value: 0 },
    uScrollY: { value: 0 },
    uMouse:   { value: new THREE.Vector2(0.5, 0.5) },
  }), []);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value    = state.clock.elapsedTime;
    matRef.current.uniforms.uScrollY.value = scrollY;
    matRef.current.uniforms.uMouse.value.set(mouse.current[0], mouse.current[1]);
  });

  return (
    <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -1, 0]} scale={[18, 18, 1]}>
      <planeGeometry args={[1, 1, 192, 192]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Floating Gold Orbs ───────────────────────────────────────────
function GoldOrbs() {
  const orbData = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      pos: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
      ] as [number, number, number],
      scale: 0.08 + Math.random() * 0.18,
      speed: 0.4 + Math.random() * 0.6,
    })),
  []);

  return (
    <>
      {orbData.map((orb, i) => (
        <Float key={i} speed={orb.speed} rotationIntensity={0.2} floatIntensity={1.5}>
          <mesh position={orb.pos}>
            <sphereGeometry args={[orb.scale, 32, 32]} />
            <meshStandardMaterial
              color="#C5A059"
              metalness={1}
              roughness={0.1}
              emissive="#8B6914"
              emissiveIntensity={0.4}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

// ── Camera Drift ─────────────────────────────────────────────────
function CinematicCamera({ scrollY }: { scrollY: number }) {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    camera.position.x = Math.sin(t * 0.08) * 0.6;
    camera.position.y = 3.5 + Math.cos(t * 0.05) * 0.3 - scrollY * 1.5;
    camera.position.z = 6 + Math.sin(t * 0.06) * 0.4;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ── Public Export ────────────────────────────────────────────────
export default function DigitalAura({ scrollY = 0 }: { scrollY?: number }) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 3.5, 6], fov: 55 }}
      style={{ background: '#0A0A0E' }}
    >
      <CinematicCamera scrollY={scrollY} />

      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 8, 4]} intensity={2} color="#C5A059" />
      <pointLight position={[-6, 2, -4]} intensity={1} color="#4A3010" />
      <pointLight position={[6, 2, -4]} intensity={0.8} color="#C5A059" />

      {/* Stars for depth */}
      <Stars radius={40} depth={20} count={800} factor={2} saturation={0} fade speed={0.5} />

      {/* Main hero elements */}
      <GoldPlasmaMesh scrollY={scrollY} />
      <GoldOrbs />
    </Canvas>
  );
}
