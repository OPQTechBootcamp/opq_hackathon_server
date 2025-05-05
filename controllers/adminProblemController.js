import db from '../config/db.js';

export const uploadProblemStatement = async (req, res) => {
  const { title, description } = req.body;
  const overviewFile = req.files['overview_file']?.[0];
  const inDepthFile = req.files['in_depth_file']?.[0];

  if (!title || !overviewFile) {
    return res.status(400).json({ error: 'Title and overview file are required.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO problem_statements 
       (title, description, overview_file, overview_file_name, overview_file_type, 
        in_depth_file, in_depth_file_name, in_depth_file_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        overviewFile.buffer,
        overviewFile.originalname,
        overviewFile.mimetype,
        inDepthFile ? inDepthFile.buffer : null,
        inDepthFile ? inDepthFile.originalname : null,
        inDepthFile ? inDepthFile.mimetype : null,
      ]
    );

    res.status(201).json({ message: 'Problem statement uploaded successfully', id: result.insertId });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error while uploading problem statement.' });
  }
};

export const deleteProblemStatement = async (req, res) => {
    const { id } = req.params;
  
    try {
      const [result] = await db.query('DELETE FROM problem_statements WHERE id = ?', [id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error deleting problem statement' });
    }
  };

  export const updateProblemStatement = async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
  
    try {
      // Get existing row
      const [existingRows] = await db.query('SELECT * FROM problem_statements WHERE id = ?', [id]);
      if (!existingRows.length) return res.status(404).json({ error: 'Not found' });
  
      const updates = [];
      const values = [];
  
      if (title) {
        updates.push('title = ?');
        values.push(title);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (req.files?.overview_file?.[0]) {
        updates.push('overview_file_name = ?', 'overview_file = ?');
        values.push(req.files.overview_file[0].originalname, req.files.overview_file[0].buffer);
      }
      if (req.files?.in_depth_file?.[0]) {
        updates.push('in_depth_file_name = ?', 'in_depth_file = ?');
        values.push(req.files.in_depth_file[0].originalname, req.files.in_depth_file[0].buffer);
      }
  
      if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  
      await db.query(
        `UPDATE problem_statements SET ${updates.join(', ')} WHERE id = ?`,
        [...values, id]
      );
  
      res.json({ message: 'Updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error updating problem statement' });
    }
  };

  export const checkHackathonStarted = async () => {
    const now = new Date();
    const [rows] = await db.query(
      `SELECT start_datetime FROM hackathon_schedule ORDER BY start_datetime ASC LIMIT 1`
    );
  
    if (!rows.length) return { started: false, remaining: 0 };
  
    const startTime = new Date(rows[0].start_datetime);
    const remaining = Math.max(0, startTime - now);
  
    return { started: now >= startTime, remaining };
  };

  // Route: /admin/problem-statements
  export const getAllProblemStatements = async (req, res) => {
    try {
      let selectionRemainingMins = 0;
      let editSelectionTimeRemaining = 0;
      
      if (req.user.type === 'team') {
        const { started, remaining } = await checkHackathonStarted();
        if (!started) {
          const minutes = Math.ceil(remaining / 60000);
          return res.status(403).json({
            error: `Hackathon hasn't started yet. Please check back in ${minutes} minutes.`,
          });
        }
        
        // Calculate problem statement selection time remaining
        const now = new Date();
        const [scheduleRows] = await db.query(
          `SELECT start_datetime, ps_selection_time FROM hackathon_schedule ORDER BY start_datetime ASC LIMIT 1`
        );
        
        if (scheduleRows.length > 0) {
          const startTime = new Date(scheduleRows[0].start_datetime);
          const psSelectionTime = scheduleRows[0].ps_selection_time || 30; // Default to 30 minutes if not set
          const psSelectionEndTime = new Date(startTime.getTime() + (psSelectionTime * 60000));
          
          // Only calculate remaining time if we're in the selection window
          if (now < psSelectionEndTime) {
            selectionRemainingMins = Math.ceil((psSelectionEndTime - now) / 60000);
          }
          
          // Calculate edit selection time remaining (4 hours from start time)
          const editEndTime = new Date(startTime.getTime() + (4 * 60 * 60000)); 
          
          if (now < editEndTime) {
            editSelectionTimeRemaining = Math.ceil((editEndTime - now) / 60000);
          }
        }
      }
  
      const [rows] = await db.query(`
        SELECT id, title, description, 
               overview_file_name, in_depth_file_name, 
               created_at 
        FROM problem_statements
        ORDER BY created_at DESC
      `);

      res.json({
        problemStatements: rows,
        selectionRemainingMins,
        editSelectionTimeRemaining
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error fetching problem statements" });
    }
  };
  
// GET /problem-statements/:id/file/overview
export const getProblemStatementOverviewFile =  async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.type === 'team') {
      const { started, remaining } = await checkHackathonStarted();
      if (!started) {
        const minutes = Math.ceil(remaining / 60000);
        return res.status(403).json({
          error: `Hackathon hasn't started yet. Please check back in ${minutes} minutes.`,
        });
      }
    }
    const [rows] = await db.query(
      "SELECT overview_file, overview_file_name FROM problem_statements WHERE id = ?",
      [id]
    );
    if (!rows.length || !rows[0].overview_file) {
      return res.status(404).json({ error: "Overview file not found" });
    }

    const fileBuffer = rows[0].overview_file;
    const fileName = rows[0].overview_file_name || 'overview.pdf';
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(fileBuffer);
  } catch (err) {
    console.error("Error fetching overview file:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /problem-statements/:id/file/in-depth
export const getProblemStatementInDepthFile = async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.type === 'team') {
      const { started, remaining } = await checkHackathonStarted();
      if (!started) {
        const minutes = Math.ceil(remaining / 60000);
        return res.status(403).json({
          error: `Hackathon hasn't started yet. Please check back in ${minutes} minutes.`,
        });
      }
    }
    const [rows] = await db.query(
      "SELECT in_depth_file, in_depth_file_name FROM problem_statements WHERE id = ?",
      [id]
    );

    if (!rows.length || !rows[0].in_depth_file) {
      return res.status(404).json({ error: "In-depth file not found" });
    }

    const fileBuffer = rows[0].in_depth_file;
    const fileName = rows[0].in_depth_file_name || 'in-depth.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(fileBuffer);
  } catch (err) {
    console.error("Error fetching in-depth file:", err);
    res.status(500).json({ error: "Server error" });
  }
};

