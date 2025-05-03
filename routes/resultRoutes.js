// routes/resultsRoutes.js
import express from "express";
import { getAllTeamsWithCurrentRound, getTeamResultsDetail, getLeaderboard } from "../controllers/resultsController.js";
import { protect, allowRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, allowRoles("admin"), getAllTeamsWithCurrentRound);
router.get("/:teamId", protect, getTeamResultsDetail);
router.post("/leaderboard", protect, getLeaderboard);

export default router;
