import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { X, Info, Music, PlayCircle, Volume2, VolumeX, ArrowUpRight, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './PanoramaViewer.css';
import { arquivo } from '../arquivos'

// Estrutura (posição na esfera 360, ícone, link) não muda com o idioma
// — só título/descrição. Base + texto por idioma, junta os dois na hora
// de usar (montarHotspots/montarMusicSlides mais abaixo) — mesmo
// esquema usado no BentoGrid.jsx pra sites/projetos.
const HOTSPOTS_BASE = [
  {
    id: 1,
    position: [-620, -30, 450], // Posição que você gostou (será corrigida automaticamente pelo código)
    icon: "discord",
    // `link` fica AQUI na base, e não dentro de `texto` — a URL é a
    // mesma nos dois idiomas, então duplicá-la só criaria duas cópias
    // pra manter em sincronia. Só title/description mudam de língua.
    // Quando existe, o card ganha um botão (ver JSX do pano-spot-card).
    link: "https://discord.gg/AqtuBac7Vh",
    texto: {
      pt: { title: "Comunidade", description: "Sempre online no Discord conversando com a galera e alinhando os próximos projetos.", rotuloLink: "Entrar no servidor" },
      en: { title: "Community", description: "Always online on Discord, chatting with the crew and lining up the next projects.", rotuloLink: "Join the server" },
    },
  },
  {
    id: 2,
    position: [-250, -30, 450], // Puxei um pouco pra esquerda em relação ao microfone
    icon: "music",
    texto: {
      pt: { title: "Foco Total", description: "Ouvindo aquele Lofi ou Synthwave pra entrar no flow e codar sem distrações." },
      en: { title: "Total Focus", description: "Listening to some Lofi or Synthwave to get in the flow and code distraction-free." },
    },
  },
  {
    id: 3,
    position: [600, -200, -450], // No notebook (lado esquerdo da sala)
    icon: "clydes",
    link: "https://clydes.com.br/",
    texto: {
      pt: { title: "Clydes", description: "Idealizador de uma empresa de software para ajudar produtores musicais, criando plugins de músicas acessíveis. Nossa empresa conta com um grupo seleto de programadores, e uma comunidade que sempre busca por melhorias musicais.", rotuloLink: "Visitar o site" },
      en: { title: "Clydes", description: "Founder of a software company that helps music producers, building accessible music plugins. Our company has a select group of programmers and a community always looking for musical improvements.", rotuloLink: "Visit the site" },
    },
  },
  {
    id: 4,
    position: [-250, -20, -450], // Na TV grande (lado direito da sala)
    icon: "youtube",
    link: "https://open.spotify.com/intl-pt/album/7tWP3OG5dWphctKg4NMACt",
    texto: {
      // `rotuloLink` (opcional): sobrescreve o texto do botão só neste
      // hotspot. Sem ele, o card cai no genérico `tp.spotAbrirLink`.
      // É TEXTO, então mora aqui dentro e não na base junto do `link`.
      pt: { title: "Minha Playlist", description: "Uma seleção das músicas que me inspiram enquanto desenvolvo. Clique para ouvir!", rotuloLink: "Ouvir no Spotify" },
      en: { title: "My Playlist", description: "A selection of songs that inspire me while I code. Click to listen!", rotuloLink: "Listen on Spotify" },
    },
  },
];

// Slides de conteúdo para o modal de Música — cada um é uma música
// PRÓPRIA, com o vídeo do arquivo tocando na área de mídia do card.
//
// Link do Dropbox com `dl=1` (não `dl=0`, que é como ele sai ao copiar
// do navegador): dl=1 entrega o ARQUIVO direto, do jeito que uma tag
// <video src> precisa; dl=0 devolveria a PÁGINA de preview do Dropbox
// (um site inteiro). Mesma convenção usada nos vídeos de projeto do
// BentoGrid.jsx.
const MUSIC_SLIDES_BASE = [
  {
    gradient: "from-purple-900/50 to-blue-900/50",
    videoFile: "https://www.dropbox.com/scl/fi/yncel0f6bdquzyw13vld3/2026-08-28-15-44-15.mp4?rlkey=bo10r21nmqppdmlxfeqox8zfq&st=35x0qhh0&dl=1",
    texto: {
      pt: { title: "EPICDRUMS", description: "Trilha sonora que compus inspirada em Doom e Mossback — bateria pesada e clima de batalha do começo ao fim.", tag: "Composição própria" },
      en: { title: "EPICDRUMS", description: "A soundtrack I composed inspired by Doom and Mossback — heavy drums and a battle mood from start to finish.", tag: "Original composition" },
    },
  },
  {
    gradient: "from-emerald-900/50 to-cyan-900/50",
    videoFile: "https://www.dropbox.com/scl/fi/k6d4verrlr3b3v6zxlvov/2026-08-28-15-50-14.mp4?rlkey=lrd0whuk0fdrijd1w6ynwvzl4&st=3g83k308&dl=1",
    texto: {
      pt: { title: "Zack", description: "Uma música que comecei a produzir — fazer som é o passatempo que me desliga de todo o resto.", tag: "Em produção" },
      en: { title: "Zack", description: "A track I started producing — making music is the hobby that switches my brain off from everything else.", tag: "Work in progress" },
    },
  },
];

// Player do vídeo de cada slide de música. Reaproveita o botão de play
// que já existia no card (antes era só decorativo) e ganha um botão de
// mudo no canto — como é MÚSICA, o vídeo começa COM som (não é
// autoplay: só toca depois do clique, então o navegador não bloqueia).
function VideoDaMusica({ src, rotuloTocar, rotuloPausar, rotuloSilenciar, rotuloAtivarSom, rotuloTelaCheia }) {
  const videoRef = useRef(null);
  const [tocando, setTocando] = useState(false);
  const [mudo, setMudo] = useState(false);

  // Pausa ao DESMONTAR (trocar de slide ou fechar o modal): sem isso o
  // <video> do slide anterior continuaria tocando escondido e o áudio
  // dos dois se somaria.
  useEffect(() => () => videoRef.current?.pause(), []);

  const alternarPlay = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    // .play() devolve uma Promise que pode rejeitar (clique duplo rápido
    // interrompe o play com um pause no meio) — sem catch isso vira erro
    // não tratado no console à toa.
    if (v.paused) v.play().catch(() => { });
    else v.pause();
  };

  const alternarMudo = (e) => {
    e.stopPropagation();
    setMudo((m) => !m);
  };

  // Tela cheia. `requestFullscreen` é o padrão, mas o Safari do iPhone
  // não o implementa para elementos comuns — lá só o próprio <video>
  // entra em tela cheia, via `webkitEnterFullscreen`. Sem esse segundo
  // caminho o botão ficaria inerte justo no aparelho onde assistir em
  // tela cheia mais importa.
  const alternarTelaCheia = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else if (v.requestFullscreen) {
      v.requestFullscreen().catch(() => { });
    } else if (v.webkitEnterFullscreen) {
      v.webkitEnterFullscreen();
    }
  };

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        className="pano-modal-video"
        playsInline
        // "auto": faz o navegador decodificar e mostrar o primeiro
        // quadro sozinho, servindo de capa — sem isso a área fica preta
        // até apertar play, e não temos thumbnail separada de cada vídeo.
        preload="auto"
        muted={mudo}
        onClick={alternarPlay}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
      />

      {/* Play E pause no MESMO botão. Antes ele sumia ao tocar (opacity 0
          + pointer-events:none), e aí não sobrava nada pra clicar pra
          pausar. Agora ele só fica translúcido enquanto toca — pra não
          tapar o vídeo — e volta ao cheio no hover; clicável o tempo
          todo. Nunca desmonta: um elemento destruído não dispara
          `mouseleave`, e o cursor customizado do site (TargetCursor)
          escuta esse evento pra soltar o alvo — ficaria travado nas
          bordas de um botão que não existe mais. */}
      <button
        type="button"
        className={`pano-modal-play${tocando ? ' esta-tocando' : ''}`}
        onClick={alternarPlay}
        aria-label={tocando ? rotuloPausar : rotuloTocar}
      >
        {tocando
          ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
          : <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M5 3l14 9-14 9V3z" /></svg>}
      </button>

      <div className="pano-modal-controles">
        <button
          type="button"
          className="pano-modal-mute"
          onClick={alternarMudo}
          aria-label={mudo ? rotuloAtivarSom : rotuloSilenciar}
        >
          {mudo ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        <button
          type="button"
          className="pano-modal-mute"
          onClick={alternarTelaCheia}
          aria-label={rotuloTelaCheia}
        >
          <Maximize size={16} />
        </button>
      </div>
    </>
  );
}

