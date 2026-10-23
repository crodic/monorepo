import { IsMs } from '../../../decorators/validators/is-ms.decorator';
import validateConfig from '../../../utils/validate-config';
import { registerAs } from '@nestjs/config';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { AuthConfig } from './auth-config.type';

class EnvironmentVariablesValidator {
  // GUARD ADMIN
  @IsString()
  @IsNotEmpty()
  AUTH_JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  @IsMs()
  AUTH_JWT_TOKEN_EXPIRES_IN!: string;

  @IsString()
  @IsNotEmpty()
  AUTH_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  @IsMs()
  AUTH_REFRESH_TOKEN_EXPIRES_IN!: string;

  @IsString()
  @IsNotEmpty()
  AUTH_FORGOT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  @IsMs()
  AUTH_FORGOT_TOKEN_EXPIRES_IN!: string;

  @IsString()
  @IsNotEmpty()
  AUTH_CONFIRM_EMAIL_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  @IsMs()
  AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN!: string;

  @IsString()
  @IsOptional()
  AUTH_PORTAL_URL?: string;

  @IsString()
  @IsNotEmpty()
  AUTH_PORTAL_RESET_PASSWORD_URL!: string;

  // GUARD USER
  @IsString()
  @IsNotEmpty()
  USER_AUTH_JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  @IsMs()
  USER_AUTH_JWT_TOKEN_EXPIRES_IN!: string;

  @IsString()
  @IsNotEmpty()
  USER_AUTH_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  @IsMs()
  USER_AUTH_REFRESH_TOKEN_EXPIRES_IN!: string;

  @IsString()
  @IsNotEmpty()
  USER_AUTH_FORGOT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  @IsMs()
  USER_AUTH_FORGOT_TOKEN_EXPIRES_IN!: string;

  @IsString()
  @IsNotEmpty()
  USER_AUTH_CONFIRM_EMAIL_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  @IsMs()
  USER_AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN!: string;

  @IsString()
  @IsNotEmpty()
  USER_AUTH_CLIENT_URL!: string;

  @IsString()
  @IsNotEmpty()
  USER_AUTH_CLIENT_RESET_PASSWORD_URL!: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_OAUTH_CALLBACK_URL!: string;

  @IsString()
  @IsOptional()
  ADMIN_PANEL_USERNAME?: string;

  @IsString()
  @IsOptional()
  ADMIN_PANEL_PASSWORD?: string;
}

function getOriginFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

