const { getShardByRegion, getAllShards } = require('../config/shardRouter');

class MatchModel {
  static async getAll(status = null) {
    const shards = getAllShards();

    const promises = shards.map(async ({ region, pool }) => {
      try {
        let query = `
          SELECT m.*, s.name AS stadium_name, s.city AS stadium_city
          FROM matches m
          JOIN stadiums s ON m.stadium_id = s.id
        `;
        const values = [];

        if (status) {
          query += ' WHERE m.status = $1';
          values.push(status);
        }

        query += ' ORDER BY m.match_date ASC';

        const result = await pool.query(query, values);
        return result.rows.map((row) => ({ ...row, shard: region }));
      } catch (err) {
        return [];
      }
    });

    const results = await Promise.all(promises);
    return results.flat().sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  }

  static async search(keyword) {
    const shards = getAllShards();
    const searchPattern = `%${keyword}%`;

    const promises = shards.map(async ({ region, pool }) => {
      try {
        const query = `
          SELECT m.*, s.name AS stadium_name 
          FROM matches m
          JOIN stadiums s ON m.stadium_id = s.id
          WHERE m.home_team ILIKE $1 
             OR m.away_team ILIKE $1 
             OR s.name ILIKE $1
          ORDER BY m.match_date ASC
        `;
        const result = await pool.query(query, [searchPattern]);
        return result.rows.map((row) => ({ ...row, shard: region }));
      } catch (err) {
        return [];
      }
    });

    const results = await Promise.all(promises);
    return results.flat().sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  }

  static async getById(id, region = null) {
    const query = `
      SELECT m.*, s.name AS stadium_name, s.city AS stadium_city, s.capacity
      FROM matches m
      JOIN stadiums s ON m.stadium_id = s.id
      WHERE m.id = $1
    `;

    if (region) {
      const pool = getShardByRegion(region);
      const result = await pool.query(query, [id]);
      return { match: result.rows[0], region };
    } else {
      const shards = getAllShards();
      const promises = shards.map(async ({ region: r, pool }) => {
        try {
          const result = await pool.query(query, [id]);
          if (result.rows.length > 0) return { match: result.rows[0], region: r };
        } catch (err) {}
        return null;
      });

      const results = await Promise.all(promises);
      return results.find((res) => res !== null) || null;
    }
  }
}

module.exports = MatchModel;
