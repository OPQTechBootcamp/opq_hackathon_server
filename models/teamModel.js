import db from '../config/db.js';

export const findTeamByEmailOrName = async (identifier) => {
  const [rows] = await db.query(
    'SELECT * FROM teams WHERE team_email = ? OR team_name = ?',
    [identifier, identifier]
  );
  return rows[0];
};

export const createTeam = async ({ 
  team_name, 
  team_email, 
  alternate_email, 
  phone_number, 
  alternate_phone, 
  password, 
  team_members,
  section,           
  section_team_id  
}) => {
  const [result] = await db.query(
    'INSERT INTO teams (team_name, team_email, alternate_email, phone_number, alternate_phone, password, team_members, section, section_team_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [team_name, team_email, alternate_email, phone_number, alternate_phone, password, JSON.stringify(team_members), section, section_team_id]
  );
  return result; 
};
