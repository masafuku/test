import type { Insight } from '../../lib/statistics';

export function InsightBadge({ insight }: { insight: Insight }) {
  return <div className={`insight-badge insight-${insight.kind}`}>{insight.message}</div>;
}
