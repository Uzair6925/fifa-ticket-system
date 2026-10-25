const { getShardByRegion, getAllShards } = require('../config/shardRouter');

class StadiumModel {
  /**
   * Get all stadiums across all regional shards
   */
  static async getAll() {
    const shards = getAllShards();
    
    // Fetch from all shards concurrently
    const promises = shards.map(async ({ region, pool }) => {
      try {
        const result = await pool.query('SELECT * FROM stadiums ORDER BY name ASC');
        // Tag each stadium with the shard it came from
        return result.rows.map(row => ({ ...row, shard: region }));
      } catch (err) {
        console.error(`Error querying stadiums in ${region} shard:`, err.message);
        return [];
      }
    });

    const results = await Promise.all(promises);
    // Flatten array of arrays
    return results.flat();
  }

  /**
   * Get stadium by ID (looks in all shards if region not provided)
   */
  static async getById(id, region = null) {
    if (region) {
      const pool = getShardByRegion(region);
      const result = await pool.query('SELECT * FROM stadiums WHERE id = $1', [id]);
      return result.rows[0];
    } else {
      const shards = getAllShards();
      const promises = shards.map(async ({ pool }) => {
        try {
          const result = await pool.query('SELECT * FROM stadiums WHERE id = $1', [id]);
          if (result.rows.length > 0) return result.rows[0];
        } catch (err) {}
        return null;
      });

      const results = await Promise.all(promises);
      return results.find(res => res !== null) || null;
    }
  }

  /**
   * Get stadiums by a specific region
   */
  static async getByRegion(region) {
    const pool = getShardByRegion(region);
    const result = await pool.query('SELECT * FROM stadiums ORDER BY name ASC');
    return result.rows;
  }
}

module.exports = StadiumModel;
