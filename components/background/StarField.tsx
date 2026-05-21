"use client";

import { useEffect, useRef, useState } from "react";

const STAR_COUNT = 150;

type StarSpec = {
  size: number;
  left: number;
  top: number;
  duration: number;
};

function generateStars(): StarSpec[] {
  const stars: StarSpec[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      size: Math.random() * 2 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 3 + 2,
    });
  }
  return stars;
}

export function StarField() {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [stars, setStars] = useState<StarSpec[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- generated client-side only to avoid SSR/CSR Math.random() mismatch
    setStars(generateStars());

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    function onMove(e: MouseEvent) {
      const field = fieldRef.current;
      if (!field) return;
      const x = (window.innerWidth / 2 - e.pageX) / 50;
      const y = (window.innerHeight / 2 - e.pageY) / 50;
      field.style.transform = `translate(${x}px, ${y}px)`;
    }

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={fieldRef}
      id="starfield"
      aria-hidden
      className="starfield pointer-events-none"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        background: "radial-gradient(circle at center, #0B1E3B 0%, #00111c 100%)",
      }}
    >
      {stars.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{
            width: `${s.size}px`,
            height: `${s.size}px`,
            left: `${s.left}%`,
            top: `${s.top}%`,
            // CSS custom property consumed by `.star` keyframe
            ["--duration" as string]: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
