// POST /teams/:teamId/assign-section
import db from '../config/db.js';

export const assignTeamSection = async (req, res) => {
  const { teamId } = req.params;
  const { section } = req.body;

  if (!["A", "B", "C", "D", "E", "F", "I", "J"].includes(section)) {
    return res.status(400).json({ error: "Invalid section" });
  }

  try {
    // Get the highest section_team_id number for this section
    const [rows] = await db.query(
      "SELECT section_team_id FROM teams WHERE section = ? AND section_team_id IS NOT NULL",
      [section]
    );

    let maxNumber = 0;

    for (const row of rows) {
      const parts = row.section_team_id?.split('_');
      const num = parts && parts.length === 2 ? parseInt(parts[1], 10) : 0;
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }

    const nextNumber = maxNumber + 1;
    const sectionTeamId = `${section}_${nextNumber}`;

    // Update the team record
    await db.query(
      "UPDATE teams SET section = ?, section_team_id = ? WHERE id = ?",
      [section, sectionTeamId, teamId]
    );

    res.json({ message: "Section assigned successfully", sectionTeamId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


export const updateTeamSection = async (req, res) => {
  const { teamId } = req.params;
  const { newSection } = req.body;

  if (!["A", "B", "C", "D", "E", "F", "I", "J"].includes(newSection)) {
    return res.status(400).json({ error: "Invalid section" });
  }

  try {
    const [result] = await db.query(
      "SELECT section_team_id FROM teams WHERE section = ?",
      [newSection]
    );

    const sectionTeamIds = result.map(r => {
      const split = r.section_team_id?.split('_');
      return split?.length === 2 ? parseInt(split[1], 10) : 0;
    });

    const nextId = Math.max(...sectionTeamIds, 0) + 1;
    const newSectionTeamId = `${newSection}_${nextId}`;

    await db.query(
      "UPDATE teams SET section = ?, section_team_id = ? WHERE id = ?",
      [newSection, newSectionTeamId, teamId]
    );

    res.json({ message: "Section updated successfully", newSectionTeamId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
