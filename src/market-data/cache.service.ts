import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class CacheService {
  private readonly cacheDir = path.join(process.cwd(), 'responses');

  constructor() {
    this.ensureCacheDirectoryExists();
  }

  private async ensureCacheDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.cacheDir);
    } catch {
      await fs.mkdir(this.cacheDir, { recursive: true });
    }
  }

  private generateCacheKey(request: any): string {
    const requestString = JSON.stringify(request, Object.keys(request).sort());
    return crypto.createHash('sha256').update(requestString).digest('hex');
  }

  private getCacheFilePath(cacheKey: string): string {
    return path.join(this.cacheDir, `${cacheKey}.json`);
  }

  async get<T>(request: any): Promise<T | null> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const filePath = this.getCacheFilePath(cacheKey);
      
      const data = await fs.readFile(filePath, 'utf-8');
      const cachedResponse = JSON.parse(data);
      
      console.log(`Cache HIT for key: ${cacheKey}`);
      return cachedResponse.data;
    } catch (error) {
      console.log(`Cache MISS for request:`, request);
      return null;
    }
  }

  async set(request: any, data: any): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const filePath = this.getCacheFilePath(cacheKey);
      
      const cacheEntry = {
        timestamp: new Date().toISOString(),
        request,
        data
      };
      
      await fs.writeFile(filePath, JSON.stringify(cacheEntry, null, 2));
      console.log(`Cached response for key: ${cacheKey}`);
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.cacheDir, file)))
      );
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}