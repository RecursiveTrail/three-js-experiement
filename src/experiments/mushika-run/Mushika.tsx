import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { LANE_LERP_S, celebrateY, jumpY, laneX } from './constants'
import type { Snapshot } from './reduce'

const SKIN = '#f4c45a'
const BODY = '#e8b03a'
const GOLD = '#ffd978'
const SASH = '#e24b2c'
const PINK = '#ff9aa8'
const NOSE = '#ff7a90'
const EYE_WHITE = '#fff8ee'
const EYE = '#4a2418'
const SHADOW_Y = 0.03
const RUN = 12

function Paw({ side, z }: { side: -1 | 1; z: number }) {
  return (
    <mesh position={[side * 0.02, -0.14, z]}>
      <sphereGeometry args={[0.07, 10, 10]} />
      <meshStandardMaterial color={BODY} roughness={0.5} />
    </mesh>
  )
}

export function Mushika({ world }: { world: Snapshot }) {
  const ref = useRef<Group>(null)
  const shadow = useRef<Group>(null)
  const lf = useRef<Group>(null)
  const rf = useRef<Group>(null)
  const lb = useRef<Group>(null)
  const rb = useRef<Group>(null)
  const tail = useRef<Group>(null)
  const t1 = useRef<Group>(null)
  const t2 = useRef<Group>(null)
  const t3 = useRef<Group>(null)
  const ears = useRef<Group>(null)

  useFrame(({ clock }, dt) => {
    const g = ref.current
    if (!g) return
    const target = laneX(world.lane)
    const k = 1 - Math.exp(-dt / LANE_LERP_S)
    g.position.x += (target - g.position.x) * k
    const celebrating = world.celebrateT !== null
    const hopping = world.jumpT !== null
    const running = world.phase === 'playing' && !hopping && !celebrating
    const t = clock.elapsedTime * RUN
    const stride = running ? Math.sin(t) : 0
    let y = celebrating ? celebrateY(world.celebrateT) : jumpY(world.jumpT)
    if (running) y += Math.abs(Math.sin(t * 2)) * 0.07
    g.position.y = y
    g.position.z = 0
    if (celebrating) {
      const c = world.celebrateT ?? 0
      g.rotation.x = c * Math.PI * 4
      g.rotation.y = Math.sin(c * Math.PI * 4) * 0.25
      g.rotation.z = Math.sin(c * Math.PI * 4) * 0.12
      g.scale.set(1.08, 1.16, 1.08)
    } else {
      g.rotation.x = hopping ? -0.18 : running ? Math.abs(stride) * 0.05 : 0
      g.rotation.y = 0
      g.rotation.z = running ? stride * 0.05 : 0
      g.scale.set(1, hopping ? 1.1 : 1, 1)
    }

    const lift = celebrating ? Math.sin((world.celebrateT ?? 0) * Math.PI * 4) * 0.9 : hopping ? 0.75 : 0
    if (lf.current) lf.current.rotation.x = celebrating ? lift : lift || stride * 0.85
    if (rf.current) rf.current.rotation.x = celebrating ? -lift : lift || -stride * 0.85
    if (lb.current) lb.current.rotation.x = celebrating ? -lift * 0.7 : hopping ? 0.55 : -stride * 0.75
    if (rb.current) rb.current.rotation.x = celebrating ? lift * 0.7 : hopping ? 0.55 : stride * 0.75

    if (ears.current) {
      ears.current.rotation.z = celebrating
        ? Math.sin((world.celebrateT ?? 0) * Math.PI * 6) * 0.18
        : running
          ? stride * 0.08
          : Math.sin(clock.elapsedTime * 2.2) * 0.03
    }

    const wag = celebrating
      ? Math.sin((world.celebrateT ?? 0) * Math.PI * 8) * 0.8
      : running
        ? Math.sin(t * 0.9)
        : Math.sin(clock.elapsedTime * 2.4) * 0.2
    if (tail.current) {
      tail.current.rotation.x = celebrating ? -1.35 : hopping ? -1.15 : -0.45 + (running ? Math.sin(t) * 0.22 : 0)
      tail.current.rotation.y = wag * 0.55
    }
    if (t1.current) t1.current.rotation.y = wag * 0.35
    if (t2.current) t2.current.rotation.y = wag * 0.45
    if (t3.current) t3.current.rotation.y = wag * 0.55

    const blob = shadow.current
    if (blob) {
      blob.position.x = g.position.x
      blob.position.y = SHADOW_Y
      blob.position.z = 0
      const squash = celebrating || hopping ? 0.62 : 1
      blob.scale.set(squash, 1, squash)
    }
  })

  return (
    <>
      <group ref={shadow} position={[0, SHADOW_Y, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.42, 18]} />
          <meshBasicMaterial color="#5a3018" transparent opacity={0.22} />
        </mesh>
      </group>
      <group ref={ref} position={[0, 0, 0]}>
        <mesh position={[0, 0.28, 0.04]} scale={[1.05, 0.85, 1.25]}>
          <sphereGeometry args={[0.24, 18, 18]} />
          <meshStandardMaterial color={BODY} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.32, 0.06]} rotation={[0.25, 0, 0]}>
          <torusGeometry args={[0.2, 0.035, 8, 18]} />
          <meshStandardMaterial color={SASH} roughness={0.5} />
        </mesh>
        <mesh position={[0.16, 0.3, 0.08]} rotation={[0.3, 0.4, 0.6]}>
          <boxGeometry args={[0.08, 0.14, 0.03]} />
          <meshStandardMaterial color={SASH} roughness={0.5} />
        </mesh>

        <group position={[0.11, 0.16, 0.16]} ref={lf}>
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.045, 0.055, 0.16, 8]} />
            <meshStandardMaterial color={BODY} roughness={0.5} />
          </mesh>
          <Paw side={1} z={0.02} />
        </group>
        <group position={[-0.11, 0.16, 0.16]} ref={rf}>
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.045, 0.055, 0.16, 8]} />
            <meshStandardMaterial color={BODY} roughness={0.5} />
          </mesh>
          <Paw side={-1} z={0.02} />
        </group>
        <group position={[0.12, 0.16, -0.12]} ref={lb}>
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.16, 8]} />
            <meshStandardMaterial color={BODY} roughness={0.5} />
          </mesh>
          <Paw side={1} z={-0.02} />
        </group>
        <group position={[-0.12, 0.16, -0.12]} ref={rb}>
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.16, 8]} />
            <meshStandardMaterial color={BODY} roughness={0.5} />
          </mesh>
          <Paw side={-1} z={-0.02} />
        </group>

        <group position={[0, 0.58, 0.1]}>
          <mesh>
            <sphereGeometry args={[0.22, 20, 20]} />
            <meshStandardMaterial color={SKIN} roughness={0.38} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={`cheek-${s}`} position={[s * 0.14, -0.04, 0.12]} scale={[0.7, 0.65, 0.55]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshStandardMaterial color="#f7d078" roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.07, 0.12, 0.08, 12]} />
            <meshStandardMaterial color={GOLD} metalness={0.55} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.08, 0.2]}>
            <sphereGeometry args={[0.028, 8, 8]} />
            <meshStandardMaterial color={SASH} />
          </mesh>
          <group ref={ears}>
            {[-1, 1].map((s) => (
              <group key={`ear-${s}`} position={[s * 0.18, 0.16, -0.02]} rotation={[0.15, 0, s * -0.35]}>
                <mesh>
                  <sphereGeometry args={[0.11, 14, 14]} />
                  <meshStandardMaterial color={SKIN} roughness={0.42} />
                </mesh>
                <mesh position={[0, 0.01, 0.02]} scale={[0.72, 0.72, 0.55]}>
                  <sphereGeometry args={[0.09, 12, 12]} />
                  <meshStandardMaterial color={PINK} />
                </mesh>
                <mesh position={[0, -0.02, 0.02]}>
                  <torusGeometry args={[0.045, 0.012, 6, 14]} />
                  <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.25} />
                </mesh>
              </group>
            ))}
          </group>
          {[-1, 1].map((s) => (
            <group key={`eye-${s}`} position={[s * 0.085, 0.04, 0.17]}>
              <mesh scale={[1.05, 1.15, 0.7]}>
                <sphereGeometry args={[0.07, 14, 14]} />
                <meshStandardMaterial color={EYE_WHITE} />
              </mesh>
              <mesh position={[0, -0.008, 0.04]}>
                <sphereGeometry args={[0.038, 12, 14]} />
                <meshStandardMaterial color={EYE} />
              </mesh>
              <mesh position={[0.012, 0.018, 0.062]}>
                <sphereGeometry args={[0.016, 8, 8]} />
                <meshStandardMaterial color="#fff" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.04, 0.2]}>
            <sphereGeometry args={[0.04, 10, 10]} />
            <meshStandardMaterial color={NOSE} />
          </mesh>
          <mesh position={[0, -0.09, 0.175]} rotation={[0.5, 0, 0]} scale={[1.1, 0.55, 1]}>
            <torusGeometry args={[0.045, 0.012, 6, 14, Math.PI]} />
            <meshStandardMaterial color={PINK} />
          </mesh>
        </group>

        <group ref={tail} position={[0, 0.32, -0.28]}>
          <mesh>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial color={BODY} roughness={0.45} />
          </mesh>
          <group ref={t1} rotation={[-0.55, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.08]}>
              <cylinderGeometry args={[0.045, 0.055, 0.16, 8]} />
              <meshStandardMaterial color={GOLD} roughness={0.4} />
            </mesh>
            <group ref={t2} position={[0, 0, -0.16]} rotation={[-0.5, 0, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.07]}>
                <cylinderGeometry args={[0.032, 0.045, 0.14, 8]} />
                <meshStandardMaterial color={GOLD} roughness={0.4} />
              </mesh>
              <group ref={t3} position={[0, 0, -0.14]} rotation={[-0.45, 0, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.06]}>
                  <cylinderGeometry args={[0.022, 0.032, 0.12, 8]} />
                  <meshStandardMaterial color={GOLD} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0, -0.13]}>
                  <sphereGeometry args={[0.045, 10, 10]} />
                  <meshStandardMaterial color={PINK} roughness={0.45} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </>
  )
}
