import pool from "../../config/db";
import { IRefreshToken } from "./refreshToken.interface";

const TOKEN_COLUMNS =
  'id, user_id AS "userId", token, expires_at AS "expiresAt", revoked, replaced_by_token AS "replacedByToken"';

export const RefreshTokenModel = {
  async create(data: { userId: number; token: string; expiresAt: Date }): Promise<void> {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [data.userId, data.token, data.expiresAt]
    );
  },

  async findByToken(token: string): Promise<IRefreshToken | null> {
    const { rows } = await pool.query(
      `SELECT ${TOKEN_COLUMNS} FROM refresh_tokens WHERE token = $1 LIMIT 1`,
      [token]
    );
    return rows[0] ?? null;
  },

  async revoke(token: string, replacedByToken: string | null = null): Promise<void> {
    await pool.query(
      `UPDATE refresh_tokens
       SET revoked = TRUE, replaced_by_token = $2, updated_at = NOW()
       WHERE token = $1`,
      [token, replacedByToken]
    );
  },
};
