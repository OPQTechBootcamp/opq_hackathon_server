import express from "express";
const router = express.Router();
import {
assignTeamSection, 
updateTeamSection
} from "../controllers/sectionController.js";
import { protect, allowRoles } from "../middlewares/authMiddleware.js";
router.post("/:teamId/assign-section", protect, allowRoles("coordinator"), assignTeamSection);
router.post("/:teamId/update", protect, allowRoles("coordinator"), updateTeamSection);

export default router;