'use client';

import { useState, useRef } from 'react';

const DEFAULT_MAX_DRAG = 140;

interface DraggableBulbProps {
  src: string;
  wrapperClassName: string;
  maxDrag?: number;
}

export function DraggableBulb({ src, wrapperClassName, maxDrag = DEFAULT_MAX_DRAG }: DraggableBulbProps) {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const startRef = useRef<{ clientX: number; clientY: number; offsetX: number; offsetY: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    startRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX: drag.x,
      offsetY: drag.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const start = startRef.current;
    if (!start) return;
    const dx = e.clientX - start.clientX;
    const dy = e.clientY - start.clientY;
    const x = Math.max(-maxDrag, Math.min(maxDrag, start.offsetX + dx));
    const y = Math.max(-maxDrag, Math.min(maxDrag, start.offsetY + dy));
    setDrag({ x, y });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    startRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const hasDrag = drag.x !== 0 || drag.y !== 0;

  return (
    <div
      className={`${wrapperClassName} cursor-grab active:cursor-grabbing pointer-events-auto`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        className="size-full flex items-center justify-center transition-transform duration-300 ease-out"
        style={hasDrag ? { transform: `translate(${drag.x}px, ${drag.y}px)` } : undefined}
      >
        <img
          alt=""
          className="block size-full object-contain select-none pointer-events-none"
          src={src}
          draggable={false}
        />
      </div>
    </div>
  );
}
