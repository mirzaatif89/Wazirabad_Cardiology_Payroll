import { randomInt } from "crypto";
import {
  consumePasswordResetToken,
  createPasswordResetOtp,
  getAdminForPasswordReset,
  updateAdminPassword,
  verifyAdminPassword,
  verifyPasswordResetOtp
} from "../models/authModel.js";
import { sendPasswordResetOtp } from "../services/mailService.js";

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

export const requestPasswordResetOtp = async (req, res) => {
  const { usernameOrEmail } = req.body;

  if (!usernameOrEmail) {
    return res.status(400).json({ message: "Username or email is required." });
  }

  try {
    const admin = await getAdminForPasswordReset(usernameOrEmail);

    if (!admin) {
      return res.status(404).json({ message: "Admin user not found." });
    }

    if (!admin.email) {
      return res.status(400).json({ message: "Admin email is not configured. Please set ADMIN_EMAIL in backend .env." });
    }

    const otp = String(randomInt(100000, 1000000));
    await createPasswordResetOtp(admin.id, otp);
    await sendPasswordResetOtp({ to: admin.email, otp });

    return res.json({ message: "OTP sent to your registered email." });
  } catch (error) {
    console.error("Password reset OTP failed:", error);
    return res.status(500).json({ message: error.message || "Password reset OTP failed." });
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  const { usernameOrEmail, resetToken, newPassword, confirmPassword } = req.body;

  if (!usernameOrEmail || !resetToken || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Username/email, verified reset token, new password, and confirm password are required." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "New password and confirm password do not match." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }

  try {
    const admin = await getAdminForPasswordReset(usernameOrEmail);

    if (!admin) {
      return res.status(404).json({ message: "Admin user not found." });
    }

    const isValidToken = await consumePasswordResetToken(admin.id, String(resetToken).trim(), admin.username, newPassword);

    if (!isValidToken) {
      return res.status(400).json({ message: "OTP verification expired. Please request a new OTP." });
    }

    return res.json({ message: "Password reset successfully. Please login with your new password." });
  } catch (error) {
    console.error("Password reset failed:", error);
    return res.status(500).json({ message: "Password reset failed." });
  }
};

export const verifyPasswordResetOtpCode = async (req, res) => {
  const { usernameOrEmail, otp } = req.body;

  if (!usernameOrEmail || !otp) {
    return res.status(400).json({ message: "Username/email and OTP are required." });
  }

  if (!/^\d{6}$/.test(String(otp).trim())) {
    return res.status(400).json({ message: "OTP must be 6 digits." });
  }

  try {
    const admin = await getAdminForPasswordReset(usernameOrEmail);

    if (!admin) {
      return res.status(404).json({ message: "Admin user not found." });
    }

    const resetToken = await verifyPasswordResetOtp(admin.id, String(otp).trim());

    if (!resetToken) {
      return res.status(400).json({ message: "OTP is invalid or expired." });
    }

    return res.json({
      message: "OTP verified. You can set a new password now.",
      resetToken
    });
  } catch (error) {
    console.error("Password reset OTP verification failed:", error);
    return res.status(500).json({ message: "Password reset OTP verification failed." });
  }
};
