import db from "../config/db.js";
import path from "path";
import fs from "fs";

export const getTeamDashboard = async (req, res) => {
  try {
    const { id, team_name } = req.body;

    if (!id || !team_name) {
      return res
        .status(400)
        .json({
          message: "Team ID and Team Name are required in the request body",
        });
    }

    // Get team
    const [teamRows] = await db.query(
      `SELECT id, team_name, team_email, team_members, section, section_team_id, problem_statement_id FROM teams WHERE id = ? AND team_name = ?`,
      [id, team_name]
    );
    const team = teamRows[0];
    if (!team) {
      return res
        .status(404)
        .json({ message: "Team not found with the provided ID and Name" });
    }

    const team_members = team.team_members || {};

    // Get judge name from team_judges and users tables
    const [teamJudgeRows] = await db.query(
      `
            SELECT tj.judge_id, u.name AS judge_name
            FROM team_judges tj
            INNER JOIN users u ON tj.judge_id = u.id
            WHERE tj.team_id = ?
        `,
      [id]
    );

    // teamJudgeRows will now be an array of judge objects
    const judgeNames = teamJudgeRows.map((row) => row.judge_name) || [];
    const judge_name =
      judgeNames.length > 0 ? judgeNames.join(", ") : "Not Assigned";
    // Get problem statement title if selected
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

    return res.status(200).json({
      team_name: team.team_name,
      team_email: team.team_email,
      section: team.section,
      section_team_id: team.section_team_id,
      team_members,
      judge_name,
      problem_statement_title,
    });
  } catch (error) {
    console.error("Error in getTeamDashboard:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const submitToRound = async (req, res) => {
  try {
    const teamId = req.user.id;
    const { message } = req.body;
    const uploadedFile = req.file;

    const [currentRoundRows] = await db.query(`
          SELECT * FROM rounds WHERE NOW() BETWEEN start_time AND end_time LIMIT 1
      `);

    if (!currentRoundRows.length) {
      return res.status(400).json({ message: "No active round to submit to." });
    }

    const currentRoundId = currentRoundRows[0].id;

    let filePath = null;
    let originalFileName = null;

    if (uploadedFile) {
      originalFileName = uploadedFile.originalname;
      const fileExtension = path.extname(originalFileName);
      const newFileName = `team_${teamId}_round_${currentRoundId}${fileExtension}`;
      filePath = path.join(uploadedFile.destination, newFileName);

      // Rename the file on the server
      fs.rename(uploadedFile.path, filePath, (err) => {
        if (err) {
          console.error("Error renaming file:", err);
          // Optionally handle the error, maybe delete the partially uploaded file
        }
      });
    }

    await db.query(
      `
          INSERT INTO submissions (team_id, round_id, file_path, file_name, message, submitted_at)
          VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [teamId, currentRoundId, filePath, originalFileName, message]
    );

    return res
      .status(201)
      .json({
        message: "Submission successful!",
        file_name: originalFileName,
        file_path: filePath,
      });
  } catch (error) {
    console.error("Error in submitToRound:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const selectedProblemStatement = async (req, res) => {
  try {
    const { id, team_name } = req.body;

    if (!id || !team_name) {
      return res
        .status(400)
        .json({
          message: "Team ID and Team Name are required in the request body",
        });
    }

    // Get team
    const [teamRows] = await db.query(
      `SELECT * FROM teams WHERE id = ?`,
      [id, team_name]
    );
    const team = teamRows[0];
    if (!team) {
      return res
        .status(404)
        .json({ message: "Team not found with the provided ID and Name" });
    }
    return res.json({ problem_statement_id: team.problem_statement_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const selectProblemStatementId = async (req, res) => {
  try {
    const { id, team_name } = req.body;
    const problemId = req.params.id;

    if (!id || !team_name) {
      return res.status(400).json({
        message: "Team ID and Team Name are required in the request body",
      });
    }

    if (!problemId) {
      return res.status(400).json({
        message: "problemId is required in the request params",
      });
    }

    // Get the team
    const [teamRows] = await db.query(
      `SELECT * FROM teams WHERE id = ?`,
      [id, team_name]
    );
    const team = teamRows[0];
    if (!team) {
      return res.status(404).json({
        message: "Team not found with the provided ID and Name",
      });
    }

    if (team.problem_statement_id) {
      return res
        .status(400)
        .json({ message: "Problem statement already selected." });
    }

    // Validate the problem statement
    const [problemRows] = await db.query(
      `SELECT id FROM problem_statements WHERE id = ?`,
      [problemId]
    );
    const problem = problemRows[0];
    if (!problem) {
      return res
        .status(404)
        .json({ message: "Problem statement not found." });
    }

    // Update the team with selected problem ID
    await db.query(
      `UPDATE teams SET problem_statement_id = ? WHERE id = ?`,
      [problemId, id]
    );

    return res
      .status(200)
      .json({ message: "Problem statement selected successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const editProblemStatementId = async (req, res) => {
  try {
    const { team_name, problem_statement_id } = req.body;
    const teamId = req.params.team_id;

    // Validate required fields
    if (!teamId || !team_name) {
      return res.status(400).json({
        message: "Team ID and Team Name are required",
      });
    }

    if (!problem_statement_id) {
      return res.status(400).json({
        message: "New problem statement ID is required in the request body",
      });
    }

    // Verify the team exists
    const [teamRows] = await db.query(
      `SELECT * FROM teams WHERE id = ? AND team_name = ?`,
      [teamId, team_name]
    );
    
    const team = teamRows[0];
    if (!team) {
      return res.status(404).json({
        message: "Team not found with the provided ID and Name",
      });
    }

    // Validate the new problem statement exists
    const [problemRows] = await db.query(
      `SELECT id FROM problem_statements WHERE id = ?`,
      [problem_statement_id]
    );

    const problem = problemRows[0];
    if (!problem) {
      return res.status(404).json({
        message: "Problem statement not found",
      });
    }

    // Update the team with the new problem statement ID
    await db.query(
      `UPDATE teams SET problem_statement_id = ? WHERE id = ?`,
      [problem_statement_id, teamId]
    );

    return res.status(200).json({
      message: "Problem statement updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
