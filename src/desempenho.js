import { useEffect, useState } from "react";

// Modo leve: liga sozinho em máquina fraca e desliga as animações caras.
//
// O que pesa no site é a troca de layout do grid — 14 cards animando
// POSIÇÃO E TAMANHO ao mesmo tempo. Num PC bom isso roda liso e é a
// graça da coisa; num notebook antigo, medido com CPU 6x mais lenta,
// 23% dos quadros passavam de 33ms e a troca engasgava. Em vez de
// escolher entre "bonito pra todo mundo" e "rápido pra todo mundo",
// aqui cada máquina recebe o que aguenta.
//
// A decisão vem de três sinais, do mais confiável pro menos:
//
//   1. `prefers-reduced-motion` — o usuário PEDIU menos animação nas
//      configurações do sistema. Isso não é palpite, é vontade
//      declarada, então vale sozinho.
//   2. Núcleos de CPU e memória — dá pra ler na hora, sem esperar. É
//      grosseiro (não enxerga a placa de vídeo), mas pega a maioria dos
//      aparelhos fracos antes mesmo do primeiro quadro.
//   3. Medição real dos quadros — a prova final. Um PC pode ter 8
//      núcleos e vídeo integrado ruim; só medindo pra saber. Roda uma
//      única vez, depois que a animação de entrada terminou (medir
//      DURANTE ela acusaria qualquer máquina, já que ela é pesada de
//      propósito).
//
// Só liga, nunca desliga: se a máquina se mostrou fraca uma vez, não
// faz sentido devolver a animação e arriscar engasgar de novo.

// Abaixo disso, considera fraca. 4 núcleos / 4 GB é o corte usual entre
// aparelho de entrada e o resto.
const NUCLEOS_MINIMO = 4;
const MEMORIA_MINIMA = 4;

// 22ms ≈ 45 fps. Acima disso a máquina já não sustenta 60 nem parada,
// e a troca de layout (bem mais cara) vai engasgar feio.
const QUADRO_LENTO_MS = 22;

const AMOSTRAS = 60;

function suspeitaDeMaquinaFraca() {
  if (typeof window === "undefined") return false;

  // Vontade declarada do usuário: respeita sem discutir.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;

  const nucleos = navigator.hardwareConcurrency;
  if (typeof nucleos === "number" && nucleos <= NUCLEOS_MINIMO) return true;

  // `deviceMemory` não existe no Firefox nem no Safari — por isso o
  // teste de tipo em vez de comparar direto.
  const memoria = navigator.deviceMemory;
  if (typeof memoria === "number" && memoria <= MEMORIA_MINIMA) return true;

  return false;
}

export function useModoLeve({ esperarMs = 7000 } = {}) {
  const [modoLeve, setModoLeve] = useState(suspeitaDeMaquinaFraca);

  useEffect(() => {
    if (modoLeve) return;   // já decidido, não precisa medir

    let cancelado = false;
    let raf;

    const relogio = setTimeout(() => {
      const tempos = [];
      let anterior = performance.now();

      const medir = () => {
        if (cancelado) return;
        const agora = performance.now();
        tempos.push(agora - anterior);
        anterior = agora;

        if (tempos.length < AMOSTRAS) {
          raf = requestAnimationFrame(medir);
          return;
        }

        // Mediana, não média: um engasgo isolado (o navegador coletando
        // lixo, outra aba acordando) não deve condenar a máquina.
        tempos.sort((a, b) => a - b);
        const mediana = tempos[Math.floor(tempos.length / 2)];
        if (mediana > QUADRO_LENTO_MS) setModoLeve(true);
      };

      raf = requestAnimationFrame(medir);
    }, esperarMs);

    return () => {
      cancelado = true;
      clearTimeout(relogio);
      cancelAnimationFrame(raf);
    };
  }, [modoLeve, esperarMs]);

  return modoLeve;
}
