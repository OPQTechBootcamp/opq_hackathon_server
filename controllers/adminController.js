import db from '../config/db.js';
import bcrypt from 'bcryptjs';

export const getUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeams = async (req, res) => {
  try {
    const [teams] = await db.query('SELECT id, team_name, section, section_team_id FROM teams');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeamJudges = async (req, res) => {
  try {
    const [assignments] = await db.query(`
      SELECT tj.id, t.team_name,  t.section, t.section_team_id, u.name AS judge_name
      FROM team_judges tj
      JOIN teams t ON tj.team_id = t.id
      JOIN users u ON tj.judge_id = u.id
    `);
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const assignJudges = async (req, res) => {
  const { teamIds, judgeIds } = req.body; // Both teamIds and judgeIds are arrays
  
  try {
    // Create an array of value pairs for all combinations of teams and judges
    const values = [];
    
    // For each team, assign all the judges
    teamIds.forEach(teamId => {
      judgeIds.forEach(judgeId => {
        values.push([teamId, judgeId]);
      });
    });
    
    // Insert all team-judge assignments into the database
    await db.query('INSERT INTO team_judges (team_id, judge_id) VALUES ?', [values]);
    
    res.json({ 
      message: 'Judges assigned successfully to teams.',
      data: {
        teamsCount: teamIds.length,
        judgesCount: judgeIds.length,
        assignmentsCount: values.length
      }
    });
  } catch (err) {
    console.error('Error assigning judges to teams:', err);
    res.status(500).json({ error: err.message });
  }
};

export const unassignJudge = async (req, res) => {
  const { assignmentId } = req.params;
  try {
      await db.query('DELETE FROM team_judges WHERE id = ?', [assignmentId]);
      res.json({ message: 'Judge unassigned successfully.' });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};


// controllers/adminController.js
export const getAllUsersAndTeams = async (req, res) => {
  try {
    // Fetch all users
    const [users] = await db.query(`
      SELECT id, name, email, role, created_at 
      FROM users
      ORDER BY role ASC, created_at DESC
    `);

    // Fetch all teams
    const [teams] = await db.query(`
      SELECT id, team_name, team_email, created_at, JSON_LENGTH(team_members) AS team_size, section, section_team_id
      FROM teams
      ORDER BY created_at DESC
    `);

    res.json({ users, teams });
  } catch (error) {
    console.error('Error fetching users and teams:', error);
    res.status(500).json({ error: 'Failed to fetch users and teams' });
  }
};

// controllers/adminController.js
export const resetPassword = async (req, res) => {
  const { type, id, newPassword } = req.body;

  if (!type || !id || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10); // Use bcrypt for hashing

  try {
    if (type === 'user') {
      await db.query(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, id]);
    } else if (type === 'team') {
      await db.query(`UPDATE teams SET password = ? WHERE id = ?`, [hashedPassword, id]);
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
};
