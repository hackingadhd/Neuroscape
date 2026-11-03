// Step-by-step "how the chemical travels" stories, one per chemical messenger.
// Steps 1–3 are shown on the 3D brain; steps 4–9 zoom into the live gap
// between two nerve cells.
import type { BrainState, BrainTarget, NeuroKey } from "./cells";

export type JourneyStep = {
  title: string;
  text: string;
  view: "brain" | "synapse";
  target: BrainTarget;
  /** Name shown on the brain label for this step. */
  label: string;
  /** Some steps switch the brain state to show a difference. */
  state?: BrainState;
};

type Story = {
  name: string;
  source: { target: BrainTarget; label: string; where: string };
  route: { target: BrainTarget; label: string; text: string };
  arrive: { target: BrainTarget; label: string; text: string };
  job: string;
  adhd: string;
};

const STORIES: Record<NeuroKey, Story> = {
  dopamine: {
    name: "Dopamine",
    source: { target: "vta", label: "Dopamine Factory", where: "a small cluster of nerve cells in the middle of the brain, near the top of the brainstem" },
    route: {
      target: "mesocortical",
      label: "Dopamine routes",
      text: "Long nerve 'wires' carry the dopamine signal forward. One route goes to the front of the brain (focus); another goes to the reward centre (motivation).",
    },
    arrive: {
      target: "dlpfc",
      label: "Planning area",
      text: "The signal reaches the planning area at the front of the brain and the reward centre deep inside. Here dopamine says: 'this matters, keep going!'",
    },
    job: "a 'this is worth doing' message",
    adhd:
      "In ADHD, a bit less dopamine is released and the recyclers may clear it away faster. Fewer receivers light up, so the 'keep going' message comes through weak. Watch the receivers: they light up less often.",
  },
  norepinephrine: {
    name: "Norepinephrine",
    source: { target: "lc", label: "Alertness Dial", where: "a tiny blue spot in the brainstem, at the back of the brain near the neck" },
    route: {
      target: "lcProj",
      label: "Alertness Routes",
      text: "Branching nerve 'wires' spray norepinephrine out to almost the whole brain, turning up alertness.",
    },
    arrive: {
      target: "dlpfc",
      label: "Planning area",
      text: "In the planning area at the front of the brain, norepinephrine sharpens focus by helping nerve cells hold on to the important signal and ignore the noise.",
    },
    job: "a 'stay alert, lock on' message",
    adhd:
      "In ADHD the alertness system is less well tuned and the recyclers clear norepinephrine quickly, so the focus message fades fast. Attention drifts or jumps to something new.",
  },
  serotonin: {
    name: "Serotonin",
    source: { target: "raphe", label: "Serotonin Factory", where: "a chain of small clusters running down the middle of the brainstem" },
    route: {
      target: "rapheProj",
      label: "Serotonin Routes",
      text: "Long nerve 'wires' carry serotonin to the front, middle and back of the brain.",
    },
    arrive: {
      target: "pfc",
      label: "Front of the brain",
      text: "At the front of the brain serotonin helps you wait, stay calm and keep emotions in check. It also tones down dopamine-driven urges.",
    },
    job: "a 'stay calm, wait a moment' message",
    adhd:
      "Serotonin isn't the main chemical in ADHD. Differences are small and inconsistent, but they may add to impulsive reactions and emotional ups and downs.",
  },
};

export function journeyFor(neuro: NeuroKey): { name: string; steps: JourneyStep[] } {
  const s = STORIES[neuro];
  return {
    name: s.name,
    steps: [
      {
        title: `${s.name} is made`,
        text: `${s.name} is made in ${s.source.where}. This spot is highlighted on the brain.`,
        view: "brain",
        target: s.source.target,
        label: s.source.label,
      },
      { title: "It travels along nerve wires", text: s.route.text, view: "brain", target: s.route.target, label: s.route.label },
      { title: "It arrives where it's needed", text: s.arrive.text, view: "brain", target: s.arrive.target, label: s.arrive.label },
      {
        title: "It's packed into tiny bubbles",
        text: `Now we zoom in to where two nerve cells meet. At the end of the sending cell, ${s.name.toLowerCase()} waits inside tiny bubbles, ready to go.`,
        view: "synapse",
        target: "synapse:vesicles",
        label: "Message bubbles",
      },
      {
        title: "It crosses the gap",
        text: `When a signal arrives, the bubbles burst open and release ${s.name.toLowerCase()} into the tiny gap between the two cells. It drifts across in less than a thousandth of a second.`,
        view: "synapse",
        target: "synapse:cleft",
        label: "The gap",
      },
      {
        title: "Receivers catch the message",
        text: `On the other side, receivers catch the ${s.name.toLowerCase()}. Each one that lights up passes on ${s.job} to the next cell.`,
        view: "synapse",
        target: "synapse:receptors",
        label: "Receivers",
      },
      {
        title: "Recyclers clean it up",
        text: `Recyclers are tiny pumps on the sending cell (the purple pumps in the picture). Once the message has been delivered, they pull the ${s.name.toLowerCase()} back inside. This switches the message off and saves the chemical to use again. If the recyclers work too fast, the message is cut short.`,
        view: "synapse",
        target: "synapse:transporters",
        label: "Recyclers",
      },
      { title: "What's different in ADHD", text: s.adhd, view: "synapse", target: "synapse:receptors", label: "Receivers", state: "adhd" },
    ],
  };
}
