// Neuroscape content, written for a non-science audience.
// Internal names (cells / CellItem / organelles) are kept from the original
// Cell Architecture Studio code: a "cell" is a brain topic and an
// "organelle" is a part of the brain inside that topic.
import { brainThumb } from "../lib/brainArt";

export type ViewMode = "mesh" | "focus" | "synapse";
export type BrainState = "typical" | "adhd";
export type NeuroKey = "dopamine" | "norepinephrine" | "serotonin";

/** Keys understood by BrainScene: cortex regions, deep nuclei and pathways. */
export type BrainTarget =
  | "cortex" | "pfc" | "dlpfc" | "ofc" | "ifg" | "dmn" | "parietal"
  | "acc" | "caudate" | "putamen" | "nacc" | "thalamus" | "cerebellum" | "vermis"
  | "vta" | "sn" | "lc" | "raphe"
  | "mesocortical" | "mesolimbic" | "nigrostriatal" | "lcProj" | "rapheProj"
  | "synapse:vesicles" | "synapse:cleft" | "synapse:receptors" | "synapse:transporters";

export type Meter = { label: string; typical: number; adhd: number; explain?: string };

// One plain sentence per meter saying what the bar actually measures.
const METER_EXPLAIN: Record<string, string> = {
  vesicles: "How much chemical each nerve cell releases every time it sends a message. Less chemical means a quieter message.",
  cleft: "How much chemical is still in the gap, ready to reach the receivers. In ADHD it is cleared away sooner.",
  receptors: "How many receivers on the next nerve cell pick up the message. Fewer means the message arrives weaker.",
  transporters: "How quickly the recyclers pull the chemical back in. A higher number means the message is switched off sooner.",
  vta: "How strongly the dopamine-making cells fire when they sense a reward is coming. A weaker signal makes it harder to feel motivated ahead of time.",
  mesocortical: "How much dopamine reaches the front of the brain, where focus and planning happen.",
  mesolimbic: "How strong the 'I want to do this' push is when dopamine reaches the reward centre.",
  nigrostriatal: "How much dopamine reaches the area that controls movement. Less is linked to fidgeting and restlessness.",
  lc: "The Alertness Dial works in two modes. In 'locked-on' mode it fires in short bursts when something important happens, helping you focus on it. In 'scanning' mode it fires steadily and attention wanders to anything new. This bar shows roughly how much of the time it spends locked on. In ADHD it spends more time scanning.",
  lcProj: "How well alertness holds up during a long, boring task instead of fading after a few minutes.",
  alpha2a: "How clearly focus signals stand out from background 'noise' in the front of the brain.",
  net: "How quickly norepinephrine is pulled back in. A higher number means the message is switched off sooner.",
  raphe: "How strongly serotonin helps calm down sudden urges and big reactions.",
  rapheProj: "How easily someone can wait instead of acting straight away.",
  sert: "How quickly serotonin is pulled back in. The difference in ADHD is small.",
  ht2a: "How well serotonin helps keep mood steady under stress.",
  planArea: "How well the front of the brain keeps attention on a task.",
  brake: "How quickly and firmly the brain can stop an action once it has started.",
  reward: "How exciting a reward that is still far away feels.",
  moveGate: "How well the brain holds back extra movements like fidgeting.",
};

export type Sign = "attention" | "hyperactivity" | "impulsivity" | "motivation" | "planning" | "emotions";

export const SIGNS: Array<{ id: Sign; name: string; text: string; color: string; chemicals: NeuroKey[] }> = [
  { id: "attention", name: "Attention", text: "Trouble focusing, staying on task and remembering instructions.", color: "#7a6fc4", chemicals: ["dopamine", "norepinephrine"] },
  { id: "hyperactivity", name: "Hyperactivity", text: "Restlessness, fidgeting and finding it hard to sit still.", color: "#d9824a", chemicals: ["dopamine"] },
  { id: "impulsivity", name: "Impulsivity", text: "Acting or speaking before thinking, and finding it hard to wait.", color: "#c25a7c", chemicals: ["dopamine", "norepinephrine", "serotonin"] },
  { id: "motivation", name: "Motivation", text: "Boring tasks feel extra hard to start; instant rewards pull strongly.", color: "#c08a1f", chemicals: ["dopamine"] },
  { id: "emotions", name: "Emotions & Mood", text: "Big, fast feelings, frustration and mood ups and downs.", color: "#4d6fbf", chemicals: ["serotonin", "norepinephrine"] },
  { id: "planning", name: "Time & Planning", text: "Losing track of time, planning ahead and staying organised.", color: "#5e8a5a", chemicals: ["dopamine", "norepinephrine"] },
];