const montarHotspots = (idioma) => HOTSPOTS_BASE.map(({ texto, ...resto }) => ({ ...resto, ...texto[idioma] }));
const montarMusicSlides = (idioma) => MUSIC_SLIDES_BASE.map(({ texto, ...resto }) => ({ ...resto, ...texto[idioma] }));

const TEXTO_PANO = {
  pt: {
    dica: "Arraste para girar • Role para zoom",
    carregando: "Carregando 360...",
    spotAbrirLink: "Acessar",
    videoTocar: "Tocar música",
    videoPausar: "Pausar música",
    videoSilenciar: "Silenciar",
    videoAtivarSom: "Ativar som",
    videoTelaCheia: "Tela cheia",
  },
  en: {
    dica: "Drag to rotate • Scroll to zoom",
    carregando: "Loading 360...",
    spotAbrirLink: "Open",
    videoTocar: "Play track",
    videoPausar: "Pause track",
    videoSilenciar: "Mute",
    videoAtivarSom: "Unmute",
    videoTelaCheia: "Fullscreen",
  },
};

function PanoramaSphere({ activeHotspot, setActiveHotspot, idioma = "pt" }) {
  const HOTSPOTS = montarHotspots(idioma);
  const tp = TEXTO_PANO[idioma];
  const texture = useTexture(arquivo('/Panorama.webp'));
  texture.colorSpace = THREE.SRGBColorSpace; // Garantir cores corretas

  // Função para ajudar a mapear novos pontos
  const handleSphereClick = (e) => {
    const pt = e.point;
    console.log(`Coordenada do clique: position={[${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}, ${pt.z.toFixed(2)}]}`);
  };

  const renderIcon = (iconName, isActive) => {
    if (iconName === 'music') return <Music size={20} />;
    if (iconName === 'clydes') return <img src="https://i.postimg.cc/gJFCV1Rz/Sem-T-tulo-1.png" alt="Clydes" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', imageRendering: 'auto', filter: isActive ? 'invert(1) brightness(0)' : 'none' }} />;
    if (iconName === 'youtube') return <PlayCircle size={20} />;
    if (iconName === 'discord') return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    );
    return <Info size={20} />;
  }

  // Função mágica para evitar que o ícone suma ao dar zoom
  // Ela garante que, não importa os números que você digite, 
  // o ponto sempre fique colado na parede de dentro da esfera (raio 450)
  const normalizePosition = (pos) => {
    const [x, y, z] = pos;
    const distance = Math.sqrt(x * x + y * y + z * z);
    const radius = 450;
    return [(x / distance) * radius, (y / distance) * radius, (z / distance) * radius];
  };

  return (
    <group scale={[-1, 1, 1]}>
      <mesh onPointerDown={handleSphereClick}>
        <sphereGeometry args={[500, 60, 40]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} />
      </mesh>

      {/* Renderizar os Hotspots */}
      {HOTSPOTS.map((spot) => (
        <Html
          key={spot.id}
          position={normalizePosition(spot.position)}
          center
          zIndexRange={[100, 0]}
        >
          <div className="pano-spot group" onClick={(e) => {
            e.stopPropagation(); // Evita acionar o clique da esfera
            setActiveHotspot(activeHotspot === spot.id ? null : spot.id);
          }}>

            {/* Ponto / Ícone com animação de flutuar */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className={`pano-spot-btn ${activeHotspot === spot.id ? 'bg-white text-black scale-110' : 'bg-black/50 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md hover:scale-110'}`}
            >
              {renderIcon(spot.icon, activeHotspot === spot.id)}
            </motion.div>

            {/* Efeito de pulso */}
            {activeHotspot !== spot.id && (
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="pano-spot-pulse"
              ></motion.div>
            )}

            {/* Card Explicativo Pequeno (Apenas para Discord etc, não para Música) */}
            <AnimatePresence>
              {activeHotspot === spot.id && spot.icon !== 'music' && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 10, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className="pano-spot-card"
                >
                  <h4 className="pano-spot-title">{spot.title}</h4>
                  <p className="pano-spot-desc">
                    {spot.description}
                  </p>

                  {/* Só os hotspots que têm `link` na base ganham botão —
                      os outros seguem só com texto. O stopPropagation é
                      necessário: o clique subiria até o `.pano-spot`, cujo
                      onClick fecha o card, e ele sumiria no mesmo clique
                      que abre o link. */}
                  {spot.link && (
                    <a
                      href={spot.link}
                      target="_blank"
                      rel="noreferrer"
                      className="pano-spot-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{spot.rotuloLink || tp.spotAbrirLink}</span>
                      <ArrowUpRight size={14} />
                    </a>
                  )}

                  {/* Seta do balão */}
                  <div className="pano-spot-arrow"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Html>
      ))}
    </group>
  );
}

export function PanoramaViewer({ idioma = "pt" }) {
  const HOTSPOTS = montarHotspots(idioma);
  const MUSIC_SLIDES = montarMusicSlides(idioma);
  const tp = TEXTO_PANO[idioma];
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);

  // Fecha o card ativo se o usuário clicar no fundo e começar a arrastar
  const handlePointerDown = () => {
    if (activeHotspot) setActiveHotspot(null);
  };

  const activeSpotData = HOTSPOTS.find(h => h.id === activeHotspot);
  const currentSlide = MUSIC_SLIDES[slideIndex];

  const handleNextSlide = (e) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev + 1) % MUSIC_SLIDES.length);
  };

  const handlePrevSlide = (e) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev - 1 + MUSIC_SLIDES.length) % MUSIC_SLIDES.length);
  };

  return (
    <div className="pano group" onPointerDown={handlePointerDown}>
      {/* Efeito de desfoque real nas bordas (Blur com CSS Mask) */}
      <div
        className="pano-vignette"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          maskImage: 'radial-gradient(circle at center, transparent 55%, black 100%)',
          WebkitMaskImage: 'radial-gradient(circle at center, transparent 55%, black 100%)'
        }}
      ></div>

      {/* Dica de interação */}
      <div className="pano-tip">
        {tp.dica}
      </div>

      <Canvas className="pano-canvas" camera={{ position: [0, 0, 0.1], fov: 100 }}>
        <Suspense fallback={
          <Html center>
            <div className="pano-loading">
              <div className="pano-loading-ring"></div>
              <div className="pano-loading-text">{tp.carregando}</div>
            </div>
          </Html>
        }>
          <PanoramaSphere activeHotspot={activeHotspot} setActiveHotspot={setActiveHotspot} idioma={idioma} />
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={-0.5}
            minDistance={0.1}
            maxDistance={300}
          />
        </Suspense>
      </Canvas>

      {/* Modal Grande sobrepondo o 360 (Apenas para Música) */}
      <AnimatePresence>
        {activeSpotData && activeSpotData.icon === 'music' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pano-modal"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Setas de navegação */}
            <button onClick={handlePrevSlide} className="pano-modal-arrow pano-modal-arrow--prev">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button onClick={handleNextSlide} className="pano-modal-arrow pano-modal-arrow--next">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>

            {/* Coluna: o X ACIMA do card, não dentro dele. Dentro, ele
                dividia o canto superior direito da área de mídia com o
                botão de som e os dois se cobriam — e não dava pra só
                empurrar o X pra cima, porque o card tem `overflow:
                hidden` e ele seria cortado. Aqui fora ele sobe livre e o
                botão de som fica onde estava. */}
            <div className="pano-modal-stack">
              {/* Botão Fechar */}
              <button
                onClick={(e) => { e.stopPropagation(); setActiveHotspot(null); }}
                className="pano-modal-close"
              >
                <X size={20} />
              </button>

              {/* Card Principal */}
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="pano-modal-card"
                onClick={(e) => e.stopPropagation()}
              >

              {/* Área de Mídia (Vídeo/Imagem) */}
              <div className="pano-modal-media">
                {/* Gradiente de fundo dinâmico por slide — fica ATRÁS do
                    vídeo (ver z-index no CSS), aparecendo só na margem
                    que o vídeo não cobre. */}
                <motion.div
                  key={slideIndex + '-bg'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  className={`pano-modal-gradient ${currentSlide.gradient}`}
                ></motion.div>
                {/* `key`: força o player a montar do zero a cada troca de
                    slide, então o vídeo antigo é desmontado (e pausado
                    pelo cleanup) em vez de continuar tocando por baixo. */}
                <VideoDaMusica
                  key={slideIndex}
                  src={currentSlide.videoFile}
                  rotuloTocar={tp.videoTocar}
                  rotuloPausar={tp.videoPausar}
                  rotuloSilenciar={tp.videoSilenciar}
                  rotuloAtivarSom={tp.videoAtivarSom}
                  rotuloTelaCheia={tp.videoTelaCheia}
                />
              </div>

              {/* Textos - animados por slide */}
              <div className="pano-modal-body">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slideIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="pano-modal-text"
                  >
                    <h3 className="pano-modal-title">{currentSlide.title}</h3>
                    <p className="pano-modal-desc">
                      {currentSlide.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
                <div className="pano-modal-rule"></div>
                <div className="pano-modal-foot">
                  <div className="pano-modal-tag">
                    <Music size={14} />
                    <span>{currentSlide.tag}</span>
                  </div>
                  {/* Indicadores de slide */}
                  <div className="pano-modal-dots">
                    {MUSIC_SLIDES.map((_, i) => (
                      <div key={i} className={`pano-modal-dot ${i === slideIndex ? 'bg-white' : 'bg-white/20'}`}></div>
                    ))}
                  </div>
                </div>
              </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
