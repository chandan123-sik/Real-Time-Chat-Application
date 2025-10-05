import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Middleware to protect the routes
export const protectRoute = async (req, res, next) => {
  try {
    const token = req.header("token");   // ✅ Correct way
    if (!token) {
      return res.json({ success: false, message: "JWT must be provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
