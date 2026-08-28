import React, { useRef, useEffect, useState } from 'react';
import { motion, useTransform, animate, useMotionValue } from 'framer-motion';
import GradualBlur from './GradualBlur';
import TargetCursor from './TargetCursor';
import BentoGrid from './BentoGrid';
import Loader from './Loader';
import './UI.css';

export default function UI() {
  const scrollContainer = useRef(null);

  // Idioma do site inteiro (repassado pro BentoGrid, que é quem
  // realmente traduz o conteúdo) — vive aqui, não dentro do BentoGrid,
  // porque o botão de trocar fica FORA dele, direto no overlay do UI.
  const [idioma, setIdioma] = useState('pt');
  const alternarIdioma = () => setIdioma((i) => (i === 'pt' ? 'en' : 'pt'));

  // Mesmo breakpoint do grid (40rem): abaixo dele o layout vira uma
  // coluna alta, e o container precisa rolar na VERTICAL em vez da
  // horizontal. Os estilos ficam inline (o Framer anima opacidade e
  // transform por MotionValue), então essa escolha precisa vir do JS.
  const [ehMobile, setEhMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const ler = () => setEhMobile(mq.matches);
    ler();
    mq.addEventListener('change', ler);
    return () => mq.removeEventListener('change', ler);
  }, []);

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
          // No CELULAR o grid vira uma coluna e fica bem mais alto que a
          // tela (medido: 1837px dentro de 840px). Com `overflowY:
          // hidden` não havia como rolar e o conteúdo de baixo era
          // simplesmente inalcançável. O eixo X é o inverso: a rolagem
          // horizontal existe só para as gavetas do desktop, que nascem
          // fora do grid — no celular elas viram painel sobre a tela, e
          // deixar o X solto só criaria um arrasto lateral à toa.
          overflowY: ehMobile ? 'auto' : 'hidden',
          overflowX: ehMobile ? 'hidden' : 'scroll', // 'scroll' em vez de 'auto' força a barra a existir sempre, evitando pulo de layout
          pointerEvents: 'auto',
          position: 'relative',
          display: 'flex',
          // `center` com conteúdo mais alto que o container corta os dois
          // extremos e nem a rolagem alcança o de cima — daí `flex-start`
          // quando a coluna do celular estoura a altura.
          alignItems: ehMobile ? 'flex-start' : 'center',
          // margin: '0 auto' no filho cuidará do centro horizontal sem cortar as bordas
          zIndex: 1
        }}
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
            <BentoGrid idioma={idioma} />
          </motion.div>
        </motion.div>

        {/* Botão de trocar idioma - lado direito, em cima (o canto de
            baixo já é do menu de músicas). Mostra a língua que você VAI
            trocar PRA, não a atual — mesmo padrão de qualquer seletor
            de idioma. */}
        <motion.button
          type="button"
          onClick={alternarIdioma}
          aria-label={idioma === 'pt' ? 'Switch to English' : 'Mudar para português'}
          className="language-toggle"
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            opacity: gridOpacity,
            zIndex: 15,
            pointerEvents: 'auto'
          }}
        >
          {idioma === 'pt' ? 'EN' : 'PT'}
        </motion.button>

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
