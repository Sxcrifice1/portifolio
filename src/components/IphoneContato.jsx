import { Suspense, useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, Html, Center, Bounds } from '@react-three/drei'
import * as THREE from 'three'
import './IphoneContato.css'

const MODELO = '/iphone_14_pro.glb'

// ╔══════════════════════════════════════════════════════════════════╗
// ║  PAINEL DA TELA — é aqui que você mexe para POSICIONAR           ║
// ╚══════════════════════════════════════════════════════════════════╝
//
// X e Y são FRAÇÃO DA ALTURA do aparelho (não pixels), então continuam
// valendo se você trocar o .glb, mudar o zoom ou redimensionar a gaveta.
// Escala de referência: 0.10 ≈ um décimo da altura do celular.

// ATENÇÃO ao sinal do X: o painel é montado virado 180° (a tela do
// aparelho olha para o outro lado), então o eixo X sai ESPELHADO —
// aumentar o valor move para a ESQUERDA na tela, não para a direita.
// O 0.03 já corrige um desvio do próprio modelo, cuja caixa
// delimitadora não é simétrica (botões laterais puxam o centro).
const PAINEL_X = 0.25    // + vai para a ESQUERDA  − vai para a DIREITA
const PAINEL_Y = 0.00    // + vai para CIMA        − vai para BAIXO

const PAINEL_LARGURA = 205   // largura do painel, em px
const PAINEL_ESCALA = 0.86   // tamanho sobre a tela: maior = painel maior

// ── Tempos e amplitudes da animação ──────────────────────────────────
const DUR_ENTRADA = 2.2      // segundos girando até travar de frente
const VOLTAS = 2             // voltas completas durante a entrada
const AMPL_BALANCO = 0.07    // ~4° para cada lado, já parado
const AMPL_SUBIDA = 0.005    // quanto ele sobe e desce flutuando
const RITMO = 0.55           // velocidade do flutuar (menor = mais calmo)
const BALOES_SUBIDA_PX = 7   // quanto os balões acompanham a subida, em px

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3)

// Glifo do WhatsApp em SVG inline. O lucide-react tirou os ícones de
// marca do pacote, então não dá para importar de lá.
const IconeWhatsApp = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
)

// Mensagens que passam nos balõezinhos em volta do aparelho. Fallback
// PT — o BentoGrid.jsx normalmente manda a lista certa pelo idioma
// ativo via prop `mensagensChat`; isto só entra em jogo se o
// componente for usado sem essa prop.
const MENSAGENS_PADRAO = [
  "Gostei muito do portfólio!",
  "Gostaria de fechar negócio",
  "Seu trabalho é excelente",
  "Tem disponibilidade esse mês?",
  "Quanto fica uma landing page?",
  "Podemos marcar uma call?",
  "Vi seu 3D, ficou insano",
  "Preciso de um site novo",
]

const SLOTS = 3          // quantos balões ficam na tela ao mesmo tempo
const TROCA_MS = 2600    // intervalo entre uma troca e outra
const FADE_MS = 500      // quanto o balão leva para sumir antes de trocar

/**
 * Balõezinhos de conversa flutuando em volta do celular.
 *
 * São HTML comum posicionado por cima do <Canvas>, não objetos 3D: assim
 * o texto fica sempre legível e não acompanha o balanço do aparelho.
 *
 * A troca é ROUND-ROBIN, um balão por vez, então nunca piscam todos
 * juntos — cada um volta a mudar a cada SLOTS × TROCA_MS.
 */
function BaloesFlutuantes({ containerRef, mensagens }) {
  const [indices, setIndices] = useState(() => [0, 1, 2])
  const [visiveis, setVisiveis] = useState(() => [true, true, true])

  useEffect(() => {
    let slot = 0
    let trocaPendente
    const relogio = setInterval(() => {
      const atual = slot
      slot = (slot + 1) % SLOTS

      setVisiveis((v) => v.map((x, i) => (i === atual ? false : x)))
      trocaPendente = setTimeout(() => {
        setIndices((idx) => {
          const novo = [...idx]
          // avança até uma mensagem que nenhum outro balão esteja mostrando
          let prox = (novo[atual] + SLOTS) % mensagens.length
          while (novo.some((v, j) => j !== atual && v === prox)) {
            prox = (prox + 1) % mensagens.length
          }
          novo[atual] = prox
          return novo
        })
        setVisiveis((v) => v.map((x, i) => (i === atual ? true : x)))
      }, FADE_MS)
    }, TROCA_MS)

    return () => { clearInterval(relogio); clearTimeout(trocaPendente) }
  }, [mensagens])

  return (
    <div className="iphone-baloes" ref={containerRef} aria-hidden="true">
      {indices.map((msg, i) => (
        <span
          key={i}
          className={`iphone-balao iphone-balao--${i + 1} ${visiveis[i] ? 'esta-visivel' : ''}`}
        >
          {mensagens[msg]}
        </span>
      ))}
    </div>
  )
}