export default registerAs<AuthConfig>('auth', () => {
  const isProd = process.env.NODE_ENV === 'production';

  const env: Record<string, any> = isProd
    ? {
        AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET,
        AUTH_JWT_TOKEN_EXPIRES_IN: process.env.AUTH_JWT_TOKEN_EXPIRES_IN,
        AUTH_REFRESH_SECRET: process.env.AUTH_REFRESH_SECRET,
        AUTH_REFRESH_TOKEN_EXPIRES_IN:
          process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN,
        AUTH_FORGOT_SECRET: process.env.AUTH_FORGOT_SECRET,
        AUTH_FORGOT_TOKEN_EXPIRES_IN: process.env.AUTH_FORGOT_TOKEN_EXPIRES_IN,
        AUTH_CONFIRM_EMAIL_SECRET: process.env.AUTH_CONFIRM_EMAIL_SECRET,
        AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN:
          process.env.AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN,
        AUTH_PORTAL_URL: process.env.AUTH_PORTAL_URL,
        AUTH_PORTAL_RESET_PASSWORD_URL:
          process.env.AUTH_PORTAL_RESET_PASSWORD_URL,

        USER_AUTH_JWT_SECRET: process.env.USER_AUTH_JWT_SECRET,
        USER_AUTH_JWT_TOKEN_EXPIRES_IN:
          process.env.USER_AUTH_JWT_TOKEN_EXPIRES_IN,
        USER_AUTH_REFRESH_SECRET: process.env.USER_AUTH_REFRESH_SECRET,
        USER_AUTH_REFRESH_TOKEN_EXPIRES_IN:
          process.env.USER_AUTH_REFRESH_TOKEN_EXPIRES_IN,
        USER_AUTH_FORGOT_SECRET: process.env.USER_AUTH_FORGOT_SECRET,
        USER_AUTH_FORGOT_TOKEN_EXPIRES_IN:
          process.env.USER_AUTH_FORGOT_TOKEN_EXPIRES_IN,
        USER_AUTH_CONFIRM_EMAIL_SECRET:
          process.env.USER_AUTH_CONFIRM_EMAIL_SECRET,
        USER_AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN:
          process.env.USER_AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN,
        USER_AUTH_CLIENT_URL: process.env.USER_AUTH_CLIENT_URL,
        USER_AUTH_CLIENT_RESET_PASSWORD_URL:
          process.env.USER_AUTH_CLIENT_RESET_PASSWORD_URL,
        GOOGLE_OAUTH_CALLBACK_URL: process.env.GOOGLE_OAUTH_CALLBACK_URL,

        ADMIN_PANEL_USERNAME: process.env.ADMIN_PANEL_USERNAME,
        ADMIN_PANEL_PASSWORD: process.env.ADMIN_PANEL_PASSWORD,
      }
    : {
        AUTH_JWT_SECRET:
          process.env.AUTH_JWT_SECRET ||
          'secret-jwt-admin-monorepo-super-key-32',
        AUTH_JWT_TOKEN_EXPIRES_IN:
          process.env.AUTH_JWT_TOKEN_EXPIRES_IN || '15m',
        AUTH_REFRESH_SECRET:
          process.env.AUTH_REFRESH_SECRET ||
          'secret-refresh-admin-monorepo-super-key-32',
        AUTH_REFRESH_TOKEN_EXPIRES_IN:
          process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN || '7d',
        AUTH_FORGOT_SECRET:
          process.env.AUTH_FORGOT_SECRET ||
          'secret-forgot-admin-monorepo-super-key-32',
        AUTH_FORGOT_TOKEN_EXPIRES_IN:
          process.env.AUTH_FORGOT_TOKEN_EXPIRES_IN || '1h',
        AUTH_CONFIRM_EMAIL_SECRET:
          process.env.AUTH_CONFIRM_EMAIL_SECRET ||
          'secret-confirm-admin-monorepo-super-key-32',
        AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN:
          process.env.AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN || '24h',
        AUTH_PORTAL_URL: process.env.AUTH_PORTAL_URL || 'http://localhost:5173',
        AUTH_PORTAL_RESET_PASSWORD_URL:
          process.env.AUTH_PORTAL_RESET_PASSWORD_URL ||
          'http://localhost:5173/reset-password',

        USER_AUTH_JWT_SECRET:
          process.env.USER_AUTH_JWT_SECRET ||
          'secret-jwt-user-monorepo-super-key-32',
        USER_AUTH_JWT_TOKEN_EXPIRES_IN:
          process.env.USER_AUTH_JWT_TOKEN_EXPIRES_IN || '15m',
        USER_AUTH_REFRESH_SECRET:
          process.env.USER_AUTH_REFRESH_SECRET ||
          'secret-refresh-user-monorepo-super-key-32',
        USER_AUTH_REFRESH_TOKEN_EXPIRES_IN:
          process.env.USER_AUTH_REFRESH_TOKEN_EXPIRES_IN || '7d',
        USER_AUTH_FORGOT_SECRET:
          process.env.USER_AUTH_FORGOT_SECRET ||
          'secret-forgot-user-monorepo-super-key-32',
        USER_AUTH_FORGOT_TOKEN_EXPIRES_IN:
          process.env.USER_AUTH_FORGOT_TOKEN_EXPIRES_IN || '1h',
        USER_AUTH_CONFIRM_EMAIL_SECRET:
          process.env.USER_AUTH_CONFIRM_EMAIL_SECRET ||
          'secret-confirm-user-monorepo-super-key-32',
        USER_AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN:
          process.env.USER_AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN || '24h',
        USER_AUTH_CLIENT_URL:
          process.env.USER_AUTH_CLIENT_URL || 'http://localhost:3000',
        USER_AUTH_CLIENT_RESET_PASSWORD_URL:
          process.env.USER_AUTH_CLIENT_RESET_PASSWORD_URL ||
          'http://localhost:3000/reset-password',
        GOOGLE_OAUTH_CALLBACK_URL:
          process.env.GOOGLE_OAUTH_CALLBACK_URL ||
          'http://localhost:8001/api/v1/user/auth/google/callback',

        ADMIN_PANEL_USERNAME: process.env.ADMIN_PANEL_USERNAME,
        ADMIN_PANEL_PASSWORD: process.env.ADMIN_PANEL_PASSWORD,
      };

  validateConfig(env, EnvironmentVariablesValidator);

  return {
    secret: env.AUTH_JWT_SECRET,
    expires: env.AUTH_JWT_TOKEN_EXPIRES_IN,
    refreshSecret: env.AUTH_REFRESH_SECRET,
    refreshExpires: env.AUTH_REFRESH_TOKEN_EXPIRES_IN,
    forgotSecret: env.AUTH_FORGOT_SECRET,
    forgotExpires: env.AUTH_FORGOT_TOKEN_EXPIRES_IN,
    confirmEmailSecret: env.AUTH_CONFIRM_EMAIL_SECRET,
    confirmEmailExpires: env.AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN,
    portalUrl:
      env.AUTH_PORTAL_URL ||
      getOriginFromUrl(env.AUTH_PORTAL_RESET_PASSWORD_URL) ||
      (isProd ? '' : 'http://localhost:5173'),
    portalResetPasswordUrl: env.AUTH_PORTAL_RESET_PASSWORD_URL,

    userSecret: env.USER_AUTH_JWT_SECRET,
    userExpires: env.USER_AUTH_JWT_TOKEN_EXPIRES_IN,
    userRefreshSecret: env.USER_AUTH_REFRESH_SECRET,
    userRefreshExpires: env.USER_AUTH_REFRESH_TOKEN_EXPIRES_IN,
    userForgotSecret: env.USER_AUTH_FORGOT_SECRET,
    userForgotExpires: env.USER_AUTH_FORGOT_TOKEN_EXPIRES_IN,
    userConfirmEmailSecret: env.USER_AUTH_CONFIRM_EMAIL_SECRET,
    userConfirmEmailExpires: env.USER_AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN,
    clientUrl: env.USER_AUTH_CLIENT_URL,
    clientResetPasswordUrl: env.USER_AUTH_CLIENT_RESET_PASSWORD_URL,
    googleOAuthCallbackUrl: env.GOOGLE_OAUTH_CALLBACK_URL,

    adminPanelUsername: env.ADMIN_PANEL_USERNAME || (isProd ? '' : 'admin'),
    adminPanelPassword: env.ADMIN_PANEL_PASSWORD || (isProd ? '' : 'admin'),
  };
});
