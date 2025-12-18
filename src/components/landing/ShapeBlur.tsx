import { useRef, useEffect, useState, FC } from 'react';
import * as THREE from 'three';

interface ShapeBlurProps {
  children: React.ReactNode;
  className?: string;
  variation?: number;
  shapeSize?: number;
  roundness?: number;
  borderSize?: number;
  circleSize?: number;
  circleEdge?: number;
  pixelRatioProp?: number;
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_shapeSize;
  uniform float u_roundness;
  uniform float u_borderSize;
  uniform float u_circleSize;
  uniform float u_circleEdge;
  uniform int u_variation;
  
  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }
  
  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= u_resolution.x / u_resolution.y;
    
    vec2 mouse = (u_mouse - 0.5) * 2.0;
    mouse.x *= u_resolution.x / u_resolution.y;
    
    float d = sdRoundedBox(uv, vec2(u_shapeSize * 0.5), u_roundness);
    float border = smoothstep(0.0, u_borderSize, abs(d));
    
    float mouseDist = length(uv - mouse);
    float circle = smoothstep(u_circleSize + u_circleEdge, u_circleSize, mouseDist);
    
    vec3 color1 = vec3(0.0, 0.8, 0.9);
    vec3 color2 = vec3(0.5, 0.0, 0.8);
    vec3 color = mix(color1, color2, sin(u_time * 0.5) * 0.5 + 0.5);
    
    float alpha = (1.0 - border) * 0.3 + circle * 0.2;
    alpha *= smoothstep(0.02, -0.02, d);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export const ShapeBlur: FC<ShapeBlurProps> = ({
  children,
  className = "",
  variation = 0,
  shapeSize = 1.2,
  roundness = 0.4,
  borderSize = 0.05,
  circleSize = 0.3,
  circleEdge = 0.5,
  pixelRatioProp = 2,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const uniformsRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioProp));
    rendererRef.current = renderer;

    // Uniforms
    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(rect.width, rect.height) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_shapeSize: { value: shapeSize },
      u_roundness: { value: roundness },
      u_borderSize: { value: borderSize },
      u_circleSize: { value: circleSize },
      u_circleEdge: { value: circleEdge },
      u_variation: { value: variation },
    };
    uniformsRef.current = uniforms;

    // Geometry and material
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation
    let animationId: number;
    const animate = () => {
      uniforms.u_time.value += 0.016;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      renderer.setSize(newRect.width, newRect.height);
      uniforms.u_resolution.value.set(newRect.width, newRect.height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [shapeSize, roundness, borderSize, circleSize, circleEdge, variation, pixelRatioProp]);

  // Update mouse position
  useEffect(() => {
    if (uniformsRef.current) {
      uniformsRef.current.u_mouse.value.set(mousePos.x, mousePos.y);
    }
  }, [mousePos]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: 1 - (e.clientY - rect.top) / rect.height,
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ filter: 'blur(40px)' }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
