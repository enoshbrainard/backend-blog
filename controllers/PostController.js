const Post = require("../models/Posts");

// Create Post
const createPosts = async (req, res) => {
  try {
    const { title, topic, content, image, createdAt } = req.body;
    const userId = req.query.userId; // ✅ Fixed: direct access, not destructuring

    const newPost = new Post({
      title,
      userId,
      topic,
      content,
      image,
      createdAt,
    });

    await newPost.save();
    res.status(200).json(newPost);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Get All Posts
const getposts = async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch (e) {
    res.status(500).json({ message: "server error occurred" });
  }
};

// Get Posts by Admin/User ID
const getadminposts = async (req, res) => {
  const userId = req.query.userId; // ✅ Fixed

  try {
    const posts = await Post.find({ userId });

    if (!posts || posts.length === 0) {
      return res.status(404).json({ message: "No posts found for this user" });
    }

    res.status(200).json(posts);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { createPosts, getposts, getadminposts }; // ✅ Don't forget to export getadminposts too!