const PART_SIGNS: Record<string, Sign[]> = {
  raphe: ["emotions", "impulsivity"],
  rapheProj: ["emotions", "impulsivity"],
  sert: ["emotions"],
  ht2a: ["emotions"],
  vesicles: ["attention", "motivation"],
  cleft: ["attention", "motivation"],
  receptors: ["attention", "motivation"],
  transporters: ["attention", "motivation"],
  vta: ["motivation"],
  mesocortical: ["attention", "planning"],
  mesolimbic: ["motivation"],
  nigrostriatal: ["hyperactivity"],
  lc: ["attention"],
  lcProj: ["attention"],
  alpha2a: ["attention", "impulsivity"],
  net: ["attention"],
  planArea: ["attention", "planning"],
  brake: ["impulsivity"],
  reward: ["motivation"],
  moveGate: ["hyperactivity"],
  nonstim: ["attention", "impulsivity"],
  guanf: ["impulsivity", "hyperactivity", "attention"],
};

const DA: NeuroKey[] = ["dopamine"];
const NE: NeuroKey[] = ["norepinephrine"];
const BOTH: NeuroKey[] = ["dopamine", "norepinephrine"];
const PART_CHEMS: Record<string, NeuroKey[]> = {
  vesicles: BOTH, cleft: BOTH, receptors: BOTH, transporters: BOTH,
  vta: DA, mesocortical: DA, mesolimbic: DA, nigrostriatal: DA,
  lc: NE, lcProj: NE, alpha2a: NE, net: NE,
  planArea: BOTH, brake: BOTH, reward: DA, moveGate: DA,
  raphe: ["serotonin"], rapheProj: ["serotonin"], sert: ["serotonin"], ht2a: ["serotonin"],
};

export type OrganelleItem = {
  id: string;
  /** Chemical messengers this part uses. */
  chemicals: NeuroKey[];
  /** Which main signs of ADHD this part is linked to. */
  signs: Sign[];
  /** Plain-language name shown everywhere (and on the brain). */
  name: string;
  /** Scientific name, shown small. */
  subtitle: string;
  color: string;
  target: BrainTarget;
  whatIs: string;
  /** What it does. */
  note: string;
  /** How it is affected in ADHD. */
  adhd: string;
  fact: string;
  meter: Meter;
};

export type CellRenderImage = { url: string; aspect: "square" | "wide" | "landscape" };

export type ImagingCard = { label: string; kind: "fmri" | "pet" | "dti"; caption: string };

export type CellItem = {
  id: string;
  name: string;
  type: string;
  accent: string;
  accentSoft: string;
  color: string;
  defaultOrganelle: string;
  /** Which topic the comparison view suggests next. */
  comparison: string;
  clinicalContext: string;
  /** Heading for the part cards' highlighted box. */
  adhdHeading?: string;
  /** Chemical messenger used by the live synapse view and the step-by-step journey. */
  neuro: NeuroKey;
  /** Pathways animated in 3D while this topic is open. */
  pathways: BrainTarget[];
  /** Regions painted on the thumbnail art. */
  thumbRegions: BrainTarget[];
  renderImage?: CellRenderImage;
  adhdSummary: string;
  contrast: Array<{ label: string; typical: string; adhd: string }>;
  occurrence: { title: string; body: string; motif: string };
  microscope: ImagingCard[];
  organelles: OrganelleItem[];
};

