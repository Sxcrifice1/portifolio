import { useRef, useEffect } from 'react';
import './DraggableTag.css';

export function DraggableTag({ text, initialX = 0, initialY = 0 }) {
  const tagRef = useRef(null);
  const isDragging = useRef(false);
  
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: initialX, y: initialY });

  useEffect(() => {
    if (tagRef.current) {
      tagRef.current.style.transform = `translate(${initialX}px, ${initialY}px)`;
    }
  }, [initialX, initialY]);

  const handlePointerDown = (e) => {
    e.stopPropagation(); // Impede que o clique propague para o grid
    isDragging.current = true;
    startPos.current = {
      x: e.clientX - currentPos.current.x,
      y: e.clientY - currentPos.current.y,
    };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;

    const tag = tagRef.current;
    const parent = tag.parentElement;

    let newX = e.clientX - startPos.current.x;
    let newY = e.clientY - startPos.current.y;

    const maxX = parent.clientWidth - tag.clientWidth;
    const maxY = parent.clientHeight - tag.clientHeight;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    currentPos.current = { x: newX, y: newY };
    tag.style.transform = `translate(${newX}px, ${newY}px)`;
  };

  const handlePointerUp = (e) => {
    isDragging.current = false;
    e.target.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={tagRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={(e) => e.stopPropagation()}
      className="draggable-tag card-interactable"
    >
      {text}
    </div>
  );
}

// Z-index global: 
let grabZ = 50000;
let lowestZ = 10000;

// Threshold mínimo (em px) para considerar que houve arraste
const MOVE_THRESHOLD = 5;

