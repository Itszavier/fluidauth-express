/** @format */

import { NextFunction, Router } from "express";
import authEngine from "../config/authEngine";
import { users } from "../mock";
import authService from "../config/authEngine";
const router = Router();

router.use(function (req, res, next) {
  // console.log(req.session, "api auth router");
  next();
});

router.get("/session", function (req, res, next) {
  res.status(200).json({ session: req.session || null, user: req.user || null });
});

router.post("/login", authService.authenticate("credential"));

router.get("login/google", authService.authenticate("google"));

router.get("/redirect/google", authEngine.handleCallback("google"));

router.get("/login/github", authService.authenticate("github"));

router.get("/redirect/github", authEngine.handleCallback("github"));


router.get('/login/discord', authService.authenticate('discord'));

router.get("/redirect/discord", authEngine.handleCallback("discord"));

export default router;
