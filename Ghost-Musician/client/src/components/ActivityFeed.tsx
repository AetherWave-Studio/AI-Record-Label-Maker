import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FeedItem } from './FeedItem';
import type { FeedTab, FeedItem as FeedItemType } from '@/types/feed';

// Mock data for development - will be replaced with API calls
const mockFeedItems: FeedItemType[] = [
  {
    id: '1',
    type: 'daily_growth_reminder',
    user: { id: 'current-user', username: 'you', level: 'Artist', chartPosition: 34 },
    timestamp: new Date().toISOString(),
    readyBands: [
      { id: '1', name: 'Neon Parallax', lastGrowth: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
      { id: '2', name: 'Chrome Butterfly', lastGrowth: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
      { id: '3', name: 'Digital Séance', lastGrowth: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() },
      { id: '4', name: 'Quantum Echoes', lastGrowth: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() },
      { id: '5', name: 'Static Prophecy', lastGrowth: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: '2',
    type: 'new_release',
    user: { id: 'sarah123', username: 'Sarah', level: 'Artist', chartPosition: 28 },
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    artist: {
      id: 'artist-1',
      bandName: 'Chrome Butterfly',
      genre: 'Synthwave',
      cardImageUrl: 'https://via.placeholder.com/300x400/0ea5e9/ffffff?text=Chrome+Butterfly',
    },
    releaseTitle: 'Neon Dreams',
    audioUrl: '/api/audio/neon-dreams.mp3',
    stats: {
      streams: 45,
      comments: 3,
      reactions: 12,
    },
  },
  {
    id: '3',
    type: 'achievement',
    user: { id: 'mike456', username: 'Mike', level: 'Producer', chartPosition: 15 },
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    achievementType: 'gold_record',
    artist: {
      id: 'artist-2',
      bandName: 'Urban Prophecy',
      genre: 'Hip-Hop',
    },
    releaseTitle: 'Electric Dreams',
    creditsEarned: 5000,
    stats: {
      sales: 500000,
      chartPosition: 15,
      chartChange: 8,
      reactions: 47,
      comments: 15,
    },
  },
  {
    id: '4',
    type: 'rank_change',
    user: { id: 'alex789', username: 'Alex', level: 'Artist', chartPosition: 10 },
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    oldRank: 42,
    newRank: 10,
    bandsUpdated: 8,
    stats: {
      fame: 85,
      fameChange: 12,
      streams: 5200,
    },
  },
  {
    id: '5',
    type: 'new_artist',
    user: { id: 'jordan101', username: 'Jordan', level: 'Artist' },
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    artist: {
      id: 'artist-3',
      bandName: 'Digital Séance',
      genre: 'Synthwave',
      cardImageUrl: 'https://via.placeholder.com/300x400/a855f7/ffffff?text=Digital+Seance',
    },
    description: 'Tokyo-born sound architect who spent years studying traditional Japanese music before fusing it with modern electronics. Lives in a converted warehouse studio filled with both vintage synthesizers and ancient instruments.',
    memberCount: 3,
    stats: {
      streams: 150,
      sales: 75,
    },
  },
];

export function ActivityFeed() {
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const [isLoading, setIsLoading] = useState(false);
  const [feedItems] = useState<FeedItemType[]>(mockFeedItems);

  const tabs: { id: FeedTab; label: string; icon: string }[] = [
    { id: 'for-you', label: 'For You', icon: '🎯' },
    { id: 'following', label: 'Following', icon: '🌍' },
    { id: 'trending', label: 'Trending', icon: '📈' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Feed Tabs */}
      <div className="sticky top-16 z-40 bg-deep-slate/95 backdrop-blur-sm border-b border-sky-glint/20 mb-6">
        <div className="flex gap-2 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate shadow-lg'
                  : 'bg-charcoal text-soft-gray hover:text-white-smoke hover:bg-charcoal/80'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed Content */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-sky-glint" />
          </div>
        ) : feedItems.length > 0 ? (
          <>
            {feedItems.map((item) => (
              <FeedItem key={item.id} item={item} />
            ))}

            {/* Load More */}
            <div className="flex justify-center py-8">
              <button
                onClick={() => {
                  setIsLoading(true);
                  // Simulate loading more items
                  setTimeout(() => setIsLoading(false), 1000);
                }}
                className="px-6 py-3 bg-charcoal border border-sky-glint/30 text-white-smoke rounded-lg hover:border-sky-glint hover:bg-charcoal/80 transition-all"
              >
                Load More
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-soft-gray text-lg mb-4">No activity yet</p>
            {activeTab === 'following' && (
              <p className="text-soft-gray mb-4">Follow artists to see their updates here</p>
            )}
            <button className="px-6 py-3 bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate rounded-lg font-semibold hover:shadow-lg transition-all">
              Upload Your First Song
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
