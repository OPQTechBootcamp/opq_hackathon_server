import db from "../config/db.js";

// Controller object with methods for handling link operations
const linksController = {
  // Get all links
  getAllLinks: async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM important_links ORDER BY created_at DESC');
      res.json(rows);
    } catch (error) {
      console.error('Error fetching links:', error);
      res.status(500).json({ message: 'Failed to fetch links' });
    }
  },

  // Create a new link
  createLink: async (req, res) => {
    try {
      const { name, url } = req.body;
      
      if (!name || !url) {
        return res.status(400).json({ message: 'Name and URL are required' });
      }
      
      await db.query('INSERT INTO important_links (name, url) VALUES (?, ?)', [name, url]);
      res.status(201).json({ message: 'Link created successfully' });
    } catch (error) {
      console.error('Error creating link:', error);
      res.status(500).json({ message: 'Failed to create link' });
    }
  },

  // Update an existing link
  updateLink: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, url } = req.body;
      
      if (!name || !url) {
        return res.status(400).json({ message: 'Name and URL are required' });
      }
      
      const [result] = await db.query('UPDATE important_links SET name = ?, url = ? WHERE id = ?', [name, url, id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Link not found' });
      }
      
      res.json({ message: 'Link updated successfully' });
    } catch (error) {
      console.error('Error updating link:', error);
      res.status(500).json({ message: 'Failed to update link' });
    }
  },

  // Delete a link
  deleteLink: async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await db.query('DELETE FROM important_links WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Link not found' });
      }
      
      res.json({ message: 'Link deleted successfully' });
    } catch (error) {
      console.error('Error deleting link:', error);
      res.status(500).json({ message: 'Failed to delete link' });
    }
  }
};

export default linksController;