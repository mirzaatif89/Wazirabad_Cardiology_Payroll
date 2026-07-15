import { updateAdminPassword, verifyAdminPassword } from "../models/authModel.js";

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    const admin = await verifyAdminPassword(username, password);

    if (!admin) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    return res.json({
      message: "Login successful.",
      user: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Login failed." });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Current password, new password, and confirm password are required." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "New password and confirm password do not match." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }

  try {
    const admin = await verifyAdminPassword("admin", currentPassword);

    if (!admin) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    await updateAdminPassword("admin", newPassword);
    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Password change failed:", error);
    return res.status(500).json({ message: "Password change failed." });
  }
};
