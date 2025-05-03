import db from '../config/db.js';

// Create a new schedule and insert rounds
export const createSchedule = async (req, res) => {
  const { title, start_datetime, end_datetime, number_of_rounds } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Insert schedule
    const [result] = await connection.query(
      `INSERT INTO hackathon_schedule (title, number_of_rounds, start_datetime, end_datetime) VALUES (?, ?, ?, ?)`,
      [title, number_of_rounds, start_datetime, end_datetime]
    );

    const scheduleId = result.insertId;

    // Insert rounds
    const roundPromises = [];
    for (let i = 1; i <= number_of_rounds; i++) {
      roundPromises.push(
        connection.query(
          `INSERT INTO rounds (round_number, title) VALUES (?, ?)`,
          [i, `R${i}`]
        )
      );
    }
    await Promise.all(roundPromises);

    await connection.commit();
    res.status(201).json({ message: 'Schedule and rounds created successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Create Schedule Error:', error);
    res.status(500).json({ error: 'Failed to create schedule and rounds' });
  } finally {
    connection.release();
  }
};

// Update schedule and reset rounds
export const updateSchedule = async (req, res) => {
  const { id } = req.params;
  const { title, start_datetime, end_datetime, number_of_rounds } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Update schedule
    await connection.query(
      `UPDATE hackathon_schedule SET title = ?, number_of_rounds = ?, start_datetime = ?, end_datetime = ? WHERE id = ?`,
      [title, number_of_rounds, start_datetime, end_datetime, id]
    );

    // Delete old rounds
    await connection.query(`DELETE FROM rounds`);

    // Insert updated rounds
    const roundPromises = [];
    for (let i = 1; i <= number_of_rounds; i++) {
      roundPromises.push(
        connection.query(
          `INSERT INTO rounds (round_number, title) VALUES (?, ?)`,
          [i, `R${i}`]
        )
      );
    }
    await Promise.all(roundPromises);

    await connection.commit();
    res.json({ message: 'Schedule and rounds updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Update Schedule Error:', error);
    res.status(500).json({ error: 'Failed to update schedule and rounds' });
  } finally {
    connection.release();
  }
};

// Delete schedule and its rounds
export const deleteSchedule = async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Delete schedule
    await connection.query(`DELETE FROM hackathon_schedule WHERE id = ?`, [id]);

    // Delete all rounds
    await connection.query(`DELETE FROM rounds`);

    await connection.commit();
    res.json({ message: 'Schedule and rounds deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Delete Schedule Error:', error);
    res.status(500).json({ error: 'Failed to delete schedule and rounds' });
  } finally {
    connection.release();
  }
};

// Get all schedules
export const getAllSchedules = async (req, res) => {
  try {
    const [schedules] = await db.query(`SELECT * FROM hackathon_schedule ORDER BY start_datetime`);
    res.json(schedules);
  } catch (error) {
    console.error('Fetch Schedules Error:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

// Get a single schedule
export const getScheduleById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(`SELECT * FROM hackathon_schedule WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Fetch Single Schedule Error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
};
