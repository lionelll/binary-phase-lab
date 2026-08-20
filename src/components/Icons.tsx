export type IconName = 'reset' | 'play' | 'lever' | 'reaction' | 'info' | 'chevron';

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = { className, width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  const paths: Record<IconName, React.ReactNode> = {
    reset: <><path d="M4 7v5h5"/><path d="M5.4 16a8 8 0 1 0 .4-9L4 8"/></>,
    play: <path d="m8 5 11 7-11 7Z"/>,
    lever: <><path d="M4 16h16M12 16l-3 5h6z"/><circle cx="7" cy="10" r="2"/><circle cx="17" cy="7" r="2"/><path d="m6 12 12-3"/></>,
    reaction: <><path d="M5 7h12l-3-3M19 17H7l3 3"/><circle cx="5" cy="7" r="1"/><circle cx="19" cy="17" r="1"/></>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}
