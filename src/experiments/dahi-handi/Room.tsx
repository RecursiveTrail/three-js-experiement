import { DoubleSide } from 'three'

export function Room() {
  const h = 3.2
  const half = 4
  const wall = '#e8d5b7'
  const wood = '#6b3f24'
  const floor = '#c4a574'
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
      <mesh position={[0, 3.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[half * 2, half * 2]} />
        <meshStandardMaterial color="#d9c4a0" side={DoubleSide} />
      </mesh>
      {[-2, 0, 2].map((x) => (
        <mesh key={x} position={[x, 3.05, 0]}>
          <boxGeometry args={[0.18, 0.12, 7.6]} />
          <meshStandardMaterial color={wood} />
        </mesh>
      ))}
      <pointLight position={[-1.6, 2.6, 0.4]} intensity={12} color="#ffd9a0" distance={9} castShadow />
      <pointLight position={[1.8, 2.6, -0.6]} intensity={8} color="#ffcc88" distance={9} />
      <ambientLight intensity={0.35} />
    </group>
  )
}
