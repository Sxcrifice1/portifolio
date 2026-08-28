import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export const Scroll3DContainer = ({
  titleComponent,
  children,
}) => {
  const containerRef = useRef(null);

  // IMPORTANTE: Como o scroll ocorre dentro de uma div no UI.jsx, 
  // idealmente essa div deveria ser passada como `container` aqui se 
  // quisermos perfeita sincronia. Se não passarmos, o Framer Motion 
  // tentará usar o Window. Mas como a Window não rola no seu app, 
  // o scrollYProgress precisa monitorar o ancestral rolavel mais proximo.
  
  // Solução: encontraremos o container rolavel via DOM para anexá-lo ao useScroll dinamicamente.
  const [scrollContainer, setScrollContainer] = useState(null);

  useEffect(() => {
    // Procura o elemento pai que tenha overflow-y: auto. No nosso caso, é a div do UI.jsx
    if (containerRef.current) {
      const parent = containerRef.current.closest('[style*="overflow-y: auto"]');
      if (parent) {
        setScrollContainer(parent);
      }
    }
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    container: scrollContainer ? { current: scrollContainer } : undefined,
    offset: ["start end", "end start"], // Começa quando o topo entra na tela, termina quando o fim sai
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // scale: começa em 0.8 e vai até 1 (tamanho real) no topo da tela
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);

  // rotateX: começa deitado para trás (20 graus) e levanta até 0 graus (reto)
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [20, 0]);

  // translateY do card principal para dar o efeito que ele está subindo
  const translateCard = useTransform(scrollYProgress, [0, 1], [100, -100]);

  // Título sobe ligeiramente conforme o card se levanta
  const translateTitle = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center p-2 sm:p-20 w-full"
      style={{ perspective: "1000px" }}
    >
      <div
        className="w-full relative flex flex-col items-center justify-center"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Título com translação */}
        <motion.div
          style={{
            translateY: translateTitle,
          }}
          className="max-w-5xl mx-auto text-center w-full mb-8 sm:mb-12"
        >
          {titleComponent}
        </motion.div>

        {/* Cartão com rotação e escala 3D */}
        <motion.div
          style={{
            rotateX: rotateX,
            scale: scale,
            translateY: translateCard,
            boxShadow:
              "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
          }}
          className="max-w-5xl w-full mx-auto bg-[#141414] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden p-2 sm:p-4"
        >
          <div className="bg-[#1a1a1a] rounded-[1.5rem] sm:rounded-[2rem] h-full w-full overflow-hidden border border-white/5 min-h-[400px]">
             {/* Conteúdo do Cartão */}
             {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Scroll3DContainer;
