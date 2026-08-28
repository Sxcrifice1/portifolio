import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, ArrowUpRight, Code2, PenTool, MapPin, Mail, Smartphone, Plus, Send, ArrowDownLeft, Code, MessageSquareDashed, Download, ChevronRight, ChevronLeft } from "lucide-react";
import Personagem from './Personagem'; // 3D Avatar!
import { DraggableTag, DraggableCard } from './DraggableTag';
import { PanoramaViewer } from './PanoramaViewer';

const DelayedMount = ({ children, delay = 800 }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/20">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

const profileData = {
  name: "Jake Bogan",
  role: "Front End Web Developer",
  avatarUrl: "/avatar.webp",
  services: [
    { name: "Branding", style: "top-[20%] right-[15%] rotate-12" },
    { name: "3D Design", style: "top-[40%] right-[5%] -rotate-6" },
    { name: "SVG Icons", style: "top-[10%] left-[10%] -rotate-12" },
    { name: "Frontend", style: "bottom-[25%] right-[20%] rotate-12" },
    { name: "WordPress", style: "top-[45%] left-[5%] rotate-6" },
    { name: "UX/UI Design", style: "bottom-[20%] left-[15%] -rotate-6" },
    { name: "SEO", style: "bottom-[5%] left-[40%] rotate-3" },
  ],
  tools: [
    { name: "Adobe XD", text: "Xd", color: "text-[#ff61f6]", bgColor: "bg-[#252525]" },
    { name: "Figma", text: "F", color: "text-white", bgColor: "bg-[#252525]" },
    { name: "Tailwind", text: "T", color: "text-blue-500", bgColor: "bg-[#252525]" },
    { name: "Photoshop", text: "Ps", color: "text-blue-400", bgColor: "bg-[#252525]" },
  ],
  stats: [
    { value: "+40", label: "Projetos entregues" },
    { value: "+18", label: "Clientes felizes" },
    { value: "+6", label: "Anos de estrada" },
  ],
  projects: [
    { name: "Nebula Dashboard", tag: "Web App", year: "2026" },
    { name: "Orbit Design System", tag: "Design System", year: "2025" },
    { name: "Hyperflow Landing", tag: "Landing", year: "2025" },
    { name: "Kite Analytics", tag: "Dashboard", year: "2024" },
    { name: "Pulse CRM", tag: "SaaS", year: "2024" },
    { name: "Nova Portfolio", tag: "Website", year: "2023" },
  ]
};

// Layouts calculados matematicamente para um Grid de 20 colunas e 20 linhas (Tamanho Fixo!)
const LAYOUT_PRESETS = [
  { // 0: Screenshot 1 (Default) - 20 Linhas Totais (5 + 3 + 6 + 6)
    header: "order-1 sm:col-span-15 sm:row-span-5", // Ajustado para 15
    avatar: "order-2 sm:col-span-5 sm:row-span-5",  // 5x5 Quadrado Perfeito (1:1)
    github: "order-3 sm:col-span-4 sm:row-span-3",
    dribbble: "order-4 sm:col-span-4 sm:row-span-3",
    location: "order-5 sm:col-span-4 sm:row-span-3",
    mail: "order-6 sm:col-span-4 sm:row-span-3",
    phone: "order-7 sm:col-span-4 sm:row-span-3",
    projects: "order-8 sm:col-span-12 sm:row-span-6",
    services: "order-9 sm:col-span-8 sm:row-span-6",
    tools: "order-10 sm:col-span-8 sm:row-span-6",
    collab: "order-11 sm:col-span-12 sm:row-span-6"
  },
  { // 1: Screenshot 2 (Projects Full) - 20 Linhas Totais (5 + 5 + 4 + 6)
    avatar: "order-1 sm:col-span-5 sm:row-span-5",  // 5x5 Quadrado Perfeito (1:1)
    collab: "order-2 sm:col-span-15 sm:row-span-5", // Ajustado para 15
    projects: "order-3 sm:col-span-20 sm:row-span-5",
    services: "order-4 sm:col-span-8 sm:row-span-4",
    phone: "order-5 sm:col-span-4 sm:row-span-4",
    dribbble: "order-6 sm:col-span-4 sm:row-span-4",
    github: "order-7 sm:col-span-4 sm:row-span-4",
    header: "order-8 sm:col-span-8 sm:row-span-6",
    mail: "order-9 sm:col-span-4 sm:row-span-3",
    tools: "order-10 sm:col-span-8 sm:row-span-6",
    location: "order-11 sm:col-span-4 sm:row-span-3"
  },
  { // 2: Screenshot 3 (Map Location) - 20 Linhas Totais (5 + 4 + 5 + 6)
    collab: "order-1 sm:col-span-12 sm:row-span-5",
    location: "order-2 sm:col-span-8 sm:row-span-5",
    mail: "order-3 sm:col-span-4 sm:row-span-4",    // Socials viram 4x4
    avatar: "order-4 sm:col-span-4 sm:row-span-4",  // 4x4 Quadrado Perfeito (1:1), menor e no meio!
    phone: "order-5 sm:col-span-4 sm:row-span-4",   // Socials viram 4x4
    github: "order-6 sm:col-span-4 sm:row-span-4",  // Socials viram 4x4
    dribbble: "order-7 sm:col-span-4 sm:row-span-4",// Socials viram 4x4
    tools: "order-8 sm:col-span-8 sm:row-span-5",
    header: "order-9 sm:col-span-12 sm:row-span-5",
    services: "order-10 sm:col-span-8 sm:row-span-6",
    projects: "order-11 sm:col-span-12 sm:row-span-6"
  }
];

// Largura da gaveta, em px. Ela vive FORA do grid, então esse número não
// precisa fechar conta com as 20 colunas.
const DRAWER_W = 525;

// Fallback do respiro entre a gaveta e os cards, só até o gap real do grid ser
// medido. Nada de número chutado aqui: o valor que vale é lido do
// `getComputedStyle` do grid, para a gaveta respeitar o mesmo ritmo de
// espaçamento do resto do layout mesmo se o `sm:gap-4` mudar um dia.
//
// (O respiro vai em `style` inline, e não como classe `ml-*`, porque o
// `* { margin: 0 }` do index.css está fora de @layer — e CSS sem layer ganha
// das utilities do Tailwind v4. Classe de margin aqui seria ignorada.)
const DRAWER_GAP_FALLBACK = 16;

// ═══════════════════════════════════════════════════════════════
// CARDS QUE ABREM GAVETA
// ───────────────────────────────────────────────────────────────
// Para cada card e cada preset, de que lado(s) do grid a gaveta
// nasce — sempre o lado que o card ENCOSTA. A forma é consequência,
// não escolha: ela cai do cruzamento de "que lados" com "onde o
// card está na vertical".
//
//   1 lado + card no topo   →  L            1 lado + card no meio  →  T
//   1 lado + card embaixo   →  L invertido  2 lados + card no meio →  H
//
// Ou seja: não existe código de "desenhar um H". Existe o contorno
// da união, e o H aparece sozinho quando há gaveta dos dois lados.
// ═══════════════════════════════════════════════════════════════
const EXPANDABLE = {
  avatar: {
    label: "Sobre mim",
    // 0: em cima à direita → L      1: em cima à esquerda → L espelhado
    // 2: no MEIO da fileira de socials, sem encostar em borda nenhuma:
    //    troca de lugar com o card de e-mail para alcançar a esquerda → T
    0: { sides: ["right"] },
    1: { sides: ["left"] },
    2: { sides: ["left"], swapWith: "mail" }
  },
  projects: {
    label: "Ver tudo",
    // 0: cols 1-12, linhas 9-14 → encosta só na ESQUERDA, no meio      → T
    // 1: cols 1-20, linhas 6-10 → encosta nas DUAS bordas, no meio     → H
    // 2: cols 9-20, linhas 15-20 → encosta na DIREITA, no rodapé       → L invertido
    0: { sides: ["left"] },
    1: { sides: ["left", "right"] },
    2: { sides: ["right"] }
  }
};

const EXPANDABLE_CARDS = Object.keys(EXPANDABLE);

// ═══════════════════════════════════════════════════════════════
// A FORMA RECORTADA — um único <path> SVG por card
// ───────────────────────────────────────────────────────────────
// Em vez de duas divs emendadas com um pseudo-elemento tapando o
// buraco, desenhamos o contorno da UNIÃO card+gavetas como um
// caminho só. Vantagens:
//   • não existe emenda para esconder — é literalmente uma peça;
//   • os degraus ganham canto CÔNCAVO arredondado, coisa que
//     border-radius não sabe fazer;
//   • a borda é um stroke contínuo, sem risco de linha dupla;
//   • dá pra esticar a forma continuamente (é só remedir o path).
//
// São duas etapas independentes, e é isso que deixa geral:
//   1. shapeOutline  → os vértices da união, em polígono retilíneo
//   2. roundedPolygon→ arredonda cada canto conforme ele seja
//                      convexo (raio grande) ou côncavo (raio menor)
//
// Nenhuma das duas sabe o que é "L", "T" ou "H". As formas caem
// de onde as peças estão.
// ═══════════════════════════════════════════════════════════════

// Vértices da união, em sentido HORÁRIO.
//   h = o card (cabeça)      bl / br = gavetas esquerda / direita
// As gavetas são colunas de altura total; qualquer uma pode ser null.
// Os pontos atravessam o gap de propósito: é ele que some na forma.
function shapeOutline(h, bl, br) {
  const P = (x, y) => ({ x, y });
  const hx1 = h.x, hx2 = h.x + h.w, hy1 = h.y, hy2 = h.y + h.h;

  if (bl && br) {
    const l1 = bl.x, l2 = bl.x + bl.w, lt = bl.y, lb = bl.y + bl.h;
    const r1 = br.x, r2 = br.x + br.w, rt = br.y, rb = br.y + br.h;
    return [
      P(l1, lt), P(l2, lt), P(l2, hy1),   // gaveta esq: topo → desce até a barra
      P(r1, hy1), P(r1, rt),              // barra: atravessa → sobe na gaveta dir
      P(r2, rt), P(r2, rb), P(r1, rb),    // gaveta dir: contorno externo
      P(r1, hy2), P(l2, hy2),             // barra de volta
      P(l2, lb), P(l1, lb)                // gaveta esq: base
    ];
  }
  if (br) {
    const b1 = br.x, b2 = br.x + br.w, bt = br.y, bb = br.y + br.h;
    return [
      P(hx1, hy1), P(b1, hy1), P(b1, bt),
      P(b2, bt), P(b2, bb), P(b1, bb),
      P(b1, hy2), P(hx1, hy2)
    ];
  }
  if (bl) {
    const b1 = bl.x, b2 = bl.x + bl.w, bt = bl.y, bb = bl.y + bl.h;
    return [
      P(b1, bt), P(b2, bt), P(b2, hy1),
      P(hx2, hy1), P(hx2, hy2), P(b2, hy2),
      P(b2, bb), P(b1, bb)
    ];
  }
  return [P(hx1, hy1), P(hx2, hy1), P(hx2, hy2), P(hx1, hy2)];
}

// Arredonda os cantos de um polígono retilíneo horário.
//   R = raio dos cantos CONVEXOS (as quinas de fora do card)
//   r = raio dos cantos CÔNCAVOS (os degraus)
//
// Dois filtros fazem o trabalho pesado de graça: vértices repetidos
// e vértices colineares são descartados. É por isso que o mesmo
// código serve para L, T, L invertido e H — quando a gaveta encosta
// rente no topo (ou no rodapé) daquele degrau simplesmente não sobra
// vértice, e a aresta corre reta.
function roundedPolygon(pts, R, r) {
  const n = pts.length;
  const corners = [];

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const v1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
    if (l1 < 0.01 || l2 < 0.01) continue;              // vértice repetido

    const cross = v1.x * v2.y - v1.y * v2.x;
    if (Math.abs(cross) < 0.01) continue;              // colinear: não é canto

    // Horário na tela (y para baixo): cross > 0 é convexo.
    const convex = cross > 0;
    const rad = Math.min(convex ? R : r, l1 / 2, l2 / 2);

    corners.push({
      inX: p1.x - (v1.x / l1) * rad, inY: p1.y - (v1.y / l1) * rad,
      outX: p1.x + (v2.x / l2) * rad, outY: p1.y + (v2.y / l2) * rad,
      rad, sweep: convex ? 1 : 0
    });
  }

  if (corners.length < 3) return "";

  let d = `M ${corners[0].inX} ${corners[0].inY}`;
  for (let i = 0; i < corners.length; i++) {
    const c = corners[i], next = corners[(i + 1) % corners.length];
    d += c.rad > 0.01
      ? ` A ${c.rad} ${c.rad} 0 0 ${c.sweep} ${c.outX} ${c.outY}`
      : ` L ${c.outX} ${c.outY}`;
    d += ` L ${next.inX} ${next.inY}`;
  }
  return d + " Z";
}

