import { Response } from 'express';
import { logger } from '../utils/logger.js';

class SSEManager {
  private clients: Map<string, Response> = new Map();

  addClient(clientId: string, res: Response): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

    this.clients.set(clientId, res);
    logger.info(`SSE client connected: ${clientId} (Total: ${this.clients.size})`);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    logger.info(`SSE client disconnected: ${clientId} (Total: ${this.clients.size})`);
  }

  broadcastFlagUpdate(
    flagKey: string,
    data: {
      action: 'CREATE' | 'UPDATE' | 'DELETE' | 'TOGGLE';
      flag?: any;
      version?: number;
    }
  ): void {
    const message = {
      type: 'flag_update',
      flagKey,
      action: data.action,
      timestamp: Date.now(),
      version: data.version,
      ...(data.flag && {
        flag : {
          key: data.flag.key,
          name: data.flag.name,
          enabled: data.flag.enabled,
          rolloutPercentage: data.flag.rolloutPercentage,
          tags: data.flag.tags,
          version: data.flag.__v,
        },
      }),
    };

    const eventData = `event: flag_update\ndata: ${JSON.stringify(message)}\n\n`;

    let sentCount = 0;
    for (const [clientId, client] of this.clients) {
      try {
        client.write(eventData);
        sentCount++;
      } catch (error) {
        logger.error(`Failed to send to client ${clientId}:`, error);
        this.removeClient(clientId);
      }
    }

    logger.info(`Broadcast flag update: ${flagKey} (${data.action}) to ${sentCount} clients`);
  }

  broadcastBulkUpdate(flagKeys: string[], action: 'BULK_UPDATE'): void {
    const message = {
      type: 'bulk_update',
      flagKeys,
      action,
      timestamp: Date.now(),
    };

    const eventData = `event: bulk_update\ndata: ${JSON.stringify(message)}\n\n`;

    for (const [clientId, client] of this.clients) {
      try {
        client.write(eventData);
      } catch (error) {
        logger.error('Failed to send bulk update:', error);
        this.removeClient(clientId);
      }
    }

    logger.info(`Broadcast bulk update for ${flagKeys.length} flags`);
  }

  getStats(): { totalConnections: number; clientIds: string[] } {
    return {
      totalConnections: this.clients.size,
      clientIds: Array.from(this.clients.keys()),
    };
  }
}

export const sseManager = new SSEManager();
