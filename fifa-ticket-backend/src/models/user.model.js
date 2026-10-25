const { getShardByRegion, getAllShards } = require('../config/shardRouter');

class UserModel {
  static async findByEmail(email) {
    const shards = getAllShards();

    const promises = shards.map(async ({ region, pool }) => {
      try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
          return { user: result.rows[0], region };
        }
      } catch (err) {}
      return null;
    });

    const results = await Promise.all(promises);
    const found = results.find((res) => res !== null);
    return found || null;
  }

  static async create(userData, region = 'europe') {
    const pool = getShardByRegion(region);
    const { full_name, email, password, phone, role = 'user' } = userData;

    const query = `
      INSERT INTO users (full_name, email, password, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, full_name, email, role, created_at
    `;
    const values = [full_name, email, password, phone, role];

    const result = await pool.query(query, values);
    return { user: result.rows[0], region };
  }

  static async findById(id, region) {
    const pool = getShardByRegion(region);
    const result = await pool.query(
      'SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByIdWithPassword(id, region) {
    const pool = getShardByRegion(region);
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async updateProfile(id, region, updates) {
    const pool = getShardByRegion(region);
    const {
      full_name,
      phone,
      nationality,
      passport_number,
      billing_address,
      payment_methods,
      preferences,
    } = updates;

    const query = `
      UPDATE users SET full_name = $2, phone = $3
      WHERE id = $1
      RETURNING id, full_name, email, phone, role, created_at
    `;
    const values = [
      id,
      full_name,
      phone,
      nationality,
      passport_number,
      billing_address,
      payment_methods,
      preferences,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updatePassword(id, region, newHashedPassword) {
    const pool = getShardByRegion(region);
    await pool.query('UPDATE users SET password = $2 WHERE id = $1', [id, newHashedPassword]);
    return true;
  }
}

module.exports = UserModel;
