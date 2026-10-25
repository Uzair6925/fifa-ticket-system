const { getShardByRegion, getAllShards } = require('../config/shardRouter');

class BookingModel {
  static async createTransaction(userId, matchId, seatIds, totalAmount, paymentDetails, region) {
    const pool = getShardByRegion(region);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const seatQuery = `
        SELECT id FROM seats 
        WHERE id = ANY($1::uuid[]) AND status = 'available'
        FOR UPDATE
      `;
      const seatCheck = await client.query(seatQuery, [seatIds]);

      if (seatCheck.rows.length !== seatIds.length) {
        throw new Error('One or more seats are no longer available.');
      }

      const insertBooking = `
        INSERT INTO bookings (user_id, match_id, total_amount, status)
        VALUES ($1, $2, $3, 'confirmed')
        RETURNING id
      `;
      const bookingResult = await client.query(insertBooking, [userId, matchId, totalAmount]);
      const bookingId = bookingResult.rows[0].id;

      const updateSeats = `
        UPDATE seats SET status = 'booked'
        WHERE id = ANY($1::uuid[])
      `;
      await client.query(updateSeats, [seatIds]);

      const insertBookingSeats = `
        INSERT INTO booking_seats (booking_id, seat_id)
        VALUES ($1, $2)
      `;
      for (const seatId of seatIds) {
        await client.query(insertBookingSeats, [bookingId, seatId]);
      }

      const insertPayment = `
        INSERT INTO payments (booking_id, amount, payment_status, transaction_id, payment_method, paid_at)
        VALUES ($1, $2, 'success', $3, $4, NOW())
      `;
      await client.query(insertPayment, [
        bookingId,
        totalAmount,
        paymentDetails.transactionId,
        paymentDetails.method,
      ]);

      await client.query('COMMIT');
      return bookingId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async cancelTransaction(bookingId, userId) {
    const shards = getAllShards();
    let targetRegion = null;
    let foundBooking = null;

    for (const { region, pool } of shards) {
      const checkRes = await pool.query(
        'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
        [bookingId, userId]
      );
      if (checkRes.rows.length > 0) {
        targetRegion = region;
        foundBooking = checkRes.rows[0];
        break;
      }
    }

    if (!foundBooking || !targetRegion) {
      return null;
    }

    if (foundBooking.status === 'cancelled') {
      throw new Error('This booking has already been cancelled.');
    }

    const pool = getShardByRegion(targetRegion);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        "UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
        [bookingId]
      );

      await client.query(
        `UPDATE seats SET status = 'available'
         WHERE id IN (SELECT seat_id FROM booking_seats WHERE booking_id = $1)`,
        [bookingId]
      );

      await client.query(
        "UPDATE payments SET payment_status = 'refunded' WHERE booking_id = $1",
        [bookingId]
      );

      await client.query('COMMIT');
      return {
        bookingId,
        region: targetRegion,
        refundedAmount: foundBooking.total_amount,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

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
        return result.rows.map((row) => ({ ...row, shard: region }));
      } catch (err) {
        return [];
      }
    });

    const results = await Promise.all(promises);
    return results.flat().sort((a, b) => new Date(b.booked_at) - new Date(a.booked_at));
  }
}

module.exports = BookingModel;
