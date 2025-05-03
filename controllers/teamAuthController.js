import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findTeamByEmailOrName, createTeam } from '../models/teamModel.js';
import db from '../config/db.js';

const generateToken = (id) => {
    return jwt.sign({ id, type: 'team' }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const registerTeam = async (req, res) => {
  const { 
      team_name, 
      team_email, 
      alternate_email, 
      phone_number, 
      alternate_phone, 
      password, 
      team_members 
  } = req.body;

  if (!team_name || !team_email || !password || !team_members || !phone_number) {
      return res.status(400).json({ status: 'error', message: 'All fields including members are required' });
  }

  const existing = await findTeamByEmailOrName(team_email);
  if (existing) {
      return res.status(409).json({ status: 'error', message: 'Team with this email already exists' });
  }    
  
  const existingName = await findTeamByEmailOrName(team_name);
  if (existingName) {
      return res.status(409).json({ status: 'error', message: 'Team with this name already exists' });
  }

  try {
      const password_hash = await bcrypt.hash(password, 10);
      const newTeam = await createTeam({ 
          team_name, 
          team_email, 
          alternate_email, 
          phone_number, 
          alternate_phone, 
          password: password_hash, 
          team_members 
      });
      return res.status(201).json({
          status: 'success',
          message: 'Team registered successfully',
          team: {
              id: newTeam.insertId, 
              team_name,
              team_email,
              alternate_email,
              phone_number,
              alternate_phone,
              team_members
          }
      });
  } catch (error) {
      console.error('Error registering team:', error);
      return res.status(500).json({ status: 'error', message: 'Failed to register team' });
  }
};

export const loginTeam = async (req, res) => {
    const { team_email, password } = req.body;
  
    if (!team_email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }
  
    try {
      const team = await findTeamByEmailOrName(team_email);
  
      if (!team) {
        return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      }
  
      const isPasswordMatch = await bcrypt.compare(password, team.password);
  
      if (!isPasswordMatch) {
        return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      }
  
      // Get problem statement title if assigned
      let problem_statement_title = null;
      if (team.problem_statement_id) {
        const [psRows] = await db.query(
          `SELECT title FROM problem_statements WHERE id = ?`,
          [team.problem_statement_id]
        );
        if (psRows.length > 0) {
          problem_statement_title = psRows[0].title;
        }
      }
  
      const token = generateToken(team.id);
      return res.status(200).json({
        status: 'success',
        message: 'Login successful',
        token,
        team: {
          id: team.id,
          team_name: team.team_name,
          team_email: team.team_email,
          section: team.section,
          section_team_id: team.section_team_id,
          problem_statement_title,
        }
      });
    } catch (error) {
      console.error('Error logging in team:', error);
      return res.status(500).json({ status: 'error', message: 'Failed to login' });
    }
  };
  
  export const createTeamMemberProfile = async (req, res) => {
    const { 
        team_id, 
        member_name,
        full_name,
        email, 
        phone_number, 
        linkedin_url, 
        branch, 
        college, 
        interests, 
        bio 
    } = req.body;

    // Validate required fields
    if (!team_id || !member_name || !full_name || !email || !phone_number || !branch || !college || !interests) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'All required fields must be provided' 
        });
    }

    try {
        // Check if team exists
        const team = await getTeamById(team_id);
        if (!team) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Team not found' 
            });
        }



        // Check if profile already exists for this member
        const existingMemberProfile = await getMemberProfileByTeamIdAndName(team_id, member_name);
        if (existingMemberProfile) {
            return res.status(409).json({ 
                status: 'error', 
                message: 'Profile for this team member already exists' 
            });
        }

        // Process interests if provided as a string
        const processedInterests = typeof interests === 'string' 
            ? interests.split(',').map(item => item.trim()) 
            : interests;

        // Create member profile
        const profile = await saveTeamMemberProfile({
            team_id,
            member_name,
            full_name,
            email,
            phone_number,
            linkedin_url: linkedin_url || null,
            branch,
            college,
            interests: JSON.stringify(processedInterests),
            bio: bio || null
        });

        return res.status(201).json({
            status: 'success',
            message: 'Team member profile created successfully',
            profile: {
                id: profile.insertId,
                team_id,
                member_name,
                full_name,
                email,
                phone_number,
                linkedin_url,
                branch,
                college,
                interests: processedInterests,
                bio
            }
        });
    } catch (error) {
        console.error('Error creating team member profile:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Failed to create team member profile' 
        });
    }
};
export const getTeamById = async (teamId) => {
  const [rows] = await db.query(
      'SELECT * FROM teams WHERE id = ?',
      [teamId]
  );
  return rows[0];
};

export const getProfileByTeamId = async (teamId) => {
  const [rows] = await db.query(
      'SELECT * FROM team_profiles WHERE team_id = ?',
      [teamId]
  );
  return rows[0];
};

// Helper functions for database operations
export const getMemberProfileByTeamIdAndName = async (teamId, memberName) => {
    const [rows] = await db.query(
        'SELECT * FROM team_member_profiles WHERE team_id = ? AND member_name = ?',
        [teamId, memberName]
    );
    return rows[0];
};

export const saveTeamMemberProfile = async (profileData) => {
    const [result] = await db.query(
        `INSERT INTO team_member_profiles 
        (team_id, member_name, full_name, email, phone_number, linkedin_url, branch, college, interests, bio) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            profileData.team_id,
            profileData.member_name,
            profileData.full_name,
            profileData.email,
            profileData.phone_number,
            profileData.linkedin_url,
            profileData.branch,
            profileData.college,
            profileData.interests,
            profileData.bio
        ]
    );
    return result;
};