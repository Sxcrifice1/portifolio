import { useEffect, useState } from "react";

// As animações do site rodam em TODA máquina, por decisão de projeto.
//
// Aqui existia um "modo leve" que adivinhava se o computador era fraco
// (contando núcleos de CPU, lendo `deviceMemory` e cronometrando 60
// quadros com requestAnimationFrame) e, se achasse que sim, desligava
// sozinho a animação de troca de layout do grid. Isso saiu de propósito:
// o palpite errava — um PC bom com pouca RAM declarada, ou um segundo
// ruim porque outra aba acordou na hora da medição, e o visitante perdia
// a animação para sempre, sem jeito de recuperar (o modo só ligava,
// nunca desligava). Preferimos a animação em todo mundo.
//
// O que ficou é uma coisa DIFERENTE, e por isso este arquivo mudou de
// nome (era `desempenho.js`): `prefers-reduced-motion` não é um palpite
// sobre o computador, é a pessoa dizendo nas configurações do sistema
// operacional que movimento na tela lhe faz mal — enjoo, enxaqueca
// vestibular, sensibilidade a piscadas. Quem liga essa opção liga porque
// precisa, e o navegador só está entregando esse recado. Continua sendo
// respeitado.
//
// Se um dia você quiser animação até nesse caso, é só fazer este hook
// devolver `false` direto — mas saiba que é isso que está abrindo mão.

const CONSULTA = "(prefers-reduced-motion: reduce)";

function leituraInicial() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.(CONSULTA).matches ?? false;
}

export function usePrefereMenosMovimento() {
  const [prefereMenos, setPrefereMenos] = useState(leituraInicial);

  useEffect(() => {
    const mq = window.matchMedia?.(CONSULTA);
    if (!mq) return;

    // Ao contrário do modo leve antigo, este acompanha os dois sentidos:
    // se a pessoa desligar a opção no sistema, as animações voltam na
    // hora, sem precisar recarregar a página.
    const ler = () => setPrefereMenos(mq.matches);
    ler();
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
  }, []);

  return prefereMenos;
}
