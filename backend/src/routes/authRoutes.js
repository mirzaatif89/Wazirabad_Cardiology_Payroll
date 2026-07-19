import { Router } from "express";
import {
  changePassword,
  login,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  verifyPasswordResetOtpCode
} from "../controllers/authController.js";

const router = Router();

router.post("/login", login);
router.post("/change-password", changePassword);
router.post("/forgot-password", requestPasswordResetOtp);
router.post("/verify-reset-otp", verifyPasswordResetOtpCode);
router.post("/reset-password", resetPasswordWithOtp);

export default router;
