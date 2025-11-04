import { IAudio, ITrackItem, IVideo } from "@designcombo/types";
import { AudioData, getAudioData, visualizeAudio } from "@remotion/media-utils";
import { isEqual } from "lodash";

interface AudioDataCache {
  data: AudioData;
  lastAccessed: number;
}

export class AudioDataManager {
  private fps = 30;
  private numberOfSamples = 512;
  public dataBars: number[] = [];
  public items: (ITrackItem & (IVideo | IAudio))[] = [];
  private audioDatas: { [key: string]: AudioDataCache } = {};
  private readonly MAX_CACHE_SIZE = 10;
  private frameCache: Map<number, number[]> = new Map();
  private readonly CACHE_TTL = 1000 * 60 * 5; // 5 minutes
  private suppressedSources: Set<string> = new Set();

  private toEffectiveSrc(src: string): string {
    if (typeof window === "undefined" || !src) return src;
    try {
      const url = new URL(src, window.location.origin);
      if (url.origin !== window.location.origin) {
        return `/api/uploads/url?u=${encodeURIComponent(src)}`;
      }
    } catch {}
    return src;
  }

  public setAudioDataManager(fps: number) {
    this.fps = fps;
  }

  private async loadAudioData(src: string, id: string): Promise<void> {
    try {
      const effective = this.toEffectiveSrc(src);
      if (this.suppressedSources.has(effective)) return;
      console.log("Loading audio data for", effective);
      const data = await getAudioData(effective);
      this.audioDatas[id] = {
        data,
        lastAccessed: Date.now()
      };
      this.cleanupCache();
    } catch (error) {
      // Be permissive: audio analysis is optional. If decoding fails or is blocked,
      // skip gracefully so video rendering continues.
      const name = (error as any)?.name || "Error";
      const message = (error as any)?.message || String(error);
      const log = (msg: string) => {
        // Warn once per source to reduce console noise
        if (!this.suppressedSources.has(src)) {
          console.warn(msg);
          this.suppressedSources.add(src);
        }
      };

      const knownSkippable = [
        "EncodingError",
        "NotSupportedError",
        "AbortError",
        "TypeError", // often fetch/CORS issues surface as TypeError in browsers
        "DOMException"
      ];
      if (
        knownSkippable.includes(name) ||
        /Unable to decode audio data/i.test(message) ||
        /decoding/i.test(message) ||
        /403/i.test(message) ||
        /Failed to fetch/i.test(message)
      ) {
        log(`Skipping audio analysis for ${src} due to: ${name} ${message}`);
        return;
      }

      // Default: skip (don't throw) to avoid breaking the player on audio decode issues
      log(`Skipping audio analysis for ${src} due to unknown error: ${name} ${message}`);
      return;
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const entries = Object.entries(this.audioDatas);

    if (entries.length > this.MAX_CACHE_SIZE) {
      const entriesToRemove = entries
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
        .slice(0, entries.length - this.MAX_CACHE_SIZE);

      for (const [id] of entriesToRemove) {
        delete this.audioDatas[id];
      }
    }

    // Remove expired cache entries
    for (const [id, cache] of entries) {
      if (now - cache.lastAccessed > this.CACHE_TTL) {
        delete this.audioDatas[id];
      }
    }
  }

  public async setItems(items: (ITrackItem & (IVideo | IAudio))[]) {
    const newItemIds = items.map((item) => item.id);
    const currentItemIds = this.items.map((item) => item.id);
    const addItemIds = newItemIds.filter((id) => !currentItemIds.includes(id));
    const removeItemIds = currentItemIds.filter(
      (id) => !newItemIds.includes(id)
    );

    // Remove items
    for (const id of removeItemIds) {
      this.removeItem(id);
    }

    // Add new items
    await Promise.all(
      addItemIds.map(async (id) => {
        const item = items.find((item) => item.id === id);
        if (item?.details.src) {
          await this.loadAudioData(item.details.src, id);
        }
      })
    );

    this.items = items;
    this.frameCache.clear(); // Clear frame cache when items change
  }

  public validateUpdateItems(
    validateItems: (ITrackItem & (IVideo | IAudio))[]
  ) {
    for (const item of validateItems) {
      for (const audioDataItem of this.items) {
        if (!isEqual(audioDataItem, item) && audioDataItem.id === item.id) {
          this.updateItem(item);
        }
      }
    }
  }

  public removeItem(id: string) {
    delete this.audioDatas[id];
    this.frameCache.clear(); // Clear frame cache when items are removed
  }

  public async updateItem(newItem: ITrackItem & (IVideo | IAudio)) {
    this.items = this.items.map((item) => {
      if (item.id === newItem.id) {
        if (item.details.src !== newItem.details.src) {
          this.loadAudioData(newItem.details.src, item.id).catch(() => {});
        }
        return newItem;
      }
      return item;
    });
    this.frameCache.clear(); // Clear frame cache when items are updated
  }

  private combineValues = (
    length: number,
    sources: Array<number[]>
  ): number[] => {
    return Array.from({ length }).map((_, i) => {
      return sources.reduce((acc, source) => Math.max(acc, source[i]), 0);
    });
  };

  getAudioDataForFrame(frame: number): number[] {
    // Check cache first
    const cachedResult = this.frameCache.get(frame);
    if (cachedResult) {
      return cachedResult;
    }

    const visualizationValues = this.items.map((item, index) => {
      const cache = this.audioDatas[item.id];
      if (!cache) return Array(this.numberOfSamples).fill(0);

      const frameTime =
        frame -
        (this.items[index].display.from * this.fps) / 1000 +
        ((this.items[index].trim?.from || 0) * this.fps) / 1000;

      if (
        (this.items[index].display.from * this.fps) / 1000 > frame ||
        (this.items[index].display.to * this.fps) / 1000 < frame
      ) {
        return Array(this.numberOfSamples).fill(0);
      }

      const visualizationValues = visualizeAudio({
        audioData: cache.data,
        frame: frameTime,
        fps: this.fps,
        numberOfSamples: this.numberOfSamples
      });

      // Update last accessed time
      cache.lastAccessed = Date.now();
      return visualizationValues;
    });

    const result = this.combineValues(
      this.numberOfSamples,
      visualizationValues
    );

    // Cache the result
    this.frameCache.set(frame, result);

    // Limit cache size
    if (this.frameCache.size > 100) {
      const firstKey = this.frameCache.keys().next().value;
      if (firstKey !== undefined) {
        this.frameCache.delete(firstKey);
      }
    }

    return result;
  }
}

export const audioDataManager = new AudioDataManager();
