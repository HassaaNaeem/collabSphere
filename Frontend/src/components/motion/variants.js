/* Subtle, premium motion. Restrained easing, short distances, no bounce. */

export const ease = [0.22, 1, 0.36, 1]

export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.25, ease } },
}

export const container = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
}

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease } },
}

// gentle hover lift for cards / interactive surfaces
export const hoverLift = {
  rest: { y: 0 },
  hover: { y: -3, transition: { duration: 0.25, ease } },
}
