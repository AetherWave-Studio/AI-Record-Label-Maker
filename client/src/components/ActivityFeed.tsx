import { useState } from 'react';
import { Loader2, TrendingUp, Star, Music, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

type FeedTab = 'for-you' | 'following' | 'trending';

type FeedEvent = {
  id: string;
  userId: string;
  eventType: string;
  bandId?: string | null;
  data: {
    bandName?: string;
    genre?: string;
    fame?: number;
    totalStreams?: number;
    description?: string;
    [key: string]: any;
  };
  createdAt: string;
};

export function ActivityFeed() {
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const { isAuthenticated } = useAuth();
  
  // Fetch feed events from API (only when authenticated)
  const { data: feedData, isLoading, error } = useQuery<{ events: FeedEvent[]; count: number }>({
    queryKey: ['/api/feed', { limit: 20, offset: 0 }],
    enabled: isAuthenticated, // Only fetch when authenticated
  });

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
        ) : feedData && feedData.events.length > 0 ? (
          <>
            {feedData.events.map((event) => (
              <div key={event.id} className="bg-charcoal border border-sky-glint/20 rounded-lg p-4 hover:border-sky-glint/40 transition-all">
                <div className="flex items-start gap-3">
                  {/* Event Icon */}
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-glint to-electric-blue flex items-center justify-center flex-shrink-0">
                    {event.eventType === 'band_created' && <Star className="w-5 h-5 text-deep-slate" />}
                    {event.eventType === 'daily_growth' && <TrendingUp className="w-5 h-5 text-deep-slate" />}
                    {event.eventType === 'achievement_earned' && <Award className="w-5 h-5 text-deep-slate" />}
                    {!['band_created', 'daily_growth', 'achievement_earned'].includes(event.eventType) && <Music className="w-5 h-5 text-deep-slate" />}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {event.eventType === 'band_created' && (
                          <>
                            <h3 className="font-semibold text-white-smoke mb-1">New Band Created! 🎸</h3>
                            <p className="text-soft-gray text-sm">
                              <Link href={`/rpg/bands/${event.bandId}`}>
                                <span className="text-sky-glint hover:underline font-medium">{event.data.bandName}</span>
                              </Link>
                              {event.data.genre && <span> • {event.data.genre}</span>}
                            </p>
                          </>
                        )}
                        {event.eventType === 'daily_growth' && (
                          <>
                            <h3 className="font-semibold text-white-smoke mb-1">Daily Growth Applied! 📈</h3>
                            <p className="text-soft-gray text-sm">
                              <Link href={`/rpg/bands/${event.bandId}`}>
                                <span className="text-sky-glint hover:underline font-medium">{event.data.bandName}</span>
                              </Link>
                              {event.data.fame && <span> • FAME: {event.data.fame}</span>}
                              {event.data.totalStreams && <span> • {event.data.totalStreams.toLocaleString()} streams</span>}
                            </p>
                          </>
                        )}
                        {!['band_created', 'daily_growth'].includes(event.eventType) && (
                          <>
                            <h3 className="font-semibold text-white-smoke mb-1 capitalize">{event.eventType.replace(/_/g, ' ')}</h3>
                            <p className="text-soft-gray text-sm">{event.data.description || 'Activity update'}</p>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-soft-gray flex-shrink-0">
                        {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Placeholder */}
            <div className="flex justify-center py-8">
              <button
                className="px-6 py-3 bg-charcoal border border-sky-glint/30 text-white-smoke rounded-lg hover:border-sky-glint hover:bg-charcoal/80 transition-all"
                disabled
              >
                Load More (Coming Soon)
              </button>
            </div>
          </>
        ) : !isAuthenticated ? (
          <div className="text-center py-12">
            <p className="text-soft-gray text-lg mb-4">Sign in to see the activity feed</p>
            <p className="text-soft-gray mb-4">Join the community to create bands, grow your empire, and see what everyone is up to!</p>
            <a href="/api/login">
              <button className="px-6 py-3 bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate rounded-lg font-semibold hover:shadow-lg transition-all">
                Sign In
              </button>
            </a>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-soft-gray text-lg mb-4">No activity yet</p>
            <p className="text-soft-gray mb-4">Create your first band to see activity here!</p>
            <Link href="/rpg">
              <button className="px-6 py-3 bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate rounded-lg font-semibold hover:shadow-lg transition-all">
                Create Your First Band
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
