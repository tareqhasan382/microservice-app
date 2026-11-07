import bcrypt from "bcryptjs";
import pool from "../../config/db";
import config from "../../config";
import { IRegisterUser, IUpdateUser, IUser } from "./user.interface";

const USER_COLUMNS = "id, name, email, image, role, created_at, updated_at";

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(Number(config.bycrypt_salt_rounds) || 10);
  return bcrypt.hash(password, salt);
};

export const UserModel = {
  async findByEmail(email: string, withPassword = false): Promise<IUser | null> {
    const columns = withPassword ? `${USER_COLUMNS}, password` : USER_COLUMNS;
    const { rows } = await pool.query(
      `SELECT ${columns} FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()]
    );
    return rows[0] ?? null;
  },

  async findById(id: number, withPassword = false): Promise<IUser | null> {
    const columns = withPassword ? `${USER_COLUMNS}, password` : USER_COLUMNS;
    const { rows } = await pool.query(
      `SELECT ${columns} FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async create(data: IRegisterUser): Promise<IUser> {
    const hashedPassword = await hashPassword(data.password);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, image)
       VALUES ($1, $2, $3, $4)
       RETURNING ${USER_COLUMNS}`,
      [data.name, data.email.toLowerCase(), hashedPassword, data.image ?? null]
    );
    return rows[0];
  },

  async findAll(limit: number, offset: number): Promise<{ users: IUser[]; total: number }> {
    const { rows } = await pool.query(
      `SELECT ${USER_COLUMNS} FROM users ORDER BY id ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM users`);
    return { users: rows, total: countResult.rows[0].total };
  },

  async update(id: number, data: IUpdateUser): Promise<IUser | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      values.push(data.name);
      fields.push(`name = $${values.length}`);
    }
    if (data.image !== undefined) {
      values.push(data.image);
      fields.push(`image = $${values.length}`);
    }
    if (data.role !== undefined) {
      values.push(data.role);
      fields.push(`role = $${values.length}`);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING ${USER_COLUMNS}`,
      values
    );
    return rows[0] ?? null;
  },

  async updatePassword(id: number, password: string): Promise<void> {
    const hashedPassword = await hashPassword(password);
    await pool.query(
      `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`,
      [hashedPassword, id]
    );
  },

  async remove(id: number): Promise<boolean> {
    const { rowCount } = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  },
};
