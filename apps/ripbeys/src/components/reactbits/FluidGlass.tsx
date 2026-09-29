import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, useGLTF } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'

// React Bits FluidGlass bar, used as the navbar lens.
// Models: public/assets/3d from DavidHDev/react-bits.
// The Unsplash scroll demo is not mounted here so the archive can still scroll.

useGLTF.preload('/assets/3d/bar.glb')

function GlassBar() {
  const ref = useRef<THREE.Mesh>(null)
  const { nodes } = useGLTF('/assets/3d/bar.glb') as unknown as {
    nodes: Record<string, THREE.Mesh>
  }
  const geometry =
    nodes.Cube?.geometry ??
    Object.values(nodes).find((node) => node.geometry)?.geometry

  useFrame((state, delta) => {
    const mesh = ref.current
    if (!mesh) return
    const v = state.viewport.getCurrentViewport(state.camera, [0, 0, 15])
    easing.damp3(mesh.position, [state.pointer.x * v.width * 0.15, 0, 0], 0.2, delta)
  })

  if (!geometry) return null

  return (
    <mesh ref={ref} geometry={geometry} scale={0.18} rotation-x={Math.PI / 2} position={[0, 0, 0]}>
      <MeshTransmissionMaterial
        transmission={1}
        roughness={0.08}
        thickness={8}
        ior={1.15}
        chromaticAberration={0.08}
        anisotropy={0.04}
        color="#f5f5f5"
      />
    </mesh>
  )
}

export default function FluidGlass({ className = '' }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 20 }}
        dpr={1}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.6} />
        <GlassBar />
      </Canvas>
    </div>
  )
}
