export const variants = {
  main: {
    active: { transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
    inactive: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
  },
  item: {
    active: {
      x: 0,
      opacity: [0, 1, 0, 1],
      transition: {
        opacity: { duration: 0.2 },
        x: { duration: 0.2 }
      }
    },
    inactive: {
      x: -10,
      opacity: 0
    }
  }
}
