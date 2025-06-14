const express = require("express");
const path = require("path");

const mongoose = require("mongoose");
const dotEnv = require("dotenv");
const cookieParser = require("cookie-parser");
const Post = require("./models/Posts");
const cors = require("cors");
const userRouter = require("./routes/userRouter");
const app = express();
dotEnv.config();
const port = process.env.PORT;
app.use(cookieParser());
dotEnv.config();

// Enable CORS (you can specify origin if needed)
const allowedOrigins = [
  "http://localhost:3000", // local dev
  "https://your-frontend.vercel.app" // replace with your actual frontend Vercel URL
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // if you're using cookies
  })
);
// Serve static files like favicon.ico from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Set Content-Security-Policy headers to avoid browser blocking scripts/images

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https:; connect-src 'self' http://localhost:8009"
  );
  next();
});

// Middleware to parse JSON
app.use(express.json());

// Use employee routes
app.use("/api", userRouter);
app.get("/api/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id);
    if (!post) res.status(404).json({ message: "Not found" });
    res.status(200).json(post);
  } catch (e) {
    res.status(500).json({ message: "Error fecthing posts" });
  }
});

// app.use("/employees", employeeRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Mongo db CONNECTED");
  })
  .catch((e) => {
    console.log("error occurred", e);
  });

// Start server
app.listen(port, () => {
  console.log("Server is running on port", port);
});
