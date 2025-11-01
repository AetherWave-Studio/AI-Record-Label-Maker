import { useState } from 'react';
import { Loader2, Home, Users, TrendingUp, Search, Plus, Video, Image, Calendar, Gift } from 'lucide-react';
import { FeedItem } from './FeedItem';
import type { FeedTab, FeedItem as FeedItemType } from '@/types/feed';

// Mock data for development - will be replaced with API calls
const mockFeedItems: FeedItemType[] = [
  {
    id: 'daily-reward-1',
    type: 'milestone',
    user: { id: 'system', username: 'AetherWave Daily', level: 'System', chartPosition: 1 },
    timestamp: new Date().toISOString(),
    milestoneType: 'daily_login',
    milestoneValue: 20,
    description: '🎁 Daily Login Bonus! Click your profile to collect 20 media credits and start creating!',
    stats: {
      fame: 10,
    },
  },
  {
    id: '1',
    type: 'daily_growth_reminder',
    user: { id: 'current-user', username: 'you', level: 'Artist', chartPosition: 34 },
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
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
  const [showCreatePost, setShowCreatePost] = useState(false);

  const tabs: { id: FeedTab; label: string; icon: React.ReactNode }[] = [
    { id: 'for-you', label: 'For You', icon: <Home size={18} /> },
    { id: 'following', label: 'Following', icon: <Users size={18} /> },
    { id: 'trending', label: 'Trending', icon: <TrendingUp size={18} /> },
  ];

  // Create post form for Facebook-like functionality
  const CreatePostForm = () => (
    <div className="bg-gradient-to-br from-deep-slate to-charcoal rounded-xl border border-sky-glint/20 p-4 mb-6 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-glint to-electric-blue flex items-center justify-center text-deep-slate font-bold">
          D
        </div>
        <input
          type="text"
          placeholder="What's happening with your music career?"
          className="flex-1 bg-charcoal/50 border border-soft-gray/30 rounded-full px-4 py-2 text-white-smoke placeholder-soft-gray focus:border-sky-glint focus:outline-none focus:ring-2 focus:ring-sky-glint/20 transition-all"
          onFocus={() => setShowCreatePost(true)}
        />
        <div className="flex gap-2">
          <button className="p-2 text-soft-gray hover:text-sky-glint hover:bg-charcoal rounded-lg transition-colors">
            <Video size={20} />
          </button>
          <button className="p-2 text-soft-gray hover:text-sky-glint hover:bg-charcoal rounded-lg transition-colors">
            <Image size={20} />
          </button>
          <button className="p-2 text-soft-gray hover:text-sky-glint hover:bg-charcoal rounded-lg transition-colors">
            <Calendar size={20} />
          </button>
        </div>
      </div>
      {showCreatePost && (
        <div className="mt-3">
          <textarea
            placeholder="Share more about your musical journey..."
            className="w-full bg-charcoal/30 border border-soft-gray/30 rounded-lg px-4 py-3 text-white-smoke placeholder-soft-gray focus:border-sky-glint focus:outline-none focus:ring-2 focus:ring-sky-glint/20 transition-all resize-none"
            rows={3}
          />
          <div className="flex justify-end gap-3 mt-3">
            <button
              onClick={() => setShowCreatePost(false)}
              className="px-4 py-2 text-soft-gray hover:text-white-smoke transition-colors"
            >
              Cancel
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate rounded-lg font-semibold hover:shadow-lg transition-all">
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Facebook-style Create Post */}
      <CreatePostForm />

      {/* Facebook-style Stories Bar */}
      <div className="bg-gradient-to-br from-deep-slate to-charcoal rounded-xl border border-sky-glint/20 p-4 mb-6 shadow-xl">
        <div className="flex gap-4 overflow-x-auto">
          <div className="flex flex-col items-center min-w-fit">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-aetherwave-pink to-electric-neon flex items-center justify-center text-white text-2xl shadow-lg hover:shadow-aetherwave-pink/50 transition-all cursor-pointer">
              +
            </div>
            <span className="text-xs text-soft-gray mt-1">Create Story</span>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center min-w-fit">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg shadow-lg">
                📸
              </div>
              <span className="text-xs text-soft-gray mt-1">Story {i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Facebook-style Feed Tabs */}
      <div className="sticky top-16 z-40 bg-deep-slate/95 backdrop-blur-sm border-b border-sky-glint/20 mb-6">
        <div className="flex gap-1 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-sky-glint/20 text-sky-glint border border-sky-glint/50'
                  : 'text-soft-gray hover:text-white-smoke hover:bg-charcoal/50'
                }
              `}
            >
              {tab.icon}
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
                className="px-8 py-3 bg-gradient-to-r from-sky-glint/20 to-electric-blue/20 border border-sky-glint/30 text-sky-glint rounded-lg font-medium hover:border-sky-glint hover:from-sky-glint/30 hover:to-electric-blue/30 transition-all"
              >
                Load More Posts
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-sky-glint to-electric-blue flex items-center justify-center text-deep-slate text-3xl shadow-lg">
              🎵
            </div>
            <p className="text-soft-gray text-lg mb-4">No activity yet</p>
            {activeTab === 'following' && (
              <p className="text-soft-gray mb-4">Follow artists to see their updates here</p>
            )}
            <button className="px-6 py-3 bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate rounded-lg font-semibold hover:shadow-lg transition-all">
              Start Your Music Journey
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
