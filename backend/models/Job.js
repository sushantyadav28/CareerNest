import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    companyLogo: {
      type: String,
      default: "",
    },
    aboutCompany: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract"],
      default: "Full-time",
    },
    skills: {
      type: [String],
      default: [],
    },
    minSalary: {
      type: Number,
      min: 0,
      default: 0,
    },
    maxSalary: {
      type: Number,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      required: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

jobSchema.index({
  title: "text",
  companyName: "text",
  skills: "text",
});

const Job = mongoose.model("Job", jobSchema);

export default Job;
