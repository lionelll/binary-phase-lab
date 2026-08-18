export type IconName = 'home' | 'reset' | 'play' | 'pause' | 'diagram' | 'cooling' | 'lever' | 'reaction' | 'info' | 'settings';

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = { className, width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    reset: <><path d="M4 7v5h5"/><path d="M5.4 16a8 8 0 1 0 .4-9L4 8"/></>,
    play: <path d="m8 5 11 7-11 7Z"/>,
    pause: <><path d="M8 5v14M16 5v14"/></>,
    diagram: <><path d="M4 19V5M4 19h16"/><path d="M7 15c3-7 7-2 12-9"/><path d="M7 17c4-4 8-1 12-7"/></>,
    cooling: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></>,
    lever: <><path d="M4 16h16M12 16l-3 5h6z"/><circle cx="7" cy="10" r="2"/><circle cx="17" cy="7" r="2"/><path d="m6 12 12-3"/></>,
    reaction: <><path d="M5 7h12l-3-3M19 17H7l3 3"/><circle cx="5" cy="7" r="1"/><circle cx="19" cy="17" r="1"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
    settings: <><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="11" cy="18" r="2" fill="currentColor"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}
