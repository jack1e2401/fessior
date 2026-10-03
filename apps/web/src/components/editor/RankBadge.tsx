import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Award } from 'lucide-react';

interface RankBadgeProps {
  elo: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RankBadge: React.FC<RankBadgeProps> = ({ elo, showLabel = false, size = 'md' }) => {
  let rankName = 'Novice';
  let Icon = Shield;
  let colorClass = 'text-stone';
  let bgClass = 'bg-charcoal/20 border-charcoal';

  if (elo >= 1800) {
    rankName = 'Grandmaster';
    Icon = Award;
    colorClass = 'text-yellow-400';
    bgClass = 'bg-yellow-400/20 border-yellow-400/50';
  } else if (elo >= 1500) {
    rankName = 'Master';
    Icon = ShieldCheck;
    colorClass = 'text-purple-400';
    bgClass = 'bg-purple-400/20 border-purple-400/50';
  } else if (elo >= 1200) {
    rankName = 'Expert';
    Icon = ShieldAlert;
    colorClass = 'text-blue-400';
    bgClass = 'bg-blue-400/20 border-blue-400/50';
  } else if (elo >= 1000) {
    rankName = 'Apprentice';
    Icon = Shield;
    colorClass = 'text-green-400';
    bgClass = 'bg-green-400/20 border-green-400/50';
  }

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 border ${bgClass} rounded-xl`}>
      <Icon size={iconSizes[size]} className={colorClass} />
      {showLabel && (
        <span className={`font-display font-bold uppercase tracking-wider ${colorClass} ${textSizes[size]}`}>
          {rankName}
        </span>
      )}
    </div>
  );
};
