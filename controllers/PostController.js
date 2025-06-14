const Post = require("../models/Posts");
const createPosts = async (req, res) => {
  try {
    const { title, topic, content, image, createdAt } = req.body;

    const newPost = new Post({
      title,
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
const getposts = async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch (e) {
    res.status(500).json({ message: "server error occured" });
  }
};

module.exports = { createPosts, getposts };
