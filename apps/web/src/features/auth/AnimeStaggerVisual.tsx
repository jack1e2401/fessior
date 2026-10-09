import { useEffect, useRef, type RefObject } from 'react';
import { animate, createScope, onScroll, stagger } from 'animejs';

type AnimeStaggerVisualProps = {
  variant?: 'auth' | 'ambient';
  scrollContainer?: RefObject<HTMLElement | null>;
  scrollTarget?: RefObject<HTMLElement | null>;
};

const dots = [
  { radius: 104, count: 28, size: 1.8 },
  { radius: 132, count: 30, size: 3.1 },
  { radius: 160, count: 34, size: 5.4 },
  { radius: 188, count: 38, size: 7.4 },
].flatMap(({ radius, count, size }, ring) =>
  Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    const pulseSize = size * (0.78 + ((index + ring) % 4) * 0.12);
    return {
      key: `${ring}-${index}`,
      cx: 250 + Math.cos(angle) * radius,
      cy: 250 + Math.sin(angle) * radius,
      size: pulseSize,
    };
  }),
);

const tickAngles = Array.from({ length: 144 }, (_, index) => (index / 144) * Math.PI * 2);

const codeBars = [
  { x: 155, y: 250, widths: [18, 58, 36, 24] },
  { x: 175, y: 276, widths: [38, 72, 28] },
  { x: 175, y: 302, widths: [24, 48, 64, 20] },
  { x: 195, y: 328, widths: [48, 34, 58] },
  { x: 175, y: 354, widths: [34, 70, 26] },
  { x: 155, y: 380, widths: [22, 52, 42, 28] },
];

