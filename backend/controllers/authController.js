import jwt from "jsonwebtoken";
import User from "../models/User.js";

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profilePicture: user.profilePicture,
  resume: user.resume,
  skills: user.skills,
  phone: user.phone,
  companyName: user.companyName,
});

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role, companyName } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Never allow arbitrary role values.
    const userRole = role || "applicant";

    if (!["applicant", "recruiter"].includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: userRole,
      companyName: userRole === "recruiter" ? (companyName || "").trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token: createToken(user._id),
      user: safeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Registration error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `This account is registered as ${user.role}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: createToken(user._id),
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: safeUser(req.user),
  });
};

export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "email",
      "phone",
      "skills",
      "profilePicture",
      "resume",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }
      updates.name = updates.name.trim();
    }

    if (updates.email !== undefined) {
      if (
        typeof updates.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email",
        });
      }

      updates.email = updates.email.trim().toLowerCase();
    }

    if (updates.phone !== undefined) {
      if (typeof updates.phone !== "string") {
        return res.status(400).json({
          success: false,
          message: "Phone must be a string",
        });
      }
    }

    if (updates.skills !== undefined) {
      if (Array.isArray(updates.skills)) {
        updates.skills = updates.skills
          .filter((skill) => typeof skill === "string")
          .map((skill) => skill.trim())
          .filter(Boolean);
      } else if (typeof updates.skills === "string") {
        updates.skills = updates.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean);
      } else {
        return res.status(400).json({
          success: false,
          message: "Skills must be a list or comma-separated string",
        });
      }
    }

    if (
      updates.profilePicture !== undefined &&
      typeof updates.profilePicture !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Profile picture must be a string URL",
      });
    }

    if (updates.resume !== undefined && typeof updates.resume !== "string") {
      return res.status(400).json({
        success: false,
        message: "Resume must be a string URL",
      });
    }

    if (updates.email) {
      const existing = await User.findOne({
        email: updates.email,
        _id: { $ne: req.user._id },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "This email is already in use",
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already in use",
      });
    }

    console.error("Profile update error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};
