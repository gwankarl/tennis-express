import { createHash } from 'node:crypto';
import type { Request } from 'express';

const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Creates a stable, non-plaintext identity key for product view deduplication. */
export function getProductViewActorKey(request: Request): string | null {
  if (request.auth?.userId) {
    return `user:${request.auth.userId}`;
  }

  const visitorId = request.get('X-Visitor-Id')?.trim();

  if (!visitorId || !VISITOR_ID_PATTERN.test(visitorId)) {
    return null;
  }

  const visitorHash = createHash('sha256').update(visitorId).digest('hex');

  return `visitor:${visitorHash}`;
}
