import express from "express";
import {
  createJob,
  getJobs,
  getMyJobs,
  getJobById,
  updateJob,
  deleteJob,
} from "../controllers/jobController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getJobs);

// Recruiter routes: authenticate and check role
router.get("/mine", protect, authorize("recruiter"), getMyJobs);

router.post("/", protect, authorize("recruiter"), createJob);

router.put("/:id", protect, authorize("recruiter"), updateJob);

router.delete("/:id", protect, authorize("recruiter"), deleteJob);

// A logged-in applicant can view unpublished jobs only if authorized;
// public job details are available without login.
router.get("/:id", getJobById);

export default router;
