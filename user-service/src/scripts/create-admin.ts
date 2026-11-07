import dotenv from "dotenv";
import Path from "path";

dotenv.config({ path: Path.join(process.cwd(), ".env") });

import bcrypt from "bcryptjs";
import { Pool } from "pg";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type AdminEnv = { name: string; email: string; password: string };

export const readAdminEnv = (): AdminEnv => {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set (see user-service/.env)"
    );
  }

  return { name, email, password };
};

export const hashPassword = async (password: string): Promise<string> => {
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  return bcrypt.hash(password, await bcrypt.genSalt(rounds));
};

// Creates the admin from env data, or promotes/updates it if the email already exists.
export const ensureAdmin = async ({ name, email, password }: AdminEnv) => {
  const hashedPassword = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email)
     DO UPDATE SET name = EXCLUDED.name,
                   password = EXCLUDED.password,
                   role = 'admin',
                   updated_at = NOW()
     RETURNING id, name, email, role`,
    [name, email.toLowerCase(), hashedPassword]
  );
  return rows[0] as { id: number; name: string; email: string; role: string };
};

const run = async () => {
  const admin = await ensureAdmin(readAdminEnv());
  console.log(`✅ Admin ready -> id=${admin.id} email=${admin.email} role=${admin.role}`);
};

if (require.main === module) {
  run()
    .catch((error: unknown) => {
      console.error("❌ Failed to create admin:", error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
