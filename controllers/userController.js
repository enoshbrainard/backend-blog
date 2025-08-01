const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotEnv = require("dotenv");
dotEnv.config();

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  sameSite: isProduction ? "Strict" : "Lax",
  secure: isProduction,
  maxAge: maxAgeMs,
});

const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    const { password: _, ...safeUser } = newUser.toObject();
    res.status(201).json({ message: "User created successfully", user: safeUser });
  } catch (e) {
    console.error("Error during user creation:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.cookie("accessToken", accessToken, cookieOptions(60 * 60 * 1000)); // 1 hour
    res.cookie("refreshToken", refreshToken, cookieOptions(24 * 60 * 60 * 1000)); // 1 day

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username || user.name,
        email: user.email,
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Server Error" });
  }
};

const logout = async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "Strict" : "Lax",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "Strict" : "Lax",
  });
  res.status(200).json({ message: "Logged out" });
};

const verify = async (req, res) => {
  const { accessToken, refreshToken } = req.cookies;

  try {
    if (accessToken) {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      return res.status(200).json({ message: "Access token valid", user: decoded });
    }
  } catch (err) {
    // Ignore and fall back to refresh
  }

  try {
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

      res.cookie("accessToken", newAccessToken, cookieOptions(60 * 60 * 1000));
      return res.status(200).json({ message: "Access token refreshed", user: decoded });
    }
  } catch (err) {
    return res.status(403).json({ message: "Refresh token expired or invalid" });
  }

  return res.status(401).json({ message: "Not authenticated" });
};

const resetpassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Missing email or new password" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User Not Found" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { createUser, loginUser, resetpassword, logout, verify };

