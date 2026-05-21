import { RANKS } from '../../lib/types';

interface Props { rank: string; donations?: number; }

export default function RankBadge({ rank, donations }: Props) {
  const info = RANKS.find(r => r.name === rank) ?? RANKS[0];
  return (
    <span className="rank-badge" style={{ background: `${info.color}22`, color: info.color, border: `1px solid ${info.color}44` }}>
      {info.icon} {rank}
    </span>
  );
}