/**
 * O aparelho: entra girando, trava de frente e fica flutuando.
 *
 * A âncora do painel é MEDIDA da caixa delimitadora do modelo, não
 * chutada — troque o .glb e ele se reposiciona sozinho.
 */
function Aparelho({ aoTravar, baloesRef, children }) {
  const { scene } = useGLTF(MODELO)
  const giro = useRef()
  const t = useRef(0)
  const travou = useRef(false)

  const modelo = useMemo(() => {
    const clone = scene.clone(true)

    // OPACIDADE: sem isto dá para ver o módulo de câmeras ATRAVÉS do
    // vidro da frente. O .glb vem com materiais transparentes e sem
    // escrita no buffer de profundidade, então as faces de trás são
    // desenhadas por cima das da frente. Três ajustes resolvem:
    //   • depthWrite liga o teste de profundidade
    //   • FrontSide para de desenhar o interior do casco
    //   • transmission/transparent zerados onde a opacidade já é cheia
    clone.traverse((o) => {
      if (!o.isMesh) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.forEach((m) => {
        if (!m) return
        m.depthWrite = true
        m.side = THREE.FrontSide
        if (m.transmission !== undefined && m.transmission > 0) m.transmission = 0
        if (m.transparent && m.opacity >= 0.95) {
          m.transparent = false
          m.opacity = 1
        }
        m.needsUpdate = true
      })
    })
    return clone
  }, [scene])

  const tela = useMemo(() => {
    const caixa = new THREE.Box3().setFromObject(modelo)
    const tam = caixa.getSize(new THREE.Vector3())
    const centro = caixa.getCenter(new THREE.Vector3())
    // A TELA olha para -Z (o +Z é a traseira, a das câmeras), por isso o
    // painel vai para o lado negativo e gira 180° em Y.
    //
    // A folga é fração da ALTURA, não da espessura: com a espessura
    // (~8 mm) o afastamento dava menos de 1 mm, o painel ficava rente
    // demais ao vidro e a oclusão o tratava como dentro da geometria —
    // sumia atrás do aparelho, deixando só uma lasca à mostra.
    return {
      altura: tam.y,
      z: centro.z - tam.z / 2 - tam.y * 0.03,
      centro
    }
  }, [modelo])

  useFrame((_, dt) => {
    const g = giro.current
    if (!g) return
    t.current += dt

    if (t.current < DUR_ENTRADA) {
      // ENTRADA: gira VOLTAS vezes e desacelera até parar de frente (π).
      const k = easeOutCubic(t.current / DUR_ENTRADA)
      g.rotation.y = Math.PI + (1 - k) * VOLTAS * Math.PI * 2
      g.rotation.x = 0
      g.position.y = 0
      return
    }

    if (!travou.current) {
      travou.current = true
      aoTravar?.()
    }

    // FLUTUANDO: balanço curto em torno da frente + sobe e desce.
    const u = (t.current - DUR_ENTRADA) * RITMO
    const sobe = Math.sin(u * 0.8)          // -1 a 1, a fase da flutuação

    g.rotation.y = Math.PI + Math.sin(u) * AMPL_BALANCO
    g.rotation.x = Math.sin(u * 0.7) * 0.035
    g.position.y = sobe * AMPL_SUBIDA

    // Os balões sobem e descem na MESMA fase do aparelho, para parecerem
    // parte da cena. Escrevo direto no style em vez de usar estado: isto
    // roda a cada quadro, e um setState aqui re-renderizaria 60x/s.
    // O sinal é invertido porque +Y no 3D é para cima e +Y no CSS é para baixo.
    if (baloesRef?.current) {
      baloesRef.current.style.translate = `0 ${(-sobe * BALOES_SUBIDA_PX).toFixed(2)}px`
    }
  })

  return (
    // Sem `rotation` aqui: o useFrame escreve rotation.y por inteiro a
    // cada quadro, e o Math.PI que vira a tela para a frente já está lá.
    <group ref={giro}>
      <primitive object={modelo} />

      {/* `transform` põe o painel no espaço 3D: ele acompanha o aparelho.
          Sem `occlude` de propósito — a oclusão por geometria estava
          escondendo o painel contra o próprio vidro, e como ele só
          aparece depois que o giro trava (com a tela sempre de frente),
          não existe momento em que precisaria ser escondido. */}
      <Html
        transform
        position={[
          tela.centro.x + tela.altura * PAINEL_X,
          tela.centro.y + tela.altura * PAINEL_Y,
          tela.z
        ]}
        rotation={[0, Math.PI, 0]}
        distanceFactor={tela.altura * PAINEL_ESCALA}
        // A largura vai como VARIÁVEL CSS, não como `width` direto.
        // Passar `width` pelo style do <Html> desalinha o painel: o drei
        // centraliza com translate(-50%,-50%) num wrapper cuja largura
        // deixa de bater com a do conteúdo, e o painel desloca meia
        // largura para o lado (espelhado, por causa da rotação de 180°).
        style={{ '--painel-largura': `${PAINEL_LARGURA}px` }}
        className="iphone-tela"
      >
        {children}
      </Html>
    </group>
  )
}

