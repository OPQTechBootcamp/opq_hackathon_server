// controllers/judgeController.js

import db from "../config/db.js";
import bcrypt from 'bcryptjs';

// Register a new judge
export const registerJudge = async (req, res) => {
  let connection;
  
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    const {
      name,
      email,
      password,
      whatsapp_number,
      industry,
      total_experience,
      current_company,
      job_title,
      linkedin_url,
      bio,
      area_of_expertise,
      preferred_evaluation_days,
      preferred_time_slot,
      dietary_preference
    } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with judge role
    const [userResult] = await connection.execute(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'judge', 'pending']
    );
    
    const userId = userResult.insertId;
    
    // Create judge profile
    await connection.execute(
      `INSERT INTO judges (
        user_id, whatsapp_number, industry, total_experience, 
        current_company, job_title, linkedin_url, bio, 
        area_of_expertise, preferred_evaluation_days, 
        preferred_time_slot, dietary_preference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, whatsapp_number, industry, total_experience,
        current_company, job_title, linkedin_url || null, bio,
        area_of_expertise, preferred_evaluation_days || null,
        preferred_time_slot || null, dietary_preference || null
      ]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Judge registration successful. Pending approval.',
      userId
    });
    
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error registering judge:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to register judge',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Update judge approval status
export const updateJudgeStatus = async (req, res) => {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    const { userId, status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "approved" or "rejected".'
      });
    }
    
    const [result] = await connection.execute(
      'UPDATE users SET status = ? WHERE id = ? AND role = "judge"',
      [status, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Judge not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Judge ${status === 'approved' ? 'approved' : 'rejected'} successfully`
    });
    
  } catch (error) {
    console.error('Error updating judge status:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update judge status',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Get all judges with basic details
export const getAllJudges = async (req, res) => {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    const [judges] = await connection.execute(`
      SELECT 
        u.id, u.name, u.email, u.status, u.created_at,
        j.industry, j.total_experience, j.current_company, j.job_title
      FROM 
        users u
      JOIN 
        judges j ON u.id = j.user_id
      WHERE 
        u.role = 'judge'
      ORDER BY 
        u.created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      count: judges.length,
      data: judges
    });
    
  } catch (error) {
    console.error('Error fetching judges:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch judges',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Get judge by ID with full details
export const getJudgeById = async (req, res) => {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    const { id } = req.params;
    
    const [judges] = await connection.execute(`
      SELECT 
        u.id, u.name, u.email, u.status, u.created_at,
        j.*
      FROM 
        users u
      JOIN 
        judges j ON u.id = j.user_id
      WHERE 
        u.id = ? AND u.role = 'judge'
    `, [id]);
    
    if (judges.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Judge not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: judges[0]
    });
    
  } catch (error) {
    console.error('Error fetching judge details:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch judge details',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};