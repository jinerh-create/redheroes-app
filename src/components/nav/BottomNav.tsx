interface Props { active: string; }

const TABS = [
  { key: 'home', icon: '🏠', label: 'Home', href: '/' },
  { key: 'find', icon: '🔍', label: 'Find', href: '/find' },
  { key: 'requests', icon: '🩸', label: 'Requests', href: '/requests' },
  { key: 'chat', icon: '💬', label: 'Chat', href: '/chat' },
  { key: 'leaderboard', icon: '🏆', label: 'Ranks', href: '/leaderboard' },
];

export default function BottomNav({ active }: Props) {
  return (
    <nav className="bottom-nav">
      {TABS.map(t => (
        <a key={t.key} href={t.href} className={`nav-item${active === t.key ? ' active' : ''}`}>
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </a>
      ))}
    </nav>
  );
}
