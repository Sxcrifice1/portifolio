import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { X, Info, Music, Code, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Exemplo de pontos de interesse (Hotspots)
const HOTSPOTS = [
  {
    id: 1,
    position: [-620, -30, 450], // Posição que você gostou (será corrigida automaticamente pelo código)
    title: "Comunidade",
    description: "Sempre online no Discord conversando com a galera e alinhando os próximos projetos.",
    icon: "discord"
  },
  {
    id: 2,
    position: [-250, -30, 450], // Puxei um pouco pra esquerda em relação ao microfone
    title: "Foco Total",
    description: "Ouvindo aquele Lofi ou Synthwave pra entrar no flow e codar sem distrações.",
    icon: "music"
  },
  {
    id: 3,
    position: [600, -200, -450], // No notebook (lado esquerdo da sala)
    title: "Clydes",
    description: "Idealizador de uma empresa de software para ajudar produtores musicais, criando plugins de músicas acessíveis. Nossa empresa conta com um grupo seleto de programadores, e uma comunidade que sempre busca por melhorias musicais.",
    icon: "clydes"
  },
  {
    id: 4,
    position: [-250, -20, -450], // Na TV grande (lado direito da sala)
    title: "Minha Playlist",
    description: "Uma seleção das músicas que me inspiram enquanto desenvolvo. Clique para ouvir!",
    icon: "youtube",
    link: "" // Link será adicionado depois
  }
];

// Slides de conteúdo para o modal de Música
const MUSIC_SLIDES = [
  {
    title: "Foco Total",
    description: "Ouvindo aquele Lofi ou Synthwave pra entrar no flow e codar sem distrações.",
    tag: "Spotify / YouTube",
    gradient: "from-purple-900/50 to-blue-900/50"
  },
  {
    title: "Playlist de Code",
    description: "Uma curadoria especial de músicas que me acompanham durante o desenvolvimento. De lo-fi beats a trilhas de jogos.",
    tag: "Coding Vibes",
    gradient: "from-emerald-900/50 to-cyan-900/50"
  },
  {
    title: "Synthwave Nights",
    description: "Quando o sol se põe e a criatividade acende. Retrowave e Synthwave são o combustível das madrugadas de código.",
    tag: "Night Sessions",
    gradient: "from-pink-900/50 to-orange-900/50"
  }
];

function PanoramaSphere({ activeHotspot, setActiveHotspot }) {
  const texture = useTexture('/Panorama.png');
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
          <div className="relative group cursor-pointer" onClick={(e) => {
            e.stopPropagation(); // Evita acionar o clique da esfera
            setActiveHotspot(activeHotspot === spot.id ? null : spot.id);
          }}>

            {/* Ponto / Ícone com animação de flutuar */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${activeHotspot === spot.id ? 'bg-white text-black scale-110' : 'bg-black/50 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md hover:scale-110'}`}
            >
              {renderIcon(spot.icon, activeHotspot === spot.id)}
            </motion.div>

            {/* Efeito de pulso */}
            {activeHotspot !== spot.id && (
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-white rounded-full animate-ping opacity-20 pointer-events-none"
              ></motion.div>
            )}

            {/* Card Explicativo Pequeno (Apenas para Discord etc, não para Música) */}
            <AnimatePresence>
              {activeHotspot === spot.id && spot.icon !== 'music' && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 10, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className="absolute top-12 left-1/2 -translate-x-1/2 w-72 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl origin-top"
                >
                  <h4 className="text-white font-bold font-outfit mb-2 text-lg">{spot.title}</h4>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {spot.description}
                  </p>

                  {/* Seta do balão */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/80 border-t border-l border-white/10 rotate-45 backdrop-blur-xl"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Html>
      ))}
    </group>
  );
}

export function PanoramaViewer() {
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
    <div className="relative w-full h-full bg-black overflow-hidden rounded-2xl group" onPointerDown={handlePointerDown}>
      {/* Efeito de desfoque real nas bordas (Blur com CSS Mask) */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          maskImage: 'radial-gradient(circle at center, transparent 55%, black 100%)',
          WebkitMaskImage: 'radial-gradient(circle at center, transparent 55%, black 100%)'
        }}
      ></div>

      {/* Dica de interação */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white/70 px-4 py-1.5 rounded-full text-xs backdrop-blur-md pointer-events-none border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Arraste para girar • Role para zoom
      </div>

      <Canvas className="w-full h-full" camera={{ position: [0, 0, 0.1], fov: 100 }}>
        <Suspense fallback={
          <Html center>
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              <div className="text-white text-sm font-medium tracking-wide whitespace-nowrap">Carregando 360...</div>
            </div>
          </Html>
        }>
          <PanoramaSphere activeHotspot={activeHotspot} setActiveHotspot={setActiveHotspot} />
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
            className="absolute inset-0 z-[999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Setas de navegação */}
            <button onClick={handlePrevSlide} className="absolute left-4 z-40 p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white backdrop-blur-md transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button onClick={handleNextSlide} className="absolute right-4 z-40 p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white backdrop-blur-md transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>

            {/* Card Principal */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-[400px] bg-[#111]/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botão Fechar */}
              <button
                onClick={(e) => { e.stopPropagation(); setActiveHotspot(null); }}
                className="absolute top-4 right-4 z-10 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              {/* Área de Mídia (Vídeo/Imagem) */}
              <div className="w-full h-48 bg-neutral-900 relative flex items-center justify-center overflow-hidden">
                {/* Gradiente de fundo dinâmico por slide */}
                <motion.div
                  key={slideIndex + '-bg'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  className={`absolute inset-0 bg-gradient-to-br ${currentSlide.gradient}`}
                ></motion.div>
                {/* Botão Play central */}
                <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center bg-black/30 backdrop-blur-md text-white hover:scale-110 hover:bg-white/20 transition-all cursor-pointer z-10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M5 3l14 9-14 9V3z" /></svg>
                </div>
              </div>

              {/* Textos - animados por slide */}
              <div className="px-8 py-7 flex flex-col gap-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slideIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-3"
                  >
                    <h3 className="text-white font-outfit text-2xl font-bold">{currentSlide.title}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      {currentSlide.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
                <div className="mt-2 w-full h-[1px] bg-white/10"></div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center text-xs text-neutral-500">
                    <Music size={14} />
                    <span>{currentSlide.tag}</span>
                  </div>
                  {/* Indicadores de slide */}
                  <div className="flex gap-1.5">
                    {MUSIC_SLIDES.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i === slideIndex ? 'bg-white' : 'bg-white/20'}`}></div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
