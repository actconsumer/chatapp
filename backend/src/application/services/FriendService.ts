/**
 * Friend Service
 * Handles friend relationships, requests, and blocking
 */

import { cosmosDBClient } from '../../infrastructure/database/cosmosdb.config';
import { AppError } from '../middleware/error.middleware';
import { FriendRequest, Friend, IFriend, IFriendRequest } from '../../domain/entities/Friend';
import { IUser } from '../../domain/entities/User';

export class FriendService {
  private readonly friendsContainer = 'friends';
  private readonly usersContainer = 'users';

  /**
   * Send a friend request
   */
  async sendFriendRequest(senderId: string, receiverId: string): Promise<IFriendRequest> {
    // Check if sender and receiver exist
    const sender = await cosmosDBClient.getItem<IUser>(this.usersContainer, senderId);
    const receiver = await cosmosDBClient.getItem<IUser>(this.usersContainer, receiverId);

    if (!sender || !receiver) {
      throw new AppError('User not found', 404);
    }

    if (senderId === receiverId) {
      throw new AppError('Cannot send friend request to yourself', 400);
    }

    // Check for existing request
    const existingRequests = await cosmosDBClient.queryItems<IFriendRequest>(
      this.friendsContainer,
      'SELECT * FROM c WHERE (c.senderId = @senderId AND c.receiverId = @receiverId) OR (c.senderId = @receiverId AND c.receiverId = @senderId)',
      [
        { name: '@senderId', value: senderId },
        { name: '@receiverId', value: receiverId }
      ]
    );

    if (existingRequests.length > 0) {
      const existing = existingRequests[0];
      if (existing.status === 'pending') {
        throw new AppError('Friend request already pending', 400);
      }
      if (existing.status === 'accepted') {
        throw new AppError('Already friends', 400);
      }
    }

    // Create friend request
    const friendRequest = new FriendRequest({
      senderId,
      senderUsername: sender.username,
      senderDisplayName: sender.displayName,
      senderAvatar: sender.avatar,
      receiverId,
      receiverUsername: receiver.username,
      receiverDisplayName: receiver.displayName,
      receiverAvatar: receiver.avatar,
      status: 'pending'
    });

    return await cosmosDBClient.upsertItem<IFriendRequest>(this.friendsContainer, friendRequest);
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(requestId: string, userId: string): Promise<IFriend> {
    const request = await cosmosDBClient.getItem<IFriendRequest>(this.friendsContainer, requestId);

    if (!request) {
      throw new AppError('Friend request not found', 404);
    }

    if (request.receiverId !== userId) {
      throw new AppError('Not authorized to accept this request', 403);
    }

    if (request.status !== 'pending') {
      throw new AppError('Friend request is not pending', 400);
    }

    // Update request status
    request.status = 'accepted';
    request.updatedAt = new Date();
    request.respondedAt = new Date();
    await cosmosDBClient.upsertItem(this.friendsContainer, request);

    // Get full user details for friend relationship
    const sender = await cosmosDBClient.getItem<IUser>(this.usersContainer, request.senderId);
    const receiver = await cosmosDBClient.getItem<IUser>(this.usersContainer, request.receiverId);

    if (!sender || !receiver) {
      throw new AppError('User not found', 404);
    }

    // Create friend relationship (bidirectional)
    const friend1 = new Friend({
      userId: request.senderId,
      friendId: request.receiverId,
      friendUsername: receiver.username,
      friendDisplayName: receiver.displayName,
      friendAvatar: receiver.avatar
    });

    const friend2 = new Friend({
      userId: request.receiverId,
      friendId: request.senderId,
      friendUsername: sender.username,
      friendDisplayName: sender.displayName,
      friendAvatar: sender.avatar
    });

    await cosmosDBClient.upsertItem(this.friendsContainer, friend1);
    await cosmosDBClient.upsertItem(this.friendsContainer, friend2);

    return friend1;
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(requestId: string, userId: string): Promise<void> {
    const request = await cosmosDBClient.getItem<IFriendRequest>(this.friendsContainer, requestId);

    if (!request) {
      throw new AppError('Friend request not found', 404);
    }

    if (request.receiverId !== userId) {
      throw new AppError('Not authorized to reject this request', 403);
    }

    request.status = 'rejected';
    request.updatedAt = new Date();
    await cosmosDBClient.upsertItem(this.friendsContainer, request);
  }

  /**
   * Remove a friend
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    // Find and delete both sides of the friendship
    const friendships = await cosmosDBClient.queryItems<IFriend>(
      this.friendsContainer,
      'SELECT * FROM c WHERE (c.userId = @userId AND c.friendId = @friendId) OR (c.userId = @friendId AND c.friendId = @userId)',
      [
        { name: '@userId', value: userId },
        { name: '@friendId', value: friendId }
      ]
    );

    for (const friendship of friendships) {
      await cosmosDBClient.deleteItem(this.friendsContainer, friendship.id);
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    if (userId === blockedUserId) {
      throw new AppError('Cannot block yourself', 400);
    }

    // Remove existing friendship if any
    await this.removeFriend(userId, blockedUserId);

    // Get blocked user details
    const blockedUser = await cosmosDBClient.getItem<IUser>(this.usersContainer, blockedUserId);
    if (!blockedUser) {
      throw new AppError('User not found', 404);
    }

    // Create blocked relationship
    const blocked = new Friend({
      userId,
      friendId: blockedUserId,
      friendUsername: blockedUser.username,
      friendDisplayName: blockedUser.displayName,
      friendAvatar: blockedUser.avatar,
      isBlocked: true,
      blockedAt: new Date()
    });

    await cosmosDBClient.upsertItem(this.friendsContainer, blocked);
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    const blocked = await cosmosDBClient.queryItems<IFriend>(
      this.friendsContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.friendId = @blockedUserId AND c.isBlocked = true',
      [
        { name: '@userId', value: userId },
        { name: '@blockedUserId', value: blockedUserId }
      ]
    );

    if (blocked.length === 0) {
      throw new AppError('User is not blocked', 400);
    }

    await cosmosDBClient.deleteItem(this.friendsContainer, blocked[0].id);
  }

  /**
   * Get user's friends list
   */
  async getFriends(userId: string): Promise<IUser[]> {
    const friendships = await cosmosDBClient.queryItems<IFriend>(
      this.friendsContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.isBlocked = false',
      [{ name: '@userId', value: userId }]
    );

    // Get full user details for each friend
    const friends: IUser[] = [];
    for (const friendship of friendships) {
      const friend = await cosmosDBClient.getItem<IUser>(this.usersContainer, friendship.friendId);
      if (friend) {
        friends.push(friend);
      }
    }

    return friends;
  }

  /**
   * Get pending friend requests (received)
   */
  async getPendingRequests(userId: string): Promise<IFriendRequest[]> {
    return await cosmosDBClient.queryItems<IFriendRequest>(
      this.friendsContainer,
      'SELECT * FROM c WHERE c.receiverId = @userId AND c.status = @status',
      [
        { name: '@userId', value: userId },
        { name: '@status', value: 'pending' }
      ]
    );
  }

  /**
   * Get sent friend requests
   */
  async getSentRequests(userId: string): Promise<IFriendRequest[]> {
    return await cosmosDBClient.queryItems<IFriendRequest>(
      this.friendsContainer,
      'SELECT * FROM c WHERE c.senderId = @userId AND c.status = @status',
      [
        { name: '@userId', value: userId },
        { name: '@status', value: 'pending' }
      ]
    );
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(userId: string): Promise<string[]> {
    const blocked = await cosmosDBClient.queryItems<IFriend>(
      this.friendsContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.isBlocked = true',
      [{ name: '@userId', value: userId }]
    );

    return blocked.map(b => b.friendId);
  }

  /**
   * Check if users are friends
   */
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendships = await cosmosDBClient.queryItems<IFriend>(
      this.friendsContainer,
      'SELECT * FROM c WHERE c.userId = @userId1 AND c.friendId = @userId2 AND c.isBlocked = false',
      [
        { name: '@userId1', value: userId1 },
        { name: '@userId2', value: userId2 }
      ]
    );

    return friendships.length > 0;
  }

  /**
   * Check if user is blocked
   */
  async isBlocked(userId: string, potentialBlockedUserId: string): Promise<boolean> {
    const blocked = await cosmosDBClient.queryItems<IFriend>(
      this.friendsContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.friendId = @blockedUserId AND c.isBlocked = true',
      [
        { name: '@userId', value: userId },
        { name: '@blockedUserId', value: potentialBlockedUserId }
      ]
    );

    return blocked.length > 0;
  }

  /**
   * Toggle favorite status for a friend
   */
  async toggleFavorite(userId: string, friendId: string): Promise<IFriend> {
    const friendships = await cosmosDBClient.queryItems<IFriend>(
      this.friendsContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.friendId = @friendId',
      [
        { name: '@userId', value: userId },
        { name: '@friendId', value: friendId }
      ]
    );

    if (friendships.length === 0) {
      throw new AppError('Not friends', 400);
    }

    const friendship = friendships[0];
    friendship.isFavorite = !friendship.isFavorite;
    return await cosmosDBClient.upsertItem<IFriend>(this.friendsContainer, friendship);
  }
}

export const friendService = new FriendService();
