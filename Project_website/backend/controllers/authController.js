// backend/controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcrypt";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email" });

    // check password
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    if (user.role !== "admin") {
  return res.status(403).json({ message: "Access denied: Not admin" });
}

    res.json({
      message: "Login successful",
      user: { email: user.email, role: user.role }
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
