import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { APEX_Y } from './constants'
import { phaseDurationS, type World } from './reduce'
import type { Group } from 'three'

const SKIN = '#6eb8dc'
const HAIR = '#3a2418'
const DHOTI = '#f2d04a'
const SASH = '#c4452d'
const GOLD = '#e8c45a'
const FEATHER = '#2f8f4e'
const EYE_WHITE = '#f4f0e6'
const EYE_BROWN = '#5c3218'
const LIP = '#c47a8a'

function SkinMesh({
  position,
  rotation,
  args,
  geometry: Geometry,
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  args: number[]
  geometry: 'sphere' | 'cylinder'
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      {Geometry === 'sphere' ? (
        <sphereGeometry args={args as [number, number, number]} />
      ) : (
        <cylinderGeometry args={args as [number, number, number, number]} />
      )}
      <meshStandardMaterial color={SKIN} roughness={0.45} />
    </mesh>
  )
}

function GoldBand({
  position,
  rotation,
  args,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  args: [number, number, number, number]
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={args} />
      <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.28} />
    </mesh>
  )
}

function Arm({ side, clapping }: { side: -1 | 1; clapping: boolean }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    if (clapping) {
      const beat = (Math.sin(clock.elapsedTime * 22) + 1) / 2
      const fold = 0.95 + beat * 0.45
      g.rotation.z = -side * fold
      g.rotation.x = -0.55
    } else {
      g.rotation.z = 0
      g.rotation.x = 0
    }
  })
  return (
    <group ref={ref} position={[side * 0.16, 0.5, 0]}>
      <SkinMesh geometry="cylinder" position={[0, -0.11, 0]} args={[0.035, 0.042, 0.22, 8]} />
      <GoldBand position={[0, -0.05, 0]} args={[0.045, 0.045, 0.03, 10]} />
      <GoldBand position={[0, -0.18, 0]} args={[0.038, 0.038, 0.025, 10]} />
      <SkinMesh geometry="sphere" position={[0, -0.22, 0]} args={[0.038, 10, 10]} />
    </group>
  )
}

