import db from "../config/db.js";

// Create a new schedule and insert rounds
export const createSchedule = async (req, res) => {
  const {
    title,
    start_datetime,
    end_datetime,
    number_of_rounds,
    ps_selection_time,
  } = req.body;

  // Convert incoming ISO dates to IST before storing
  // MySQL expects a specific format for datetime values
  const convertToIST = (isoString) => {
    if (!isoString) return null;
    
    // Parse the input date
    const date = new Date(isoString);
    
    // Adjust for IST timezone (UTC+5:30)
    // This creates a string in MySQL datetime format in IST timezone
    const istYear = date.getFullYear();
    const istMonth = String(date.getMonth() + 1).padStart(2, '0');
    const istDay = String(date.getDate()).padStart(2, '0');
    const istHours = String(date.getHours()).padStart(2, '0');
    const istMinutes = String(date.getMinutes()).padStart(2, '0');
    const istSeconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${istYear}-${istMonth}-${istDay} ${istHours}:${istMinutes}:${istSeconds}`;
  };

  const istStartDatetime = convertToIST(start_datetime);
  const istEndDatetime = convertToIST(end_datetime);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Insert schedule with ps_selection_time
    const [result] = await connection.query(
      `INSERT INTO hackathon_schedule (title, number_of_rounds, start_datetime, end_datetime, ps_selection_time) VALUES (?, ?, ?, ?, ?)`,
      [title, number_of_rounds, istStartDatetime, istEndDatetime, ps_selection_time]
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
    res
      .status(201)
      .json({ message: "Schedule and rounds created successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Create Schedule Error:", error);
    res.status(500).json({ error: "Failed to create schedule and rounds" });
  } finally {
    connection.release();
  }
};

// Update schedule
export const updateSchedule = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    start_datetime,
    end_datetime,
    ps_selection_time,
  } = req.body;

  // Convert incoming ISO dates to IST before storing
  const convertToIST = (isoString) => {
    if (!isoString) return null;
    
    // Parse the input date
    const date = new Date(isoString);
    
    // Format for MySQL datetime in IST
    const istYear = date.getFullYear();
    const istMonth = String(date.getMonth() + 1).padStart(2, '0');
    const istDay = String(date.getDate()).padStart(2, '0');
    const istHours = String(date.getHours()).padStart(2, '0');
    const istMinutes = String(date.getMinutes()).padStart(2, '0');
    const istSeconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${istYear}-${istMonth}-${istDay} ${istHours}:${istMinutes}:${istSeconds}`;
  };

  const istStartDatetime = convertToIST(start_datetime);
  const istEndDatetime = convertToIST(end_datetime);

  const connection = await db.getConnection();
  try {
    await connection.query(
      `UPDATE hackathon_schedule SET title = ?, start_datetime = ?, end_datetime = ?, ps_selection_time = ? WHERE id = ?`,
      [
        title,
        istStartDatetime,
        istEndDatetime,
        ps_selection_time,
        id,
      ]
    );
    res.json({ message: "Schedule updated successfully" });
  } catch (error) {
    console.error("Update Schedule Error:", error);
    res.status(500).json({ error: "Failed to update schedule" });
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
    res.json({ message: "Schedule and rounds deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Delete Schedule Error:", error);
    res.status(500).json({ error: "Failed to delete schedule and rounds" });
  } finally {
    connection.release();
  }
};

// Get all schedules
export const getAllSchedules = async (req, res) => {
  try {
    const [schedules] = await db.query(
      `SELECT * FROM hackathon_schedule ORDER BY start_datetime`
    );
    res.json(schedules);
  } catch (error) {
    console.error("Fetch Schedules Error:", error);
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
};

// Get a single schedule
export const getScheduleById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT * FROM hackathon_schedule WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Fetch Single Schedule Error:", error);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
};
