/**
 * Central motion design system — single source of truth for every animation.
 */

export const transition = {
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
  base: { duration: 0.24, ease: [0.4, 0, 0.2, 1] },
  slow: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  bouncy: { type: 'spring', stiffness: 500, damping: 25 },
} as const;

export const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: transition.base } };
export const slideUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: transition.base } };
export const slideDown = { hidden: { opacity: 0, y: -12 }, visible: { opacity: 1, y: 0, transition: transition.base } };
export const slideRight = { hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0, transition: transition.base } };
export const slideLeft = { hidden: { opacity: 0, x: 12 }, visible: { opacity: 1, x: 0, transition: transition.base } };
export const scaleIn = { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1, transition: transition.base } };
export const popIn = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: transition.bouncy } };

export const staggerContainer = (staggerMs = 50) => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: staggerMs / 1000, delayChildren: 0.05 } },
});
export const staggerFast = staggerContainer(40);
export const stagger = staggerContainer(80);
export const staggerSlow = staggerContainer(120);

export const hoverLift = { whileHover: { y: -2, transition: transition.fast }, whileTap: { y: 0, transition: transition.fast } };
export const hoverScale = { whileHover: { scale: 1.02, transition: transition.fast }, whileTap: { scale: 0.98, transition: transition.fast } };
export const hoverGlow = { whileHover: { boxShadow: '0 8px 24px rgba(20, 184, 166, 0.15)', transition: transition.fast } };

export const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: transition.base,
};
