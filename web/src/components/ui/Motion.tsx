'use client';
import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import {
  fadeIn, slideUp, slideDown, slideLeft, slideRight, scaleIn, popIn,
  stagger, staggerFast, staggerSlow, hoverLift, hoverScale, transition,
} from '@/lib/motion';

type Direction = 'up' | 'down' | 'left' | 'right';

interface FadeInProps extends HTMLMotionProps<'div'> { delay?: number; children: ReactNode; }
export function FadeIn({ delay = 0, children, ...rest }: FadeInProps) {
  return <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ ...transition.base, delay }} {...rest}>{children}</motion.div>;
}

interface SlideProps extends HTMLMotionProps<'div'> { from?: Direction; delay?: number; children: ReactNode; }
const slideVariants = { up: slideUp, down: slideDown, left: slideLeft, right: slideRight } as const;
export function Slide({ from = 'up', delay = 0, children, ...rest }: SlideProps) {
  return <motion.div initial="hidden" animate="visible" variants={slideVariants[from]} transition={{ ...transition.base, delay }} {...rest}>{children}</motion.div>;
}

interface ScaleInProps extends HTMLMotionProps<'div'> { delay?: number; pop?: boolean; children: ReactNode; }
export function ScaleIn({ delay = 0, pop = false, children, ...rest }: ScaleInProps) {
  return <motion.div initial="hidden" animate="visible" variants={pop ? popIn : scaleIn} transition={{ ...transition.base, delay }} {...rest}>{children}</motion.div>;
}

interface StaggerProps extends HTMLMotionProps<'div'> { speed?: 'fast' | 'normal' | 'slow'; children: ReactNode; }
export function Stagger({ speed = 'normal', children, ...rest }: StaggerProps) {
  const variants = speed === 'fast' ? staggerFast : speed === 'slow' ? staggerSlow : stagger;
  return <motion.div initial="hidden" animate="visible" variants={variants} {...rest}>{children}</motion.div>;
}

interface StaggerItemProps extends HTMLMotionProps<'div'> { children: ReactNode; }
export function StaggerItem({ children, ...rest }: StaggerItemProps) {
  return <motion.div variants={slideUp} {...rest}>{children}</motion.div>;
}

interface HoverProps extends HTMLMotionProps<'div'> { mode?: 'lift' | 'scale'; children: ReactNode; }
export function Hover({ mode = 'lift', children, ...rest }: HoverProps) {
  const preset = mode === 'lift' ? hoverLift : hoverScale;
  return <motion.div {...preset} {...rest}>{children}</motion.div>;
}

interface RevealProps extends HTMLMotionProps<'div'> { delay?: number; once?: boolean; children: ReactNode; }
export function Reveal({ delay = 0, once = true, children, ...rest }: RevealProps) {
  return <motion.div initial="hidden" whileInView="visible" viewport={{ once, margin: '-50px' }} variants={slideUp} transition={{ ...transition.base, delay }} {...rest}>{children}</motion.div>;
}
