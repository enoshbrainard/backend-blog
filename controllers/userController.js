const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotEnv = require("dotenv");
dotEnv.config();
const createUser = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(req.body.password, salt);
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedpassword,
    });
    await newUser.save();
    const { password, ...newuser } = newUser.toObject();
    res
      .status(201)
      .json({ message: "User created successfully", user: newuser });
  } catch (e) {
    console.error("Error occurred:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    const ismatch = await bcrypt.compare(password, user.password);
    if (!ismatch) {
      return res.status(401).json({ message: "invalid password" });
    }
    const jwt = require("jsonwebtoken");
    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    // Set both tokens as HTTP-only cookies (optional: store refresh in cookie or database)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "None", // or "Lax" (use "None" with `secure: true` if cross-site)
      secure: true, // for HTTPS only in production
      maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      // secure: process.env.NODE_ENV === "production"
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });
    // res.status(200).json({ message: "Tokens sent successfully" });
    // res.cookie("jwt", token, {
    //   httpOnly: true,
    //   sameSite: "Strict",
    //   maxAge: 60 * 60 * 1000,
    // });
    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        // anything else you want to send
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Server Error" });
  }
};
// const logout = async (req, res) => {
//   res.clearCookie("jwt", {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "strict",
//   });
//   res.status(200).json({ message: "logged out" });
// };
const logout = async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  });
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  });
  res.status(200).json({ message: "logged out" });
};

const verify = async (req, res) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  // Step 1: Try verifying access token
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      return res
        .status(200)
        .json({ message: "Access token valid", user: decoded });
    } catch (err) {
      // Access token expired or invalid — continue to check refresh
    }
  }

  // Step 2: Try verifying refresh token
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      // Issue new access token
      const newAccessToken = jwt.sign(
        { id: decoded.id },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      // Send new access token as cookie
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        sameSite: "Lax",
        secure: false,
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      return res
        .status(200)
        .json({ message: "Access token refreshed", user: decoded });
    } catch (err) {
      return res
        .status(403)
        .json({ message: "Refresh token expired or invalid" });
    }
  }

  // Step 3: Neither token is valid
  return res.status(401).json({ message: "Not authenticated" });
};

const resetpassword = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User Not Found" });
  }
  const salt = await bcrypt.genSalt(10);
  const hashedpassword = await bcrypt.hash(password, salt);
  user.password = hashedpassword;
  await user.save();
  res.status(200).json({ message: "successful" });
};

module.exports = { createUser, loginUser, resetpassword, logout, verify };


