/**
 * Video Upload Service
 *
 * Handles video introduction uploads for vetting process.
 * Thin wrapper around S3Service with video metadata tracking.
 * Future: Integrate with Mux for video processing and streaming.
 */

import { db } from '../../db';
import { videoRecordings, serviceProviders } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getS3Service } from '../storage/s3.service';
import type { S3UploadResult } from '../storage/s3.service';

export type VideoType = 'self_introduction' | 'work_experience' | 'skills_demo' | 'other';
export type VideoStatus = 'uploaded' | 'processing' | 'ready' | 'failed';

export interface VideoUploadRequest {
  serviceProviderId: string;
  videoType: VideoType;
  file: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  };
}

export interface VideoUploadResult {
  id: string;
  videoUrl: string;
  videoKey: string;
  videoType: VideoType;
  status: VideoStatus;
  uploadedAt: Date;
}

export interface VideoDownloadResult {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

/**
 * Video Upload Service
 */
export class VideoUploadService {
  private s3Service = getS3Service();

  /**
   * Upload a video
   */
  async uploadVideo(request: VideoUploadRequest): Promise<VideoUploadResult> {
    const { serviceProviderId, videoType, file } = request;

    // Upload to S3
    const uploadResult: S3UploadResult = await this.s3Service.uploadFile({
      fileName: file.originalName,
      fileBuffer: file.buffer,
      contentType: file.mimeType,
      folder: `videos/${serviceProviderId}`,
      encrypt: false, // Videos are typically not encrypted (large files, streamed)
      metadata: {
        serviceProviderId,
        videoType,
      },
    });

    // Store metadata in database
    const [video] = await db
      .insert(videoRecordings)
      .values({
        serviceProviderId,
        videoType,
        videoUrl: uploadResult.url,
        videoKey: uploadResult.key,
        status: 'uploaded',
        fileSize: uploadResult.size,
        reviewed: false,
        approved: false,
        uploadedAt: new Date(),
        createdAt: new Date(),
      })
      .returning();

    // If this is a self_introduction video, update service_providers table
    if (videoType === 'self_introduction') {
      await db
        .update(serviceProviders)
        .set({
          videoIntroUrl: uploadResult.url,
          videoIntroStatus: 'pending', // Will be 'processing' when sent to Mux
          videoIntroUploadedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(serviceProviders.id, serviceProviderId));
    }

    return {
      id: video.id,
      videoUrl: uploadResult.url,
      videoKey: uploadResult.key,
      videoType: video.videoType as VideoType,
      status: video.status as VideoStatus,
      uploadedAt: video.uploadedAt || new Date(),
    };
  }

  /**
   * Get a video by ID
   */
  async getVideo(videoId: string): Promise<VideoDownloadResult> {
    const [video] = await db
      .select()
      .from(videoRecordings)
      .where(eq(videoRecordings.id, videoId))
      .limit(1);

    if (!video) {
      throw new Error('Video not found');
    }

    // Download from S3
    const downloadResult = await this.s3Service.downloadFile(video.videoKey);

    return {
      buffer: downloadResult.buffer,
      fileName: `video-${videoId}`,
      mimeType: downloadResult.contentType,
    };
  }

  /**
   * Get all videos for a service provider
   */
  async getVideosByServiceProvider(
    serviceProviderId: string,
    videoType?: VideoType
  ): Promise<Array<{
    id: string;
    videoType: VideoType;
    status: VideoStatus;
    videoUrl: string;
    fileSize: number;
    durationSeconds: number | null;
    reviewed: boolean;
    approved: boolean;
    uploadedAt: Date;
  }>> {
    const conditions = [eq(videoRecordings.serviceProviderId, serviceProviderId)];

    if (videoType) {
      conditions.push(eq(videoRecordings.videoType, videoType));
    }

    const videos = await db
      .select({
        id: videoRecordings.id,
        videoType: videoRecordings.videoType,
        status: videoRecordings.status,
        videoUrl: videoRecordings.videoUrl,
        fileSize: videoRecordings.fileSize,
        durationSeconds: videoRecordings.durationSeconds,
        reviewed: videoRecordings.reviewed,
        approved: videoRecordings.approved,
        uploadedAt: videoRecordings.uploadedAt,
      })
      .from(videoRecordings)
      .where(and(...conditions));

    return videos as any;
  }

  /**
   * Generate a presigned URL for temporary access
   */
  async getPresignedUrl(videoId: string, expiresIn: number = 3600): Promise<string> {
    const [video] = await db
      .select({ videoKey: videoRecordings.videoKey })
      .from(videoRecordings)
      .where(eq(videoRecordings.id, videoId))
      .limit(1);

    if (!video) {
      throw new Error('Video not found');
    }

    return this.s3Service.getPresignedUrl(video.videoKey, expiresIn);
  }

  /**
   * Delete a video
   */
  async deleteVideo(videoId: string): Promise<void> {
    const [video] = await db
      .select({ videoKey: videoRecordings.videoKey })
      .from(videoRecordings)
      .where(eq(videoRecordings.id, videoId))
      .limit(1);

    if (!video) {
      throw new Error('Video not found');
    }

    // Delete from S3
    await this.s3Service.deleteFile(video.videoKey);

    // Delete from database
    await db.delete(videoRecordings).where(eq(videoRecordings.id, videoId));
  }

  /**
   * Review a video (admin action)
   */
  async reviewVideo(
    videoId: string,
    approved: boolean,
    reviewedBy: string,
    notes?: string
  ): Promise<void> {
    await db
      .update(videoRecordings)
      .set({
        reviewed: true,
        approved,
        reviewedBy,
        reviewedAt: new Date(),
        adminNotes: notes || null,
      })
      .where(eq(videoRecordings.id, videoId));
  }

  /**
   * Process video with Mux (future implementation)
   * This is a placeholder for Mux integration
   */
  async processWithMux(videoId: string): Promise<void> {
    // TODO: Implement Mux integration
    // 1. Create Mux asset
    // 2. Upload video to Mux
    // 3. Store muxAssetId and muxPlaybackUrl
    // 4. Update status to 'processing'
    // 5. Wait for Mux webhook to update status to 'ready'

    throw new Error('Mux integration not yet implemented');
  }

  /**
   * Update video processing status (called by Mux webhook)
   */
  async updateVideoStatus(
    videoId: string,
    status: VideoStatus,
    muxAssetId?: string,
    muxPlaybackUrl?: string,
    durationSeconds?: number
  ): Promise<void> {
    await db
      .update(videoRecordings)
      .set({
        status,
        muxAssetId: muxAssetId || null,
        muxPlaybackUrl: muxPlaybackUrl || null,
        durationSeconds: durationSeconds || null,
      })
      .where(eq(videoRecordings.id, videoId));

    // If this is a self_introduction video, update service_providers table
    const [video] = await db
      .select({ videoType: videoRecordings.videoType, serviceProviderId: videoRecordings.serviceProviderId })
      .from(videoRecordings)
      .where(eq(videoRecordings.id, videoId))
      .limit(1);

    if (video && video.videoType === 'self_introduction') {
      await db
        .update(serviceProviders)
        .set({
          videoIntroStatus: status === 'ready' ? 'ready' : status === 'processing' ? 'processing' : 'failed',
          videoIntroAssetId: muxAssetId || null,
          updatedAt: new Date(),
        })
        .where(eq(serviceProviders.id, video.serviceProviderId));

      // If Mux playback URL exists, update that too
      if (muxPlaybackUrl) {
        await db
          .update(serviceProviders)
          .set({
            videoIntroUrl: muxPlaybackUrl,
            updatedAt: new Date(),
          })
          .where(eq(serviceProviders.id, video.serviceProviderId));
      }
    }
  }

  /**
   * Check if service provider has uploaded required videos
   */
  async hasRequiredVideos(serviceProviderId: string): Promise<{
    hasIntroVideo: boolean;
    isApproved: boolean;
  }> {
    const videos = await this.getVideosByServiceProvider(
      serviceProviderId,
      'self_introduction'
    );

    const hasIntroVideo = videos.length > 0;
    const isApproved = videos.some((v) => v.approved);

    return {
      hasIntroVideo,
      isApproved,
    };
  }
}
