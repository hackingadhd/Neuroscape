import { Sparkles } from "lucide-react";
import { cells } from "../data/cells";
import { Modal } from "./Modal";

export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} label="About this app" panelClassName="about-modal">
      <div className="about-head">
        <span className="brand-orb" aria-hidden="true">
          <Sparkles size={24} />
        </span>
        <div>
          <h3>Neuroscape</h3>
          <p>Explore the ADHD brain in interactive 3D.</p>
        </div>
      </div>

      <dl className="about-list">
        <div>
          <dt>Topics</dt>
          <dd>
            {cells.length} brain topics: whole-brain networks, prefrontal cortex, basal ganglia,
            cerebellum, the synapse, dopamine, norepinephrine and serotonin.
          </dd>
        </div>
        <div>
          <dt>3D brain</dt>
          <dd>
            Generated procedurally in Three.js (folded cortex, cerebellum, deep nuclei and
            animated neurotransmitter pathways). Simplified for learning, not anatomically exact.
          </dd>
        </div>
        <div>
          <dt>Rendering</dt>
          <dd>
            React + Three.js (React Three Fiber) with an HDR studio environment, ACES tone
            mapping, and meshopt-compressed assets.
          </dd>
        </div>
      </dl>

      <p className="about-foot">Educational project adapted from Cell Architecture Studio (MIT). ADHD differences shown are simplified group averages — not for diagnosis or medical advice.</p>
    </Modal>
  );
}
