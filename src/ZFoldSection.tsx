import React, { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { AD_SIZES, MINIMUM_HOMES, meetsHomeMinimum } from './route-planner';
import { chooseMailerSize, useMailerPlan } from './mailer-plan';
import './zfold.css';

const LAYOUTS = [
  { cols: 2, rows: 3, fraction: '1/6', name: 'A little space. A clear offer.' },
  { cols: 2, rows: 2, fraction: '1/4', name: 'Room for a little more.' },
  { cols: 1, rows: 3, fraction: '1/3', name: 'A wide space for your story.' },
  { cols: 1, rows: 2, fraction: '1/2', name: 'Give your business more room.' },
  { cols: 1, rows: 1, fraction: 'Full', name: 'Make the whole panel yours.' },
];
const currency = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export function ZFoldSection() {
  const section = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const plan = useMailerPlan();
  const [manual, setManual] = useState<'open' | 'closed' | null>(null);
  const [scrollOpen, setScrollOpen] = useState(false);
  const [placement, setPlacement] = useState({ panel: 1, slot: 0 });
  const { scrollYProgress } = useScroll({ target: section, offset: ['start 65%', 'end end'] });
  const leftFold = useTransform(scrollYProgress, [0.14, 0.46], [-179.5, 0]);
  const rightFold = useTransform(scrollYProgress, [0.35, 0.7], [-179.5, 0]);
  useMotionValueEvent(scrollYProgress, 'change', (value) => setScrollOpen(value >= 0.7));
  const open = reducedMotion || (manual === 'open' || (manual === null && scrollOpen));
  const leftRotation = reducedMotion || manual === 'open' ? 0 : manual === 'closed' ? -179.5 : leftFold;
  const rightRotation = reducedMotion || manual === 'open' ? 0 : manual === 'closed' ? -179.5 : rightFold;
  const layout = LAYOUTS[plan.sizeIndex];
  const size = AD_SIZES[plan.sizeIndex];
  const minimumMet = meetsHomeMinimum(plan.residential);
  const remainingHomes = Math.max(0, MINIMUM_HOMES - plan.residential);
  const slots = layout.cols * layout.rows;
  const chooseSize = (index: number) => {
    setPlacement({ panel: 1, slot: 0 }); setManual('open'); chooseMailerSize(index);
  };

  const panelContents = (panel: number) => <div className="zfold-panel__inside" aria-hidden={!open}>
    <div className="zfold-panel__label"><span>0{panel + 1}</span><span>Inside panel</span></div>
    <div className="zfold-panel__slots" style={{ gridTemplateColumns: `repeat(${layout.cols}, 1fr)`, gridTemplateRows: `repeat(${layout.rows}, 1fr)` }}>
      {Array.from({ length: slots }, (_, slot) => {
        const chosen = panel === placement.panel && slot === Math.min(placement.slot, slots - 1);
        return <button key={slot} type="button" className={`zfold-space${chosen ? ' is-chosen' : ''}`} disabled={!open} aria-label={`Preview ${size.label} in panel ${panel + 1}, space ${slot + 1}`} aria-pressed={chosen} onClick={() => setPlacement({ panel, slot })}>
          {chosen ? <><strong>{layout.fraction}</strong><span>Your business here</span></> : <span className="zfold-space__cross" aria-hidden="true">+</span>}
        </button>;
      })}
    </div>
  </div>;

  return <section className={`zfold-section${manual ? " zfold-section--manual" : ""}`} id="mailer" ref={section} aria-labelledby="zfold-heading">
    <div className="zfold-section__heading">
      <p className="eyebrow">Now, picture your business inside</p>
      <h2 id="zfold-heading">One mailer.<br /><span className="script">Make a little room for you.</span></h2>
      <p>Open it up. Find your fit. Choose the space that gives your business room to shine.</p>
    </div>
    <div className="zfold-section__scroll">
      <div className="zfold-workspace">
        <div className="zfold-preview">
          <div className="zfold-preview__topline"><span>HLN / The shared neighborhood mailer</span><span>11 × 17 · Z-fold</span></div>
          <div className="zfold-scene" aria-label={open ? `Open three-panel mailer showing ${size.label} example spaces` : 'Folded HLN mailer; scroll or use the open button to reveal ad spaces'}>
            <div className="zfold-sheet">
              <div className="zfold-panel zfold-panel--center">{panelContents(1)}</div>
              <motion.div className="zfold-panel zfold-panel--left" style={{ rotateY: leftRotation }}>
                <div className="zfold-panel__face">{panelContents(0)}</div>
                <div className="zfold-panel__back zfold-panel__back--brand" aria-hidden="true"><img src="/hln-logo-black.svg" alt="" /><span>Local businesses.<br />Local homes.<br />Local connections.</span></div>
              </motion.div>
              <motion.div className="zfold-panel zfold-panel--right" style={{ rotateY: rightRotation }}>
                <div className="zfold-panel__face">{panelContents(2)}</div>
                <div className="zfold-panel__back zfold-panel__back--cover" aria-hidden="true"><img src="/hln-card-zfold.jpg" alt="" /></div>
              </motion.div>
            </div>
          </div>
          <div className="zfold-preview__tools">
            <p>{open ? 'Tap an outlined space to move your ad.' : 'Keep scrolling to unfold the possibilities.'}</p>
            {!reducedMotion && <button type="button" onClick={() => setManual(open ? 'closed' : 'open')}>{open ? 'Fold mailer' : 'Open mailer'} <span aria-hidden="true">↔</span></button>}
          </div>
          <p className="zfold-preview__note">Example inside layouts, not live inventory. Final dimensions and placement confirmed with HLN.</p>
        </div>
        <div className="zfold-options">
          <p className="zfold-options__step">Choose your ad space</p>
          <h3>{layout.name}</h3>
          <p className="zfold-options__explain">Each size is a fraction of <strong>one inside panel.</strong> Compare the shapes, then pick your fit.</p>
          <div className="zfold-sizes" role="group" aria-label="Choose an ad size">
            {AD_SIZES.map((item, index) => <button key={item.label} type="button" aria-pressed={plan.sizeIndex === index} onClick={() => chooseSize(index)}><span>{item.label}</span><strong>{Math.round(item.rate * 100)}¢<small>/door</small></strong></button>)}
          </div>
          <div className="zfold-estimate" aria-live="polite" aria-atomic="true">
            <span>{plan.doors ? 'Your selected route plan' : '1,000-home minimum · example mailing'}</span>
            <strong>{currency((plan.doors || MINIMUM_HOMES) * size.rate)}</strong>
            <p>{(plan.doors || MINIMUM_HOMES).toLocaleString('en-US')} deliveries × {currency(size.rate)} per door</p>
            <small>{minimumMet ? '1,000-home minimum met. Updates with your route selection and ad size.' : plan.doors ? `Below minimum. Add routes with at least ${remainingHomes.toLocaleString('en-US')} more homes.` : 'Select routes totaling at least 1,000 homes for your own estimate.'}</small>
          </div>
          <p className="zfold-options__placement">Preview: panel {placement.panel + 1} · space {Math.min(placement.slot + 1, slots)} of {slots}</p>
          <a className="btn btn--solid zfold-options__cta" href={minimumMet ? '#reserve' : '#map'} onClick={() => { if (minimumMet) window.dispatchEvent(new CustomEvent('hln-route-selection', { detail: plan.summary })); }}>{minimumMet ? 'Review this mailer plan' : plan.doors ? `Add ${remainingHomes.toLocaleString('en-US')} more homes` : 'Choose at least 1,000 homes'}</a>
          <p className="zfold-options__fine">Estimates only. Distribution, availability, and final artwork confirmed before booking.</p>
        </div>
      </div>
    </div>
  </section>;
}