// Retângulo-alvo de uma gaveta, em coordenadas do grid.
//
// Os clamps não são detalhe. Durante o voo entre presets o card passa
// POR CIMA de onde a gaveta nasce; sem travar, o corpo começaria
// DENTRO da cabeça e os degraus sairiam invertidos. Prendendo o corpo
// na borda da cabeça, a forma só abre conforme ela libera espaço — e o
// "estica" sai de graça disso.
function drawerTarget(h, raw, g, side) {
  const toLeft = side === "left";
  const hNear = toLeft ? h.x : h.x + h.w;           // borda da cabeça virada à gaveta

  if (!raw) return { x: hNear, y: h.y, w: 0, h: h.h };   // colapsada rente à cabeça

  const rx1 = raw.x - g.x, rx2 = rx1 + raw.width;
  const near = toLeft ? Math.min(rx2, hNear) : Math.max(rx1, hNear);
  const far = toLeft ? Math.min(rx1, near) : Math.max(rx2, near);

  // A gaveta é coluna de altura total: nunca pode ser mais curta que a
  // cabeça, senão a união deixa de ter degrau.
  const top = Math.min(raw.y - g.y, h.y);
  const bottom = Math.max(raw.y - g.y + raw.height, h.y + h.h);

  return { x: Math.min(near, far), y: top, w: Math.abs(far - near), h: bottom - top };
}

