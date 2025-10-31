import { formatDistanceToNow } from 'date-fns';
import { Music, Play, MessageCircle, Flame, Share2, Award, TrendingUp, User, Zap } from 'lucide-react';
import { Link } from 'wouter';
import type { FeedItem as FeedItemType } from '@/types/feed';

interface FeedItemProps {
  item: FeedItemType;
}

export function FeedItem({ item }: FeedItemProps) {
  const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  // Common action buttons
  const ActionButtons = ({ showListen = false, audioUrl }: { showListen?: boolean; audioUrl?: string }) => (
    <div className="flex gap-3 mt-4">
      {showListen && audioUrl && (
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-aetherwave-pink to-electric-neon text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-aetherwave-pink/50 hover:-translate-y-0.5 transition-all">
          <Play size={16} />
          Listen
        </button>
      )}
      <button className="flex items-center gap-2 px-4 py-2 border border-soft-gray/30 text-white-smoke rounded-lg hover:border-sky-glint transition-colors">
        <MessageCircle size={16} />
        Comment
      </button>
      <button className="flex items-center gap-2 px-4 py-2 border border-soft-gray/30 text-white-smoke rounded-lg hover:border-sky-glint transition-colors">
        <Flame size={16} />
        React
      </button>
      <button className="flex items-center gap-2 px-4 py-2 border border-soft-gray/30 text-soft-gray rounded-lg hover:border-sky-glint hover:text-white-smoke transition-colors">
        <Share2 size={16} />
      </button>
    </div>
  );

  // Stats display
  const Stats = ({ stats }: { stats?: FeedItemType['stats'] }) => {
    if (!stats) return null;
    return (
      <div className="flex gap-4 text-sm text-soft-gray mt-3">
        {stats.streams !== undefined && (
          <span className="flex items-center gap-1">
            <Play size={14} /> {stats.streams.toLocaleString()} streams
          </span>
        )}
        {stats.comments !== undefined && (
          <span className="flex items-center gap-1">
            <MessageCircle size={14} /> {stats.comments} comments
          </span>
        )}
        {stats.reactions !== undefined && (
          <span className="flex items-center gap-1">
            <Flame size={14} /> {stats.reactions} reactions
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="relative backdrop-blur-2xl bg-white/[0.02] rounded-3xl p-6 mb-6 transition-all duration-300 group overflow-hidden"
         style={{
           border: '1px solid rgba(255, 255, 255, 0.05)',
           boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
         }}
         onMouseEnter={(e) => {
           e.currentTarget.style.transform = 'translateY(-4px)';
           e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(225, 90, 253, 0.15)';
           e.currentTarget.style.borderColor = 'rgba(225, 90, 253, 0.2)';
         }}
         onMouseLeave={(e) => {
           e.currentTarget.style.transform = 'translateY(0)';
           e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)';
           e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
         }}
    >
      {/* Subtle inner glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-aetherwave-pink/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
      {/* Header with user info and timestamp */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/user/${item.user.id}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aetherwave-pink to-electric-neon flex items-center justify-center text-white font-bold cursor-pointer hover:scale-110 transition-transform shadow-lg">
              {item.user.profileImageUrl ? (
                <img src={item.user.profileImageUrl} alt={item.user.username} className="w-full h-full rounded-full" />
              ) : (
                <User size={20} />
              )}
            </div>
          </Link>
          <div>
            <Link href={`/user/${item.user.id}`}>
              <span className="font-semibold text-white-smoke hover:text-sky-glint cursor-pointer">
                @{item.user.username}
              </span>
            </Link>
            {item.user.level && (
              <span className="text-soft-gray text-sm ml-2">• {item.user.level}</span>
            )}
            {item.user.chartPosition && (
              <span className="text-soft-gray text-sm ml-2">• #{item.user.chartPosition}</span>
            )}
          </div>
        </div>
        <span className="text-soft-gray text-sm">{timeAgo}</span>
      </div>

      {/* Content based on type */}
      {item.type === 'new_release' && (
        <div>
          <div className="flex items-center gap-2 text-sky-glint mb-3">
            <Music size={20} />
            <span className="font-semibold">Released "{item.releaseTitle}"</span>
          </div>

          <div className="flex gap-4">
            {item.artist.cardImageUrl && (
              <Link href={`/artist/${item.artist.id}`}>
                <img
                  src={item.artist.cardImageUrl}
                  alt={item.artist.bandName}
                  className="w-48 h-64 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform shadow-xl"
                />
              </Link>
            )}
            <div className="flex-1">
              <Link href={`/artist/${item.artist.id}`}>
                <h3 className="text-xl font-bold text-white-smoke hover:text-sky-glint cursor-pointer">
                  {item.artist.bandName}
                </h3>
              </Link>
              <p className="text-soft-gray">Genre: {item.artist.genre}</p>
              <Stats stats={item.stats} />
            </div>
          </div>

          <ActionButtons showListen audioUrl={item.audioUrl} />
        </div>
      )}

      {item.type === 'achievement' && (
        <div>
          <div className="flex items-center gap-2 text-amber-400 mb-3">
            <Award size={24} />
            <span className="text-xl font-bold">Hit {item.achievementType.replace('_', ' ').toUpperCase()}!</span>
          </div>

          <p className="text-white-smoke text-lg">
            🎵 "{item.releaseTitle}" by {item.artist.bandName}
          </p>
          <p className="text-soft-gray mt-2">
            💿 {item.stats?.sales?.toLocaleString()} total sales achieved!
          </p>
          <p className="text-sky-glint mt-1">
            💰 Earned {item.creditsEarned.toLocaleString()} credit bonus
          </p>
          {item.stats?.chartPosition && (
            <p className="text-soft-gray mt-1">
              📊 Chart position: #{item.stats.chartPosition}
              {item.stats.chartChange && item.stats.chartChange > 0 && (
                <span className="text-green-400"> ⬆️ (+{item.stats.chartChange})</span>
              )}
            </p>
          )}

          <Stats stats={item.stats} />

          <div className="flex gap-3 mt-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-deep-slate rounded-lg font-semibold hover:shadow-lg transition-all">
              🎊 Congratulate
            </button>
            <Link href={`/artist/${item.artist.id}`}>
              <button className="flex items-center gap-2 px-4 py-2 border border-soft-gray/30 text-white-smoke rounded-lg hover:border-sky-glint transition-colors">
                👀 View Card
              </button>
            </Link>
          </div>
        </div>
      )}

      {item.type === 'rank_change' && (
        <div>
          <div className="flex items-center gap-2 text-green-400 mb-3">
            <TrendingUp size={24} />
            <span className="text-xl font-bold">Climbed the charts!</span>
          </div>

          <p className="text-white-smoke text-lg">
            Jumped from <span className="text-soft-gray">#{item.oldRank}</span> → <span className="text-sky-glint font-bold text-2xl">#{item.newRank}</span> on global leaderboard
          </p>
          <p className="text-soft-gray mt-2">
            Applied daily growth to all {item.bandsUpdated} bands 🚀
          </p>

          {item.stats && (
            <div className="mt-3 p-3 bg-deep-slate/50 rounded-lg">
              <p className="text-white-smoke">💪 Current FAME: <span className="text-sky-glint font-bold">{item.stats.fame}</span>
                {item.stats.fameChange && item.stats.fameChange > 0 && (
                  <span className="text-green-400"> (+{item.stats.fameChange} today)</span>
                )}
              </p>
              {item.stats.streams && (
                <p className="text-white-smoke mt-1">📈 Daily Streams: <span className="text-sky-glint font-bold">{item.stats.streams.toLocaleString()}</span></p>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button className="flex items-center gap-2 px-4 py-2 border border-soft-gray/30 text-white-smoke rounded-lg hover:border-sky-glint transition-colors">
              👏 React
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-sky-glint text-deep-slate rounded-lg font-semibold hover:shadow-lg transition-all">
              👤 Follow
            </button>
            <Link href={`/user/${item.user.id}`}>
              <button className="flex items-center gap-2 px-4 py-2 border border-soft-gray/30 text-white-smoke rounded-lg hover:border-sky-glint transition-colors">
                👀 View Profile
              </button>
            </Link>
          </div>
        </div>
      )}

      {item.type === 'new_artist' && (
        <div>
          <div className="flex items-center gap-2 text-sky-glint mb-3">
            <Music size={20} />
            <span className="font-semibold">Created new artist!</span>
          </div>

          <div className="flex gap-4">
            {item.artist.cardImageUrl && (
              <Link href={`/artist/${item.artist.id}`}>
                <img
                  src={item.artist.cardImageUrl}
                  alt={item.artist.bandName}
                  className="w-48 h-64 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform shadow-xl"
                />
              </Link>
            )}
            <div className="flex-1">
              <Link href={`/artist/${item.artist.id}`}>
                <h3 className="text-2xl font-bold text-white-smoke hover:text-sky-glint cursor-pointer">
                  "{item.artist.bandName}"
                </h3>
              </Link>
              <p className="text-soft-gray text-lg mt-1">
                {item.artist.genre} • {item.memberCount}-piece band
              </p>

              {item.stats && (
                <div className="mt-3 text-soft-gray">
                  <p>Starting Stats:</p>
                  <div className="flex gap-4 mt-1">
                    {item.stats.streams && <span>🎵 {item.stats.streams} streams</span>}
                    {item.stats.sales && <span>💿 {item.stats.sales} downloads</span>}
                  </div>
                </div>
              )}

              {item.description && (
                <p className="text-white-smoke mt-3 italic">
                  "{item.description.slice(0, 150)}..."
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Link href={`/artist/${item.artist.id}`}>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-aetherwave-pink to-electric-neon text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-aetherwave-pink/50 hover:-translate-y-0.5 transition-all">
                👀 View Full Card
              </button>
            </Link>
            <ActionButtons />
          </div>
        </div>
      )}

      {item.type === 'daily_growth_reminder' && (
        <div className="bg-gradient-to-r from-sky-glint/10 to-electric-blue/10 border-2 border-sky-glint rounded-xl p-4">
          <div className="flex items-center gap-2 text-sky-glint mb-3">
            <Zap size={24} className="animate-pulse" />
            <span className="text-xl font-bold">Your bands are ready for growth!</span>
          </div>

          <p className="text-white-smoke mb-3">
            {item.readyBands.length} bands can receive daily growth bonuses
          </p>

          <div className="space-y-2 mb-4">
            {item.readyBands.slice(0, 3).map((band) => (
              <div key={band.id} className="flex items-center justify-between bg-charcoal/50 rounded-lg p-2">
                <span className="text-white-smoke">🎸 {band.name}</span>
                <span className="text-soft-gray text-sm">
                  Last: {formatDistanceToNow(new Date(band.lastGrowth), { addSuffix: true })}
                </span>
              </div>
            ))}
            {item.readyBands.length > 3 && (
              <p className="text-soft-gray text-sm">... and {item.readyBands.length - 3} more</p>
            )}
          </div>

          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-aetherwave-pink to-electric-neon text-white rounded-lg font-bold hover:shadow-2xl hover:shadow-aetherwave-pink/60 hover:-translate-y-1 transition-all">
              <Zap size={20} />
              APPLY GROWTH TO ALL
            </button>
            <button className="px-4 py-3 border border-soft-gray/30 text-soft-gray rounded-lg hover:border-sky-glint hover:text-white-smoke transition-colors">
              ⏭️ Skip
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
