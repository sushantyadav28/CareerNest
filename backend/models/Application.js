import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: {
      type: String,
      default: "",
    },
    resumePath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "Shortlisted", "Rejected", "Accepted"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

// Prevent the same applicant from applying twice to the same job.
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
