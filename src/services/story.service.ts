import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from './config';
import { getAuthHeaders } from './apiHelper';

// Types
export interface StoryMedia {
  url: string;
  type: 'image' | 'video' | 'text';
  durationMs?: number; // for video
  text?: string; // for text stories
  backgroundColor?: string; // for text stories
}

export interface Story {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  media: StoryMedia;
  createdAt: string;
  expiresAt: string;
  viewsCount: number;
  hasViewed: boolean;
}

export interface CreateStoryRequest {
  media: StoryMedia;
  // If uploading file via multipart, consumers should pass FormData to createStoryUpload instead
}

export interface StoryViewer {
  userId: string;
  userName: string;
  userAvatar?: string;
  viewedAt: string;
}

class StoryService {
  async list(): Promise<Story[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.STORIES.LIST);
      const headers = await getAuthHeaders();
      const res = await axios.get(url, { headers });
      return res.data.data;
    } catch (error: any) {
      console.error('List stories error:', error);
      throw new Error(error.response?.data?.message || 'Failed to load stories');
    }
  }

  async myStories(): Promise<Story[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.STORIES.MY_STORIES);
      const headers = await getAuthHeaders();
      const res = await axios.get(url, { headers });
      return res.data.data;
    } catch (error: any) {
      console.error('My stories error:', error);
      throw new Error(error.response?.data?.message || 'Failed to load your stories');
    }
  }

  async getUserStories(userId: string): Promise<Story[]> {
    try {
      const url = buildApiUrl(`/api/stories/user/${userId}`);
      const headers = await getAuthHeaders();
      const res = await axios.get(url, { headers });
      return res.data.data || [];
    } catch (error: any) {
      console.error('Get user stories error:', error);
      return []; // Return empty array to prevent UI errors
    }
  }

  async get(storyId: string): Promise<Story> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.STORIES.GET(storyId));
      const headers = await getAuthHeaders();
      const res = await axios.get(url, { headers });
      return res.data.data;
    } catch (error: any) {
      console.error('Get story error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get story');
    }
  }

  async create(data: CreateStoryRequest): Promise<Story> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.STORIES.CREATE);
      const headers = await getAuthHeaders();
      const res = await axios.post(url, data, { headers });
      return res.data.data;
    } catch (error: any) {
      console.error('Create story error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create story');
    }
  }

  async createUpload(form: FormData): Promise<Story> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.STORIES.CREATE);
      const headers = await getAuthHeaders();
      const res = await axios.post(url, form, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
      return res.data.data;
    } catch (error: any) {
      console.error('Create story upload error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload story');
    }
  }

  async remove(storyId: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.STORIES.DELETE(storyId));
      const headers = await getAuthHeaders();
      await axios.delete(url, { headers });
    } catch (error: any) {
      console.error('Delete story error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete story');
    }
  }

  async markViewed(storyId: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.STORIES.VIEW(storyId));
      const headers = await getAuthHeaders();
      await axios.post(url, {}, { headers });
    } catch (error: any) {
      console.error('View story error:', error);
      // Don't throw to keep UI smooth; treat as non-fatal
    }
  }

  async viewers(storyId: string): Promise<StoryViewer[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.STORIES.VIEWERS(storyId));
      const headers = await getAuthHeaders();
      const res = await axios.get(url, { headers });
      return res.data.data;
    } catch (error: any) {
      console.error('Story viewers error:', error);
      throw new Error(error.response?.data?.message || 'Failed to load viewers');
    }
  }
}

export const storyService = new StoryService();
