import Mux from '@mux/mux-node';

export class MuxService {
  private mux: Mux;

  constructor() {
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      console.warn('MUX_TOKEN_ID or MUX_TOKEN_SECRET not set. MuxService will not function correctly.');
    }

    this.mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });
  }

  /**
   * Generate a direct upload URL for the client
   */
  async getDirectUploadUrl() {
    try {
      const upload = await this.mux.video.uploads.create({
        new_asset_settings: {
          playback_policy: ['public'],
          encoding_tier: 'baseline', // Cost-effective for simple intros
        },
        cors_origin: '*', // Allow uploads from any origin (adjust for prod)
      });

      return {
        uploadUrl: upload.url,
        uploadId: upload.id,
      };
    } catch (error) {
      console.error('Error creating Mux upload URL:', error);
      throw new Error('Failed to create video upload URL');
    }
  }

  /**
   * Get asset details by upload ID
   * Used to confirm upload completion and get asset ID
   */
  async getUploadDetails(uploadId: string) {
    try {
      const upload = await this.mux.video.uploads.retrieve(uploadId);
      return upload;
    } catch (error) {
      console.error('Error retrieving Mux upload details:', error);
      throw new Error('Failed to retrieve upload details');
    }
  }

  /**
   * Get asset details by asset ID
   */
  async getAsset(assetId: string) {
    try {
      const asset = await this.mux.video.assets.retrieve(assetId);
      return asset;
    } catch (error) {
      console.error('Error retrieving Mux asset:', error);
      throw new Error('Failed to retrieve video asset');
    }
  }

  /**
   * Delete an asset
   */
  async deleteAsset(assetId: string) {
    try {
      await this.mux.video.assets.delete(assetId);
      return true;
    } catch (error) {
      console.error('Error deleting Mux asset:', error);
      throw new Error('Failed to delete video asset');
    }
  }
}

export const muxService = new MuxService();
