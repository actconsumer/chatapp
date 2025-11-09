/**
 * Story Domain Entity
 * Represents a user's story (similar to Instagram/WhatsApp stories)
 */

export type StoryMediaType = 'image' | 'video';
export type StoryPrivacy = 'public' | 'friends' | 'custom';

export interface IStoryViewer {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  viewedAt: Date;
}

export interface IStoryReaction {
  userId: string;
  username: string;
  emoji: string;
  timestamp: Date;
}

export interface IStory {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  userAvatar?: string;
  
  // Content
  mediaUrl: string;
  mediaType: StoryMediaType;
  thumbnailUrl?: string;
  caption?: string;
  backgroundColor?: string;
  duration: number; // in seconds
  
  // Engagement
  viewers: IStoryViewer[];
  reactions: IStoryReaction[];
  viewCount: number;
  
  // Privacy
  privacy: StoryPrivacy;
  customViewerIds: string[]; // for custom privacy
  
  // Metadata
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  deletedAt?: Date;
}

export class Story implements IStory {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  userAvatar?: string;
  mediaUrl: string;
  mediaType: StoryMediaType;
  thumbnailUrl?: string;
  caption?: string;
  backgroundColor?: string;
  duration: number;
  viewers: IStoryViewer[];
  reactions: IStoryReaction[];
  viewCount: number;
  privacy: StoryPrivacy;
  customViewerIds: string[];
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  deletedAt?: Date;

  constructor(data: Partial<IStory>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.username = data.username || '';
    this.displayName = data.displayName || '';
    this.userAvatar = data.userAvatar;
    this.mediaUrl = data.mediaUrl || '';
    this.mediaType = data.mediaType || 'image';
    this.thumbnailUrl = data.thumbnailUrl;
    this.caption = data.caption;
    this.backgroundColor = data.backgroundColor;
    this.duration = data.duration || 10;
    this.viewers = data.viewers || [];
    this.reactions = data.reactions || [];
    this.viewCount = data.viewCount || 0;
    this.privacy = data.privacy || 'friends';
    this.customViewerIds = data.customViewerIds || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.expiresAt = data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    this.deletedAt = data.deletedAt;
  }

  addView(viewer: IStoryViewer): void {
    const hasViewed = this.viewers.some(v => v.userId === viewer.userId);
    if (!hasViewed) {
      this.viewers.push(viewer);
      this.viewCount += 1;
    }
  }

  addReaction(reaction: IStoryReaction): void {
    const existingIndex = this.reactions.findIndex(r => r.userId === reaction.userId);
    if (existingIndex >= 0) {
      this.reactions[existingIndex] = reaction;
    } else {
      this.reactions.push(reaction);
    }
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  canUserView(userId: string): boolean {
    if (this.privacy === 'public') return true;
    if (this.privacy === 'custom') {
      return this.customViewerIds.includes(userId);
    }
    return true; // For 'friends', check will be done at service level
  }

  toJSON() {
    return { ...this };
  }
}