function AmbientDial() {
  return (
      <svg viewBox="0 0 500 500" className="h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id="ambient-dial-glow">
            <stop offset="0%" stopColor="#5598ff" stopOpacity="0.13" />
            <stop offset="70%" stopColor="#5598ff" stopOpacity="0.025" />
            <stop offset="100%" stopColor="#5598ff" stopOpacity="0" />
          </radialGradient>
          <filter id="ambient-dial-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <circle cx="250" cy="250" r="228" fill="url(#ambient-dial-glow)" />
        <circle cx="250" cy="250" r="221" fill="none" stroke="#080a0c" strokeWidth="15" opacity="0.7" />
        <circle cx="250" cy="250" r="218" fill="none" stroke="#121416" strokeWidth="1.5" />
        <circle cx="250" cy="250" r="207" fill="none" stroke="#111315" strokeWidth="4" />

        {tickAngles.map((angle, index) => {
          const inner = index % 6 === 0 ? 198 : 201;
          const x1 = 250 + Math.cos(angle) * inner;
          const y1 = 250 + Math.sin(angle) * inner;
          const x2 = 250 + Math.cos(angle) * 207;
          const y2 = 250 + Math.sin(angle) * 207;
          return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={index % 6 === 0 ? '#5598ff' : '#35577c'} strokeWidth={index % 6 === 0 ? 1.5 : 0.9} opacity={index % 6 === 0 ? 0.72 : 0.5} />;
        })}

        <circle cx="250" cy="250" r="193" fill="none" stroke="#101214" strokeWidth="1.5" />
        <circle cx="250" cy="250" r="183" fill="none" stroke="#151719" strokeWidth="1.5" />
        <circle cx="250" cy="250" r="171" fill="none" stroke="#101214" strokeWidth="3" />

        <g transform="rotate(-90 250 250)" filter="url(#ambient-dial-glow-filter)">
          <circle cx="250" cy="250" r="221" fill="none" stroke="#ff4d55" strokeWidth="3" strokeDasharray="128 1260" />
          <circle cx="250" cy="250" r="221" fill="none" stroke="#ffad34" strokeWidth="3" strokeDasharray="93 1295" strokeDashoffset="-139" />
          <circle cx="250" cy="250" r="221" fill="none" stroke="#12e5b1" strokeWidth="3" strokeDasharray="154 1234" strokeDashoffset="-249" />
          <circle cx="250" cy="250" r="221" fill="none" stroke="#438cff" strokeWidth="4" strokeDasharray="128 1260" strokeDashoffset="-416" />
          <circle cx="250" cy="250" r="221" fill="none" stroke="#18c9e6" strokeWidth="3" strokeDasharray="172 1216" strokeDashoffset="-558" />
          <circle cx="250" cy="250" r="221" fill="none" stroke="#a4ec48" strokeWidth="3" strokeDasharray="128 1260" strokeDashoffset="-744" />
          <circle cx="250" cy="250" r="221" fill="none" stroke="#ffc62e" strokeWidth="3" strokeDasharray="115 1273" strokeDashoffset="-884" />
        </g>

        <circle cx="250" cy="250" r="157" fill="#202224" stroke="#17191b" strokeWidth="1.5" />
        <path d="M130 125a158 158 0 0 1 87-48l25 20a135 135 0 0 0-91 93l-20 14a156 156 0 0 1-1-79Z" fill="#696765" opacity="0.22" />
        {dots.map((dot) => <circle className="dial-dot" key={dot.key} cx={dot.cx} cy={dot.cy} r={dot.size} fill="#5598ff" />)}
      </svg>
  );
}

function AuthJudgingVisual() {
  return (
    <svg viewBox="0 0 600 600" role="img" aria-label="Animated coding and judging visualization" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id="auth-scene-glow">
          <stop offset="0%" stopColor="#398cff" stopOpacity="0.11" />
          <stop offset="70%" stopColor="#398cff" stopOpacity="0.025" />
          <stop offset="100%" stopColor="#398cff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="auth-code-scan" x1="0" x2="1">
          <stop offset="0%" stopColor="#4d91ff" stopOpacity="0" />
          <stop offset="50%" stopColor="#4d91ff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#4d91ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="300" cy="300" r="278" fill="url(#auth-scene-glow)" />
      <circle cx="300" cy="300" r="235" fill="none" stroke="#ffffff" strokeOpacity="0.035" />
      <circle cx="300" cy="300" r="220" fill="none" stroke="#ffffff" strokeOpacity="0.045" strokeDasharray="2 12" />
      <g className="auth-orbit-slow" style={{ transformOrigin: '300px 300px' }}>
        <circle cx="300" cy="300" r="252" fill="none" stroke="#5598ff" strokeOpacity="0.18" strokeWidth="1.5" strokeDasharray="76 1508" />
        <circle cx="300" cy="48" r="3" fill="#5598ff" />
        <circle cx="552" cy="300" r="3" fill="#20d9b5" />
        <circle cx="300" cy="552" r="3" fill="#ffad34" />
      </g>

      <circle cx="300" cy="300" r="202" fill="none" stroke="#ffffff" strokeOpacity="0.055" />
      <path d="M300 98 A202 202 0 0 1 502 300" fill="none" stroke="#20d9b5" strokeOpacity="0.42" strokeWidth="2" />
      <path d="M98 300 A202 202 0 0 1 300 98" fill="none" stroke="#ffad34" strokeOpacity="0.32" strokeWidth="2" />

      <rect x="91" y="174" width="354" height="252" rx="16" fill="#17191b" stroke="#ffffff" strokeOpacity="0.12" />
      <path d="M92 218h352" stroke="#ffffff" strokeOpacity="0.08" />
      <circle cx="118" cy="197" r="4" fill="#ff5b63" fillOpacity="0.85" />
      <circle cx="134" cy="197" r="4" fill="#ffad34" fillOpacity="0.8" />
      <circle cx="150" cy="197" r="4" fill="#20d9b5" fillOpacity="0.75" />
      <rect x="381" y="191" width="34" height="12" rx="6" fill="#25292e" />
      <circle cx="391" cy="197" r="2" fill="#5598ff" />
      <rect x="399" y="194" width="10" height="5" rx="2.5" fill="#5b626b" />

      {codeBars.map((row, rowIndex) => {
        let x = row.x;
        return row.widths.map((width, segmentIndex) => {
          const segmentX = x;
          x += width + 8;
          const palette = ['#5598ff', '#a27bff', '#d5dbe3', '#20d9b5'];
          return <rect className="auth-code-line" key={`${rowIndex}-${segmentIndex}`} x={segmentX} y={row.y} width={width} height="5" rx="2.5" fill={palette[(rowIndex + segmentIndex) % palette.length]} fillOpacity="0.78" style={{ transformOrigin: `${segmentX}px ${row.y + 2.5}px` }} />;
        });
      })}
      <rect className="auth-code-scan" x="115" y="235" width="306" height="2" fill="url(#auth-code-scan)" opacity="0" />

      <path d="M445 300h38m0-58v116" fill="none" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1.5" />
      <path d="M483 242v116" fill="none" stroke="#5598ff" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 7" />

      <g className="auth-judge-node" style={{ transformOrigin: '483px 242px' }}>
        <circle cx="483" cy="242" r="17" fill="#18252a" stroke="#20d9b5" strokeOpacity="0.5" />
        <path d="m477 242 4 4 8-9" fill="none" stroke="#20d9b5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="auth-judge-node" style={{ transformOrigin: '483px 300px' }}>
        <circle cx="483" cy="300" r="17" fill="#1c2230" stroke="#5598ff" strokeOpacity="0.58" />
        <path d="M481 293v14l11-7-11-7Z" fill="#5598ff" fillOpacity="0.9" />
      </g>
      <g className="auth-judge-node" style={{ transformOrigin: '483px 358px' }}>
        <circle cx="483" cy="358" r="17" fill="#29251c" stroke="#ffad34" strokeOpacity="0.5" />
        <path d="m478 358 4 4 7-8" fill="none" stroke="#ffad34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle className="auth-flow-signal" cx="483" cy="242" r="3.5" fill="#eaf5ff" />

      <circle cx="299" cy="466" r="3" fill="#5598ff" fillOpacity="0.45" />
      <circle cx="319" cy="466" r="3" fill="#20d9b5" fillOpacity="0.35" />
      <circle cx="339" cy="466" r="3" fill="#ffad34" fillOpacity="0.25" />
      <path d="M273 466h-34m127 0h-14" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />
    </svg>
  );
}

export function AnimeStaggerVisual({
  variant = 'auth',
  scrollContainer,
  scrollTarget,
}: AnimeStaggerVisualProps) {
  const rootRef = useRef<HTMLElement>(null);
  const isAmbient = variant === 'ambient';

  useEffect(() => {
    const root = rootRef.current;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (!root) return;

    const scope = createScope({ root }).add(() => {
      if (isAmbient) {
        const container = scrollContainer?.current;
        const target = scrollTarget?.current;
        if (!container || !target) return;
        const scroll = onScroll({ target, container, axis: 'y', sync: true });
        animate('.dial-orbit', {
          rotate: prefersReducedMotion ? '0.25turn' : '1turn',
          scale: prefersReducedMotion ? [0.99, 1.01] : [0.96, 1.04],
          autoplay: scroll,
          ease: 'linear',
        });
        animate('.dial-dot', {
          scale: prefersReducedMotion ? [0.82, 1] : [0.28, 1],
          opacity: prefersReducedMotion ? [0.32, 0.58] : [0.18, 1],
          delay: stagger(7, { from: 'center' }),
          autoplay: scroll,
          ease: 'linear',
        });
        return;
      }

      if (!prefersReducedMotion) {
        animate('.auth-orbit-slow', {
          rotate: '1turn',
          duration: 90000,
          loop: true,
          ease: 'linear',
        });
      }
      animate('.auth-code-line', {
        scaleX: prefersReducedMotion ? [0.98, 1] : [0.86, 1],
        opacity: prefersReducedMotion ? [0.7, 0.82] : [0.52, 0.88],
        delay: stagger(prefersReducedMotion ? 180 : 85, { from: 'center' }),
        duration: prefersReducedMotion ? 2600 : 1600,
        alternate: true,
        loop: true,
        ease: 'inOutSine',
      });
      if (!prefersReducedMotion) {
        animate('.auth-code-scan', {
          translateY: 164,
          opacity: [0, 0.72, 0],
          duration: 3600,
          loop: true,
          ease: 'linear',
        });
      }
      animate('.auth-judge-node', {
        scale: prefersReducedMotion ? [0.99, 1.01] : [0.96, 1.045],
        opacity: prefersReducedMotion ? [0.84, 1] : [0.72, 1],
        delay: stagger(prefersReducedMotion ? 700 : 420),
        duration: prefersReducedMotion ? 2400 : 1450,
        alternate: true,
        loop: true,
        ease: 'inOutSine',
      });
      animate('.auth-flow-signal', {
        translateY: prefersReducedMotion ? 20 : 116,
        opacity: [0, 1, 0],
        duration: prefersReducedMotion ? 5200 : 2700,
        loop: true,
        ease: 'inOutSine',
      });
    });

    return () => scope.revert();
  }, [isAmbient, scrollContainer, scrollTarget]);

  return (
    <section
      ref={rootRef}
      aria-label={isAmbient ? undefined : 'Anime.js animated coding and judging visualization'}
      aria-hidden={isAmbient}
      className={isAmbient
        ? 'pointer-events-none fixed left-[-18rem] top-1/2 z-0 hidden h-[min(90vh,58rem)] w-[min(90vh,58rem)] -translate-y-1/2 opacity-[0.12] mix-blend-screen lg:block'
        : 'relative hidden min-h-[100dvh] w-[48%] overflow-hidden bg-[#242322] text-linen lg:flex'}
    >
      {!isAmbient && (
        <div className="absolute left-[7%] top-1/2 z-10 h-40 w-px -translate-y-1/2 bg-white/15" aria-hidden="true" />
      )}
      <div className={isAmbient
        ? 'dial-orbit absolute inset-0'
        : 'pointer-events-none absolute left-[5%] top-1/2 aspect-square w-[90%] max-w-[820px] -translate-y-1/2'}>
        {isAmbient ? <AmbientDial /> : <AuthJudgingVisual />}
      </div>
    </section>
  );
}
