const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "unAuthorized" });
    }
    const decoded = jwt.verify(token, "secret");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "user not Found" });
    }
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ message: "Invalid token" });
  }
};
module.exports = authMiddleware;
