import React from 'react';
import { Users, CheckCircle2, XCircle, Code2 } from 'lucide-react';
import type { IMatchParticipant } from '@ocj/contracts';

interface MatchParticipantStatusProps {
  participants: IMatchParticipant[];
  currentUserId: string;
}

export const MatchParticipantStatus: React.FC<MatchParticipantStatusProps> = ({ participants, currentUserId }) => {
  return (
    <div className="bg-washi border border-charcoal p-4 mb-2 overflow-x-auto">
      <div className="flex items-center gap-2 font-display text-xs font-bold text-stone uppercase tracking-wider mb-4 border-b border-charcoal pb-2">
        <Users size={16} className="text-vermilion" />
        <span>Trạng thái trận đấu ({participants.length} Người)</span>
      </div>
      
      <div className="flex gap-4 min-w-max">
        {participants.map((p) => {
          const isMe = p.user_id === currentUserId;
          const isAC = p.status === 'ACCEPTED';
          const isWA = p.status === 'SUBMITTED_WA';
          const isCoding = p.status === 'CODING';

          return (
            <div 
              key={p.user_id} 
              className={`flex items-center gap-3 p-3 min-w-[200px] border ${isMe ? 'border-vermilion bg-vermilion/5' : 'border-charcoal bg-ink'}`}
            >
              <img
                src={p.user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.user?.username}
                alt={p.user?.username}
                className={`w-10 h-10 rounded-full border-2 ${isAC ? 'border-green-500' : isWA ? 'border-red-500' : 'border-charcoal'}`}
              />
              <div className="flex flex-col flex-1">
                <span className={`font-body text-sm font-bold truncate max-w-[120px] ${isMe ? 'text-vermilion' : 'text-linen'}`}>
                  {p.user?.username} {isMe && '(Bạn)'}
                </span>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    {isAC && <><CheckCircle2 size={12} className="text-green-500" /><span className="text-[10px] text-green-500 uppercase tracking-wider">Hoàn thành</span></>}
                    {isWA && <><XCircle size={12} className="text-red-500" /><span className="text-[10px] text-red-500 uppercase tracking-wider">Sai KQ</span></>}
                    {isCoding && <><Code2 size={12} className="text-stone animate-pulse" /><span className="text-[10px] text-stone uppercase tracking-wider">Đang code...</span></>}
                  </div>
                  {p.score_change !== undefined && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider ml-2 ${p.score_change > 0 ? 'text-vermilion' : 'text-stone'}`}>
                      {p.score_change > 0 ? '+' : ''}{p.score_change} ELO
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