const lerpBox = (a, b, k) => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  w: a.w + (b.w - a.w) * k,
  h: a.h + (b.h - a.h) * k
});

export default function BentoGrid() {
  const [activeModal, setActiveModal] = useState(null);
  const [layoutIndex, setLayoutIndex] = useState(0);

  // Qual card está expandido (null | "avatar" | "projects"). Um de cada vez:
  // duas gavetas abertas se sobreporiam na lateral.
  const [openCard, setOpenCard] = useState(null);
  const [draggedSides, setDraggedSides] = useState(new Set());
  const [activeDrawerProject, setActiveDrawerProject] = useState({ left: null, right: null });
  const handleProjectDrop = (side, projectName) => {
    // Adiciona o lado se não estiver aberto
    setDraggedSides(prev => {
      const next = new Set(prev);
      next.add(side);
      return next;
    });

    // Define qual projeto está ativo nesta gaveta
    setActiveDrawerProject(prev => ({ ...prev, [side]: projectName }));

    if (openCard !== "projects") {
      setOpenCard("projects");
    }
  };

  useEffect(() => {
    if (openCard !== "projects") {
      setDraggedSides(new Set());
    }
  }, [openCard]);

  const mouseDownInside = useRef(false);

  useEffect(() => {
    const handleGlobalMouseDown = (e) => {
      mouseDownInside.current = !!(e.target.closest('.card-interactable') || e.target.closest('.music-controls') || e.target.closest('.modal-content'));
    };
    window.addEventListener('mousedown', handleGlobalMouseDown);
    return () => window.removeEventListener('mousedown', handleGlobalMouseDown);
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (e.target.closest('.card-interactable') || e.target.closest('.music-controls') || activeModal) return;

      // Se o clique começou dentro de um card iterativo (como arrastar o 360) 
      // mas terminou fora, não fechamos o card.
      if (mouseDownInside.current) return;

      // Com uma gaveta aberta, o primeiro clique fora apenas fecha ela.
      // Só depois os cliques voltam a girar a roda de layouts.
      if (openCard) { setOpenCard(null); return; }
      setLayoutIndex((prev) => (prev + 1) % LAYOUT_PRESETS.length);
    };

    setTimeout(() => window.addEventListener('click', handleGlobalClick), 100);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeModal, openCard]);

  // Trocar de preset fecha a gaveta.
  useEffect(() => { setOpenCard(null); }, [layoutIndex]);

  // Esc fecha a gaveta.
  useEffect(() => {
    if (!openCard) return;
    const onKey = (e) => e.key === "Escape" && setOpenCard(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCard]);

  // Limpa os lados arrastados ao fechar a gaveta
  useEffect(() => {
    if (!openCard) {
      setDraggedSides(new Set());
      setActiveDrawerProject({ left: null, right: null });
    }
  }, [openCard]);

  const cfg = openCard ? EXPANDABLE[openCard][layoutIndex] : null;
  const allowedSides = cfg ? cfg.sides : [];

  let openSides = allowedSides;
  if (openCard === "projects" && draggedSides.size > 0) {
    const active = Array.from(draggedSides).filter(s => allowedSides.includes(s));
    if (active.length > 0) openSides = active;
  }

  // O GRID NÃO MUDA de proporções ao abrir uma gaveta — ela nasce FORA dele, e
  // por isso nenhum card é espremido.
  //
  // A ÚNICA exceção é o personagem no preset 2: lá ele fica no MEIO da fileira
  // de socials, sem encostar em borda nenhuma. Aí troca de lugar com o card de
  // e-mail para alcançar a borda esquerda — é só trocar as duas strings, porque
  // o que muda entre elas é o `order`. O Framer anima a troca sozinho.
  const p = React.useMemo(() => {
    const base = LAYOUT_PRESETS[layoutIndex];
    if (!cfg || !cfg.swapWith) return base;
    const other = cfg.swapWith;
    return { ...base, [openCard]: base[other], [other]: base[openCard] };
  }, [layoutIndex, openCard, cfg]);

  // `layout="position"` fica SEMPRE nas cabeças: é o que impede o card de
  // esticar e perder a proporção durante o voo entre presets. O hover só é
  // travado com a gaveta aberta, porque escalar só a cabeça deformaria a forma.
  const headMotion = (card) => ({
    layout: "position",
    ...(openCard === card ? { whileHover: { scale: 1 } } : {})
  });

  // ─────────────────────────────────────────────────────────────
  // O DESENHO DAS FORMAS
  // Um loop de rAF remede os cards a cada frame e reescreve o `d` de
  // cada path. Como ele lê a posição REAL (já com o transform que o
  // Framer aplica), a forma fica colada nos cards em qualquer
  // situação: durante o voo, no hover, no resize. E as gavetas são
  // interpoladas à parte, então ESTICAM para fora da cabeça em vez de
  // aparecer prontas do nada.
  //
  // Repare que o loop não consulta o EXPANDABLE: ele só olha quais
  // elementos de gaveta existem no DOM. Quem decide a forma é o React,
  // montando ou não cada lado.
  // ─────────────────────────────────────────────────────────────
  const gridRef = useRef(null);
  const shapes = useRef({});

  // Registra head / left / right / path de cada card expansível.
  const bind = (card, slot) => (el) => {
    (shapes.current[card] = shapes.current[card] || {})[slot] = el;
  };

  // O respiro da gaveta é o PRÓPRIO gap do grid, lido do computed style em vez
  // de repetido como número. A gaveta encosta na borda do grid, então ela tem
  // que entrar no mesmo ritmo de espaçamento dos cards — se o `sm:gap-4` mudar,
  // ela acompanha sozinha. (O gap também muda de 12px para 16px no breakpoint
  // `sm`, e por isso a leitura roda de novo no resize.)
  const [drawerGap, setDrawerGap] = useState(DRAWER_GAP_FALLBACK);
  useEffect(() => {
    const read = () => {
      if (!gridRef.current) return;
      const g = parseFloat(getComputedStyle(gridRef.current).columnGap);
      if (!Number.isNaN(g)) setDrawerGap(g);
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  useEffect(() => {
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const grid = gridRef.current;
      if (!grid) return;
      const g = grid.getBoundingClientRect();

      for (const card of EXPANDABLE_CARDS) {
        const s = shapes.current[card];
        if (!s || !s.head || !s.path) continue;

        const hr = s.head.getBoundingClientRect();
        const h = { x: hr.x - g.x, y: hr.y - g.y, w: hr.width, h: hr.height };

        const box = {};
        for (const side of ["left", "right"]) {
          const el = s[side];
          const target = drawerTarget(h, el ? el.getBoundingClientRect() : null, g, side);
          const key = side === "left" ? "boxL" : "boxR";
          s[key] = lerpBox(s[key] || target, target, 0.16);   // 0.16 = velocidade do estica
          box[side] = s[key].w >= 2 ? s[key] : null;          // fina demais: nem conta
        }

        s.path.setAttribute("d", roundedPolygon(shapeOutline(h, box.left, box.right), 16, 32));
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // As gavetas crescem para fora do container. Agora que o scroll horizontal
  // foi liberado na página (overflowX: auto), o grid NÃO precisa mais se
  // mover (shift) para evitar cortes. O usuário pediu para que a posição fique
  // 100% FIXA e não vá mais "para os lados".

  // Uma gaveta: casca transparente ancorada FORA do grid. Quem a desenha é o
  // path; ela só segura conteúdo e diz ao path onde está.
  //
  // ATENÇÃO à lista de classes: ela NÃO reaproveita a do cardMotion. Aquela
  // começa com `relative`, e `relative` + `absolute` juntas não se resolvem
  // pela ordem no atributo — vale a ordem no CSS gerado, onde o `relative` vem
  // depois e ganha. A gaveta voltaria a ser item do grid e detonaria o
  // auto-placement.
  const renderDrawer = (card, side, content, innerClassName) => (
    <motion.div
      key={`${card}-${side}`}
      ref={bind(card, side)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.14, delay: 0 } }}
      transition={{ duration: 0.35, delay: 0.28 }}   // espera a forma chegar
      style={{
        [side === "left" ? "right" : "left"]: `calc(100% + ${drawerGap}px)`,
        width: DRAWER_W
      }}
      className="absolute top-0 bottom-0 cursor-default card-interactable lshape-shell"
    >
      <div className={`absolute inset-0 ${innerClassName || 'flex flex-col justify-between gap-4 p-6 sm:p-8'}`}>
        {content}
      </div>
    </motion.div>
  );

  const scrollDrawers = (dir) => {
    ["left", "right"].forEach(side => {
      const el = document.getElementById(`drawer-projects-${side}`);
      if (el) {
        const firstChild = el.children[0];
        const cardHeight = firstChild ? firstChild.offsetHeight + 24 : 500;
        el.scrollBy({ top: dir * cardHeight, behavior: 'smooth' });
      }
    });
  };

  // Chip de affordance. Fica no canto oposto à gaveta para não ser engolido
  // pela emenda, and a seta aponta para onde ela abre.
  const renderChip = (card) => {
    const sides = EXPANDABLE[card][layoutIndex].sides;
    const open = openCard === card;
    const toLeft = sides.length === 1 && sides[0] === "left";
    return (
      <div
        className={`absolute bottom-3 z-30 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-sm pointer-events-none ${toLeft ? "right-3" : "left-3"
          }`}
      >
        <ChevronRight
          className={`w-3.5 h-3.5 text-white/70 transition-transform duration-500 ${open !== toLeft ? "rotate-180" : ""
            }`}
        />
        <span className="text-[10px] font-medium tracking-wide text-white/70">
          {open ? "Fechar" : EXPANDABLE[card].label}
        </span>
      </div>
    );
  };

  const cardMotion = {
    layout: true,
    whileHover: { scale: 1.02 }, // Substitui o CSS hover para não bugar o framer motion!
    transition: {
      type: "spring",
      bounce: 0.35,      // Elasticidade (0 a 1) - dá o efeito chiclete sem ser exagerado
      duration: 1.2      // 1.2 Segundos de duração! Força a ser muito mais lento e majestoso
    },
    className: "relative overflow-hidden shadow-xl border border-white/5 bg-[#141414] rounded-2xl card-interactable flex items-center justify-center group cursor-pointer"
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center text-white font-sans">
      <div
        className={`max-w-[825px] mx-auto w-full py-6 sm:py-8 px-4 sm:px-6 transition-all duration-500 ease-out ${activeModal ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100 pointer-events-auto"
          }`}
      >
        <p className="text-center text-white/30 text-sm mb-6 pointer-events-none">
          Clique fora dos cards para alterar os formatos do Grid!
        </p>

        {/* GRID 20 COLUNAS com AUTO-FLOW DENSE */}
        <div
          ref={gridRef}
          className="relative grid gap-3 sm:gap-[12px] grid-flow-row-dense grid-cols-1 sm:grid-cols-[repeat(20,minmax(0,1fr))] auto-rows-auto sm:auto-rows-[27px]"
        >

          {/* A FORMA EM "L" — desenhada como UMA peça só.
              É absoluta, então não ocupa célula do grid. Vem primeiro no DOM
              para ficar atrás dos cards (o avatar e a gaveta são só cascas
              transparentes por cima dela). */}
          <svg
            className="lshape-svg absolute inset-0 w-full h-full overflow-visible pointer-events-none"
            aria-hidden="true"
          >
            {EXPANDABLE_CARDS.map((card) => (
              <path key={card} ref={bind(card, "path")}
                fill="#141414" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            ))}
          </svg>

          {/* HEADER */}
          <motion.div {...cardMotion} className={`${cardMotion.className} ${p.header} !items-start !justify-center p-6 sm:p-10 cursor-default`}>
            <h1 className="text-2xl sm:text-[2.8rem] font-bold mb-2 tracking-tight text-white font-outfit leading-tight z-10 relative">
              Olá, sou {profileData.name}
            </h1>
            <p className="text-neutral-400 text-sm sm:text-xl font-light z-10 relative">{profileData.role}</p>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-700"></div>
          </motion.div>

          {/* AVATAR — gatilho da panorâmica 360 e CABEÇA da forma recortada. */}
          <motion.div
            ref={bind("avatar", "head")}
            {...cardMotion}
            {...headMotion("avatar")}
            onClick={() => setOpenCard((v) => (v === "avatar" ? null : "avatar"))}
            aria-expanded={openCard === "avatar"}
            className={`${cardMotion.className} ${p.avatar} lshape-shell cursor-pointer`}
          >
            {/* O clip do Canvas 3D perde o raio do lado que emenda na gaveta */}
            <div
              className={`absolute inset-0 flex items-center justify-center pointer-events-auto overflow-hidden rounded-2xl ${openCard === "avatar"
                ? (openSides.includes("left") ? "lshape-clip-l" : "lshape-clip-r")
                : ""
                }`}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[400px] h-[400px] flex items-center justify-center">
                <Personagem className="w-full h-full" />
              </div>
            </div>

            {renderChip("avatar")}
          </motion.div>

          {/* Gaveta do avatar com o Visualizador 360 */}
          <AnimatePresence>
            {openCard === "avatar" && openSides.map((side) =>
              renderDrawer("avatar", side, (
                <div className="w-full h-full min-h-[400px] flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold font-outfit text-xl">Sobre mim</span>
                    <span className="text-neutral-500 text-xs font-medium tracking-wide">Deslize para ver</span>
                  </div>
                  <div className="flex-1 w-full h-full relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0a]">
                    <DelayedMount delay={800}>
                      <PanoramaViewer />
                    </DelayedMount>
                  </div>
                </div>
              ))
            )}
          </AnimatePresence>

          {/* INDIVIDUAL SOCIALS - Inlined para não recarregar no React! */}
          <motion.a {...cardMotion} href="#" className={`${cardMotion.className} ${p.github} hover:bg-[#1a1a1a]`}>
            <Code2 className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-500 group-hover:text-white transition-colors" strokeWidth={1.5} />
          </motion.a>

          <motion.a {...cardMotion} href="#" className={`${cardMotion.className} ${p.dribbble} hover:bg-[#1a1a1a]`}>
            <PenTool className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-500 group-hover:text-white transition-colors" strokeWidth={1.5} />
          </motion.a>

          {/* LOCATION (Pode virar um mapa no Preset 2) */}
          <motion.a {...cardMotion} href="#" className={`${cardMotion.className} ${p.location} hover:bg-[#1a1a1a]`}>
            {layoutIndex === 2 ? (
              <>
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity" alt="Map" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <MapPin className="w-10 h-10 text-white mb-2" strokeWidth={1.5} />
                  <span className="text-white font-bold tracking-widest text-sm">VIRGINIA BEACH</span>
                </div>
              </>
            ) : (
              <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-500 group-hover:text-white transition-colors" strokeWidth={1.5} />
            )}
          </motion.a>

          <motion.a {...cardMotion} href="#" className={`${cardMotion.className} ${p.mail} hover:bg-[#1a1a1a]`}>
            <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-500 group-hover:text-white transition-colors" strokeWidth={1.5} />
          </motion.a>

          <motion.a {...cardMotion} href="#" className={`${cardMotion.className} ${p.phone} hover:bg-[#1a1a1a]`}>
            <Smartphone className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-500 group-hover:text-white transition-colors" strokeWidth={1.5} />
          </motion.a>

          {/* PROJECTS — segundo card expansível. Mesma mecânica do avatar:
              vira casca, o SVG desenha, e a gaveta nasce do lado que ele
              encosta. Aqui o clique ABRE A GAVETA; quem abre o modal passou a
              ser a setinha, que era o único jeito de ter as duas ações. */}
          <motion.div
            ref={bind("projects", "head")}
            {...cardMotion}
            {...headMotion("projects")}
            onClick={() => setOpenCard((v) => (v === "projects" ? null : "projects"))}
            aria-expanded={openCard === "projects"}
            className={`${cardMotion.className} ${p.projects} !items-start !justify-start p-8 sm:p-12 lshape-shell`}
          >
            {openCard === "projects" ? (
              <div className="absolute inset-0 flex items-center justify-between px-4 sm:px-12 z-10 w-full animate-fade-in" onClick={e => e.stopPropagation()}>
                <button onClick={() => scrollDrawers(-1)} className="p-3 sm:p-5 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 backdrop-blur-md border border-white/10 text-white shadow-xl">
                  <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
                <div className="flex flex-col items-center pointer-events-none select-none text-center">
                  <h2 className="text-white font-bold text-xl sm:text-3xl tracking-tight font-outfit">Projetos em Destaque</h2>
                  <span className="text-neutral-400 text-xs sm:text-sm mt-1 sm:mt-2">Deslize nas abas ou use as setas</span>
                </div>
                <button onClick={() => scrollDrawers(1)} className="p-3 sm:p-5 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 backdrop-blur-md border border-white/10 text-white shadow-xl">
                  <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between relative z-10 w-full animate-fade-in">
                <h2 className="text-neutral-500 font-medium text-sm sm:text-base group-hover:text-white transition-colors pointer-events-none">Projects</h2>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveModal('projects'); }}
                  aria-label="Abrir todos os projetos"
                  className="bg-[#1a1a1a] p-3 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center border border-white/5 cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4 text-white transition-transform hover:translate-x-1 hover:-translate-y-1" />
                </button>
              </div>
            )}

            {/* Mini-cards arrastáveis dos projetos — empilhados como um deck */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none z-20">
              <div className="absolute inset-0 pointer-events-auto">
                {profileData.projects.map((proj, i, arr) => {
                  // Stack mais espaçado e bagunçado
                  const total = arr.length;
                  const mid = (total - 1) / 2;
                  const offsetX = (i - mid) * 12 + (i % 2 === 0 ? 4 : -4);
                  const offsetY = (i - mid) * -5 + (i % 2 === 0 ? -2 : 2);
                  const rot = (i - mid) * 5 + (i % 2 === 0 ? -4 : 4);
                  return (
                    <DraggableCard
                      key={proj.name}
                      title={proj.name}
                      tag={proj.tag}
                      year={proj.year}
                      initialX={offsetX}
                      initialY={offsetY}
                      rotation={rot}
                      stackIndex={i}
                      totalCards={total}
                      allowedSides={EXPANDABLE["projects"][layoutIndex]?.sides || []}
                      onDrop={(side) => handleProjectDrop(side, proj.name)}
                      onClick={(simulateThrow) => {
                        const allowed = EXPANDABLE["projects"][layoutIndex]?.sides || [];
                        // Se houver mais de um lado permitido, alterna entre eles usando o index
                        const sideToOpen = allowed.length > 1 ? allowed[i % allowed.length] : (allowed[0] || "left");

                        // Executa a animação física de "jogar" o card para o lado certo
                        simulateThrow(sideToOpen);

                        // Abre a gaveta e faz o scroll
                        handleProjectDrop(sideToOpen, proj.name);
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {renderChip("projects")}
          </motion.div>

          {/* Gavetas do Projects. No preset 1 são DUAS (uma de cada lado) — é
              disso que nasce o "H", sem nenhum código específico para ele. */}
          <AnimatePresence>
            {openCard === "projects" && openSides.map((side) => {
              const activeName = activeDrawerProject[side];
              const proj = profileData.projects.find(p => p.name === activeName) || profileData.projects[0];

              return renderDrawer("projects", side, (
                <div id={`drawer-projects-${side}`} className="flex flex-col items-center justify-center h-full w-full px-4 sm:px-6 py-6 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={proj.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="flex-none h-[96%] w-[95%] rounded-3xl bg-[#141414] border border-white/5 overflow-hidden flex flex-col group relative shadow-2xl"
                    >
                      {/* Placeholder para Imagem/Vídeo */}
                      <div className="flex-1 bg-[#1a1a1a] w-full relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                        <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center opacity-30 group-hover:opacity-50 transition-all group-hover:scale-105 duration-700">
                          <Code className="w-16 h-16 text-white" strokeWidth={1} />
                          <span className="text-white/60 text-sm">Thumbnail do Projeto</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="px-10 py-8 shrink-0 bg-gradient-to-t from-[#111] to-[#141414] border-t border-white/5 flex flex-col gap-3">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-semibold px-3 py-1.5 bg-white/10 text-white rounded-full tracking-wide">{proj.tag}</span>
                          <span className="text-xs font-medium text-white/40">{proj.year}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">{proj.name}</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed mt-1 line-clamp-2">
                          Descrição do projeto. Aqui entrarão os detalhes, contexto da aplicação e tecnologias utilizadas. Acima ficará o vídeo ou imagem real.
                        </p>

                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between group/btn cursor-pointer">
                          <span className="text-sm font-semibold text-white group-hover/btn:text-white/80 transition-colors">Visualizar Case</span>
                          <ArrowUpRight className="w-4 h-4 text-white/50 group-hover/btn:text-white transition-all group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              ), 'p-0'); // Tira o padding padrão do drawer para o scroll colar nas bordas
            })}
          </AnimatePresence>

          {/* SERVICES */}
          <motion.div {...cardMotion} className={`${cardMotion.className} ${p.services} !items-start !justify-start p-8 sm:p-10 cursor-default hover:scale-100`}>
            <h2 className="text-neutral-500 font-medium w-full text-left absolute top-8 left-8 text-sm sm:text-base z-10">Services</h2>
            <div className="absolute inset-0 mt-12 flex items-center justify-center">
              <div className="relative w-full h-full max-w-[250px] max-h-[200px]">
                {profileData.services.map((service, i) => (
                  <span key={i} className={`absolute ${service.style} bg-[#2a2a2a] px-4 py-2 rounded-full text-xs font-medium text-white border border-white/10 shadow-lg hover:scale-110 hover:z-20 transition-transform cursor-default whitespace-nowrap`}>
                    {service.name}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* TOOLS */}
          <motion.div {...cardMotion} className={`${cardMotion.className} ${p.tools} !items-start !justify-start p-8 sm:p-10 flex flex-col cursor-default hover:scale-100`}>
            <h2 className="text-neutral-500 font-medium text-sm sm:text-base w-full">Tools I use</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-auto w-full max-w-[200px] mx-auto absolute bottom-8 left-1/2 -translate-x-1/2">
              {profileData.tools.map((tool, i) => (
                <div key={i} className={`${tool.bgColor} rounded-2xl p-3 flex items-center justify-center aspect-square shadow-inner hover:scale-110 transition-transform cursor-pointer border border-white/5`}>
                  <span className={`${tool.color} font-bold text-xl sm:text-2xl`}>{tool.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* COLLAB */}
          <motion.div {...cardMotion} className={`${cardMotion.className} ${p.collab} !items-start !justify-start p-8 sm:p-10 flex flex-col cursor-default hover:scale-100`}>
            <div>
              <h2 className="text-2xl sm:text-4xl font-bold mb-3 text-white font-outfit">Let's collab!</h2>
              <p className="text-neutral-400 text-sm sm:text-base sm:pr-12 leading-relaxed line-clamp-2">Let's turn your idea into reality with my design experience!</p>
            </div>
            <button
              onClick={() => setActiveModal('message')}
              className="w-full sm:w-fit px-8 absolute bottom-8 left-6 sm:left-8 py-3.5 bg-[#1a1a1a] hover:bg-[#222] rounded-2xl text-sm font-semibold transition-colors duration-300 border border-white/10 text-white cursor-pointer shadow-lg z-10"
            >
              Contact me
            </button>
          </motion.div>
        </div>
      </div>

      {activeModal === 'projects' && (
        <div className="fixed inset-0 z-50 flex flex-col w-full h-full bg-[#111111]/90 backdrop-blur-xl animate-fade-in p-4 sm:p-8 pointer-events-auto">
          <div className="max-w-[900px] mx-auto w-full flex-1 flex flex-col overflow-hidden bg-[#141414] border border-white/5 shadow-2xl rounded-[2.5rem]">
            <div className="flex items-center justify-between p-6 sm:p-8 shrink-0">
              <h2 className="text-neutral-400 font-medium text-lg">Recent Works</h2>
              <button onClick={() => setActiveModal(null)} className="bg-[#1a1a1a] hover:bg-white/10 p-4 rounded-full transition-colors cursor-pointer border border-white/5">
                <ArrowDownLeft className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-8 no-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-[250px]">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`bg-[#1a1a1a] rounded-3xl border border-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors group ${i === 2 ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
                  <Code className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors mb-2" />
                  <span className="text-white/50 text-sm font-medium">Projeto {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'message' && (
        <div className="fixed inset-0 z-50 flex flex-col w-full h-full bg-[#111111]/90 backdrop-blur-xl animate-fade-in p-4 sm:p-8 pointer-events-auto">
          <div className="max-w-[700px] mx-auto w-full flex-1 flex flex-col overflow-hidden bg-[#141414] border border-white/5 shadow-2xl rounded-[2.5rem]">
            <div className="p-6 border-b border-white/5 shrink-0 flex items-center justify-between bg-[#181818]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#2a2a2a] overflow-hidden border border-white/10 relative flex items-center justify-center">
                  <span className="text-lg">👨‍💻</span>
                </div>
                <div>
                  <h2 className="text-white font-medium text-base flex items-center gap-1">{profileData.name} <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/20" /></h2>
                  <span className="text-green-500 text-xs flex items-center gap-1.5 mt-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Online agora</span>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="bg-[#1a1a1a] hover:bg-white/10 p-3.5 rounded-full transition-colors cursor-pointer border border-white/5">
                <ArrowDownLeft className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center opacity-50">
              <MessageSquareDashed className="w-16 h-16 text-neutral-600 mb-4" />
              <p className="text-neutral-500 text-sm">Nenhuma mensagem ainda.</p>
              <p className="text-neutral-600 text-xs mt-1 text-center">Inicie uma conversa direta.</p>
            </div>

            <div className="p-6 shrink-0 border-t border-white/5 bg-[#181818]">
              <div className="bg-[#141414] rounded-full p-2 flex items-center gap-3 border border-white/10">
                <button className="p-2.5 rounded-full bg-[#1a1a1a] hover:bg-white/10 cursor-pointer transition-colors"><Plus className="w-5 h-5 text-neutral-400" /></button>
                <input type="text" placeholder="Escreva uma mensagem..." className="bg-transparent border-none outline-none text-sm text-white flex-1 px-2" disabled />
                <button className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 cursor-pointer transition-colors shadow-lg shadow-blue-600/20"><Send className="w-5 h-5 text-white ml-0.5 mt-0.5" /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
