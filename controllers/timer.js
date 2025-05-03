import db from "../config/db.js";

export const timer = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT start_datetime 
      FROM hackathon_schedule 
      ORDER BY start_datetime ASC 
      LIMIT 1
    `);

    if (!rows.length) {
      return res.status(404).json({ error: 'No hackathon start time found' });
    }

    const now = new Date();
    const startTime = new Date(rows[0].start_datetime);
    let diff = Math.max(0, startTime - now); // prevent negative

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff %= (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff %= (1000 * 60 * 60);
    const minutes = Math.floor(diff / (1000 * 60));
    diff %= (1000 * 60);
    const seconds = Math.floor(diff / 1000);

    return res.json({
      started: now >= startTime,
      remaining: {
        days,
        hours,
        minutes,
        seconds,
        formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`
      }
    });
  } catch (error) {
    console.error('Error fetching hackathon start time:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