const imaging = (fmri: string, pet: string, dti: string): ImagingCard[] => [
  { label: "Activity scan", kind: "fmri", caption: `Activity scan (fMRI): ${fmri}` },
  { label: "Chemical scan", kind: "pet", caption: `Chemical scan (PET): ${pet}` },
  { label: "Wiring scan", kind: "dti", caption: `Wiring scan (DTI): ${dti}` },
];

const part = (
  id: string,
  name: string,
  subtitle: string,
  color: string,
  target: BrainTarget,
  text: { is: string; does: string; adhd: string; fact: string },
  meter: Meter,
): OrganelleItem => ({ id, chemicals: PART_CHEMS[id] ?? [], signs: PART_SIGNS[id] ?? [], name, subtitle, color, target, whatIs: text.is, note: text.does, adhd: text.adhd, fact: text.fact, meter: { ...meter, explain: METER_EXPLAIN[id] } });

const m = (label: string, typical: number, adhd: number): Meter => ({ label, typical, adhd });

export const cells: CellItem[] = [
  {
    id: "neuro",
    name: "Neurotransmitters",
    type: "How brain cells talk",
    accent: "#6b62a8",
    accentSoft: "#e9e6f6",
    color: "#a59ad6",
    defaultOrganelle: "vesicles",
    comparison: "dopamine",
    neuro: "dopamine",
    pathways: ["mesocortical", "lcProj"],
    thumbRegions: ["vta", "lc"],
    clinicalContext:
      "ADHD is diagnosed by a doctor talking with you about your life and behaviour, not with a brain scan. The differences shown here are simplified averages from research.",
    adhdSummary:
      "Brain cells (neurons) don't touch each other. They send messages across a tiny gap using chemicals called neurotransmitters. In ADHD, two of these, dopamine and norepinephrine, are cleared away too fast or not picked up as well, so the message that arrives is weaker.",
    contrast: [
      { label: "Chemical in the gap", typical: "Stays long enough to deliver", adhd: "Cleared away faster" },
      { label: "Message received", typical: "Strong and reliable", adhd: "Weaker and patchier" },
      { label: "Overall signal", typical: "Clear", adhd: "Noisier and less clear" },
    ],
    occurrence: {
      title: "Everywhere",
      body: "Your brain has about 86 billion nerve cells, linked by around 100 trillion of these tiny gaps.",
      motif: "synapse",
    },
    microscope: imaging(
      "shows blood-flow changes, a sign of how busy brain cells are.",
      "uses tiny tracers to count the chemical 'receivers' and 'recyclers' in a living brain.",
      "maps the long cables that carry chemical messengers across the brain.",
    ),
    organelles: [
      part("vesicles", "Message Bubbles", "Synaptic vesicles", "#a59ad6", "synapse:vesicles", {
        is: "Tiny bubbles inside the end of a nerve cell, each packed with thousands of chemical molecules.",
        does: "When a signal arrives, they burst open and pour their chemicals into the gap.",
        adhd: "In ADHD, some brain circuits may release a bit less dopamine each time, so each message is quieter.",
        fact: "The bubbles are refilled and reused within seconds.",
      }, m("Chemical released per message", 80, 64)),
      part("cleft", "The Gap", "Synaptic cleft", "#c7bfe8", "synapse:cleft", {
        is: "The tiny space between two nerve cells.",
        does: "Chemical messengers drift across it to reach the next cell.",
        adhd: "Because the chemical is cleared away faster in ADHD, less of it stays in the gap.",
        fact: "It's about 2,000 times thinner than a human hair.",
      }, m("Chemical left in the gap", 78, 52)),
      part("receptors", "Receivers", "Receptors", "#7c70c2", "synapse:receptors", {
        is: "Docking spots on the nerve cell receiving the message.",
        does: "When a chemical fits into one, the next cell gets the message.",
        adhd: "Some brain-scan studies of adults with ADHD found fewer available dopamine receivers in the brain's reward area.",
        fact: "There are at least 14 different kinds of serotonin receiver.",
      }, m("Messages received", 80, 55)),
      part("transporters", "Recyclers", "Reuptake transporters", "#5b5196", "synapse:transporters", {
        is: "Tiny pumps sitting on the outside of the nerve cell that sent the message. Scientists call them reuptake transporters.",
        does: "Once a chemical messenger has been released into the gap, the recyclers pull it back inside the sending cell. This switches the message off, so it doesn't go on forever, and lets the cell reuse the chemical for the next message.",
        adhd: "In ADHD, some studies suggest there may be more recyclers, or that they work faster, especially for dopamine. The chemical is pulled back before enough of it reaches the receivers, so the message that gets through is weaker and shorter.",
        fact: "Each chemical has its own recycler: DAT for dopamine, NET for norepinephrine, SERT for serotonin.",
      }, m("Recycling speed (higher = message ends sooner)", 50, 78)),
    ],
  },
  {
    id: "dopamine",
    name: "Dopamine",
    type: "The motivation chemical",
    accent: "#c08a1f",
    accentSoft: "#f8edd2",
    color: "#ebc05e",
    defaultOrganelle: "vta",
    comparison: "norepinephrine",
    neuro: "dopamine",
    pathways: ["mesocortical", "mesolimbic", "nigrostriatal"],
    thumbRegions: ["vta", "nacc", "pfc"],
    clinicalContext:
      "Dopamine isn't simply 'low' in ADHD. The dopamine signal is weaker, or cleared away too quickly, in the circuits for motivation and focus.",
    adhdSummary:
      "Dopamine is the brain's 'this matters, keep going!' signal. In ADHD, dopamine signals in the reward and planning areas are weaker, so ordinary tasks can feel dull and the brain goes looking for something more exciting.",
    contrast: [
      { label: "Reward feeling", typical: "Strong, even for future rewards", adhd: "Weak for rewards that are far away" },
      { label: "Recyclers (pumps that pull dopamine back in)", typical: "Pull dopamine back at a normal pace", adhd: "May pull it back faster, cutting the message short" },
      { label: "What it feels like", typical: "Can push through boring tasks", adhd: "Boredom hits hard; craves new things" },
    ],
    occurrence: {
      title: "From the middle to the front",
      body: "Made in the midbrain, then sent to the reward centre and the front of the brain.",
      motif: "dopamine",
    },
    microscope: imaging(
      "when waiting for a reward, the reward centre usually lights up less in ADHD.",
      "measures how much dopamine is released in the brain's action and reward areas.",
      "dopamine travels along a bundle of cables running forward from the midbrain.",
    ),
    organelles: [
      part("vta", "Dopamine Factory", "Ventral tegmental area (VTA)", "#e0a030", "vta", {
        is: "A small group of nerve cells in the midbrain, near the top of the brainstem.",
        does: "It makes dopamine, and fires when something turns out better than expected. That teaches your brain what's worth doing.",
        adhd: "In ADHD the dopamine signal seems to pass less strongly to the clues that a reward is coming, so it's harder to feel motivated ahead of time.",
        fact: "Over time these cells start firing at the first hint of a reward, not just at the reward itself.",
      }, m("Strength of the 'reward coming' signal", 80, 58)),
      part("mesocortical", "Focus Route", "Mesocortical pathway", "#d4892a", "mesocortical", {
        is: "Long nerve fibres running from the Dopamine Factory to the front of the brain.",
        does: "It delivers dopamine to the planning area, helping you focus and remember what you're doing.",
        adhd: "Less dopamine arriving here is linked to trouble paying attention and forgetfulness.",
        fact: "In the front of the brain, norepinephrine's recyclers clean up much of the dopamine too.",
      }, m("Dopamine reaching the planning area", 80, 55)),
      part("mesolimbic", "Motivation Route", "Mesolimbic pathway", "#ebb24a", "mesolimbic", {
        is: "Nerve fibres running from the Dopamine Factory to the reward centre.",
        does: "It tells you how much effort something is worth: your drive to start and keep going.",
        adhd: "A weaker signal here helps explain why people with ADHD often prefer a quick small reward over a bigger one later.",
        fact: "Dopamine here rises BEFORE a reward, while you're looking forward to it.",
      }, m("Motivation drive", 82, 56)),
      part("nigrostriatal", "Movement Route", "Nigrostriatal pathway", "#b9772a", "nigrostriatal", {
        is: "Nerve fibres from a second dopamine cluster (the substantia nigra) to the basal ganglia.",
        does: "It keeps movement smooth and helps form habits.",
        adhd: "The gene for dopamine's recycler, which is very active along this route, has been linked to ADHD. Each gene only has a small effect, though.",
        fact: "Losing these nerve cells is what causes Parkinson's disease.",
      }, m("Dopamine for movement control", 80, 62)),
    ],
  },
  {
    id: "norepinephrine",
    name: "Norepinephrine",
    type: "The alertness chemical",
    accent: "#2f8a8f",
    accentSoft: "#dcf0ef",
    color: "#76c3c4",
    defaultOrganelle: "lc",
    comparison: "dopamine",
    neuro: "norepinephrine",
    pathways: ["lcProj"],
    thumbRegions: ["lc", "pfc"],
    clinicalContext:
      "Norepinephrine works hand in hand with dopamine. In the front of the brain, the two chemicals together keep focus sharp and steady.",
    adhdSummary:
      "Norepinephrine (also called noradrenaline) controls how alert the brain is. It also sharpens focus in the front of the brain. In ADHD the knob isn't as well tuned: sometimes too low (drifting off), sometimes jumping around (easily distracted).",
    contrast: [
      { label: "Alertness", typical: "Matches what you're doing", adhd: "Too low, or all over the place" },
      { label: "Focus filter", typical: "Background noise filtered out", adhd: "More noise gets through" },
      { label: "Attention style", typical: "Locks on when needed", adhd: "Keeps scanning for something new" },
    ],
    occurrence: {
      title: "From the brainstem to everywhere",
      body: "Made in a tiny spot in the brainstem that sends wires to almost the whole brain.",
      motif: "norepinephrine",
    },
    microscope: imaging(
      "scientists track this system by watching tiny changes in pupil size during attention tasks.",
      "shows how many norepinephrine recyclers the brain has.",
      "its cables spread out to almost the whole brain.",
    ),
    organelles: [
      part("lc", "Alertness Dial", "Locus coeruleus", "#3fa3a8", "lc", {
        is: "A tiny cluster of nerve cells in the brainstem, only about 20,000–50,000 cells on each side.",
        does: "It makes norepinephrine and switches between 'locked-on focus' mode and 'scanning around' mode.",
        adhd: "In ADHD it's thought to spend more time in 'scanning' mode, so attention jumps to whatever is new or interesting.",
        fact: "Its name means 'blue spot'. It looks bluish in real brains.",
      }, m("Time spent in 'locked-on' focus mode", 76, 52)),
      part("lcProj", "Alertness Routes", "Noradrenergic pathways", "#5ab7b7", "lcProj", {
        is: "Branching nerve fibres from the Alertness Dial out to almost every part of the brain.",
        does: "They spread norepinephrine around to boost alertness when something matters.",
        adhd: "Less precise delivery may make it hard to stay alert during long, boring tasks.",
        fact: "A single one of these nerve cells can send branches to both the front and the back of the brain.",
      }, m("Staying alert over time", 80, 58)),
      part("alpha2a", "Focus Receivers", "α2A receptors", "#2f8a8f", "dlpfc", {
        is: "Special docking spots for norepinephrine on nerve cells in the front of the brain.",
        does: "When switched on, they plug tiny 'leaks' in nerve cells so focus signals stay strong.",
        adhd: "With less activation, focus signals leak away and get noisy, making it harder to stay on task.",
        fact: "Too little norepinephrine hurts focus, but so does too much, like during intense stress.",
      }, m("Focus signal clarity", 80, 55)),
      part("net", "Norepinephrine Recyclers", "Norepinephrine transporter (NET)", "#246f73", "synapse:transporters", {
        is: "Tiny pumps on the sending nerve cell that are built to grab norepinephrine.",
        does: "After norepinephrine has delivered its message, these recyclers pull it back into the sending cell, switching the message off and saving the chemical for later. In the front of the brain they also pull back dopamine.",
        adhd: "Fast recycling cuts the message short, so less norepinephrine (and dopamine) is left to do its job in the planning area.",
        fact: "This one pump clears TWO chemicals in the planning area.",
      }, m("Recycling speed (higher = message ends sooner)", 50, 74)),
    ],
  },
  {
    id: "serotonin",
    name: "Serotonin",
    type: "The calm & mood chemical",
    accent: "#4d6fbf",
    accentSoft: "#e1e8f8",
    color: "#8ea6e3",
    defaultOrganelle: "raphe",
    comparison: "dopamine",
    neuro: "serotonin",
    pathways: ["rapheProj"],
    thumbRegions: ["raphe", "pfc"],
    clinicalContext:
      "Serotonin often matters most when ADHD comes along with anxiety or low mood, which is common.",
    adhdSummary:
      "Serotonin helps the brain stay calm, wait and manage emotions. It isn't the main chemical in ADHD, but it plays a supporting role, especially in big emotional reactions and impulsive behaviour, and when ADHD comes with anxiety or low mood.",
    contrast: [
      { label: "Emotions", typical: "Smooths out big swings", adhd: "Reactions can be stronger and faster" },
      { label: "Waiting", typical: "Helps you be patient", adhd: "Impulsive choices more likely" },
      { label: "Role in ADHD", typical: "—", adhd: "A supporting role, not the main cause" },
    ],
    occurrence: { title: "From the brainstem to everywhere", body: "Made along the centre line of the brainstem, then sent across the whole brain.", motif: "serotonin" },
    microscope: imaging("", "", ""),
    organelles: [
      part("raphe", "Serotonin Factory", "Raphe nuclei", "#6b8be0", "raphe", {
        is: "A chain of small nerve-cell clusters down the middle of the brainstem.",
        does: "They make almost all of the brain's serotonin and send it out through long, branching fibres.",
        adhd: "Serotonin activity may play a part in the big feelings, irritability and impulsive reactions that often come with ADHD.",
        fact: "",
      }, m("Calming effect", 78, 62)),
      part("rapheProj", "Serotonin Routes", "Serotonin pathways", "#8ea6e3", "rapheProj", {
        is: "Long nerve fibres carrying serotonin to the front, middle and back of the brain.",
        does: "They turn down how strongly other systems react, for example calming dopamine-driven urges and smoothing out emotions.",
        adhd: "Some research links ADHD impulsivity and emotional ups and downs to the balance between serotonin and dopamine.",
        fact: "",
      }, m("Ability to wait", 76, 54)),
      part("sert", "Serotonin Recyclers", "Serotonin transporter (SERT)", "#3d5ca8", "synapse:transporters", {
        is: "Tiny pumps on the sending nerve cell that are built to grab serotonin.",
        does: "After serotonin has delivered its message, these recyclers pull it back into the sending cell, switching the message off and saving the serotonin to use again.",
        adhd: "Links between these pumps and ADHD are weak and inconsistent. They're not a main part of the ADHD story.",
        fact: "",
      }, m("Recycling speed", 50, 56)),
      part("ht2a", "Serotonin Receivers", "5-HT receptors", "#5a77c9", "synapse:receptors", {
        is: "Docking spots for serotonin. There are many different types.",
        does: "Depending on the type, they calm a nerve cell down or rev it up, fine-tuning mood, sleep and impulses.",
        adhd: "They aren't a consistent difference in ADHD, but they shape how stress and mood affect attention and emotions.",
        fact: "",
      }, m("Mood buffering", 78, 64)),
    ],
  },
  {
    id: "areas",
    name: "Where They Work",
    type: "Brain areas that need these chemicals",
    accent: "#b85f82",
    accentSoft: "#f6e3ea",
    color: "#e2a2bb",
    defaultOrganelle: "planArea",
    comparison: "dopamine",
    neuro: "dopamine",
    pathways: ["mesocortical", "mesolimbic", "lcProj"],
    thumbRegions: ["pfc", "nacc", "putamen"],
    clinicalContext:
      "ADHD is diagnosed by a doctor talking with you about your life and behaviour, not with a brain scan. The differences shown here are averages from research on large groups of people. Every brain is different.",
    adhdSummary:
      "Dopamine and norepinephrine are delivered to a few key brain areas. When less of these chemicals gets through, each area struggles with its job, and that's what shows up as the main signs of ADHD.",
    contrast: [
      { label: "Planning area", typical: "Gets enough chemical to stay on task", adhd: "Runs low, so focus slips" },
      { label: "Reward centre", typical: "Feels motivated by future rewards", adhd: "Only instant rewards feel worth it" },
      { label: "Movement gate", typical: "Holds back extra movements", adhd: "Fidgeting slips through" },
    ],
    occurrence: { title: "Front and middle of the brain", body: "Mostly behind the forehead and deep in the middle.", motif: "frontal" },
    microscope: imaging("", "", ""),
    organelles: [
      part("planArea", "Planning Area", "Prefrontal cortex", "#c96b8f", "pfc", {
        is: "The very front of your brain, right behind your forehead.",
        does: "It keeps goals in mind, holds on to instructions and blocks out distractions. It needs both dopamine and norepinephrine to work well.",
        adhd: "With less dopamine and norepinephrine arriving, instructions get forgotten, focus drifts and tasks are hard to start and finish.",
        fact: "",
      }, m("Focus power", 82, 58)),
      part("brake", "Brake Pedal", "Inferior frontal gyrus", "#a7577a", "ifg", {
        is: "A fold on the lower side of the front of the brain.",
        does: "It stops actions you've already started, like holding back a comment. Norepinephrine and dopamine help it react in time.",
        adhd: "The brake is slower and weaker in ADHD, so it's harder to stop before blurting something out or acting on impulse.",
        fact: "",
      }, m("Brake strength", 82, 57)),
      part("reward", "Reward Centre", "Nucleus accumbens", "#f0b46a", "nacc", {
        is: "A small area deep in the middle of the brain.",
        does: "It turns dopamine into the 'I want to do this!' feeling that gets you started and keeps you going.",
        adhd: "Less dopamine here means rewards that are far away (like good grades) feel flat, while instant rewards (like phone notifications) feel irresistible.",
        fact: "",
      }, m("Excitement about future rewards", 80, 54)),
      part("moveGate", "Movement Gate", "Putamen", "#e3a35f", "putamen", {
        is: "A rounded area deep in the brain, next to the reward centre.",
        does: "It uses dopamine to decide which movements go ahead and which are held back.",
        adhd: "With a weaker dopamine signal, the gate is 'leaky', which is linked to fidgeting, restlessness and finding it hard to sit still.",
        fact: "",
      }, m("Holding back extra movement", 82, 61)),
    ],
  },
];

