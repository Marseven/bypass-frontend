import type { AxiosRequestConfig } from 'axios';

const QUEUE_KEY = 'bypass_offline_queue';

interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data?: unknown;
  timestamp: number;
}

function getQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedRequest[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(config: AxiosRequestConfig): void {
  const queue = getQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    method: config.method || 'post',
    url: config.url || '',
    data: config.data,
    timestamp: Date.now(),
  });
  saveQueue(queue);
}

export function getPendingCount(): number {
  return getQueue().length;
}

export async function flush(apiInstance: { request: (config: AxiosRequestConfig) => Promise<unknown> }): Promise<{ success: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;
  const remaining: QueuedRequest[] = [];

  for (const item of queue) {
    try {
      await apiInstance.request({
        method: item.method,
        url: item.url,
        data: item.data,
      });
      success++;
    } catch {
      failed++;
      remaining.push(item);
    }
  }

  saveQueue(remaining);
  return { success, failed };
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}
