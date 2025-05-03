import db from '../config/db.js';

export const getAllRounds = async (req, res) => {
    try {
      const [rows] = await db.query(`SELECT * FROM rounds ORDER BY round_number ASC`);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching rounds:', error);
      res.status(500).json({ message: 'Failed to fetch rounds' });
    }
  };

  
  export const createRound = async (req, res) => {
    const { round_number, title, description, start_time, end_time } = req.body;
  
    if (!round_number || !title || !start_time || !end_time) {
      return res.status(400).json({ message: 'Missing required round fields' });
    }
  
    try {
      await db.query(
        `INSERT INTO rounds (round_number, title, description, start_time, end_time)
         VALUES (?, ?, ?, ?, ?)`,
        [round_number, title, description, start_time, end_time]
      );
  
      res.status(201).json({ message: 'Round created successfully' });
    } catch (error) {
      console.error('Error creating round:', error);
      res.status(500).json({ message: 'Failed to create round' });
    }
  };

  export const updateRound = async (req, res) => {
    const { id } = req.params;
    const { round_number, title, description, start_time, end_time } = req.body;
  
    try {
      await db.query(
        `UPDATE rounds SET round_number = ?, title = ?, description = ?, start_time = ?, end_time = ? WHERE id = ?`,
        [round_number, title, description, start_time, end_time, id]
      );
  
      res.json({ message: 'Round updated successfully' });
    } catch (error) {
      console.error('Error updating round:', error);
      res.status(500).json({ message: 'Failed to update round' });
    }
  };

  export const deleteRound = async (req, res) => {
    const { id } = req.params;
  
    try {
      await db.query(`DELETE FROM rounds WHERE id = ?`, [id]);
      res.json({ message: 'Round deleted successfully' });
    } catch (error) {
      console.error('Error deleting round:', error);
      res.status(500).json({ message: 'Failed to delete round' });
    }
  };
  

  export const getRoundSubmissionEvaluationStatus = async (req, res) => {
    try {
      const [rounds] = await db.query(`
        SELECT id, round_number, title
        FROM rounds
        ORDER BY round_number ASC
      `);
  
      const roundStatusPromises = rounds.map(async (round) => {
        // Total submissions for this round
        const [submissionCountRows] = await db.query(`
          SELECT COUNT(DISTINCT team_id) AS submission_count
          FROM submissions
          WHERE round_id = ?
        `, [round.id]);
        const submissionCount = submissionCountRows[0]?.submission_count || 0;
  
        // Total evaluated submissions
        const [evaluationCountRows] = await db.query(`
          SELECT COUNT(DISTINCT team_id) AS evaluation_count
          FROM evaluations
          WHERE round_id = ?
        `, [round.id]);
        const evaluationCount = evaluationCountRows[0]?.evaluation_count || 0;
  
        // Calculate evaluation percentage
        const evaluationCompletion = submissionCount > 0
          ? Math.round((evaluationCount / submissionCount) * 100)
          : 0;
  
        return {
          round_id: round.id,
          round_number: round.round_number,
          title: round.title,
          submission_count: submissionCount,
          evaluation_count: evaluationCount,
          evaluation_completion_percent: evaluationCompletion,
        };
      });
  
      const roundStatusList = await Promise.all(roundStatusPromises);
  
      res.json(roundStatusList);
      
    } catch (error) {
      console.error('Error fetching round submission/evaluation status:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  