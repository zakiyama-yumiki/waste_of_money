import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppEnv } from './context';

type ErrorDetails = Record<string, unknown>;

export function jsonError(
  c: Context<AppEnv>,
  status: ContentfulStatusCode,
  code: string,
  message: string,
  details?: ErrorDetails
) {
  const requestId = (c.get('requestId') as string | undefined) ?? c.req.header('X-Request-Id') ?? '';
  const body: {
    error: {
      code: string;
      message: string;
      details?: ErrorDetails;
    };
    requestId: string;
  } = {
    error: { code, message },
    requestId,
  };

  if (details && Object.keys(details).length > 0) {
    body.error.details = details;
  }

  return c.json(body, status);
}
