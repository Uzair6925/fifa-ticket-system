const { getShardByRegion } = require('../config/shardRouter');
const { getActiveHoldsForMatch } = require('../config/redisClient');

class SeatModel {
  /**
   * Get all seats for a specific match, joining category and pricing.
   * Region must be passed (obtained from Match model prior).
   */
  static async getSeatsForMatch(matchId, region) {
    const pool = getShardByRegion(region);
    const query = `
      SELECT s.id, s.seat_number, s.row_number, s.section, s.price, s.status,
             c.name AS category_name
      FROM seats s
      JOIN seat_categories c ON s.category_id = c.id
      WHERE s.match_id = $1
      ORDER BY s.section, s.row_number, s.seat_number
    `;
    const result = await pool.query(query, [matchId]);
    return result.rows;
  }

  /**
   * Get specific seats by IDs to verify they exist and get prices.
   */
  static async getSeatsByIds(seatIds, region) {
    const pool = getShardByRegion(region);
    // Use ANY for array parameter
    const query = `
      SELECT id, match_id, price, status 
      FROM seats 
      WHERE id = ANY($1::uuid[])
    `;
    const result = await pool.query(query, [seatIds]);
    return result.rows;
  }

  /**
   * Get active holds for a specific match from Redis
   */
  static async getActiveHoldsForMatch(matchId) {
    return getActiveHoldsForMatch(matchId);
  }
}

module.exports = SeatModel;
