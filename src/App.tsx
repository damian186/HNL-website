import React, { useRef } from "react";
import {
  AnimatePresence,
  motion,
  MotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { PROOF_PACKAGES, type ProofPackage } from "./proofPackages";
import { RouteMapSection } from "./RouteMap";
import { ZFoldSection } from "./ZFoldSection";
import { useMailerPlan } from "./mailer-plan";
import { AD_SIZES, meetsHomeMinimum } from "./route-planner";

function RouteInquiry() {
  const plan = useMailerPlan();
  const [summary, setSummary] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (typeof detail === 'string') { setSummary(detail); setCopied(false); }
    };
    window.addEventListener('hln-route-selection', receive);
    return () => window.removeEventListener('hln-route-selection', receive);
  }, []);
  React.useEffect(() => {
    setSummary((current) => current ? plan.summary : '');
    setCopied(false);
  }, [plan.summary]);
  if (!summary || !meetsHomeMinimum(plan.residential)) return null;
  return <div className="planner-inquiry"><label htmlFor="route-inquiry-summary">Your selected route plan</label><textarea id="route-inquiry-summary" readOnly value={summary} /><button onClick={async () => {
    try { await navigator.clipboard.writeText(summary); setCopied(true); } catch { setCopied(false); }
  }}>{copied ? 'Copied' : 'Copy route plan'}</button><p>Keep this plan for your conversation with HLN. Selecting routes does not reserve space or submit an order.</p></div>;
}

type ColorKey =
  | "color1"
  | "color2"
  | "color3"
  | "color4"
  | "color5"
  | "color6"
  | "color7"
  | "color8"
  | "color9"
  | "color10"
  | "color11"
  | "color12"
  | "color13"
  | "color14"
  | "color15"
  | "color16"
  | "color17";

type Colors = Record<ColorKey, string>;

const LIQUID_BUTTON_COLORS: Colors = {
  color1: "#000000",
  color2: "#f7955c",
  color3: "#f2e5cc",
  color4: "#f7955c",
  color5: "#f2e5cc",
  color6: "#f7955c",
  color7: "#000000",
  color8: "#f2e5cc",
  color9: "#f7955c",
  color10: "#000000",
  color11: "#f2e5cc",
  color12: "#f7955c",
  color13: "#000000",
  color14: "#f2e5cc",
  color15: "#f7955c",
  color16: "#f2e5cc",
  color17: "#000000",
};

const svgOrder = [
  "svg1",
  "svg2",
  "svg3",
  "svg4",
  "svg3",
  "svg2",
  "svg1",
] as const;

type SvgKey = (typeof svgOrder)[number];

type Stop = {
  offset: number;
  stopColor: string;
};

type SvgState = {
  gradientTransform: string;
  stops: Stop[];
};

type SvgStates = Record<SvgKey, SvgState>;

const createStopsArray = (
  svgStates: SvgStates,
  order: readonly SvgKey[],
  maxStops: number,
): Stop[][] => {
  const stopsArray: Stop[][] = [];

  for (let i = 0; i < maxStops; i += 1) {
    stopsArray.push(
      order.map((svgKey) => {
        const svg = svgStates[svgKey];
        return svg.stops[i] || svg.stops[svg.stops.length - 1];
      }),
    );
  }

  return stopsArray;
};

