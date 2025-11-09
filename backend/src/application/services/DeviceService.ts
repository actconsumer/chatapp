/**
 * Device Service
 * Handles trusted device management and device-based authentication
 */

import { cosmosDBClient } from '../../infrastructure/database/cosmosdb.config';
import { AppError } from '../middleware/error.middleware';
import { Device, IDevice } from '../../domain/entities/Device';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export class DeviceService {
  private readonly devicesContainer = 'devices';
  private readonly usersContainer = 'users';

  /**
   * Generate device fingerprint hash
   */
  private generateFingerprint(deviceInfo: IDevice['fingerprint']): string {
    const fingerprintString = JSON.stringify(deviceInfo);
    return crypto.createHash('sha256').update(fingerprintString).digest('hex');
  }

  /**
   * Register a new device during signup/login
   */
  async registerDevice(
    userId: string,
    deviceInfo: {
      deviceId: string;
      deviceName: string;
      deviceType: 'mobile' | 'tablet' | 'desktop' | 'web';
      platform: string;
      appVersion?: string;
      fingerprint: IDevice['fingerprint'];
      ipAddress?: string;
      pushToken?: string;
    }
  ): Promise<IDevice> {
    // Check if device already exists
    const existingDevices = await cosmosDBClient.queryItems<IDevice>(
      this.devicesContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.deviceId = @deviceId',
      [
        { name: '@userId', value: userId },
        { name: '@deviceId', value: deviceInfo.deviceId }
      ]
    );

    if (existingDevices.length > 0) {
      // Update existing device
      const device = existingDevices[0];
      device.lastActiveAt = new Date();
      device.lastIpAddress = deviceInfo.ipAddress;
      device.pushToken = deviceInfo.pushToken;
      device.appVersion = deviceInfo.appVersion;
      device.updatedAt = new Date();
      return await cosmosDBClient.upsertItem<IDevice>(this.devicesContainer, device);
    }

    // Create new device
    const device = new Device({
      id: uuidv4(),
      userId,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType,
      platform: deviceInfo.platform,
      appVersion: deviceInfo.appVersion,
      fingerprint: deviceInfo.fingerprint,
      isTrusted: false, // Not trusted by default
      requiresPinOnStart: true, // Requires security check
      lastActiveAt: new Date(),
      lastIpAddress: deviceInfo.ipAddress,
      pushToken: deviceInfo.pushToken,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return await cosmosDBClient.upsertItem<IDevice>(this.devicesContainer, device);
  }

  /**
   * Trust a device (skip PIN/security code on this device)
   */
  async trustDevice(userId: string, deviceId: string): Promise<IDevice> {
    const devices = await cosmosDBClient.queryItems<IDevice>(
      this.devicesContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.deviceId = @deviceId',
      [
        { name: '@userId', value: userId },
        { name: '@deviceId', value: deviceId }
      ]
    );

    if (devices.length === 0) {
      throw new AppError('Device not found', 404);
    }

    const device = new Device(devices[0]);
    device.markAsTrusted();

    return await cosmosDBClient.upsertItem<IDevice>(this.devicesContainer, device);
  }

  /**
   * Revoke trust from a device
   */
  async revokeDevice(userId: string, deviceId: string): Promise<void> {
    const devices = await cosmosDBClient.queryItems<IDevice>(
      this.devicesContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.deviceId = @deviceId',
      [
        { name: '@userId', value: userId },
        { name: '@deviceId', value: deviceId }
      ]
    );

    if (devices.length === 0) {
      throw new AppError('Device not found', 404);
    }

    const device = new Device(devices[0]);
    device.revokeTrust();

    await cosmosDBClient.upsertItem(this.devicesContainer, device);
  }

  /**
   * Check if device is trusted
   */
  async isDeviceTrusted(userId: string, deviceId: string): Promise<boolean> {
    const devices = await cosmosDBClient.queryItems<IDevice>(
      this.devicesContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.deviceId = @deviceId',
      [
        { name: '@userId', value: userId },
        { name: '@deviceId', value: deviceId }
      ]
    );

    if (devices.length === 0) {
      return false;
    }

    return devices[0].isTrusted && !devices[0].revokedAt;
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string): Promise<IDevice[]> {
    return await cosmosDBClient.queryItems<IDevice>(
      this.devicesContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.revokedAt = null ORDER BY c.lastActiveAt DESC',
      [{ name: '@userId', value: userId }]
    );
  }

  /**
   * Update device activity
   */
  async updateDeviceActivity(
    userId: string,
    deviceId: string,
    ipAddress?: string
  ): Promise<void> {
    const devices = await cosmosDBClient.queryItems<IDevice>(
      this.devicesContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.deviceId = @deviceId',
      [
        { name: '@userId', value: userId },
        { name: '@deviceId', value: deviceId }
      ]
    );

    if (devices.length > 0) {
      const device = new Device(devices[0]);
      device.updateActivity(ipAddress);
      await cosmosDBClient.upsertItem(this.devicesContainer, device);
    }
  }

  /**
   * Verify device (updates last verified timestamp)
   */
  async verifyDevice(userId: string, deviceId: string): Promise<IDevice> {
    const devices = await cosmosDBClient.queryItems<IDevice>(
      this.devicesContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.deviceId = @deviceId',
      [
        { name: '@userId', value: userId },
        { name: '@deviceId', value: deviceId }
      ]
    );

    if (devices.length === 0) {
      throw new AppError('Device not found', 404);
    }

    const device = new Device(devices[0]);
    device.verify();

    return await cosmosDBClient.upsertItem<IDevice>(this.devicesContainer, device);
  }

  /**
   * Remove device (for logout or device removal)
   */
  async removeDevice(userId: string, deviceId: string): Promise<void> {
    const devices = await cosmosDBClient.queryItems<IDevice>(
      this.devicesContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.deviceId = @deviceId',
      [
        { name: '@userId', value: userId },
        { name: '@deviceId', value: deviceId }
      ]
    );

    if (devices.length > 0) {
      await cosmosDBClient.deleteItem(this.devicesContainer, devices[0].id);
    }
  }

  /**
   * Update push notification token
   */
  async updatePushToken(
    userId: string,
    deviceId: string,
    pushToken: string
  ): Promise<void> {
    const devices = await cosmosDBClient.queryItems<IDevice>(
      this.devicesContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.deviceId = @deviceId',
      [
        { name: '@userId', value: userId },
        { name: '@deviceId', value: deviceId }
      ]
    );

    if (devices.length > 0) {
      const device = devices[0];
      device.pushToken = pushToken;
      device.updatedAt = new Date();
      await cosmosDBClient.upsertItem(this.devicesContainer, device);
    }
  }

  /**
   * Get trusted devices count
   */
  async getTrustedDevicesCount(userId: string): Promise<number> {
    const devices = await this.getUserDevices(userId);
    return devices.filter(d => d.isTrusted).length;
  }

  /**
   * Revoke all devices except current (for security purposes)
   */
  async revokeAllDevicesExcept(userId: string, currentDeviceId: string): Promise<number> {
    const devices = await this.getUserDevices(userId);
    let revokedCount = 0;

    for (const device of devices) {
      if (device.deviceId !== currentDeviceId) {
        const deviceInstance = new Device(device);
        deviceInstance.revokeTrust();
        await cosmosDBClient.upsertItem(this.devicesContainer, deviceInstance);
        revokedCount++;
      }
    }

    return revokedCount;
  }
}

export const deviceService = new DeviceService();
