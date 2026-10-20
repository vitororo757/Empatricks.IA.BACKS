import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

export interface AuthenticatedIdentity {
  id: string;
  appMetadata: Record<string, unknown>;
}

interface SupabaseUser {
  id?: unknown;
  app_metadata?: unknown;
}

interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedIdentity;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabaseUrl: string,
    private readonly publishableKey: string,
    private readonly requestFetch: typeof fetch = fetch,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = Array.isArray(authorization) ? undefined : authorization;
    const bearer = token?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!bearer || !this.supabaseUrl || !this.publishableKey) {
      throw new UnauthorizedException();
    }

    let response: Response;
    try {
      response = await this.requestFetch(
        `${this.supabaseUrl.replace(/\/$/, '')}/auth/v1/user`,
        {
          headers: {
            apikey: this.publishableKey,
            authorization: `Bearer ${bearer}`,
          },
          signal: AbortSignal.timeout(5_000),
        },
      );
    } catch {
      throw new UnauthorizedException();
    }

    if (!response.ok) throw new UnauthorizedException();

    let user: SupabaseUser;
    try {
      user = (await response.json()) as SupabaseUser;
    } catch {
      throw new UnauthorizedException();
    }

    if (typeof user.id !== 'string' || user.id.length === 0) {
      throw new UnauthorizedException();
    }

    const appMetadata = isRecord(user.app_metadata) ? user.app_metadata : {};
    request.user = { id: user.id, appMetadata };
    return true;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
