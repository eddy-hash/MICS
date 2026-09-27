'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Slide {
  src: string;
  alt: string;
  caption?: string;
}

interface AuthSlideshowProps {
  slides: Slide[];
  intervalMs?: number;
  className?: string;
  /** Show the caption text at the bottom. Default: true */
  showCaption?: boolean;
  /** Show the dots navigation. Default: true */
  showDots?: boolean;
}

/**
 * Rotating photo slideshow for auth pages.
 *
 * On pages that already have their own tagline/footer overlay (like login),
 * pass showCaption={false} and showDots={false} to avoid overlap.
 */
export function AuthSlideshow({
  slides,
  intervalMs = 7000,
  className,
  showCaption = true,
  showDots = true,
}: AuthSlideshowProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [slides.length, intervalMs]);

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-slate-950', className)}>
      {/* Blurred backdrop — fills the entire panel */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <Image
            src={slides[index].src}
            alt=""
            fill
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="scale-110 object-cover blur-3xl opacity-70"
            aria-hidden
          />
        </motion.div>
      </AnimatePresence>

      {/* Sharp image — fixed 3:4 aspect ratio card, centered */}
      <div className="absolute inset-0 flex items-center justify-center p-10">
        <div className="relative aspect-[3/4] w-full max-w-[380px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
          <AnimatePresence mode="sync">
            <motion.div
              key={`fg-${index}`}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 1.0, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <Image
                src={slides[index].src}
                alt={slides[index].alt}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 90vw, 380px"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Gradient overlays for text readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-900/40 via-transparent to-cyan-900/30" />

      {/* Caption — only if enabled */}
      {showCaption && (
        <AnimatePresence mode="wait">
          {slides[index].caption && (
            <motion.p
              key={`cap-${index}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute bottom-24 left-12 right-12 max-w-md text-sm font-medium leading-relaxed text-white/95 drop-shadow-lg"
            >
              {slides[index].caption}
            </motion.p>
          )}
        </AnimatePresence>
      )}

      {/* Dots — only if enabled */}
      {showDots && (
        <div className="absolute bottom-10 left-12 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                'h-1 rounded-full transition-all duration-500',
                i === index ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
