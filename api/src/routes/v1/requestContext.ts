import type {Request, Response, NextFunction} from 'express';

/**
 * Tenant-aware request context placeholder (Phase 2).
 *
 * Every v1 route receives a context object. Currently it is always the
 * 'system' organisation — there is no auth or database yet. The signature
 * is what matters: service-layer code must take a context rather than
 * accepting organisationId from the request body as proof of access
 * (DEVELOPMENT_PLAN §11.4).
 *
 * Phase 5/10 will populate this from real auth.
 */
export type RequestContext = {
  organisationId: string;
  userId: string | null;
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'service';
};

export const SYSTEM_CONTEXT: RequestContext = {
  organisationId: 'system',
  userId: null,
  role: 'service',
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      ctx?: RequestContext;
    }
  }
}

/** Attaches the system context to every /api/v1 request for now. */
export const attachRequestContext = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.locals.ctx = SYSTEM_CONTEXT;
  next();
};
