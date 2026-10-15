import { OAuthProviderProfile } from './oauth-provider-profile.type';

export interface OAuthProviderAdapter<TProfile = unknown> {
  normalize(profile: TProfile): OAuthProviderProfile;
}
