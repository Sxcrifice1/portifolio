import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { arquivo } from '../arquivos'

const rad = (d) => (d * Math.PI) / 180

function Modelo({
  url = arquivo('/personagem.glb'),
  cabecaYaw = 18,
  cabecaPitch = 9,
  corpoYaw = 4,
  corpoPitch = 2,
  olhosYaw = 24,
  olhosPitch = 12,
  suavidade = 0.09,
  piscar = true,
}) {
  const { scene } = useGLTF(url)
  const { camera, gl } = useThree()

  const rig = useMemo(() => {
    let corpo = null, cabeca = null, olhoL = null, olhoR = null
    const face = []

    scene.traverse((o) => {
      if (o.isSkinnedMesh) {
        if (o.morphTargetDictionary) face.push(o)
        const sk = o.skeleton
        if (sk) {
          if (!corpo) corpo = sk.bones.find(b => b.name.startsWith('Corpo'))
          if (!cabeca) cabeca = sk.bones.find(b => b.name.startsWith('Cabeca'))
          if (!olhoL) olhoL = sk.bones.find(b => b.name.startsWith('Olho_L'))
          if (!olhoR) olhoR = sk.bones.find(b => b.name.startsWith('Olho_R'))
        }
      }
      if (o.isMesh || o.isSkinnedMesh) {
        if (o.material) {
          o.material.roughness = 32
          o.material.metalness = 1
        }
      }
    })

    return { corpo, cabeca, olhoL, olhoR, face }
  }, [scene])

  const alvo = useRef(new THREE.Vector2(0, 0))
  const mouse = useRef(new THREE.Vector2(0, 0))
  const blink = useRef({ valor: 0, proxima: 2 + Math.random() * 3, t: 0 })
  const bravoTimer = useRef(0)

  useEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) o.frustumCulled = false
    })

    const handleMouseMove = (e) => {
      // O movimento da cabeça passa a ser relativo ao CENTRO do próprio avatar
      // e não ao centro da tela. Assim ele nunca fica "vesgo" se o card mudar de lugar!
      const rect = gl.domElement.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const dx = (e.clientX - centerX) / (window.innerWidth / 2)
      const dy = -(e.clientY - centerY) / (window.innerHeight / 2)
      
      // Limita os valores entre -1 e 1
      mouse.current.x = Math.max(-1, Math.min(1, dx))
      mouse.current.y = Math.max(-1, Math.min(1, dy))
    }

    const handleDoubleClick = (e) => {
      // Para saber se o clique acertou o modelo 3D, precisamos mapear a coordenada
      // do mouse especificamente para as dimensões e posição do Canvas na tela.
      const rect = gl.domElement.getBoundingClientRect()
      const clickX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const clickY = -((e.clientY - rect.top) / rect.height) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(clickX, clickY), camera)

      const intersects = raycaster.intersectObject(scene, true)
      if (intersects.length > 0) {
        bravoTimer.current = 2.5 // Fica bravo por 2.5 segundos
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('dblclick', handleDoubleClick)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('dblclick', handleDoubleClick)
    }
  }, [scene, camera, gl])

  const setMorph = (nome, v) => {
    for (const m of rig.face) {
      const i = m.morphTargetDictionary?.[nome]
      if (i !== undefined) m.morphTargetInfluences[i] = v
    }
  }

  useFrame((_, dt) => {
    alvo.current.x += (mouse.current.x - alvo.current.x) * suavidade
    alvo.current.y += (mouse.current.y - alvo.current.y) * suavidade
    const { x, y } = alvo.current

    if (rig.corpo) {
      rig.corpo.rotation.y = rad(corpoYaw) * x
      rig.corpo.rotation.x = -rad(corpoPitch) * y
    }
    if (rig.cabeca) {
      rig.cabeca.rotation.y = rad(cabecaYaw - corpoYaw) * x
      rig.cabeca.rotation.x = -rad(cabecaPitch - corpoPitch) * y
    }
    for (const olho of [rig.olhoL, rig.olhoR]) {
      if (!olho) continue
      olho.rotation.y = rad(olhosYaw) * x
      olho.rotation.x = -rad(olhosPitch) * y
    }

    if (piscar) {
      const b = blink.current
      b.t += dt
      if (b.t > b.proxima) {
        const p = b.t - b.proxima
        const DUR = 0.16
        b.valor = p < DUR / 2 ? p / (DUR / 2) : 1 - (p - DUR / 2) / (DUR / 2)
        b.valor = Math.max(0, Math.min(1, b.valor))
        if (p > DUR) {
          b.valor = 0
          b.t = 0
          b.proxima = 2.2 + Math.random() * 3.5
        }
      }
      setMorph('Piscar', b.valor)
    }

    // Lógica da cara de bravo
    let caraDeMau = 0
    if (bravoTimer.current > 0) {
      bravoTimer.current -= dt
      if (bravoTimer.current > 2.3) caraDeMau = (2.5 - bravoTimer.current) / 0.2
      else if (bravoTimer.current < 0.3) caraDeMau = bravoTimer.current / 0.3
      else caraDeMau = 1
      caraDeMau = Math.max(0, Math.min(1, caraDeMau))
    }

    // Desliga o franzir original porque ele abaixa a parte de fora
    setMorph('Sobrancelha_Franzir', 0)

    // Usamos apenas o Sobrancelha_Cima invertido (negativo) como estava antes
    setMorph('Sobrancelha_Cima', caraDeMau > 0 ? -caraDeMau : Math.max(0, y) * 0.55)
  })

  return <primitive object={scene} position={[0, -0.7, 0]} />
}

export default function Personagem({ className = '', style }) {
  return (
    <div className={className} style={{ pointerEvents: 'none', ...style }}>
      <Canvas
        camera={{ position: [0, 0, 3.0], fov: 32 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
        // Teto 1.5 em vez de 2: o personagem aparece num card de ~350px,
        // onde a diferenca entre 1.5x e 2x nao e percebida, mas o custo
        // de render cresce com o QUADRADO do fator.
        dpr={[1, 1.5]}
      >
        <Environment preset="city" />
        <directionalLight position={[-1.4, 1.6, 2]} intensity={2.2} />
        <directionalLight position={[1.2, 1.0, -1.8]} intensity={1.0} color="#0055ffff" />
        <Modelo />
      </Canvas>
    </div>
  )
}

useGLTF.preload(arquivo('/personagem.glb'))
