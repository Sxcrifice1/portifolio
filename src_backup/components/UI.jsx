import React, { useRef, useState, useEffect } from 'react';
import { motion, useTransform, animate, useMotionValue } from 'framer-motion';
import GradualBlur from './GradualBlur';
import Personagem from './Personagem';
import TargetCursor from './TargetCursor';
import ScrollReveal from './ScrollReveal';
import BentoGrid from './BentoGrid';
import Loader from './Loader';
import OptionWheel from './OptionWheel';
import ElasticSlider from './ElasticSlider';

const musicTracks = [
  'Lofi Beats',
  'Synthwave Night',
  'Cyberpunk City',
  'Ambient Space',
  'Phonk Drift'
];

export default function UI() {
  const scrollContainer = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const handleGlobalClick = (e) => {
    // Se clicou dentro de um card ou nas músicas, ignora a troca de layout
    if (
      e.target.closest('.bento-card') || 
      e.target.closest('.lshape-shell') || 
      e.target.closest('.music-controls')
    ) return;
    
    setLayoutIndex((prev) => (prev + 1) % Object.keys(LAYOUT_PRESETS).length);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Se estiver a 20px ou menos do fundo, considera que chegou
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 20);
  };

  // Em vez de ler o scroll físico, criamos um progresso virtual de 0 a 1
  const introProgress = useMotionValue(0);

  // Efeito para disparar a transição após "carregar"
  useEffect(() => {
    const timer = setTimeout(() => {
        animate(introProgress, 1, {
          duration: 2.2, // Um pouco mais lento para apreciar o efeito
          ease: [0.45, 0, 0.15, 1]
        });
    }, 3500); 
    return () => clearTimeout(timer);
  }, []);

  // Animação 3D do Grid baseada no progresso virtual
  const rotateX = useTransform(introProgress, [0, 1], [15, 0]);
  const scale = useTransform(introProgress, [0, 1], [0.85, 1]);
  const translateY = useTransform(introProgress, [0, 1], [100, 0]);
  
  // Crossfade de Opacidade
  const loaderOpacity = useTransform(introProgress, [0, 0.5], [1, 0]); // Loader some rápido
  const gridOpacity = useTransform(introProgress, [0.2, 1], [0, 1]);   // Grid aparece suavemente
  const blurOpacity = useTransform(introProgress, [0.4, 1], [1, 0]);   // Borrão some suavemente depois que o grid começa a aparecer

  return (
    <section style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 10,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      
      {/* Cursor interativo avançado */}
      <TargetCursor 
        targetSelector=".glass-card, .glass-btn, button, a"
        cursorColor="#ffffff"
        cursorColorOnTarget="#ff3366" 
      />

      <div 
        ref={scrollContainer}
        style={{ 
          height: '100%', 
          overflowY: 'hidden', 
          overflowX: 'scroll', // 'scroll' em vez de 'auto' força a barra a existir sempre, evitando pulo de layout
          pointerEvents: 'auto',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          // margin: '0 auto' no filho cuidará do centro horizontal sem cortar as bordas
          zIndex: 1
        }}
        onScroll={handleScroll}
      >
        
        {/* Tela de Carregamento (Sobreposta) */}
        <motion.div 
           style={{ 
             position: 'absolute', inset: 0, 
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             opacity: loaderOpacity,
             pointerEvents: 'none',
             zIndex: 20
           }}
        >
           <Loader />
        </motion.div>
        
        {/* Espaço reservado para o conteúdo principal (Grid) */}
        <motion.div 
           style={{ 
             maxWidth: '825px', margin: '0 auto', width: '100%', perspective: '1200px',
             opacity: gridOpacity,
             zIndex: 10
           }}
        >
          <motion.div
            style={{
              rotateX,
              scale,
              translateY
            }}
          >
            {/* Novo Bento Grid Dinâmico importado do projeto JOB */}
            <BentoGrid />
          </motion.div>
        </motion.div>

        {/* Menu de Músicas e Volume - Canto Inferior Direito */}
        <motion.div 
           className="music-controls"
           style={{ 
             position: 'absolute', 
             bottom: '40px', 
             right: '20px', 
             width: '250px',
             height: '400px', // Aumentado um pouco para caber o slider
             display: 'flex',
             flexDirection: 'column',
             alignItems: 'center',
             justifyContent: 'flex-end',
             gap: '20px',
             opacity: gridOpacity,
             zIndex: 5,
             pointerEvents: 'auto'
           }}
        >
          {/* O OptionWheel ocupa o restante do espaço disponível */}
          <div className="w-full flex-1">
            <OptionWheel
              items={musicTracks}
              defaultSelected={0}
              side="right"
              textColor="rgba(255,255,255,0.2)"
              activeColor="#ffffff"
              fontSize={1.5}
              spacing={1.8}
              curve={1}
              tilt={10}
              inset={40}
              loop={true}
              onChange={(index, item) => console.log('Música selecionada:', item)}
            />
          </div>

          {/* O slider de volume no rodapé do menu */}
          <ElasticSlider 
            defaultValue={50} 
            startingValue={0} 
            maxValue={100} 
            isStepped={false}
          />
        </motion.div>

      </div>

      {/* Gradual Blur no final da tela sendo esmaecido suavemente */}
      <motion.div style={{ opacity: blurOpacity, position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
        <GradualBlur
          target="parent"
          position="bottom"
          height="12rem"
          strength={4}
          divCount={8}
          curve="bezier"
          exponential={true}
          opacity={1}
        />
      </motion.div>
    </section>
  );
}
