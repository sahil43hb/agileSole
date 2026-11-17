"use client";

import {
  Children,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`home-reveal ${on ? "is-in" : ""} ${className}`}
      style={{ "--home-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function Stagger({
  children,
  className = "",
  step = 80,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
}) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) => (
        <Reveal delay={i * step} className="h-full">
          {child}
        </Reveal>
      ))}
    </div>
  );
}

export function HomeTicker({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="home-ticker" aria-hidden="true">
      <div className="home-ticker-track">
        {row.map((label, i) => (
          <span key={`${label}-${i}`} className="home-ticker-item">
            <span className="home-ticker-dot" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
