# Neuroscape

An interactive 3D explorer of what happens in the ADHD brain, focused on the
chemical messengers (neurotransmitters) dopamine, norepinephrine and serotonin.
Written in plain language for a non-science audience.

## What's in it

- **Main Signs of ADHD**: attention, hyperactivity, impulsivity, motivation,
  emotions & mood, time & planning. Tap a sign to see which brain parts and
  chemicals are behind it.
- **Brain Map**: Neurotransmitters, Dopamine, Norepinephrine, Serotonin and
  Where They Work.
- **Parts Explained**: for each part, how ADHD affects it, what it does and
  where it is, highlighted and named on the 3D brain.
- **How the chemical travels**: an 8-step journey you flip through with arrows,
  from where the chemical is made to how its message is received.
- **Typical vs ADHD switch**: the 3D brain and the live close-up of two nerve
  cells change to show weaker, patchier signals in ADHD.
- **Key words, key differences and live meters** with plain explanations.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://127.0.0.1:5173 (or the address Vite prints).

To make a production build:

```bash
npm run build
npm run preview
```

## Notes

- The 3D brain is generated in code (Three.js) and simplified for learning; it
  is not anatomically exact.
- ADHD differences shown are simplified averages from research, not a
  diagnostic tool and not medical advice.
- Built by adapting the MIT-licensed
  [Cell Architecture Studio](https://github.com/cclank/cell-architecture-studio);
  see `LICENSE`.