function Feather({ rotation, position }: { rotation: [number, number, number]; position: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh scale={[0.42, 1.15, 0.14]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={FEATHER} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.07, 0.012]} scale={[0.28, 0.45, 0.1]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color="#1e6bb0" />
      </mesh>
      <mesh position={[0, 0.075, 0.02]} scale={[0.12, 0.18, 0.06]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#e8c45a" />
      </mesh>
    </group>
  )
}

export function Krishna({ world }: { world: World }) {
  const ref = useRef<Group>(null)
  const started = useRef(performance.now())
  const lastAnimSeq = useRef(world.animSeq)
  if (lastAnimSeq.current !== world.animSeq) {
    lastAnimSeq.current = world.animSeq
    started.current = performance.now()
  }

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const duration = phaseDurationS(world)
    const u = duration ? Math.min(1, (performance.now() - started.current) / (duration * 1000)) : 0
    let x = world.krishna[0]
    let y = 0
    let z = world.krishna[2]
    if (world.phase === 'run' && world.pot) {
      x = world.krishna[0] + (world.pot[0] - world.krishna[0]) * u
      z = world.krishna[2] + (world.pot[1] - world.krishna[2]) * u
      y = Math.abs(Math.sin(u * Math.PI * 4)) * 0.06
    } else if (world.phase === 'jump') {
      y = APEX_Y * Math.sin((Math.PI / 2) * u)
    } else if (world.phase === 'break') {
      y = APEX_Y * (1 - u)
    } else if (world.phase === 'wait') {
      y = Math.abs(Math.sin(clock.elapsedTime * 10)) * 0.04
    } else {
      y = Math.sin(clock.elapsedTime * 2.2) * 0.012
    }
    g.position.set(x, y, z)
    const faceCam = world.phase === 'idle' || world.phase === 'wait' || world.phase === 'break'
    g.rotation.y = faceCam ? 0 : world.yaw
    const stretch = world.phase === 'jump' ? 1.08 : 1
    g.scale.set(1, stretch, 1)
  })

  return (
    <group ref={ref} position={world.krishna} rotation={[0, world.yaw, 0]} castShadow>
      <group scale={1.55}>
      <SkinMesh geometry="sphere" position={[-0.055, 0.04, 0.02]} args={[0.042, 10, 10]} />
      <SkinMesh geometry="sphere" position={[0.055, 0.04, 0.02]} args={[0.042, 10, 10]} />
      <GoldBand position={[-0.055, 0.07, 0.02]} args={[0.04, 0.04, 0.018, 10]} />
      <GoldBand position={[0.055, 0.07, 0.02]} args={[0.04, 0.04, 0.018, 10]} />
      <SkinMesh geometry="cylinder" position={[-0.055, 0.16, 0]} args={[0.038, 0.045, 0.18, 8]} />
      <SkinMesh geometry="cylinder" position={[0.055, 0.16, 0]} args={[0.038, 0.045, 0.18, 8]} />

      <mesh position={[0, 0.22, 0.01]} castShadow>
        <cylinderGeometry args={[0.14, 0.16, 0.22, 14]} />
        <meshStandardMaterial color={DHOTI} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.32, 0]} rotation={[0.08, 0, 0]} castShadow>
        <torusGeometry args={[0.13, 0.035, 8, 16]} />
        <meshStandardMaterial color={SASH} roughness={0.5} />
      </mesh>
      <mesh position={[0.12, 0.28, 0.04]} rotation={[0.4, 0.5, 0.8]} castShadow>
        <boxGeometry args={[0.08, 0.12, 0.03]} />
        <meshStandardMaterial color={SASH} roughness={0.5} />
      </mesh>

      <SkinMesh geometry="sphere" position={[0, 0.46, 0]} args={[0.12, 14, 14]} />
      <SkinMesh geometry="cylinder" position={[0, 0.52, 0]} args={[0.055, 0.07, 0.08, 10]} />

      <GoldBand position={[0, 0.56, 0]} args={[0.09, 0.09, 0.03, 14]} />
      <mesh position={[0, 0.5, 0.1]} castShadow>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.28} />
      </mesh>

      <Arm side={-1} clapping={world.phase === 'break' || world.phase === 'wait'} />
      <Arm side={1} clapping={world.phase === 'break' || world.phase === 'wait'} />

      <group position={[0, 0.72, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.2, 20, 20]} />
          <meshStandardMaterial color={SKIN} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.08, -0.04]} scale={[1.08, 0.72, 1.05]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={HAIR} roughness={0.7} />
        </mesh>
        <mesh position={[-0.14, 0.0, 0.1]} scale={[0.65, 0.8, 0.6]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color={HAIR} roughness={0.7} />
        </mesh>
        <mesh position={[0.14, 0.0, 0.1]} scale={[0.65, 0.8, 0.6]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color={HAIR} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.2, -0.02]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color={HAIR} roughness={0.7} />
        </mesh>
        <GoldBand position={[0, 0.2, -0.02]} args={[0.07, 0.07, 0.02, 10]} />
        <Feather position={[-0.03, 0.3, 0]} rotation={[0.15, 0, 0.35]} />
        <Feather position={[0.04, 0.32, -0.02]} rotation={[-0.1, 0.2, -0.25]} />

        <mesh position={[-0.075, 0.04, 0.16]}>
          <sphereGeometry args={[0.048, 12, 12]} />
          <meshStandardMaterial color={EYE_WHITE} />
        </mesh>
        <mesh position={[0.075, 0.04, 0.16]}>
          <sphereGeometry args={[0.048, 12, 12]} />
          <meshStandardMaterial color={EYE_WHITE} />
        </mesh>
        <mesh position={[-0.075, 0.038, 0.198]}>
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshStandardMaterial color={EYE_BROWN} />
        </mesh>
        <mesh position={[0.075, 0.038, 0.198]}>
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshStandardMaterial color={EYE_BROWN} />
        </mesh>
        <mesh position={[-0.07, 0.046, 0.22]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial color="#1a120c" />
        </mesh>
        <mesh position={[0.08, 0.046, 0.22]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial color="#1a120c" />
        </mesh>

        <mesh position={[0, 0.12, 0.175]} rotation={[0.2, 0, 0]}>
          <torusGeometry args={[0.035, 0.01, 6, 10, Math.PI]} />
          <meshStandardMaterial color="#f7f4ea" />
        </mesh>
        <mesh position={[0, 0.1, 0.185]}>
          <boxGeometry args={[0.012, 0.04, 0.008]} />
          <meshStandardMaterial color="#f7f4ea" />
        </mesh>

        <mesh position={[0, -0.02, 0.19]} rotation={[0.4, 0, 0]} scale={[1, 0.45, 1]}>
          <torusGeometry args={[0.03, 0.008, 6, 12, Math.PI]} />
          <meshStandardMaterial color={LIP} />
        </mesh>

        <mesh position={[-0.185, 0.02, 0.04]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.28} />
        </mesh>
        <mesh position={[0.185, 0.02, 0.04]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.28} />
        </mesh>
      </group>

      <mesh position={[0, 0.48, -0.12]} rotation={[1.15, 0, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.02, 0.32, 8]} />
        <meshStandardMaterial color="#c4a35a" roughness={0.45} />
      </mesh>
      </group>
    </group>
  )
}
