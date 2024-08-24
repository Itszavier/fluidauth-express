/** @format */
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import pagesRoutes from "./routes/pages";

import authEngine from "./config/authEngine";
const app = express();

const PORT = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.resolve(__dirname, "public")));

// auth middleware
app.use(authEngine.session());

app.use(function (req, res, next) {
  next();
});

// routes
app.use(authRoutes);
app.use(pagesRoutes);

app.listen(PORT, () => console.log(`Alive on http://localhost:${PORT}`));
