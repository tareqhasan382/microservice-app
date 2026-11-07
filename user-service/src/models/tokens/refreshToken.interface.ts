export type IRefreshToken = {
  id?: number;
  userId: number;
  token: string;
  expiresAt: Date;
  revoked?: boolean;
  replacedByToken?: string | null;
};