function App() {
  React.useEffect(() => {
    if (!window.location.hash) {
      return;
    }

    window.requestAnimationFrame(() => {
      document.querySelector(window.location.hash)?.scrollIntoView();
    });
  }, []);

  return (
    <main>
      <ScrollProgress />

      <header className="topbar" aria-label="Houston Local Network">
        <a className="topbar__brand" href="#top" aria-label="Houston Local Network home">
          <span className="logo-slot logo-slot--stamp">
            <img src="/hln-logo-3d-mark.png" alt="Houston Local Network" />
          </span>
        </a>
        <nav className="topbar__nav" aria-label="Site">
          <a href="#perks">The perks</a>
          <a href="#mailer">Ad sizes</a>
          <a href="#map">Route map</a>
        </nav>
        <a href="/request-sample">Get your free sample ad</a>
      </header>

      <section className="hero" id="top" aria-label="Houston Local Network mailer ads">
        <div className="hero__bg" aria-hidden="true">
          <span className="hero__dots" />
          <span className="hero__strip" />
          <span className="hero__float hero__float--a">★</span>
          <span className="hero__float hero__float--b">⌂</span>
          <span className="hero__float hero__float--c">✦</span>
        </div>

        <div className="hero__inner">
          <div className="hero__copy">
            <p className="hero__kicker">
              <span className="hero__kicker-dot" aria-hidden="true" />
              Houston Local Network · made for your neighborhood
            </p>
            <h1 className="hero__title">
              <span className="hero__line">Local mail.</span>
              <span className="hero__line">
                <span className="hero__mark">Worth</span>
              </span>
              <span className="hero__line">opening.</span>
            </h1>
            <p className="hero__sub">
              Put your business in the middle of neighborhood life. Our shared
              Z-fold mailer brings local offers, community happenings, and a
              mascot hunt together — with your business along for the discovery.
            </p>
            <div className="hero__actions">
              <a className="btn btn--solid" href="/request-sample">
                Get your free sample ad
              </a>
              <a className="btn btn--outline" href="#perks">
                Discover what’s inside ↓
              </a>
            </div>
            <p className="hero__sample-invite">Have a logo, a business photo, or an existing ad? Let’s start with that.</p>
            <p className="hero__fine">
              Shared mailing. Local businesses. <strong>From 10¢ a door.</strong> 1,000-home minimum.
            </p>
          </div>

          <div className="hero__stage">
            <span className="hero__edition">A neighborhood in every fold.</span>
            <div className="hero__card-wrap">
              <div className="hero__front">
              <img
                className="hero__card"
                src="/hln-card-zfold.jpg"
                alt="Front cover of the Houston Local Network mailer, featuring the Neighborhood Hunt and four local business mascots"
                fetchPriority="high"
                width="1600"
                height="1043"
              />
              </div>
              <span className="hero__tape hero__tape--tl" aria-hidden="true" />
              <span className="hero__tape hero__tape--tr" aria-hidden="true" />
              <HeroStamp />
            </div>
            <p className="hero__scribble" aria-hidden="true">
              A little peek. A lot more inside.
            </p>
          </div>
        </div>
      </section>

      <Ticker />

      <PerksSection />

      <BusinessBenefitsSection />

      <RouteMapSection />

      <ZFoldSection />

      <ProofPackageRows />

      <SampleAdInvitation />

      <MailerProcess />

      <SiteFooter />
    </main>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="scroll-progress"
      aria-hidden="true"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function HeroStamp() {
  return (
    <div className="hero-stamp">
      <img
        src="/hln-logo-3d-mark.png"
        alt=""
      />
    </div>
  );
}

const TICKER_ITEMS = [
  "10¢ a door",
  "QR on every square",
  "5,000 homes per route",
  "$100 monthly gift card hunt",
  "Local businesses only",
  "USPS first-class",
  "New issue every month",
];

function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">
        {[0, 1].map((dup) => (
          <div className="ticker__group" key={dup}>
            {TICKER_ITEMS.map((item) => (
              <span className="ticker__item" key={`${dup}-${item}`}>
                {item}
                <span className="ticker__star">★</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const NEIGHBOR_DISCOVERIES = [
  {
    id: "events", num: "01", label: "Something to do.",
    text: "Discover local events and plan something fun for the family, close to home.",
    headline: "Good plans start close to home.",
    note: "Community happenings give neighbors a reason to check the mailer again.",
    image: "/hln-card-zfold.jpg", crop: "565 510 520 390",
    alt: "Around Town calendar excerpt from the HLN sample mailer", tag: "Around town",
  },
  {
    id: "offers", num: "02", label: "Something useful.",
    text: "Find an offer from a business right around the corner.",
    headline: "A local find. A reason to visit.",
    note: "From a sweet treat to help around the house, local offers make the discovery useful.",
    image: "/hln-card-inside.jpg", crop: "22 362 510 319",
    alt: "Bakery and ice cream offer examples from the HLN sample mailer", tag: "Shop the neighborhood",
  },
  {
    id: "hunt", num: "03", label: "Something to find.",
    text: "Look a little closer. There are mascots hiding inside.",
    headline: "Little characters. A bigger adventure.",
    note: "The Neighborhood Hunt invites readers to explore the mailer as they search for all four mascots.",
    image: "/hln-card-zfold.jpg", crop: "1110 640 485 395",
    alt: "Neighborhood Hunt cover excerpt with four local business mascots", tag: "The neighborhood hunt",
  },
  {
    id: "giveaway", num: "04", label: "Something to win.",
    text: "Join the hunt for a chance at a $100 local gift card.",
    headline: "Find them. Enter. Shop local.",
    note: "A monthly giveaway brings the hunt back to the local businesses that make it possible.",
    image: "/hln-card-zfold.jpg", crop: "18 508 525 255",
    alt: "One hundred dollar local gift card giveaway excerpt from the HLN sample mailer", tag: "$100 local gift card",
  },
];

function PerksSection() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const moveTab = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % NEIGHBOR_DISCOVERIES.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index + NEIGHBOR_DISCOVERIES.length - 1) % NEIGHBOR_DISCOVERIES.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = NEIGHBOR_DISCOVERIES.length - 1;
    else return;
    event.preventDefault();
    setActiveIndex(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className="section perks" id="perks" aria-labelledby="perks-heading">
      <div className="perks__head">
        <p className="eyebrow">Made for the people opening it</p>
        <h2 id="perks-heading">
          More than an ad. <span className="script">A reason to stay.</span>
        </h2>
        <p className="perks__intro">Give neighbors something to plan, use, find, and look forward to. Your business is part of the discovery.</p>
      </div>

      <div className="discovery">
        <div className="discovery__choices" role="tablist" aria-label="Explore what is inside the mailer">
          {NEIGHBOR_DISCOVERIES.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => { tabRefs.current[index] = element; }}
              className={`discovery__choice${index === activeIndex ? " is-active" : ""}`}
              type="button" role="tab" id={`discovery-tab-${item.id}`}
              aria-selected={index === activeIndex}
              aria-controls={`discovery-panel-${item.id}`}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => moveTab(event, index)}
            >
              <span className="discovery__num" aria-hidden="true">{item.num}</span>
              <span><span className="discovery__label">{item.label}</span><span className="discovery__text">{item.text}</span></span>
              <svg className="discovery__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
          ))}
        </div>

        {NEIGHBOR_DISCOVERIES.map((item, index) => (
          <div key={item.id} className={`discovery__panel discovery__panel--${item.id}`}
            role="tabpanel" id={`discovery-panel-${item.id}`}
            aria-labelledby={`discovery-tab-${item.id}`} hidden={activeIndex !== index} tabIndex={0}>
            <div className="discovery__art">
              <span className="discovery__backnumber" aria-hidden="true">{item.num}</span>
              <span className="discovery__tag">{item.tag}</span>
              <div className="discovery__clipping">
                <svg viewBox={item.crop} role="img" aria-label={item.alt}>
                  <image href={item.image} width="1600" height="1043" />
                </svg>
              </div>
              <span className="discovery__annotation" aria-hidden="true">a peek inside</span>
            </div>
            <div className="discovery__caption">
              <h3>{item.headline}</h3>
              <p>{item.note}</p>
              <span className="discovery__sample">From our sample mailer · Content varies by issue.</span>
            </div>
          </div>
        ))}
      </div>

      <div className="perks__takeaway">
        <svg className="perks__takeaway-star" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 0 31 17 48 24 31 31 24 48 17 31 0 24 17 17Z" fill="currentColor" /></svg>
        <p>A reason to open it. <span>A reason to explore it.</span> More chances to discover your business.</p>
        <span className="perks__takeaway-note">That’s the idea behind every fold.</span>
      </div>
    </section>
  );
}

function SampleAdInvitation() {
  return (
    <section className="sample-ad" id="sample-ad" aria-labelledby="sample-ad-heading">
      <div className="sample-ad__copy">
        <p className="eyebrow">See your business in the neighborhood</p>
        <h2 id="sample-ad-heading"><span className="sample-ad__headline-lead">Get your</span><span className="sample-ad__headline-offer"><span className="sample-ad__free">Free</span> sample ad.</span></h2>
        <p className="sample-ad__lead">Let’s make your business look good.</p>
        <p className="sample-ad__invitation">Send us your logo, a business photo, or an existing ad. We’ll show you how your business could look in the next HLN mailer.</p>
        <a className="btn btn--solid" href="/request-sample">Get your free sample ad →</a>
        <p className="sample-ad__reassurance">Free sample. No commitment to book. No routes or ad size needed to get started.</p>
      </div>
      <div className="sample-ad__assets">
        <p className="sample-ad__asset-kicker">Start with any one of these</p>
        <div className="sample-ad__asset"><span className="sample-ad__asset-number" aria-hidden="true">01</span><div><h3>Your logo</h3><p>Give us the mark that makes your business yours.</p></div></div>
        <div className="sample-ad__asset"><span className="sample-ad__asset-number" aria-hidden="true">02</span><div><h3>A business photo</h3><p>Your work, your team, your products, or your storefront.</p></div></div>
        <div className="sample-ad__asset"><span className="sample-ad__asset-number" aria-hidden="true">03</span><div><h3>An existing ad</h3><p>Something you already use is a great starting point.</p></div></div>
        <p className="sample-ad__asset-note">Tell us what you’d like to promote. We’ll help bring it together.</p>
      </div>
    </section>
  );
}

function ProofPackageRows() {
  const plan = useMailerPlan();
  const adSize = AD_SIZES[plan.sizeIndex];
  const packageRows = PROOF_PACKAGES.map((row) => ({ ...row, rate: `$${adSize.rate.toFixed(2)}`, spend: (Number(row.homes.replace(/,/g, "")) * adSize.rate).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }), qr: adSize.label.replace(" panel", ""), qrLabel: "panel size" }));
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const ghostX = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? ["0%", "0%"] : ["8%", "-10%"],
  );
  const ghostOpacity = useTransform(
    scrollYProgress,
    [0, 0.22, 0.82, 1],
    [0.03, 0.1, 0.08, 0.03],
  );

  return (
    <section
      className="proof-packages"
      id="packages"
      aria-label="Mailer package totals"
      ref={sectionRef}
    >
      <div className="packages-head">
        <Reveal>
          <p className="eyebrow eyebrow--on-dark">Example budgets · {adSize.label}</p>
          <h2>
            Pick your <span className="is-orange">route size.</span>
          </h2>
          <p className="packages-head__note">
            1,000-home minimum · {Math.round(adSize.rate * 100)}¢ per door
          </p>
        </Reveal>
      </div>
      <div className="proof-packages__pin">
        <motion.div
          className="proof-packages__ghost"
          aria-hidden="true"
          style={{ opacity: ghostOpacity, x: ghostX }}
        >
          {Math.round(adSize.rate * 100)}¢
        </motion.div>
        <div className="proof-packages__rows">
          {packageRows.map((packageRow, index) => (
            <ProofAnimatedRow
              index={index}
              key={`${packageRow.homes}-${packageRow.spend}`}
              packageRow={packageRow}
              progress={scrollYProgress}
              shouldReduceMotion={Boolean(shouldReduceMotion)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofAnimatedRow({
  index,
  packageRow,
  progress,
  shouldReduceMotion,
}: {
  index: number;
  packageRow: ProofPackage;
  progress: MotionValue<number>;
  shouldReduceMotion: boolean;
}) {
  const direction = packageRow.entrance === "left" ? -1 : 1;
  const start = 0.09 + index * 0.12;
  const enter = start + 0.1;
  const settle = start + 0.18;
  const pulseEnd = start + 0.34;
  const entranceOffset = shouldReduceMotion ? 0 : direction * 260;
  const overshoot = shouldReduceMotion ? 0 : direction * -24;
  const xRaw = useTransform(progress, [start, enter, settle], [
    entranceOffset,
    overshoot,
    0,
  ]);
  const x = useSpring(xRaw, { stiffness: 135, damping: 19, mass: 0.72 });
  const opacity = useTransform(progress, [start, start + 0.08], [0, 1]);
  const scale = useTransform(
    progress,
    [start, start + 0.14, pulseEnd],
    shouldReduceMotion ? [1, 1, 1] : [0.97, 1.025, 1],
  );
  const glowOpacity = useTransform(
    progress,
    [start + 0.02, start + 0.14, pulseEnd],
    shouldReduceMotion ? [0, 0, 0] : [0, 0.44, 0],
  );

  return (
    <motion.article
      className={`proof-row proof-row--${packageRow.entrance}`}
      style={{ opacity, scale, x }}
    >
      <motion.div
        className="proof-row__glow"
        aria-hidden="true"
        style={{ opacity: glowOpacity }}
      />
      <ProofAnimatedCell
        cellIndex={0}
        highlight
        label="estimated deliveries"
        progress={progress}
        rowStart={start}
        shouldReduceMotion={shouldReduceMotion}
        value={packageRow.homes}
      />
      <ProofAnimatedCell
        cellIndex={1}
        highlight
        label="per mailbox"
        progress={progress}
        rowStart={start}
        shouldReduceMotion={shouldReduceMotion}
        value={packageRow.rate}
      />
      <ProofAnimatedCell
        cellIndex={2}
        label="total"
        progress={progress}
        rowStart={start}
        shouldReduceMotion={shouldReduceMotion}
        value={packageRow.spend}
      />
      <ProofAnimatedCell
        cellIndex={3}
        isQr
        label={packageRow.qrLabel}
        progress={progress}
        rowStart={start}
        shouldReduceMotion={shouldReduceMotion}
        value={packageRow.qr}
      />
    </motion.article>
  );
}

function ProofAnimatedCell({
  cellIndex,
  label,
  highlight = false,
  isQr = false,
  progress,
  rowStart,
  shouldReduceMotion,
  value,
}: {
  cellIndex: number;
  label: string;
  highlight?: boolean;
  isQr?: boolean;
  progress: MotionValue<number>;
  rowStart: number;
  shouldReduceMotion: boolean;
  value: string;
}) {
  const numberStart = rowStart + 0.03 + cellIndex * 0.022;
  const numberEnd = numberStart + 0.09;
  const labelStart = numberStart + 0.045;
  const labelEnd = labelStart + 0.09;
  const valueOpacity = useTransform(progress, [numberStart, numberEnd], [0, 1]);
  const valueY = useTransform(
    progress,
    [numberStart, numberEnd],
    shouldReduceMotion ? [0, 0] : [18, 0],
  );
  const labelOpacity = useTransform(progress, [labelStart, labelEnd], [0, 1]);
  const labelY = useTransform(
    progress,
    [labelStart, labelEnd],
    shouldReduceMotion ? [0, 0] : [10, 0],
  );
  const scanOpacity = useTransform(
    progress,
    [labelStart, labelStart + 0.045, labelStart + 0.18],
    shouldReduceMotion ? [0, 0, 0] : [0, 0.88, 0],
  );
  const scanScaleX = useTransform(
    progress,
    [labelStart, labelStart + 0.18],
    shouldReduceMotion ? [1, 1] : [0, 1],
  );

  return (
    <div className="proof-cell">
      <motion.strong
        className={`proof-cell__value${highlight ? " is-orange" : ""}`}
        style={{ opacity: valueOpacity, y: valueY }}
      >
        {value}
      </motion.strong>
      <motion.span
        className="proof-cell__label"
        style={{ opacity: labelOpacity, y: labelY }}
      >
        {label}
      </motion.span>
      {isQr && (
        <motion.span
          className="proof-cell__scan"
          aria-hidden="true"
          style={{ opacity: scanOpacity, scaleX: scanScaleX }}
        />
      )}
    </div>
  );
}

const RESPONSE_ACTIONS = [
  { id: "scan", label: "QR scans", values: [6, 8, 10, 18], unit: "total QR scans", caption: "People opening your business page from the mailer.", limit: "Scans can include repeat visits; they are not unique customers." },
  { id: "call", label: "Call-button clicks", values: [1, 2, 3, 5], unit: "total call-button clicks", caption: "People tapping the call button on your business page.", limit: "A call-button click does not confirm a connected call or sale." },
  { id: "website", label: "Website clicks", values: [3, 5, 8, 12], unit: "total website clicks", caption: "People clicking through from your business page to your website.", limit: "A website click does not confirm an inquiry or purchase." },
];
const RESPONSE_DAYS = ["Drop day", "Day 2", "Day 4", "Day 7"];

function ResponseIllustration({ type }: { type: string }) {
  if (type === "scan") {
    const modules = ["10101101", "01100110", "11011001", "00101110", "10110011", "01010100", "11100101", "10011010"];
    return <svg viewBox="0 0 27 27" aria-hidden="true" className="response-demo__icon">
      <rect width="27" height="27" fill="#fffdf8" />
      {[[2, 2], [18, 2], [2, 18]].map(([x, y]) => <g key={`${x}-${y}`}><rect x={x} y={y} width="7" height="7" fill="currentColor" /><rect x={x + 1} y={y + 1} width="5" height="5" fill="#fffdf8" /><rect x={x + 2} y={y + 2} width="3" height="3" fill="currentColor" /></g>)}
      {modules.flatMap((row, y) => [...row].map((bit, x) => bit === "1" ? <rect key={`${x}-${y}`} x={11 + x * 1.7} y={11 + y * 1.7} width="1.3" height="1.3" fill="currentColor" /> : null))}
      <path d="M11 2h2v3h2v4h-2V7h-2zM2 11h3v2H2zm4 3h3v2H6zm5 9h3v2h-3z" fill="currentColor" />
    </svg>;
  }
  if (type === "call") return <svg viewBox="0 0 80 80" className="response-demo__icon" aria-hidden="true"><rect x="19" y="5" width="42" height="70" rx="7" fill="#fffdf8" stroke="currentColor" strokeWidth="3" /><path d="M32 12h16M35 67h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><circle cx="40" cy="39" r="15" fill="#f7955c" /><path d="m33 30-3 4c0 8 8 16 16 16l4-4-6-5-3 3c-3-1-5-3-6-6l3-3z" fill="currentColor" /></svg>;
  return <svg viewBox="0 0 80 80" className="response-demo__icon" aria-hidden="true"><rect x="5" y="13" width="70" height="49" rx="4" fill="#fffdf8" stroke="currentColor" strokeWidth="3" /><path d="M6 25h68M18 19h1m5 0h1m5 0h1M15 35h27m-27 8h20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><path d="m43 36 4 31 7-9 10 13 7-5-10-13 11-3z" fill="#f7955c" stroke="currentColor" strokeWidth="2" /></svg>;
}

function ResponseChart({ action, onComplete }: { action: typeof RESPONSE_ACTIONS[number]; onComplete: () => void }) {
  const reducedMotion = useReducedMotion();
  const [day, setDay] = React.useState(reducedMotion ? 3 : 0);
  const [playing, setPlaying] = React.useState(true);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    if (!playing || !visible || reducedMotion) return;
    const timer = day === 3
      ? window.setTimeout(onComplete, 1500)
      : window.setTimeout(() => setDay((previous) => previous + 1), 1000);
    return () => window.clearTimeout(timer);
  }, [day, playing, visible, reducedMotion, onComplete]);
  React.useEffect(() => { if (reducedMotion) { setDay(3); setPlaying(false); } }, [reducedMotion]);
  const maximum = Math.ceil(action.values[3] / 2) * 2;
  const points = action.values.map((value, index) => ({ x: 40 + [0, 2, 4, 7][index] / 7 * 300, y: 145 - value / maximum * 115 }));
  const line = points.slice(0, day + 1).map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  return <motion.div className="response-demo" onViewportEnter={() => setVisible(true)}
    onViewportLeave={() => setVisible(false)} viewport={{ amount: 0.25 }}>
    <div className="response-demo__summary">
      <div className="response-demo__illustration"><ResponseIllustration type={action.id} /><span>{action.id === "scan" ? "QR illustration" : action.id === "call" ? "Tap to call" : "Visit website"}</span></div>
      <div className="response-demo__total"><span className="response-demo__asof">Example · {RESPONSE_DAYS[day]}</span><strong>{action.values[day]}</strong><span>{action.unit}</span></div>
    </div>
    <div className="response-demo__chart">
      <svg viewBox="0 0 380 174" role="img" aria-label={`Illustrative cumulative ${action.label.toLowerCase()}: ${action.values.map((value, index) => `${RESPONSE_DAYS[index]}, ${value} total`).join("; ")}. Not actual campaign results.`}>
        {[0, maximum / 2, maximum].map((value) => { const y = 145 - value / maximum * 115; return <g key={value}><line x1="40" x2="340" y1={y} y2={y} stroke="#d5cdbc" strokeDasharray="3 5" /><text x="24" y={y + 4} textAnchor="end">{value}</text></g>; })}
        {day > 0 && <path d={`${line} L${points[day].x},145 L40,145 Z`} fill="#f7955c" opacity=".16" />}
        <motion.path d={line} fill="none" stroke="#ad5627" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => <g key={index}><text x={point.x} y="165" textAnchor="middle">{RESPONSE_DAYS[index]}</text>{index <= day && <><circle cx={point.x} cy={point.y} r="5" fill={index === day ? "#0e0e0c" : "#ad5627"} stroke="#fffdf8" strokeWidth="2" /><text className="response-demo__point-value" x={point.x} y={point.y - 12} textAnchor="middle">{action.values[index]}</text></>}</g>)}
      </svg>
    </div>
    <div className="response-demo__days" aria-label="Explore example cumulative totals">
      {RESPONSE_DAYS.map((label, index) => <button type="button" key={label} aria-pressed={day === index} aria-label={`${label}: ${action.values[index]} ${action.unit}`} onClick={() => { setPlaying(false); setDay(index); }}><span>{label}</span><strong>{action.values[index]}</strong><span>total</span></button>)}
    </div>
    <div className="response-demo__chart-note"><span>Cumulative totals · illustrative numbers</span><button type="button" onClick={() => { if (!playing && day === 3) setDay(0); setPlaying((previous) => !previous); }} disabled={!!reducedMotion}>{reducedMotion ? "Animation off" : playing ? "Pause animation" : "Play animation"}</button></div>
    <p className="response-demo__caption">{action.caption}</p>
    <p className="response-demo__limit">{action.limit}</p>
  </motion.div>;
}

function BusinessBenefitsSection() {
  const [selected, setSelected] = React.useState(0);
  const action = RESPONSE_ACTIONS[selected];
  const nextMetric = React.useCallback(() => setSelected((previous) => (previous + 1) % RESPONSE_ACTIONS.length), []);
  return (
    <section className="business-benefits" id="business" aria-labelledby="business-heading">
      <div className="business-benefits__inner">
        <div className="business-benefits__grid">
          <div className="business-benefits__reasons">
        <div className="business-benefits__head">
          <p className="eyebrow eyebrow--on-dark">Here’s what your business gets</p>
          <h2 id="business-heading">Your ad. Your page.<br /><span className="is-orange">See the response.</span></h2>
          <p>A custom ad gets you noticed. Your business page gives readers a next step. Tracking helps you see the actions that follow.</p>
        </div>
            <article><span className="business-benefits__number">01</span><div><h3>A custom ad.</h3><p>Your brand, your offer, and a clear reason to choose you — designed for the neighborhood mailer.</p></div></article>
            <article><span className="business-benefits__number">02</span><div><h3>Your own business page.</h3><p>A place to learn about your business, tap to call, or visit your website after scanning your ad.</p></div></article>
            <article><span className="business-benefits__number">03</span><div><h3>Response tracking.</h3><p>See how scans, call-button clicks, and website clicks build after delivery.</p><span className="business-benefits__coming">Advertiser reporting · coming soon</span></div></article>
            <a className="business-benefits__map-link" href="#map">Choose your neighborhoods <span aria-hidden="true">→</span></a>
          </div>
          <div className="response-preview">
            <div className="response-preview__heading"><span>Example report</span><span>Illustrative numbers</span></div>
            <h3>See the response<br /><span>build after delivery.</span></h3>
            <p className="response-preview__intro">Choose a metric. Follow an example week.</p>
            <div className="response-preview__actions" aria-label="Choose an example response metric">
              {RESPONSE_ACTIONS.map((item, index) => <button type="button" key={item.id} aria-pressed={selected === index} aria-controls="response-example" onClick={() => setSelected(index)}>{item.label}</button>)}
            </div>
            <div id="response-example"><ResponseChart key={action.id} action={action} onComplete={nextMetric} /></div>
            <p className="response-preview__availability">Demo only — not actual results or a performance forecast. Advertiser reporting is coming soon.</p>
          </div>
        </div>
        <div className="business-benefits__close"><span>From the mailbox to your business.</span><span className="script">See the next step.</span></div>
      </div>
    </section>
  );
}

function MailerProcess() {
  const steps = [
    { title: 'Request your free sample.', copy: 'Share your business, what you’d like to promote, and any artwork you have. We’ll help you picture your ad in the mailer.' },
    { title: 'Confirm your size & routes.', copy: 'We’ll confirm your preferred ad size, routes, pricing, and availability together. Paid mailings start at 1,000 homes.' },
    { title: 'Approve your design.', copy: 'Review your design and placement. You approve the final artwork before it goes to print.' },
    { title: 'Fill it. Then mail it.', copy: 'We print and mail once the shared mailer for those routes is filled. We’ll confirm the mailing schedule with you.' },
  ];
  return (
    <section className="section mailer-process" id="reserve" aria-labelledby="mailer-process-heading">
      <div className="mailer-process__panel">
        <div className="mailer-process__head">
          <p className="eyebrow eyebrow--on-dark">Here’s how it comes together</p>
          <h2 id="mailer-process-heading">From first idea.<br /><span>To their mailbox.</span></h2>
          <p>A little about your business. A plan we build together. A place in the neighborhood.</p>
        </div>
        <ol className="mailer-process__steps">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="mailer-process__number" aria-hidden="true">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </li>
          ))}
        </ol>
        <div className="mailer-process__start">
          <div><h3>Your first step is free.</h3><p>A sample request doesn’t commit you to buying. Choosing routes doesn’t reserve space or set a mailing date.</p></div>
          <LiquidLink className="route-cta" href="/request-sample">Get your free sample ad →</LiquidLink>
        </div>
        <RouteInquiry />
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <img src="/hln-logo-3d-mark.png" alt="Houston Local Network" />
          <p className="site-footer__script">
            Local businesses. Local homes. Local offers.
          </p>
          <p>
            Shared Z-fold mailers that bring local offers and neighborhood life
            together. Made for Houston&apos;s local businesses.
          </p>
          <a className="btn btn--solid site-footer__sample" href="/request-sample">Get your free sample ad →</a>
        </div>
        <nav className="site-footer__nav" aria-label="Footer">
          <h4>Explore the mailer</h4>
          <a href="#perks">The perks</a>
          <a href="#mailer">Ad sizes</a>
          <a href="#packages">Sample budgets</a>
          <a href="#map">Route planner</a>
          <a href="#reserve">How it works</a>
        </nav>
        <div className="site-footer__fine">
          <h4>Good to know</h4>
          <ul className="site-footer__details">
            <li><strong>From 10¢ per door</strong><span>For a 1/6-panel ad.</span></li>
            <li><strong>1,000-home mailing minimum</strong><span>No minimum for a free sample.</span></li>
            <li><strong>Shared mailers print once filled</strong><span>Routes, availability, and mailing dates confirmed with HLN.</span></li>
          </ul>
          <p className="site-footer__reporting">Advertiser response reporting is coming soon.</p>
        </div>
      </div>
      <div className="site-footer__bar">
        <span>© {new Date().getFullYear()} Houston Local Network — Houston, TX</span>
        <span className="site-footer__tag">Shop local. Support local.</span>
      </div>
    </footer>
  );
}

