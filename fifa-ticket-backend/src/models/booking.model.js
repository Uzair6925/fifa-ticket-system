const { getShardByRegion, getAllShards } = require('../config/shardRouter');

class BookingModel {
  /**
   * Create a booking using ACID Transactions.
   * Region must be passed to execute the transaction on the correct shard.
   */
  static async createTransaction(userId, matchId, seatIds, totalAmount, paymentDetails, region) {
    const pool = getShardByRegion(region);
    const client = await pool.connect();

    try {
      // 1. Begin Transaction
      await client.query('BEGIN');

      // 2. Double-check seat availability (Pessimistic check inside DB)
      // This is our final safety net after Redis.
      const seatQuery = `
        SELECT id FROM seats 
        WHERE id = ANY($1::uuid[]) AND status = 'available'
        FOR UPDATE
      `;
      const seatCheck = await client.query(seatQuery, [seatIds]);
      
      if (seatCheck.rows.length !== seatIds.length) {
        throw new Error('One or more seats are no longer available.');
      }

      // 3. Create Booking Record
      const insertBooking = `
        INSERT INTO bookings (user_id, match_id, total_amount, status)
        VALUES ($1, $2, $3, 'confirmed')
        RETURNING id
      `;
      const bookingResult = await client.query(insertBooking, [userId, matchId, totalAmount]);
      const bookingId = bookingResult.rows[0].id;

      // 4. Update Seats Status to 'booked'
      const updateSeats = `
        UPDATE seats SET status = 'booked'
        WHERE id = ANY($1::uuid[])
      `;
      await client.query(updateSeats, [seatIds]);

      // 5. Insert into booking_seats junction table
      const insertBookingSeats = `
        INSERT INTO booking_seats (booking_id, seat_id)
        VALUES ($1, $2)
      `;
      // Execute inserts for each seat
      for (const seatId of seatIds) {
        await client.query(insertBookingSeats, [bookingId, seatId]);
      }

      // 6. Create Payment Record
      const insertPayment = `
        INSERT INTO payments (booking_id, amount, payment_status, transaction_id, payment_method, paid_at)
        VALUES ($1, $2, 'success', $3, $4, NOW())
      `;
      await client.query(insertPayment, [
        bookingId, 
        totalAmount, 
        paymentDetails.transactionId, 
        paymentDetails.method
      ]);

      // 7. Commit Transaction
      await client.query('COMMIT');
      
      return bookingId;
    } catch (error) {
      // If ANY query fails, rollback the entire transaction
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's bookings across all shards
   */
  static async getUserBookings(userId) {
    const shards = getAllShards();
    
    const promises = shards.map(async ({ region, pool }) => {
      try {
        const query = `
          SELECT b.id as booking_id, b.total_amount, b.status as booking_status, b.booked_at,
                 m.home_team, m.away_team, m.match_date,
                 s.name as stadium_name,
                 (
                   SELECT json_agg(json_build_object('seat_number', st.seat_number, 'price', st.price))
                   FROM booking_seats bs
                   JOIN seats st ON bs.seat_id = st.id
                   WHERE bs.booking_id = b.id
                 ) as seats
          FROM bookings b
          JOIN matches m ON b.match_id = m.id
          JOIN stadiums s ON m.stadium_id = s.id
          WHERE b.user_id = $1
          ORDER BY b.booked_at DESC
        `;
        const result = await pool.query(query, [userId]);
        return result.rows.map(row => ({ ...row, shard: region }));
      } catch (err) {
        return [];
      }
    });

    const results = await Promise.all(promises);
    return results.flat().sort((a, b) => new Date(b.booked_at) - new Date(a.booked_at));
  }
}

module.exports = BookingModel;
