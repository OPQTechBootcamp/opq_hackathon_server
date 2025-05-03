import db from '../config/db.js';

export const getAllTeamsWithCurrentRound = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                t.id AS team_id,
                t.team_name,
                t.team_email,
                t.team_members,
                r.id AS round_id,
                r.round_number,
                r.title AS current_round_title,
                COALESCE(ROUND(AVG(e.total_score / 8), 2), 'NA') AS average_rating,
                COALESCE((
                    SELECT r2.round_number
                    FROM evaluations e2
                    JOIN rounds r2 ON e2.round_id = r2.id
                    WHERE e2.team_id = t.id
                    ORDER BY e2.created_at DESC
                    LIMIT 1
                ), 'NA') AS last_evaluated_round
            FROM teams t
            LEFT JOIN rounds r ON NOW() BETWEEN r.start_time AND r.end_time
            LEFT JOIN evaluations e ON t.id = e.team_id
            GROUP BY
                t.id, t.team_name, t.team_email, t.team_members, r.id, r.round_number, r.title
        `);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching team results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
  

  export const getTeamResultsDetail = async (req, res) => {
    const { teamId } = req.params;
  
    try {
      const [results] = await db.query(`
        SELECT 
          r.round_number,
          r.title,
          r.description,
          e.innovation,
          e.technical,
          e.relevance,
          e.feasibility,
          e.design,
          e.collaboration,
          e.presentation,
          e.bonus,
          e.total_score,
          e.comment,
          u.name AS judge_name,
          e.created_at
        FROM evaluations e
        INNER JOIN rounds r ON e.round_id = r.id
        INNER JOIN users u ON e.judge_id = u.id
        WHERE e.team_id = ?
        ORDER BY r.round_number ASC, e.created_at ASC
      `, [teamId]);
  
      res.json(results);
    } catch (error) {
      console.error('Error fetching team result details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  

  export const getLeaderboard = async (req, res) => {
    try {
      const { round_id, judge_id, top } = req.body;
  
      const conditions = [];
      const params = [];
  
      if (round_id) {
        conditions.push("e.round_id = ?");
        params.push(round_id);
      }
  
      if (judge_id) {
        conditions.push("e.judge_id = ?");
        params.push(judge_id);
      }
  
      const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  
      const query = `
        SELECT 
          t.id AS team_id,
          t.team_name,
          ROUND(AVG(e.total_score / 8), 2) AS average_rating,
          COUNT(DISTINCT e.round_id) AS rounds_evaluated
        FROM teams t
        LEFT JOIN evaluations e ON t.id = e.team_id
        ${whereClause}
        GROUP BY t.id, t.team_name
        ORDER BY 
          CASE WHEN average_rating IS NULL THEN 1 ELSE 0 END,
          average_rating DESC
        ${top ? `LIMIT ?` : ""}
      `;
  
      const finalParams = top ? [...params, parseInt(top)] : params;
  
      const [rows] = await db.query(query, finalParams);
  
      res.json(rows);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  