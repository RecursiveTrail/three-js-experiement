import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { PerspectiveCamera } from 'three'
import { ExperienceCanvas } from '../../shared/r3f/ExperienceCanvas'
import {
  CAMERA_FOV,
  CAMERA_FOV_PORTRAIT,
  CAMERA_POS,
  DPR,
  DT_CAP,
  GATES,
  LOOK_AT,
  SHRINE_CAMERA_POS,
  SHRINE_LOOK_AT,
  liveGateId,
} from './constants'
import { Bhuk } from './Bhuk'
import { Gate, LintelFontPreload } from './Gate'
import { Modak } from './Modak'
import { Mushika } from './Mushika'
import { Street } from './Street'
import type { Snapshot } from './reduce'

function CameraRig({ shrine }: { shrine: boolean }) {
  const { camera, size } = useThree()
  useLayoutEffect(() => {
    const look = shrine ? SHRINE_LOOK_AT : LOOK_AT
    camera.position.set(...(shrine ? SHRINE_CAMERA_POS : CAMERA_POS))
    camera.lookAt(...look)
    const portrait = size.height > size.width
    if (camera instanceof PerspectiveCamera) {
      camera.fov = shrine ? 42 : portrait ? CAMERA_FOV_PORTRAIT : CAMERA_FOV
      camera.updateProjectionMatrix()
    }
  }, [camera, size.height, size.width, shrine])
  return null
}

function Tick({ onTick }: { onTick: (dt: number) => void }) {
  useFrame((_, dt) => {
    if (document.visibilityState !== 'visible') return
    onTick(Math.min(dt, DT_CAP))
  })
  return null
}

export function MushikaRun({ world, onTick }: { world: Snapshot; onTick: (dt: number) => void }) {
  const shrine = world.phase === 'shrine'
  return (
    <ExperienceCanvas camera={{ position: CAMERA_POS, fov: CAMERA_FOV }} dpr={DPR} alpha>
      {shrine ? null : <color attach="background" args={['#7a3a48']} />}
      <LintelFontPreload />
      <CameraRig shrine={shrine} />
      <Tick onTick={onTick} />
      {shrine ? null : (
        <>
          <Street distance={world.distance} />
          {world.modaks.map((m) => (
            <Modak key={m.id} modak={m} distance={world.distance} />
          ))}
          {GATES.map((g) => (
            <Gate
              key={g.id}
              id={g.id}
              name={g.name}
              atDistance={g.distance}
              distance={world.distance}
              reached={world.gatesReached.includes(g.id)}
              phase={world.phase}
              openingT={world.openingT}
              liveId={liveGateId(world.gatesReached)}
            />
          ))}
          <Bhuk hunger={world.hunger} over={world.phase === 'over'} />
        </>
      )}
      <Mushika world={world} />
      {shrine ? <ambientLight intensity={0.9} /> : null}
      {shrine ? <pointLight position={[0, 1.4, 2.2]} intensity={18} color="#ffe8c4" distance={8} /> : null}
    </ExperienceCanvas>
  )
}
