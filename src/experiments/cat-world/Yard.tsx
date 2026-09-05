import { Environment, useGLTF, useTexture } from '@react-three/drei'
import { RepeatWrapping } from 'three'

export function Yard() {
  const maps = useTexture({
    map: '/assets/cat-world/yard/grass/leafy_grass_diff_1k.jpg',
    normalMap: '/assets/cat-world/yard/grass/leafy_grass_nor_gl_1k.jpg',
    aoMap: '/assets/cat-world/yard/grass/leafy_grass_arm_1k.jpg',
  })
  maps.map.wrapS = maps.map.wrapT = RepeatWrapping
  maps.normalMap.wrapS = maps.normalMap.wrapT = RepeatWrapping
  maps.aoMap.wrapS = maps.aoMap.wrapT = RepeatWrapping
  maps.map.repeat.set(6, 6)
  maps.normalMap.repeat.set(6, 6)
  maps.aoMap.repeat.set(6, 6)

  const pot = useGLTF('/assets/cat-world/yard/pot/planter_pot_clay_1k.gltf')
  const bench = useGLTF('/assets/cat-world/yard/bench/painted_wooden_bench_1k.gltf')

  return (
    <>
      <color attach="background" args={['#87a0b8']} />
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        position={[6, 10, 4]}
        intensity={1.6}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Environment files="/assets/cat-world/yard/garden.hdr" background />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8, 24, 24]} />
        <meshStandardMaterial {...maps} roughness={0.95} />
      </mesh>
      <primitive object={pot.scene} position={[2.4, 0, -1.6]} scale={1} />
      <primitive object={bench.scene} position={[-2.2, 0, -2.4]} rotation={[0, 0.6, 0]} />
    </>
  )
}

useGLTF.preload('/assets/cat-world/yard/pot/planter_pot_clay_1k.gltf')
useGLTF.preload('/assets/cat-world/yard/bench/painted_wooden_bench_1k.gltf')
