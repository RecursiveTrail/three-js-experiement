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
  liveGateId,
} from './constants'
import { Bhuk } from './Bhuk'
import { Gate, LintelFontPreload } from './Gate'
import { Modak } from './Modak'
import { Mushika } from './Mushika'
import { Street } from './Street'
import type { Snapshot } from './reduce'

function CameraRig() {
  const { camera, size } = useThree()
  useLayoutEffect(() => {
    camera.lookAt(...LOOK_AT)
    const portrait = size.height > size.width
    if (camera instanceof PerspectiveCamera) {
      camera.fov = portrait ? CAMERA_FOV_PORTRAIT : CAMERA_FOV
      camera.updateProjectionMatrix()
    }
  }, [camera, size.height, size.width])
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
  return (
    <ExperienceCanvas camera={{ position: CAMERA_POS, fov: CAMERA_FOV }} dpr={DPR}>
      <color attach="background" args={['#7a3a48']} />
      <LintelFontPreload />
      <CameraRig />
      <Tick onTick={onTick} />
      <Street distance={world.distance} />
      <Mushika world={world} />
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
    </ExperienceCanvas>
  )
}
