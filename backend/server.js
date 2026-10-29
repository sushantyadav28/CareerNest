import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import path from "path";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/applications", applicationRoutes);
app.use("/uploads", express.static(path.resolve("uploads")));

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CareerNest API is running!",
  });
});
    
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

// Start server after connecting to MongoDB
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`CareerNest server running on port ${PORT}`);
  });
};

startServer();
