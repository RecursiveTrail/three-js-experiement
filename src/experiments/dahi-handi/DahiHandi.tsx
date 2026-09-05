import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { ExperienceCanvas } from '../../shared/r3f/ExperienceCanvas'
import { CAMERA_FOV, CAMERA_POS, LOOK_AT } from './constants'
import { Handi } from './Handi'
import { Krishna } from './Krishna'
import { Room } from './Room'
import { SmashBurst } from './SmashBurst'
import type { World } from './reduce'

function CameraRig() {
  const { camera } = useThree()
  useLayoutEffect(() => {
    camera.lookAt(...LOOK_AT)
  }, [camera])
  return null
}

export function DahiHandi({ world }: { world: World }) {
  return (
    <ExperienceCanvas camera={{ position: CAMERA_POS, fov: CAMERA_FOV }}>
      <CameraRig />
      <Room />
      <Krishna world={world} />
      {world.pot ? <Handi xz={world.pot} /> : null}
      {world.phase === 'break' && world.lastSmash ? (
        <SmashBurst xz={world.lastSmash} animSeq={world.animSeq} />
      ) : null}
    </ExperienceCanvas>
  )
}
