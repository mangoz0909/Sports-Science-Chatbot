export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

export const wordStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.18 } },
};

export const wordReveal = {
  hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export const viewport = { once: true, amount: 0.18 };
