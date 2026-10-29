import express from "express";
import {
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
} from "../controllers/applicationController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/:jobId",
  protect,
  authorize("applicant"),
  upload.single("resume"),
  applyForJob,
);

router.get("/mine", protect, authorize("applicant"), getMyApplications);

router.get("/job/:jobId", protect, authorize("recruiter"), getJobApplications);

router.patch(
  "/:id/status",
  protect,
  authorize("recruiter"),
  updateApplicationStatus,
);

export default router;
