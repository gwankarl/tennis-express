import { afterEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';

describe('health endpoint', () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (!server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    server = undefined;
  });

  it('returns an ok status', async () => {
    server = createApp().listen(0);

    await new Promise<void>((resolve) => {
      server?.once('listening', resolve);
    });

    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Expected the test server to listen on a TCP port');
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/health`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });
});
