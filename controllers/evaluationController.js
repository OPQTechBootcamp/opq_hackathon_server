// judgeController.js

import db from '../config/db.js';
import fs from 'fs';
import path from 'path'
/**
 * Submit Evaluation
 */
export const submitEvaluation = async (req, res) => {
  try {
    const {
      team_id,
      judge_id,
      round_id,
      scores, // Get the scores object
      comments: comment = '' // Rename 'comments' to 'comment' to match your variable
    } = req.body;

    if (!team_id || !judge_id || !round_id || !scores) {
      return res.status(400).json({ message: 'Missing required fields (team_id, judge_id, round_id, scores)' });
    }

    const {
      innovation,
      technical,
      relevance,
      feasibility,
      design,
      collaboration,
      presentation,
      bonus = 0, // Default value if not present in scores
    } = scores;

    const total_score =
      parseInt(innovation, 10) +
      parseInt(technical, 10) +
      parseInt(relevance, 10) +
      parseInt(feasibility, 10) +
      parseInt(design, 10) +
      parseInt(collaboration, 10) +
      parseInt(presentation, 10) +
      parseInt(bonus, 10);

    const sql = `
      INSERT INTO evaluations
      (team_id, judge_id, round_id, innovation, technical, relevance, feasibility, design, collaboration, presentation, bonus, total_score, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        innovation = VALUES(innovation),
        technical = VALUES(technical),
        relevance = VALUES(relevance),
        feasibility = VALUES(feasibility),
        design = VALUES(design),
        collaboration = VALUES(collaboration),
        presentation = VALUES(presentation),
        bonus = VALUES(bonus),
        total_score = VALUES(total_score),
        comment = VALUES(comment)
    `;

    const values = [
      team_id, judge_id, round_id, innovation, technical, relevance,
      feasibility, design, collaboration, presentation, bonus, total_score, comment
    ];

    const [result] = await db.execute(sql, values);

    res.status(201).json({ message: 'Evaluation submitted successfully', result });
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Fetch teams assigned to a specific judge
 */
export const getAssignedTeamsForJudge = async (req, res) => {
  const { judgeId } = req.params;

  try {
    // Fetch assigned teams with problem statement title
    const [teams] = await db.query(
      `
      SELECT 
        t.id AS team_id, 
        t.team_name,
        t.section AS team_group,
        t.section_team_id AS team_code,
        ps.title AS problem_statement_title
      FROM 
        teams t
      JOIN 
        team_judges tj ON t.id = tj.team_id
      LEFT JOIN 
        problem_statements ps ON t.problem_statement_id = ps.id
      WHERE 
        tj.judge_id = ?
      `,
      [judgeId]
    );

    // Fetch all rounds
    const [rounds] = await db.query(`SELECT * FROM rounds`);

    // Fetch evaluations for this judge
    const [evaluations] = await db.query(
      `SELECT * FROM evaluations WHERE judge_id = ?`,
      [judgeId]
    );

    const enrichedTeams = await Promise.all(
      teams.map(async (team) => {
        const teamRounds = rounds.map((round) => {
          const evaluated = evaluations.some(
            (evalRow) =>
              evalRow.team_id === team.team_id &&
              evalRow.round_id === round.id
          );
          return { ...round, evaluated };
        });

        return {
          team_id: team.team_id,
          team_name: team.team_name,
          group: team.group,
          team_code: team.team_code,
          problem_statement_title: team.problem_statement_title || 'Not Selected',
          rounds: teamRounds,
        };
      })
    );

    res.json(enrichedTeams);
  } catch (error) {
    console.error('Error fetching assigned teams:', error);
    res.status(500).json({ error: 'Failed to fetch assigned teams' });
  }
};



/**
 * Fetch a specific evaluation by team, judge, and round
 */
export const getEvaluation = async (req, res) => {
  const { teamId, judgeId, roundId } = req.query;

  if (!teamId || !judgeId || !roundId) {
    return res.status(400).json({ message: 'Missing teamId, judgeId, or roundId' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT * FROM evaluations WHERE team_id = ? AND judge_id = ? AND round_id = ?`,
      [teamId, judgeId, roundId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const fetchAllTeamsRatings = async (req, res) => {
  try {
    const teamsQuery = `
      SELECT
        t.id AS team_id,
        t.team_name,
                t.section AS team_group,
        t.section_team_id AS team_code,
        ps.title AS problem_statement_title,
        ROUND(AVG(e.total_score / 8), 2) AS average_rating,
        GROUP_CONCAT(DISTINCT u.name) AS judge_names,
        GROUP_CONCAT(DISTINCT r.round_number ORDER BY r.round_number ASC) AS rounds
      FROM 
        teams t
      LEFT JOIN 
        evaluations e ON t.id = e.team_id
      LEFT JOIN 
        users u ON e.judge_id = u.id
      LEFT JOIN 
        rounds r ON e.round_id = r.id
      LEFT JOIN 
        problem_statements ps ON t.problem_statement_id = ps.id
      GROUP BY 
        t.id, t.team_name
      ORDER BY 
        CASE WHEN average_rating IS NULL THEN 1 ELSE 0 END,
        average_rating DESC
    `;

    const [teams] = await db.query(teamsQuery);

    // Now check for each team if there is a submission and evaluation
    const updatedTeams = await Promise.all(
      teams.map(async (team) => {
        const [submissionRows] = await db.query(`
          SELECT s.id AS submission_id
          FROM submissions s
          LEFT JOIN evaluations e ON s.team_id = e.team_id AND s.round_id = e.round_id
          WHERE s.team_id = ?
          LIMIT 1
        `, [team.team_id]);

        let submissionStatus = 'Pending';

        if (submissionRows.length > 0) {
          const [evaluationRows] = await db.query(`
            SELECT id
            FROM evaluations
            WHERE team_id = ? AND round_id = (SELECT round_id FROM submissions WHERE team_id = ? LIMIT 1)
            LIMIT 1
          `, [team.team_id, team.team_id]);

          if (evaluationRows.length > 0) {
            submissionStatus = 'Evaluated';
          }
        }

        return {
          ...team,
          submission_status: submissionStatus,
        };
      })
    );

    res.json(updatedTeams);

  } catch (error) {
    console.error('Error fetching teams ratings:', error);
    res.status(500).json({ error: 'Failed to fetch teams ratings' });
  }
};



/**
 * Optional - Fetch evaluations given by a particular judge
 */
export const getEvaluationsByJudge = async (req, res) => {
  const { judgeId } = req.params;

  try {
    const [evaluations] = await db.query(
      `
      SELECT 
        e.id,
        t.team_name,
        r.round_name,
        e.total_score
      FROM 
        evaluations e
      JOIN 
        teams t ON e.team_id = t.id
      JOIN 
        rounds r ON e.round_id = r.id
      WHERE 
        e.judge_id = ?
      ORDER BY 
        e.created_at DESC
      `,
      [judgeId]
    );

    res.json(evaluations);
  } catch (error) {
    console.error('Error fetching evaluations by judge:', error);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
};
