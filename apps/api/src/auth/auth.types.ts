export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  universityId: string;
}
