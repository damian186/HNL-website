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

function RouteInquiry() {
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
  if (!summary) return null;
  return <div className="planner-inquiry"><label htmlFor="route-inquiry-summary">Your selected route plan</label><textarea id="route-inquiry-summary" readOnly value={summary} /><button onClick={async () => {
    try { await navigator.clipboard.writeText(summary); setCopied(true); } catch { setCopied(false); }
  }}>{copied ? 'Copied' : 'Copy route plan'}</button><p>Keep this plan for your conversation with HLN. Selecting routes does not reserve space or submit an order.</p></div>;
}

const CALENDLY_EMBED_URL = "https://calendly.com/keith-smartcadence/30min?hide_event_type_details=1&hide_gdpr_banner=1&background_color=000000&text_color=fbebd0&primary_color=f7955c";
const CALENDLY_SCRIPT_ID = "calendly-widget-script";

type CalendlyWidgetOptions = {
  parentElement: HTMLElement;
  resize?: boolean;
  url: string;
};

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget?: (options: CalendlyWidgetOptions) => void;
    };
  }
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
  const [isCalendlyOpen, setIsCalendlyOpen] = React.useState(false);
  const calendlyBookingRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!window.location.hash) {
      return;
    }

    window.requestAnimationFrame(() => {
      document.querySelector(window.location.hash)?.scrollIntoView();
    });
  }, []);

  const openCalendly = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setIsCalendlyOpen(true);

    window.requestAnimationFrame(() => {
      calendlyBookingRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

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
          <a href="#packages">Packages</a>
          <a href="#map">Route map</a>
          <a href="#routes">Routes</a>
        </nav>
        <a href="#reserve">Check available routes</a>
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
              <a className="btn btn--solid" href="#perks">
                Discover what’s inside ↓
              </a>
              <a className="btn btn--outline" href="#map">
                Explore neighborhoods
              </a>
            </div>
            <p className="hero__fine">
              Shared mailing. Local businesses. <strong>From 10¢ a door.</strong>
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

      <ProofPackageRows />

      <HowItWorks />

      <RouteMapSection />

      <RouteBoard />

      <section
        className="section calendly-section"
        id="reserve"
        aria-label="Calendly route availability"
      >
        <div className="reserve-panel">
          <RouteInquiry />
          <p className="reserve-panel__tag">Reservation window — open</p>
          <div className="calendly-section__launch">
            <p className="route-cta-copy">
              Schedule a quick discovery call to discuss which plan fits your budget
              and which route fits your needs.
            </p>
            <LiquidLink
              aria-controls="calendly-booking"
              aria-expanded={isCalendlyOpen}
              className="route-cta"
              href="#reserve"
              onClick={openCalendly}
            >
              Check available routes
            </LiquidLink>
          </div>
          {isCalendlyOpen && (
            <div
              className="calendly-section__booking"
              id="calendly-booking"
              ref={calendlyBookingRef}
            >
              <CalendlyInlineWidget />
            </div>
          )}
        </div>
      </section>

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
    text: "Discover local events and make a plan close to home.",
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

function ProofPackageRows() {
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
          <p className="eyebrow eyebrow--on-dark">Proof of spend — package totals</p>
          <h2>
            Pick your <span className="is-orange">route size.</span>
          </h2>
          <p className="packages-head__note">
            same 10¢ everywhere — bigger route, bigger reach
          </p>
        </Reveal>
      </div>
      <div className="proof-packages__pin">
        <motion.div
          className="proof-packages__ghost"
          aria-hidden="true"
          style={{ opacity: ghostOpacity, x: ghostX }}
        >
          10¢
        </motion.div>
        <div className="proof-packages__rows">
          {PROOF_PACKAGES.map((packageRow, index) => (
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
        label="verified homes"
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

const HOW_STEPS = [
  {
    num: "1",
    title: "Mail",
    text: "One shared card lands in up to 5,000 mailboxes on your route.",
  },
  {
    num: "2",
    title: "Scan",
    text: "Your square carries its own QR code. Every scan is yours.",
  },
  {
    num: "3",
    title: "Track",
    text: "Scans, timing, and route response feed straight to your report.",
  },
];

function HowItWorks() {
  return (
    <section className="section howto" aria-label="How the mailer works">
      <Reveal className="howto__head">
        <p className="eyebrow">How it works</p>
        <h2>
          Mail, scan, <span className="script">track.</span>
        </h2>
      </Reveal>
      <div className="howto__row">
        {HOW_STEPS.map((step, index) => (
          <motion.article
            key={step.num}
            className={index === 2 ? "ticket ticket--accent" : "ticket"}
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            style={{ opacity: 0, y: 22 }}
            transition={{ duration: 0.55, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="ticket__num">{step.num}</span>
            <h3 className="ticket__title">{step.title}</h3>
            <p className="ticket__text">{step.text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

type RouteStatus = "open" | "reserved" | "waitlist";

type ManifestRoute = {
  route: string;
  area: string;
  homes: string;
  status: RouteStatus;
};

const ROUTE_MANIFEST: ManifestRoute[] = [
  { route: "26", area: "Spring Branch", homes: "5,000", status: "open" },
  { route: "14", area: "The Heights", homes: "4,200", status: "open" },
  { route: "09", area: "Katy", homes: "6,800", status: "reserved" },
  { route: "31", area: "Cypress", homes: "5,400", status: "open" },
  { route: "17", area: "Bellaire", homes: "3,900", status: "waitlist" },
  { route: "42", area: "Pearland", homes: "6,100", status: "open" },
  { route: "05", area: "Sugar Land", homes: "7,200", status: "reserved" },
  { route: "38", area: "The Woodlands", homes: "5,800", status: "open" },
];

const STATUS_LABEL: Record<RouteStatus, string> = {
  open: "Open",
  reserved: "Reserved",
  waitlist: "Waitlist",
};

function RouteBoard() {
  return (
    <section className="section routes" id="routes" aria-label="Route board">
      <Reveal className="routes__head">
        <p className="eyebrow">Route board — active drop zones</p>
        <h2>
          Where the <span className="script">card</span> lands.
        </h2>
        <div className="routes__legend" aria-hidden="true">
          <span className="routes__legend-item">
            <i className="chip chip--open" /> Open — slots available
          </span>
          <span className="routes__legend-item">
            <i className="chip chip--reserved" /> Reserved — next drop locked
          </span>
          <span className="routes__legend-item">
            <i className="chip chip--waitlist" /> Waitlist — join the queue
          </span>
        </div>
      </Reveal>

      <ol className="route-grid">
        {ROUTE_MANIFEST.map((manifestRoute, index) => (
          <motion.li
            key={manifestRoute.route}
            className={`route-card route-card--${manifestRoute.status}`}
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            style={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="route-card__rt">RT {manifestRoute.route}</span>
            <span className="route-card__area">{manifestRoute.area}</span>
            <span className="route-card__homes">
              {manifestRoute.homes} <em>homes</em>
            </span>
            <span className={`chip chip--${manifestRoute.status}`}>
              {STATUS_LABEL[manifestRoute.status]}
            </span>
          </motion.li>
        ))}
      </ol>

      <Reveal delay={0.1}>
        <p className="routes__footnote">
          Don&apos;t see your zip? Routes certify monthly — ask at booking.
        </p>
      </Reveal>
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
            Shared-card direct mail for Houston&apos;s local businesses. One
            card, thousands of mailboxes, every scan accounted for.
          </p>
        </div>
        <nav className="site-footer__nav" aria-label="Footer">
          <h4>The card</h4>
          <a href="#perks">The perks</a>
          <a href="#packages">Packages</a>
          <a href="#map">Route map</a>
          <a href="#routes">Routes</a>
          <a href="#reserve">Reserve</a>
        </nav>
        <div className="site-footer__fine">
          <h4>The fine print</h4>
          <p>
            10¢ PER MAILBOX
            <br />
            QR TRACKING INCLUDED
            <br />
            USPS FIRST-CLASS
            <br />
            $100 MONTHLY GIVEAWAY
          </p>
        </div>
      </div>
      <div className="site-footer__bar">
        <span>© 2026 Houston Local Network — Houston, TX</span>
        <span className="site-footer__tag">Shop local. Support local. Win local.</span>
      </div>
    </footer>
  );
}

function CalendlyInlineWidget() {
  const widgetRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const widget = widgetRef.current;

    if (!widget) {
      return undefined;
    }

    let isCancelled = false;
    let retryTimer: number | undefined;

    const initializeWidget = () => {
      if (isCancelled || !window.Calendly?.initInlineWidget) {
        return;
      }

      widget.innerHTML = "";
      widget.removeAttribute("data-processed");
      window.Calendly.initInlineWidget({
        parentElement: widget,
        resize: true,
        url: CALENDLY_EMBED_URL,
      });
    };

    const appendScript = () => {
      const script = document.createElement("script");
      script.id = CALENDLY_SCRIPT_ID;
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      script.addEventListener("load", initializeWidget, { once: true });
      document.body.appendChild(script);
    };

    if (window.Calendly?.initInlineWidget) {
      initializeWidget();
    } else {
      const existingScript = document.getElementById(CALENDLY_SCRIPT_ID);

      if (existingScript) {
        existingScript.addEventListener("load", initializeWidget, { once: true });
        retryTimer = window.setTimeout(() => {
          if (!isCancelled && !window.Calendly?.initInlineWidget) {
            existingScript.remove();
            appendScript();
          }
        }, 1200);
      } else {
        appendScript();
      }
    }

    return () => {
      isCancelled = true;
      window.clearTimeout(retryTimer);
    };
  }, []);

  return (
    <div
      className="calendly-inline-widget"
      data-url={CALENDLY_EMBED_URL}
      data-auto-load="false"
      data-resize="true"
      ref={widgetRef}
      style={{ minWidth: "320px", minHeight: "700px" }}
    />
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
