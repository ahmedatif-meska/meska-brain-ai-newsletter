"use client";

import { useEffect, useState } from "react";

type Particle = {
  left: number;
  dx: number;
  dy: number;
  rot: number;
  duration: number;
  delay: number;
  color: string;
  size: number;
};

const COLORS = ["#00c9fc", "#0a72f3", "#aec6ff", "#ffd166", "#ef476f"];
const COUNT = 60;

function generate(): Particle[] {
  return Array.from({ length: COUNT }, () => ({
    left: Math.random() * 100,
    dx: (Math.random() - 0.5) * 600,
    dy: 400 + Math.random() * 400,
    rot: 360 + Math.random() * 720,
    duration: 1.8 + Math.random() * 1.2,
    delay: Math.random() * 0.2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
  }));
}

export function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR/CSR Math.random() mismatch
    setParticles(generate());
    const timer = setTimeout(() => setDone(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  if (done) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="confetti-particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.6}px`,
            background: p.color,
            // @ts-expect-error CSS custom properties consumed by keyframes
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            "--rot": `${p.rot}deg`,
            "--duration": `${p.duration}s`,
            "--delay": `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
