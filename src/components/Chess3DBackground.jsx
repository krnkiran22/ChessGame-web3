import { Canvas } from '@react-three/fiber';
import { Icosahedron, TorusKnot, Environment } from '@react-three/drei';

function Coin({ position, type = 'icosahedron', color = '#FFD700', scale = 1 }) {
  return (
    type === 'icosahedron' ? (
      <Icosahedron args={[1, 0]} position={position} scale={scale}>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </Icosahedron>
    ) : (
      <TorusKnot args={[0.7, 0.25, 100, 16]} position={position} scale={scale}>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </TorusKnot>
    )
  );
}

export default function Chess3DBackground() {
  // The canvas is sized to cover the button column area (centered, not full screen)
  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: 400,
      height: 420,
      zIndex: 0,
      pointerEvents: 'none',
      background: 'transparent',
    }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Environment preset="sunset" />
        {/* Left side coins, vertically offset to match buttons */}
        <Coin position={[-2.7, 2.2, 0]} type="icosahedron" color="#FFD700" scale={1.1} />
        <Coin position={[-2.7, 0.7, 0]} type="torusknot" color="#FFD700" scale={0.9} />
        <Coin position={[-2.7, -0.8, 0]} type="icosahedron" color="#FFFACD" scale={0.8} />
        {/* Right side coins, vertically offset to match buttons */}
        <Coin position={[2.7, 1.5, 0]} type="torusknot" color="#FFD700" scale={1.0} />
        <Coin position={[2.7, 0, 0]} type="icosahedron" color="#FFD700" scale={0.9} />
        <Coin position={[2.7, -1.5, 0]} type="torusknot" color="#FFFACD" scale={0.8} />
      </Canvas>
    </div>
  );
} 