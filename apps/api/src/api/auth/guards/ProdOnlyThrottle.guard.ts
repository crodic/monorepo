import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ProdOnlyThrottleGuard extends ThrottlerGuard {
  override canActivate(context: ExecutionContext): Promise<boolean> {
    const isProd = process.env.NODE_ENV === 'production';

    if (!isProd) {
      return Promise.resolve(true);
    }

    return super.canActivate(context);
  }

  protected override throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      'Too many attempts from your IP. Please wait 1 minute.',
    );
  }
}
