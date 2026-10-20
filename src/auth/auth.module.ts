import { Global, Module } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard.js';

@Global()
@Module({
  providers: [
    {
      provide: SupabaseAuthGuard,
      useFactory: () => new SupabaseAuthGuard(
        process.env.SUPABASE_URL ?? '',
        process.env.SUPABASE_PUBLISHABLE_KEY ?? '',
      ),
    },
  ],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
