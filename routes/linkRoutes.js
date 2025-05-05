import express from 'express';
import linksController from '../controllers/impLinks.js';
import { protect } from '../middlewares/authMiddleware.js';
const router = express.Router();

// GET /api/links - Fetch all links
router.get('/links',  linksController.getAllLinks);

// POST /api/links - Create a new link
router.post('/links', protect, linksController.createLink);

// PUT /api/links/:id - Update a link
router.put('/links/:id', protect, linksController.updateLink);

// DELETE /api/links/:id - Delete a link
router.delete('/links/:id', protect, linksController.deleteLink);

export default router;