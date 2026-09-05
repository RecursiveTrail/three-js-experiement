import { DoubleSide } from 'three'
import { ROOM_H } from './constants'

const CREAM = '#f4efe4'
const SPOT = '#6b4428'
const HORN = '#efe6d4'
const NOSE = '#e8b4c4'

function CowCaricature({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh scale={[1.15, 0.85, 0.35]}>
        <sphereGeometry args={[0.28, 14, 14]} />
        <meshStandardMaterial color={CREAM} roughness={0.7} />
      </mesh>
      <mesh position={[0.1, 0.08, 0.08]} scale={[0.7, 0.45, 0.2]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color={SPOT} roughness={0.75} />
      </mesh>
      <mesh position={[-0.12, -0.02, 0.08]} scale={[0.5, 0.35, 0.18]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color={SPOT} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.16, 0.22]} scale={[0.85, 0.8, 0.45]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color={CREAM} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.1, 0.32]} scale={[0.7, 0.45, 0.4]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color={CREAM} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.08, 0.36]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color={NOSE} />
      </mesh>
      <mesh position={[-0.045, 0.18, 0.3]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#2a1c12" />
      </mesh>
      <mesh position={[0.045, 0.18, 0.3]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#2a1c12" />
      </mesh>
      <mesh position={[-0.12, 0.22, 0.2]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.035, 0.1, 6]} />
        <meshStandardMaterial color={HORN} roughness={0.55} />
      </mesh>
      <mesh position={[0.12, 0.22, 0.2]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.035, 0.1, 6]} />
        <meshStandardMaterial color={HORN} roughness={0.55} />
      </mesh>
      <mesh position={[-0.14, 0.14, 0.18]} rotation={[0, 0, 0.7]} scale={[0.35, 1, 0.2]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#c9a07a" />
      </mesh>
      <mesh position={[0.14, 0.14, 0.18]} rotation={[0, 0, -0.7]} scale={[0.35, 1, 0.2]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#c9a07a" />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, -0.28, 0.04]}>
          <cylinderGeometry args={[0.04, 0.045, 0.16, 8]} />
          <meshStandardMaterial color={CREAM} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

export function Room() {
  const h = ROOM_H
  const half = 4
  const wall = '#e8d5b7'
  const wood = '#6b3f24'
  const floor = '#c4a574'
  const muralY = 2.35
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[half * 2, half * 2]} />
        <meshStandardMaterial color={floor} />
      </mesh>
      <mesh position={[0, h / 2, -half]} receiveShadow>
        <planeGeometry args={[half * 2, h]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh position={[-half, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[half * 2, h]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh position={[half, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[half * 2, h]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh position={[0, h - 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[half * 2, half * 2]} />
        <meshStandardMaterial color="#d9c4a0" side={DoubleSide} />
      </mesh>
      {[-2, 0, 2].map((x) => (
        <mesh key={x} position={[x, h - 0.15, 0]}>
          <boxGeometry args={[0.18, 0.12, 7.6]} />
          <meshStandardMaterial color={wood} />
        </mesh>
      ))}

      <group position={[0.35, muralY, -half + 0.08]}>
        <CowCaricature scale={1.15} />
        <group position={[-0.55, -0.12, 0]} scale={0.62}>
          <CowCaricature />
        </group>
      </group>
      <group position={[-half + 0.08, muralY, 0.4]} rotation={[0, Math.PI / 2, 0]}>
        <CowCaricature scale={0.95} />
      </group>
      <group position={[half - 0.08, muralY, -0.3]} rotation={[0, -Math.PI / 2, 0]}>
        <CowCaricature scale={0.95} />
      </group>

      <pointLight position={[-1.6, 4.0, 0.4]} intensity={14} color="#ffd9a0" distance={12} castShadow />
      <pointLight position={[1.8, 3.8, -0.6]} intensity={10} color="#ffcc88" distance={12} />
      <ambientLight intensity={0.4} />
    </group>
  )
}
