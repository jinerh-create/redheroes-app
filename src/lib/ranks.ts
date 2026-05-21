import type { RankName, RankInfo } from './types';
import { RANKS } from './types';

export function getRank(donations: number): RankInfo {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (donations >= r.min) rank = r;
  }
  return rank;
}

export function getRankName(donations: number): RankName {
  return getRank(donations).name;
}

export function getNextRank(donations: number): { rank: RankInfo; remaining: number } | null {
  for (let i = 0; i < RANKS.length; i++) {
    if (donations < RANKS[i].min) {
      return { rank: RANKS[i], remaining: RANKS[i].min - donations };
    }
  }
  return null;
}
