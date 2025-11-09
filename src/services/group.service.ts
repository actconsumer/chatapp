import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from './config';
import { getAuthHeaders, getSafeToken } from './apiHelper';
import { chatService, ChatSummary } from './chat.service';

export interface CreateGroupPayload {
  name: string;
  participantIds: string[];
  description?: string;
  pinned?: boolean;
  metadata?: Record<string, unknown>;
  avatarUri?: string | null;
  avatarMimeType?: string;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  pinned?: boolean;
  metadata?: Record<string, unknown>;
}

class GroupService {
  async list(): Promise<ChatSummary[]> {
    const url = buildApiUrl(API_ENDPOINTS.GROUPS.LIST);
    const headers = await getAuthHeaders();
    const res = await axios.get(url, { headers });
    const groups: any[] = res.data?.data || [];
    return Promise.all(groups.map(async (group) => chatService.get(group?.id)));
  }

  async create(data: CreateGroupPayload): Promise<ChatSummary> {
    const { avatarUri, avatarMimeType, ...payload } = data;
    const url = buildApiUrl(API_ENDPOINTS.GROUPS.CREATE);
    const headers = await getAuthHeaders();
    const res = await axios.post(url, payload, { headers });
    const groupId = res.data?.data?.id || res.data?.id;

    if (!groupId) {
      throw new Error('Group creation response missing identifier');
    }

    let summary = await chatService.get(groupId);

    if (avatarUri) {
      try {
        await this.updateAvatar(groupId, avatarUri, avatarMimeType);
        summary = await chatService.get(groupId);
      } catch (error) {
        console.warn('GroupService.updateAvatar error:', error);
      }
    }

    return summary;
  }

  async update(groupId: string, data: UpdateGroupPayload): Promise<ChatSummary> {
    const url = buildApiUrl(API_ENDPOINTS.GROUPS.UPDATE(groupId));
    const headers = await getAuthHeaders();
    await axios.patch(url, data, { headers });
    return chatService.get(groupId);
  }

  async addMembers(groupId: string, participantIds: string[]): Promise<ChatSummary> {
    const url = buildApiUrl(API_ENDPOINTS.GROUPS.ADD_MEMBERS(groupId));
    const headers = await getAuthHeaders();
    await axios.post(url, { participantIds }, { headers });
    return chatService.get(groupId);
  }

  async removeMember(groupId: string, participantId: string): Promise<ChatSummary> {
    const url = buildApiUrl(API_ENDPOINTS.GROUPS.REMOVE_MEMBER(groupId, participantId));
    const headers = await getAuthHeaders();
    await axios.delete(url, { headers });
    return chatService.get(groupId);
  }

  async leave(groupId: string): Promise<void> {
    const url = buildApiUrl(API_ENDPOINTS.GROUPS.LEAVE(groupId));
    const headers = await getAuthHeaders();
    await axios.post(url, {}, { headers });
  }

  async togglePin(groupId: string): Promise<ChatSummary> {
    const url = buildApiUrl(API_ENDPOINTS.GROUPS.PIN(groupId));
    const headers = await getAuthHeaders();
    await axios.post(url, {}, { headers });
    return chatService.get(groupId);
  }

  async updateAvatar(groupId: string, uri: string, mimeType?: string): Promise<void> {
    const uploadUrl = buildApiUrl(API_ENDPOINTS.CHATS.AVATAR(groupId));
    const token = await getSafeToken();
    const form = new FormData();
    const extension = uri.split('.').pop();
    const inferredMime = mimeType || (extension ? `image/${extension}` : 'image/jpeg');

    form.append('avatar', {
      uri,
      name: `group-${groupId}.${extension || 'jpg'}`,
      type: inferredMime,
    } as any);

    await axios.post(uploadUrl, form, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const groupService = new GroupService();

export default groupService;
