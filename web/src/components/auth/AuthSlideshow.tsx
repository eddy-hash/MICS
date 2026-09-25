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
}

export function AuthSlideshow({
  slides,
  intervalMs = 7000,
  className,
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
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {/* Blurred backdrop — fills the frame */}
          <div className="absolute inset-0">
            <Image
              src={slides[index].src}
              alt=""
              fill
              priority={index === 0}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="scale-110 object-cover blur-3xl opacity-70"
              aria-hidden
            />
          </div>

          {/* Sharp image — centered, constrained, no zoom */}
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10"
            >
              <Image
                src={slides[index].src}
                alt={slides[index].alt}
                width={640}
                height={800}
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 480px"
                className="h-auto w-full object-cover"
              />
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-900/40 via-transparent to-cyan-900/30" />

      {/* Caption */}
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

      {/* Dots */}
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
    </div>
  );
}
