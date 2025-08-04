export class ResourceManager {
  constructor() {
    this.assets = new Map();
    this.loadingProgress = 0;
    this.totalAssets = 0;
    this.loadedAssets = 0;
  }

  async loadAssets() {
    // In a real implementation, you would load a manifest file
    // For now, we'll just resolve immediately
    return Promise.resolve();
  }

  async loadAsset(assetInfo) {
    try {
      let asset;
      switch (assetInfo.type) {
      case 'font':
        asset = await this.loadFont(assetInfo);
        break;
      case 'audio':
        asset = await this.loadAudio(assetInfo);
        break;
      case 'image':
        asset = await this.loadImage(assetInfo);
        break;
      }

      this.assets.set(assetInfo.id, asset);
      this.updateProgress();

    } catch (error) {
      console.error(`Failed to load asset: ${assetInfo.id}`, error);
    }
  }

  updateProgress() {
    this.loadedAssets++;
    this.loadingProgress = this.loadedAssets / this.totalAssets;
    this.onProgressUpdate?.(this.loadingProgress);
  }

  getAsset(id) {
    return this.assets.get(id);
  }
}
