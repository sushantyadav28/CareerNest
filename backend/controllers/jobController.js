import mongoose from "mongoose";
import Job from "../models/Job.js";

const allowedFields = [
  "title",
  "companyName",
  "companyLogo",
  "aboutCompany",
  "location",
  "employmentType",
  "skills",
  "minSalary",
  "maxSalary",
  "description",
  "isPublished",
];

const validEmploymentTypes = [
  "Full-time",
  "Part-time",
  "Internship",
  "Contract",
];

const parseSkills = (skills) => {
  if (Array.isArray(skills)) return skills;
  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }
  return [];
};

// POST /api/jobs
export const createJob = async (req, res) => {
  try {
    const {
      title,
      companyName,
      location,
      description,
      minSalary = 0,
      maxSalary = 0,
      employmentType = "Full-time",
    } = req.body;

    if (!title?.trim() || !location?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title, location and description are required",
      });
    }

    const finalCompany = companyName?.trim() || req.user.companyName?.trim();

    if (!finalCompany) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    const min = Number(minSalary);
    const max = Number(maxSalary);

    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      min < 0 ||
      max < 0 ||
      (max > 0 && max < min)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid salary range",
      });
    }

    if (!validEmploymentTypes.includes(employmentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employment type",
      });
    }

    const jobData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        jobData[field] = req.body[field];
      }
    }

    jobData.title = title.trim();
    jobData.companyName = finalCompany;
    jobData.location = location.trim();
    jobData.description = description.trim();
    jobData.minSalary = min;
    jobData.maxSalary = max;
    jobData.employmentType = employmentType;
    jobData.skills = parseSkills(req.body.skills);
    jobData.recruiter = req.user._id;

    // Never accept the recruiter ID from the request body.
    const job = await Job.create(jobData);

    return res.status(201).json({
      success: true,
      message: "Job published successfully",
      job,
    });
  } catch (error) {
    console.error("Create job error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create job",
    });
  }
};

// GET /api/jobs
export const getJobs = async (req, res) => {
  try {
    const {
      search = "",
      location = "",
      employmentType = "",
      skills = "",
      page = "1",
      limit = "10",
    } = req.query;

    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number.parseInt(limit, 10) || 10),
    );

    const filter = { isPublished: true };

    if (search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { title: regex },
        { companyName: regex },
        { skills: regex },
      ];
    }

    if (location.trim()) {
      filter.location = {
        $regex: location.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    if (employmentType && employmentType !== "Any type") {
      if (!validEmploymentTypes.includes(employmentType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employment type filter",
        });
      }
      filter.employmentType = employmentType;
    }

    const requestedSkills = parseSkills(skills);

    if (requestedSkills.length) {
      filter.skills = {
        $in: requestedSkills.map(
          (skill) =>
            new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
        ),
      };
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate("recruiter", "name companyName")
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),
      Job.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      jobs,
    });
  } catch (error) {
    console.error("Get jobs error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};

// GET /api/jobs/mine
export const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Get recruiter jobs error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your jobs",
    });
  }
};

// GET /api/jobs/:id
export const getJobById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const job = await Job.findById(req.params.id).populate(
      "recruiter",
      "name companyName",
    );

    if (
      !job ||
      (!job.isPublished && String(job.recruiter._id) !== String(req.user?._id))
    ) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({ success: true, job });
  } catch (error) {
    console.error("Get job error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job",
    });
  }
};

// PUT /api/jobs/:id
export const updateJob = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const job = await Job.findOne({
      _id: req.params.id,
      recruiter: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or you do not own this job",
      });
    }

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] =
          field === "skills" ? parseSkills(req.body[field]) : req.body[field];
      }
    }

    if (updates.title !== undefined) {
      if (typeof updates.title !== "string" || !updates.title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }
      updates.title = updates.title.trim();
    }

    if (updates.companyName !== undefined) {
      if (
        typeof updates.companyName !== "string" ||
        !updates.companyName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Company name cannot be empty",
        });
      }
      updates.companyName = updates.companyName.trim();
    }

    if (updates.location !== undefined) {
      if (typeof updates.location !== "string" || !updates.location.trim()) {
        return res.status(400).json({
          success: false,
          message: "Location cannot be empty",
        });
      }
      updates.location = updates.location.trim();
    }

    if (updates.description !== undefined) {
      if (
        typeof updates.description !== "string" ||
        !updates.description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty",
        });
      }
      updates.description = updates.description.trim();
    }

    if (
      updates.employmentType !== undefined &&
      !validEmploymentTypes.includes(updates.employmentType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid employment type",
      });
    }

    for (const field of ["minSalary", "maxSalary"]) {
      if (updates[field] !== undefined) {
        updates[field] = Number(updates[field]);

        if (!Number.isFinite(updates[field]) || updates[field] < 0) {
          return res.status(400).json({
            success: false,
            message: "Salary must be a valid non-negative number",
          });
        }
      }
    }

    const min = updates.minSalary ?? job.minSalary;
    const max = updates.maxSalary ?? job.maxSalary;

    if (max > 0 && max < min) {
      return res.status(400).json({
        success: false,
        message: "Maximum salary cannot be lower than minimum salary",
      });
    }

    job.set(updates);
    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    console.error("Update job error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update job",
    });
  }
};

// DELETE /api/jobs/:id
export const deleteJob = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      recruiter: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or you do not own this job",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete job",
    });
  }
};
