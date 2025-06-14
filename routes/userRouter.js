const express = require("express");
const mongoose = require("mongoose");
const userController = require("../controllers/userController");
const postController = require("../controllers/PostController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", userController.createUser);
router.post("/login", userController.loginUser);
router.get("/logout", userController.logout);
router.post("/createposts", postController.createPosts);
router.get("/getposts", postController.getposts);
router.put("/resetpassword", userController.resetpassword);
router.get("/verify", authMiddleware, (req, res) => {
  res.status(200).json({ message: "User authenticated", user: req.user });
});
module.exports = router;
