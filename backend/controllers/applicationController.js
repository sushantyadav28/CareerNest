import mongoose from "mongoose";
import Application from "../models/Application.js";
import Job from "../models/Job.js";

// POST /api/applications/:jobId
export const applyForJob = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload your resume",
      });
    }

    const job = await Job.findOne({
      _id: req.params.jobId,
      isPublished: true,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const application = await Application.create({
      job: job._id,
      applicant: req.user._id,
      coverLetter: req.body.coverLetter || "",
      resumePath: `/uploads/${req.file.filename}`,
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    // Remove an uploaded file if the application could not be saved.
    if (req.file) {
      const fs = await import("fs/promises");
      const path = await import("path");

      await fs
        .unlink(path.resolve("uploads", req.file.filename))
        .catch(() => {});
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    console.error("Apply for job error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to submit application",
    });
  }
};

// GET /api/applications/mine
export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      applicant: req.user._id,
    })
      .populate("job")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get applications error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
};

// GET /api/applications/job/:jobId
export const getJobApplications = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiter: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or you do not own this job",
      });
    }

    const applications = await Application.find({
      job: job._id,
    })
      .populate("applicant", "name email phone skills profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get job applicants error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job applicants",
    });
  }
};

// PATCH /api/applications/:id/status
export const updateApplicationStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Under Review",
      "Shortlisted",
      "Rejected",
      "Accepted",
    ];

    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application status",
      });
    }

    const application = await Application.findById(req.params.id).populate(
      "job",
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (String(application.job.recruiter) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot manage this application",
      });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({
      success: true,
      message: "Application status updated",
      application,
    });
  } catch (error) {
    console.error("Update application error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update application status",
    });
  }
};
