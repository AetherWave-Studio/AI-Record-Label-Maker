export type FeedTab = 'for-you' | 'following' | 'trending';

export interface FeedUser {
  id: string;
  username: string;
  level?: string;
  chartPosition?: number;
  profileImageUrl?: string;
}

export interface FeedArtist {
  id: string;
  bandName: string;
  genre: string;
  cardImageUrl?: string;
}

export interface ReadyBand {
  id: string;
  name: string;
  lastGrowth: string;
}

export interface FeedStats {
  streams?: number;
  sales?: number;
  comments?: number;
  reactions?: number;
  chartPosition?: number;
  chartChange?: number;
  fame?: number;
  fameChange?: number;
}

export type FeedActivityType =
  | 'new_release'
  | 'achievement'
  | 'rank_change'
  | 'new_artist'
  | 'daily_growth_reminder'
  | 'text_post'
  | 'level_up'
  | 'milestone';

interface BaseFeedItem {
  id: string;
  type: FeedActivityType;
  user: FeedUser;
  timestamp: string;
  stats?: FeedStats;
}

interface NewReleaseFeedItem extends BaseFeedItem {
  type: 'new_release';
  artist: FeedArtist;
  releaseTitle: string;
  audioUrl?: string;
}

interface AchievementFeedItem extends BaseFeedItem {
  type: 'achievement';
  achievementType: 'gold_record' | 'platinum_album' | 'diamond_album';
  artist: FeedArtist;
  releaseTitle: string;
  creditsEarned: number;
}

interface RankChangeFeedItem extends BaseFeedItem {
  type: 'rank_change';
  oldRank: number;
  newRank: number;
  bandsUpdated: number;
}

interface NewArtistFeedItem extends BaseFeedItem {
  type: 'new_artist';
  artist: FeedArtist;
  description?: string;
  memberCount: number;
}

interface DailyGrowthReminderFeedItem extends BaseFeedItem {
  type: 'daily_growth_reminder';
  readyBands: ReadyBand[];
}

interface TextPostFeedItem extends BaseFeedItem {
  type: 'text_post';
  title: string;
  content: string;
}

interface LevelUpFeedItem extends BaseFeedItem {
  type: 'level_up';
  oldLevel: string;
  newLevel: string;
  unlockedFeatures: string[];
}

interface MilestoneFeedItem extends BaseFeedItem {
  type: 'milestone';
  milestoneType: string;
  milestoneValue: number;
  description: string;
}

export type FeedItem =
  | NewReleaseFeedItem
  | AchievementFeedItem
  | RankChangeFeedItem
  | NewArtistFeedItem
  | DailyGrowthReminderFeedItem
  | TextPostFeedItem
  | LevelUpFeedItem
  | MilestoneFeedItem;
