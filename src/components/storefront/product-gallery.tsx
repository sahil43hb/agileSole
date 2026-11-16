"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const LENS = 168;
const ZOOM = 2.4;

export function ProductGallery({ images, title, activeSrc }: { images: string[]; title: string; activeSrc?: string }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(false);
  const [hover, setHover] = useState(false);
  const [lens, setLens] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const src = picked
    ? images[index] || activeSrc || ""
    : (activeSrc && images.includes(activeSrc) ? activeSrc : images[index] || activeSrc || "");

  useEffect(() => {
    setPicked(false);
    if (activeSrc && images.includes(activeSrc)) setIndex(images.indexOf(activeSrc));
  }, [activeSrc, images]);

  function show(i: number) {
    setPicked(true);
    setIndex(i);
  }

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") setIndex((i) => Math.min(images.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, images.length]);

  const move = useCallback((clientX: number, clientY: number) => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const y = Math.max(0, Math.min(1, (clientY - r.top) / r.height));
    setLens({ x: x * 100, y: y * 100 });
  }, []);

  if (!src) {
    return <div className="aspect-square w-full rounded-[1.6rem] bg-brand-mist" />;
  }

  const lensLeft = `clamp(0px, calc(${lens.x}% - ${LENS / 2}px), calc(100% - ${LENS}px))`;
  const lensTop = `clamp(0px, calc(${lens.y}% - ${LENS / 2}px), calc(100% - ${LENS}px))`;

  return (
    <div className="relative flex gap-3 lg:gap-4">
      {images.length > 1 ? (
        <div className="hidden w-[4.25rem] shrink-0 flex-col gap-2 lg:flex">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onMouseEnter={() => show(i)}
              onClick={() => show(i)}
              className={`h-[4.25rem] w-[4.25rem] overflow-hidden rounded-xl bg-brand-mist ring-2 ring-offset-2 ring-offset-paper transition ${
                (images[index] || src) === img ? "ring-ink" : "ring-transparent hover:ring-black/15"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div
          ref={boxRef}
          className="relative aspect-square cursor-crosshair overflow-hidden rounded-[1.6rem] bg-brand-mist"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onMouseMove={(e) => move(e.clientX, e.clientY)}
          onClick={() => setLightbox(true)}
          role="button"
          tabIndex={0}
          aria-label="Zoom product image"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setLightbox(true);
            }
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={title} className="h-full w-full object-cover" />
          {hover ? (
            <span
              className="pointer-events-none absolute hidden rounded-md border border-white/90 bg-white/25 shadow-sm lg:block"
              style={{ width: LENS, height: LENS, left: lensLeft, top: lensTop }}
            />
          ) : null}
          {images.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className="absolute start-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm lg:flex"
                onClick={(e) => {
                  e.stopPropagation();
                  show(index === 0 ? images.length - 1 : index - 1);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                className="absolute end-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm lg:flex"
                onClick={(e) => {
                  e.stopPropagation();
                  show(index === images.length - 1 ? 0 : index + 1);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {images.map((img, i) => (
              <button
                key={img}
                type="button"
                onClick={() => show(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-mist ring-2 ring-offset-2 ring-offset-paper ${
                  (images[index] || src) === img ? "ring-ink" : "ring-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {hover && src ? (
        <div
          className="pointer-events-none absolute start-full top-0 z-30 ms-5 hidden h-[min(32rem,100%)] w-[min(32rem,38vw)] overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_80px_rgba(17,17,17,0.18)] ring-1 ring-black/[0.08] lg:block"
          aria-hidden
        >
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url(${src})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${ZOOM * 100}%`,
              backgroundPosition: `${lens.x}% ${lens.y}%`,
            }}
          />
        </div>
      ) : null}

      {lightbox ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4" onClick={() => setLightbox(false)}>
          <button
            type="button"
            aria-label="Close"
            className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink"
            onClick={() => setLightbox(false)}
          >
            <X className="h-4 w-4" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={title} className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      ) : null}
    </div>
  );
}