function GradientSvg({
  className,
  isHovered,
  colors,
  gradientId,
}: {
  className: string;
  isHovered: boolean;
  colors: Colors;
  gradientId: string;
}) {
  const svgStates: SvgStates = {
    svg1: {
      gradientTransform:
        "translate(287.5 280) rotate(-29.0546) scale(689.807 1000)",
      stops: [
        { offset: 0, stopColor: colors.color1 },
        { offset: 0.188423, stopColor: colors.color2 },
        { offset: 0.260417, stopColor: colors.color3 },
        { offset: 0.328792, stopColor: colors.color4 },
        { offset: 0.328892, stopColor: colors.color5 },
        { offset: 0.328992, stopColor: colors.color1 },
        { offset: 0.442708, stopColor: colors.color6 },
        { offset: 0.537556, stopColor: colors.color7 },
        { offset: 0.631738, stopColor: colors.color1 },
        { offset: 0.725645, stopColor: colors.color8 },
        { offset: 0.817779, stopColor: colors.color9 },
        { offset: 0.84375, stopColor: colors.color10 },
        { offset: 0.90569, stopColor: colors.color1 },
        { offset: 1, stopColor: colors.color11 },
      ],
    },
    svg2: {
      gradientTransform:
        "translate(126.5 418.5) rotate(-64.756) scale(533.444 773.324)",
      stops: [
        { offset: 0, stopColor: colors.color1 },
        { offset: 0.104167, stopColor: colors.color12 },
        { offset: 0.182292, stopColor: colors.color13 },
        { offset: 0.28125, stopColor: colors.color1 },
        { offset: 0.328792, stopColor: colors.color4 },
        { offset: 0.328892, stopColor: colors.color5 },
        { offset: 0.453125, stopColor: colors.color6 },
        { offset: 0.515625, stopColor: colors.color7 },
        { offset: 0.631738, stopColor: colors.color1 },
        { offset: 0.692708, stopColor: colors.color8 },
        { offset: 0.75, stopColor: colors.color14 },
        { offset: 0.817708, stopColor: colors.color9 },
        { offset: 0.869792, stopColor: colors.color10 },
        { offset: 1, stopColor: colors.color1 },
      ],
    },
    svg3: {
      gradientTransform:
        "translate(264.5 339.5) rotate(-42.3022) scale(946.451 1372.05)",
      stops: [
        { offset: 0, stopColor: colors.color1 },
        { offset: 0.188423, stopColor: colors.color2 },
        { offset: 0.307292, stopColor: colors.color1 },
        { offset: 0.328792, stopColor: colors.color4 },
        { offset: 0.328892, stopColor: colors.color5 },
        { offset: 0.442708, stopColor: colors.color15 },
        { offset: 0.537556, stopColor: colors.color16 },
        { offset: 0.631738, stopColor: colors.color1 },
        { offset: 0.725645, stopColor: colors.color17 },
        { offset: 0.817779, stopColor: colors.color9 },
        { offset: 0.84375, stopColor: colors.color10 },
        { offset: 0.90569, stopColor: colors.color1 },
        { offset: 1, stopColor: colors.color11 },
      ],
    },
    svg4: {
      gradientTransform:
        "translate(860.5 420) rotate(-153.984) scale(957.528 1388.11)",
      stops: [
        { offset: 0.109375, stopColor: colors.color11 },
        { offset: 0.171875, stopColor: colors.color2 },
        { offset: 0.260417, stopColor: colors.color13 },
        { offset: 0.328792, stopColor: colors.color4 },
        { offset: 0.328892, stopColor: colors.color5 },
        { offset: 0.328992, stopColor: colors.color1 },
        { offset: 0.442708, stopColor: colors.color6 },
        { offset: 0.515625, stopColor: colors.color7 },
        { offset: 0.631738, stopColor: colors.color1 },
        { offset: 0.692708, stopColor: colors.color8 },
        { offset: 0.817708, stopColor: colors.color9 },
        { offset: 0.869792, stopColor: colors.color10 },
        { offset: 1, stopColor: colors.color11 },
      ],
    },
  };
  const maxStops = Math.max(
    ...Object.values(svgStates).map((svg) => svg.stops.length),
  );
  const stopsAnimationArray = createStopsArray(svgStates, svgOrder, maxStops);
  const gradientTransform = svgOrder.map(
    (svgKey) => svgStates[svgKey].gradientTransform,
  );
  const duration = isHovered ? 42 : 13;

  return (
    <svg
      className={className}
      width="1030"
      height="280"
      viewBox="0 0 1030 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1030" height="280" rx="140" fill={`url(#${gradientId})`} />
      <defs>
        <motion.radialGradient
          id={gradientId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          animate={{ gradientTransform }}
          transition={{ duration, repeat: Infinity, ease: "linear" }}
        >
          {stopsAnimationArray.map((stopConfigs, index) => (
            <AnimatePresence key={index}>
              <motion.stop
                initial={{
                  offset: stopConfigs[0].offset,
                  stopColor: stopConfigs[0].stopColor,
                }}
                animate={{
                  offset: stopConfigs.map((config) => config.offset),
                  stopColor: stopConfigs.map((config) => config.stopColor),
                }}
                transition={{ duration, repeat: Infinity, ease: "linear" }}
              />
            </AnimatePresence>
          ))}
        </motion.radialGradient>
      </defs>
    </svg>
  );
}

function Liquid({
  isHovered,
  colors,
  gradientId,
}: {
  isHovered: boolean;
  colors: Colors;
  gradientId: string;
}) {
  return (
    <>
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className={`liquid-blob liquid-blob--${index + 1}`}>
          <GradientSvg
            className="liquid-blob__svg"
            isHovered={isHovered}
            colors={colors}
            gradientId={`${gradientId}-${index}`}
          />
        </div>
      ))}
    </>
  );
}

function LiquidLink({
  children,
  className = "",
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const [isActive, setIsActive] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();
  const gradientId = React.useId().replace(/:/g, "");
  const canAnimate = !shouldReduceMotion;

  return (
    <a
      {...props}
      className={`liquid-button ${className}`.trim()}
      onBlur={(event) => {
        setIsActive(false);
        props.onBlur?.(event);
      }}
      onFocus={(event) => {
        setIsActive(true);
        props.onFocus?.(event);
      }}
      onPointerEnter={(event) => {
        setIsActive(true);
        props.onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        setIsActive(false);
        props.onPointerLeave?.(event);
      }}
    >
      <span className="liquid-button__fallback" aria-hidden="true" />
      {canAnimate && (
        <span className="liquid-button__liquid" aria-hidden="true">
          <Liquid
            isHovered={isActive}
            colors={LIQUID_BUTTON_COLORS}
            gradientId={`liquid-${gradientId}`}
          />
        </span>
      )}
      <span className="liquid-button__label">{children}</span>
    </a>
  );
}

export default App;