for (const cell of cells) {
  cell.renderImage = { url: brainThumb(cell.thumbRegions, cell.accent, cell.accentSoft), aspect: "square" };
}

export function getCellById(id: string) {
  return cells.find((cell) => cell.id === id) ?? cells[0];
}

export type CellCategory = "Brain Areas" | "Brain Chemicals";

export const CELL_CATEGORY_ORDER: CellCategory[] = ["Brain Areas", "Brain Chemicals"];

export function categorize(cell: CellItem): CellCategory {
  return cell.id === "areas" ? "Brain Areas" : "Brain Chemicals";
}

export const BRAIN_STATES: Array<{ id: BrainState; label: string; blurb: string }> = [
  { id: "typical", label: "Typical", blurb: "Showing a typical brain" },
  { id: "adhd", label: "ADHD", blurb: "Showing common ADHD differences" },
];

export const NEURO_INFO: Record<NeuroKey, { name: string; short: string; color: string; transporter: string; receptor: string }> = {
  dopamine: { name: "Dopamine", short: "DA", color: "#e6a425", transporter: "DAT", receptor: "Dopamine" },
  norepinephrine: { name: "Norepinephrine", short: "NE", color: "#2fa3a8", transporter: "NET", receptor: "Norepinephrine" },
  serotonin: { name: "Serotonin", short: "5-HT", color: "#5f82db", transporter: "SERT", receptor: "Serotonin" },
};