// Mini-card arrastável — DECK INFINITO
export function DraggableCard({ 
  title, 
  tag, 
  year, 
  imageUrl, 
  initialX = 0, 
  initialY = 0, 
  rotation = 0, 
  stackIndex = 0, 
  totalCards = 1,
  allowedSides = ["left", "right"],
  onDrop,
  onClick
}) {
  const cardRef = useRef(null);
  const isDragging = useRef(false);
  const isGone = useRef(false);
  const hasMoved = useRef(false);
  const inertiaRaf = useRef(null);
  const respawnTimer = useRef(null);
  const snapbackTimer = useRef(null);
  const capturedPointerId = useRef(null);
  const downCoords = useRef({ x: 0, y: 0 });
  
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: initialX, y: initialY });
  const currentRotation = useRef(rotation);

  const pointerHistory = useRef([]);
  const velocity = useRef({ x: 0, y: 0 });

  // baseZ alto para que os lowestZ possam diminuir muito sem chegar a valores negativos
  const baseZ = 20000 + stackIndex;

  useEffect(() => {
    if (cardRef.current && !isGone.current) {
      cardRef.current.style.transform = `translate(${initialX}px, ${initialY}px) rotate(${rotation}deg)`;
      cardRef.current.style.zIndex = String(baseZ);
    }
    return () => {
      if (inertiaRaf.current) cancelAnimationFrame(inertiaRaf.current);
      if (respawnTimer.current) clearTimeout(respawnTimer.current);
      if (snapbackTimer.current) clearTimeout(snapbackTimer.current);
    };
  }, [initialX, initialY, rotation, baseZ]);

  // ── Respawn: volta o card ao centro, embaixo da pilha ──
  const respawn = () => {
    const card = cardRef.current;
    if (!card) return;

    // Reset total de estado
    isGone.current = false;
    isDragging.current = false;
    hasMoved.current = false;
    currentPos.current = { x: initialX, y: initialY };
    currentRotation.current = rotation;

    // A cada respawn, o card recebe um z-index menor que todos os outros
    lowestZ--;
    
    card.style.transition = 'none';
    card.style.visibility = 'visible';
    card.style.opacity = '0';
    card.style.pointerEvents = 'auto';
    card.style.zIndex = String(lowestZ);
    card.style.transform = `translate(${initialX}px, ${initialY}px) rotate(${rotation}deg) scale(0.9)`;

    card.offsetHeight; // force reflow

    requestAnimationFrame(() => {
      if (!card) return;
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      card.style.opacity = '1';
      card.style.transform = `translate(${initialX}px, ${initialY}px) rotate(${rotation}deg) scale(1)`;
      setTimeout(() => {
        if (card) card.style.transition = '';
      }, 450);
    });
  };

  // ── Pointer Down ──
  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (isGone.current) return;

    // Cancela animações/timers pendentes
    if (inertiaRaf.current) { cancelAnimationFrame(inertiaRaf.current); inertiaRaf.current = null; }
    if (snapbackTimer.current) { clearTimeout(snapbackTimer.current); snapbackTimer.current = null; }

    isDragging.current = true;
    hasMoved.current = false;
    downCoords.current = { x: e.clientX, y: e.clientY };
    pointerHistory.current = [{ x: e.clientX, y: e.clientY, t: performance.now() }];

    startPos.current = {
      x: e.clientX - currentPos.current.x,
      y: e.clientY - currentPos.current.y,
    };

    // Card agarrado vai pro topo
    grabZ++;
    const card = cardRef.current;
    card.style.zIndex = String(grabZ);
    card.style.opacity = '1';
    card.style.transition = '';
    currentRotation.current = rotation * 0.3;
    card.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px) rotate(${currentRotation.current}deg) scale(1.08)`;
    // NÃO faz setPointerCapture aqui — será feito no move se arrastar de verdade
  };

  // ── Pointer Move ──
  const handlePointerMove = (e) => {
    if (!isDragging.current) return;

    // Só conta como arraste se moveu >= MOVE_THRESHOLD pixels
    if (!hasMoved.current) {
      const dx = e.clientX - downCoords.current.x;
      const dy = e.clientY - downCoords.current.y;
      if (Math.hypot(dx, dy) < MOVE_THRESHOLD) return; // Ignora micro-movimentos
      
      hasMoved.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
        capturedPointerId.current = e.pointerId;
      } catch (_) { /* ok */ }
    }

    const card = cardRef.current;
    const newX = e.clientX - startPos.current.x;
    const newY = e.clientY - startPos.current.y;

    currentPos.current = { x: newX, y: newY };
    card.style.transform = `translate(${newX}px, ${newY}px) rotate(${currentRotation.current}deg) scale(1.08)`;

    const now = performance.now();
    pointerHistory.current.push({ x: e.clientX, y: e.clientY, t: now });
    pointerHistory.current = pointerHistory.current.filter(p => now - p.t < 80);
  };

  // ── Pointer Up ──
  const handlePointerUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    // Libera pointer capture se ativo
    if (capturedPointerId.current !== null) {
      try { e.currentTarget.releasePointerCapture(capturedPointerId.current); } catch (_) { /* ok */ }
      capturedPointerId.current = null;
    }

    // Click puro (sem arraste) → deixa o onClick handler cuidar
    if (!hasMoved.current) {
      pointerHistory.current = [];
      return;
    }

    // Calcula velocidade do arraste
    const history = pointerHistory.current;
    const now = performance.now();
    if (history.length >= 2) {
      const oldest = history[0];
      const dt = (now - oldest.t) / 1000;
      if (dt > 0.005) {
        velocity.current = {
          x: (e.clientX - oldest.x) / dt,
          y: (e.clientY - oldest.y) / dt,
        };
      } else {
        velocity.current = { x: 0, y: 0 };
      }
    } else {
      velocity.current = { x: 0, y: 0 };
    }
    pointerHistory.current = [];

    const speed = Math.hypot(velocity.current.x, velocity.current.y);
    const isThrowLeft = velocity.current.x < -20;
    const isThrowRight = velocity.current.x > 20;

    let canThrow = speed > 120;
    if (canThrow) {
      if (isThrowLeft && !allowedSides.includes("left")) canThrow = false;
      if (isThrowRight && !allowedSides.includes("right")) canThrow = false;
    }

    if (canThrow) {
      startInertia();
    } else {
      // Volta pro repouso no centro do deck
      currentPos.current = { x: initialX, y: initialY };
      currentRotation.current = rotation;
      const card = cardRef.current;
      card.style.transition = 'transform 0.35s ease-out';
      card.style.transform = `translate(${initialX}px, ${initialY}px) rotate(${rotation}deg) scale(1)`;
      snapbackTimer.current = setTimeout(() => {
        if (card) card.style.transition = '';
        snapbackTimer.current = null;
      }, 350);
    }
  };

  // ── Inércia: card desliza após soltar ──
  const startInertia = () => {
    const FRICTION = 0.93;
    const THROW_ROTATION_MULT = 0.02;

    let vx = velocity.current.x * 0.02;
    let vy = velocity.current.y * 0.02;
    let firedDrop = false;

    const tick = () => {
      const card = cardRef.current;
      if (!card) return;
      const parent = card.parentElement;
      if (!parent) return;

      vx *= FRICTION;
      vy *= FRICTION;

      currentPos.current.x += vx;
      currentPos.current.y += vy;

      const throwRot = vx * THROW_ROTATION_MULT;
      currentRotation.current += throwRot;
      
      const halfParent = parent.clientWidth / 2;
      const rect = card.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      const localX = rect.left - parentRect.left;
      const w = rect.width;

      let opacity = 1;
      const cardCenter = localX + w / 2;
      const distFromCenter = Math.abs(cardCenter - halfParent);
      const fadeStart = halfParent * 0.5;
      if (distFromCenter > fadeStart) {
        opacity = Math.max(0, 1 - (distFromCenter - fadeStart) / (halfParent * 0.6));
      }

      card.style.opacity = String(opacity);
      card.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px) rotate(${throwRot * 3}deg) scale(${0.9 + opacity * 0.1})`;

      // Saiu completamente
      if (!firedDrop && opacity <= 0.02) {
        firedDrop = true;
        isGone.current = true;
        card.style.visibility = 'hidden';
        card.style.pointerEvents = 'none';
        card.style.zIndex = '0';

        if (onDrop) {
          if (localX < halfParent) onDrop("left");
          else onDrop("right");
        }

        respawnTimer.current = setTimeout(respawn, 500);
        return;
      }

      if (Math.hypot(vx, vy) > 0.3 && !isGone.current) {
        inertiaRaf.current = requestAnimationFrame(tick);
      } else if (!isGone.current) {
        // Parou sem sair: volta ao repouso
        currentPos.current = { x: initialX, y: initialY };
        currentRotation.current = rotation;
        card.style.opacity = '1';
        card.style.transition = 'transform 0.35s ease-out';
        card.style.transform = `translate(${initialX}px, ${initialY}px) rotate(${rotation}deg) scale(1)`;
        setTimeout(() => {
          if (card) card.style.transition = '';
        }, 350);
      }
    };

    inertiaRaf.current = requestAnimationFrame(tick);
  };

  // ── Render ──
  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={(e) => {
        e.stopPropagation();
        if (isGone.current) return;

        // Cancela qualquer snap-back pendente
        if (snapbackTimer.current) {
          clearTimeout(snapbackTimer.current);
          snapbackTimer.current = null;
        }

        if (!hasMoved.current && onClick) {
          const simulateThrow = (side) => {
            if (!cardRef.current || isGone.current) return;
            isGone.current = true;
            const card = cardRef.current;
            card.style.pointerEvents = 'none';

            const throwX = side === "left" ? -400 : 400;
            const throwRot = side === "left" ? -45 : 45;
            card.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease';
            card.style.transform = `translate(${throwX}px, ${currentPos.current.y}px) rotate(${throwRot}deg) scale(0.9)`;
            card.style.opacity = '0';
            
            respawnTimer.current = setTimeout(respawn, 450);
          };
          onClick(simulateThrow);
        }
      }}
      className="draggable-card card-interactable"
      style={{ touchAction: 'none', position: 'absolute', zIndex: baseZ }}
    >
      <div className="draggable-card__image">
        {imageUrl ? (
          <img src={imageUrl} alt={title} draggable={false} />
        ) : (
          <div className="draggable-card__placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
        )}
      </div>
      <div className="draggable-card__info">
        <span className="draggable-card__tag">{tag}</span>
        <h3 className="draggable-card__title">{title}</h3>
      </div>
    </div>
  );
}
