/**
 * SHAMIKH LUXURY OS — Redis-backed Queue Manager (BullMQ Wrapper)
 * Enterprise-grade asynchronous job queue system.
 * Dual-mode: uses real BullMQ if Redis is configured, otherwise falls back to safe memory-based delays.
 */

import { eventBus } from './event-bus';

interface QueueJobOptions {
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}

class ShamakhQueueManager {
  private isRedisConfigured = false;
  private redisUrl = '';

  constructor() {
    this.redisUrl = process.env.REDIS_URL || '';
    if (this.redisUrl && !this.redisUrl.includes('placeholder')) {
      this.isRedisConfigured = true;
    }
  }

  /**
   * Enqueue a background job for asynchronous worker execution.
   */
  async enqueue(
    queueName: 'emails' | 'sync' | 'security' | 'crm',
    jobName: string,
    payload: Record<string, unknown>,
    options: QueueJobOptions = {}
  ): Promise<{ success: boolean; jobId?: string; mode: 'redis' | 'mock' }> {
    if (this.isRedisConfigured) {
      try {
        // Dynamically import BullMQ & IORedis to avoid Edge runtime/Next.js client-side bundle weight
        const { Queue } = await import('bullmq');
        const IORedis = (await import('ioredis')).default;

        const connection = new IORedis(this.redisUrl, {
          maxRetriesPerRequest: null,
        });

        const queue = new Queue(queueName, { connection });
        const job = await queue.add(jobName, payload, {
          delay: options.delay || 0,
          attempts: options.attempts || 3,
          backoff: options.backoff || { type: 'exponential', delay: 1000 },
        });

        // Clean up connection gracefully
        await queue.close();
        await connection.quit();

        console.info(`[SHAMIKH QUEUE] Job ${job.id} enqueued successfully to ${queueName} [Redis]`);
        return { success: true, jobId: job.id, mode: 'redis' };
      } catch (err: any) {
        console.error('[SHAMIKH QUEUE] Redis BullMQ failed, falling back to mock queue:', err.message);
      }
    }

    // ─── MOCK / FALLBACK MODE ─────────────────────────────────────────
    const mockJobId = `job_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Simulate async execution with setTimeout
    const executeMockJob = async () => {
      console.info(`[SHAMIKH QUEUE MOCK] Starting mock job execution: ${jobName} on queue: ${queueName}`);
      
      // Dispatch via our central EventBus to fire appropriate business logic
      if (queueName === 'emails') {
        await eventBus.emit('NOTIFICATION_REQUESTED', {
          channel: 'email',
          type: jobName,
          ...payload,
        }, 'queue_mock_worker');
      } else if (queueName === 'security') {
        await eventBus.emit('FRAUD_DETECTED', payload as any, 'queue_mock_worker');
      } else if (queueName === 'sync') {
        // Trigger AliExpress price/stock sync in background
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/dropshipping/sync`).catch(() => {});
      }
    };

    if (options.delay) {
      setTimeout(executeMockJob, options.delay);
    } else {
      // Fire-and-forget
      executeMockJob();
    }

    return { success: true, jobId: mockJobId, mode: 'mock' };
  }
}

export const queueManager = new ShamakhQueueManager();
