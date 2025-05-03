import express from "express";
const router = express.Router();
import {
  getAllRounds,
  createRound,
  updateRound,
  deleteRound,
  getRoundSubmissionEvaluationStatus,
} from "../controllers/roundsController.js";
import { protect, allowRoles } from "../middlewares/authMiddleware.js";
// Submit an evaluation
router.post("/", protect, allowRoles("admin"), createRound);
router.get("/", protect, getAllRounds);
router.put("/:id", protect, allowRoles("admin"), updateRound);
router.delete("/:id", protect, allowRoles("admin"), deleteRound);
router.get("/status", protect, allowRoles("admin"), getRoundSubmissionEvaluationStatus);
export default router;
