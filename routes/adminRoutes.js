import express from "express";
const router = express.Router();
import {
  getUsers,
  getTeams,
  getTeamJudges,
  assignJudges,
  unassignJudge,
  getAllUsersAndTeams,
} from "../controllers/adminController.js";
import { protect, allowRoles } from "../middlewares/authMiddleware.js";
import {
  uploadProblemStatement,
  updateProblemStatement,
  getAllProblemStatements,
  getProblemStatementInDepthFile,
  getProblemStatementOverviewFile,
  deleteProblemStatement,
} from "../controllers/adminProblemController.js";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage });
// Get users
router.get("/users", protect, allowRoles("admin", "coordinator"), getUsers);

// Get teams
router.get("/teams", protect, allowRoles("admin", "coordinator"), getTeams);

// Get team-judge assignments
router.get("/team-judges", protect, allowRoles("admin", "coordinator"), getTeamJudges);

// Assign judges to a team
router.post("/assign-judges", protect, allowRoles("admin", "coordinator"), assignJudges);

// Unassign judge from a team
router.delete(
  "/unassign-judge/:assignmentId",
  protect,
  allowRoles("admin"),
  unassignJudge
);

router.get(
  "/users-teams",
  protect,
  allowRoles("admin", "coordinator"),
  getAllUsersAndTeams
);

router.post(
  "/problem-statement/upload",
  upload.fields([
    { name: "overview_file", maxCount: 1 },
    { name: "in_depth_file", maxCount: 1 },
  ]),
  protect,
  allowRoles("admin"),
  uploadProblemStatement
);

// routes/adminProblemRoutes.js
router.get(
  "/problem-statements",
  protect,
  getAllProblemStatements
);
router.get(
  "/problem-statement/:id/file/overview",
  protect,
  getProblemStatementOverviewFile
);
router.get(
  "/problem-statement/:id/file/in-depth",
  protect,
  getProblemStatementInDepthFile
);
router.put(
  "/problem-statement/:id",
  upload.fields([
    { name: "overview_file", maxCount: 1 },
    { name: "in_depth_file", maxCount: 1 },
  ]),
  protect,
  allowRoles("admin"),
  updateProblemStatement
);
router.delete(
  "/problem-statement/:id",
  protect,
  allowRoles("admin"),
  deleteProblemStatement
);

export default router;