export default function IphoneContato({
  whatsapp,
  mensagem,                              // texto JÁ DIGITADO no WhatsApp
  titulo = "Vamos conversar?",           // texto de cima, na tela
  textoBotao = "Enviar mensagem",        // texto dentro do botão verde
  textoCarregando = "Carregando…",       // texto embaixo do anel de loading
  mensagensChat = MENSAGENS_PADRAO,      // balõezinhos flutuantes
}) {
  const [travado, setTravado] = useState(false)
  const baloesRef = useRef(null)   // ligado ao useFrame do aparelho

  // Fallback: se o WebGL engasgar e o useFrame não rodar, o painel
  // aparece assim mesmo pouco depois — nunca fica um card sem botão.
  useEffect(() => {
    const t = setTimeout(() => setTravado(true), (DUR_ENTRADA + 1.2) * 1000)
    return () => clearTimeout(t)
  }, [])

  const linkWhats = `https://wa.me/${whatsapp.replace(/\D/g, '')}` +
    (mensagem ? `?text=${encodeURIComponent(mensagem)}` : '')

  return (
    <div className="iphone-palco">
      <Canvas camera={{ position: [0, 0, 0.42], fov: 35 }} dpr={[1, 2]} gl={{ alpha: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 4]} intensity={1.4} />
        <directionalLight position={[-3, -1, -2]} intensity={0.5} color="#6ea8ff" />

        <Suspense
          fallback={
            <Html center>
              <div className="iphone-carregando">
                <div className="iphone-carregando-anel" />
                <span>{textoCarregando}</span>
              </div>
            </Html>
          }
        >
          <Environment preset="city" />
          {/* Margem menor = aparelho MAIOR no quadro; 1.15 deixava
              muita sobra em volta. */}
          <Bounds fit clip observe margin={0.88}>
            <Center>
              <Aparelho aoTravar={() => setTravado(true)} baloesRef={baloesRef}>
                {/* O conteúdo da tela só aparece quando o giro termina. */}
                <div className={`iphone-tela-conteudo ${travado ? 'esta-visivel' : ''}`}>
                  <span className="iphone-tela-titulo">{titulo}</span>

                  <a
                    href={linkWhats}
                    target="_blank"
                    rel="noreferrer"
                    className="iphone-tela-btn"
                  >
                    <IconeWhatsApp className="iphone-tela-btn-icone" />
                    {textoBotao}
                  </a>
                </div>
              </Aparelho>
            </Center>
          </Bounds>
        </Suspense>
      </Canvas>

      {/* Balõezinhos por cima do canvas. Entram junto com o painel, quando
          o giro termina. */}
      {travado && <BaloesFlutuantes containerRef={baloesRef} mensagens={mensagensChat} />}
    </div>
  )
}

useGLTF.preload(MODELO)
