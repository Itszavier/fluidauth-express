import { Router } from "express";
import authEngine from "../config/authEngine";
import { users } from "../mock";
const router = Router();

router.post(
  "/login",
  authEngine.authenticate("credential"),
  function (req, res, next) {
    res.status(200).json({
      message: "successfully logged in",
      user: req.user || null,
      session: req.session || null,
    });
  }
);

router.get("/session", function (req, res, next) {
  res
    .status(200)
    .json({ session: req.session || null, user: req.user || null });
});

router.get("/login/google", authEngine.authenticate("google"));

router.get("/redirect/google", authEngine.handleCallback("google"));

export default router;
