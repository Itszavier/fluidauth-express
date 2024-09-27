/** @format */
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import pagesRoutes from "./routes/pages";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import authEngine from "./config/authEngine";
const app = express();

const PORT = process.env.PORT || 3000;

// middleware

app.set("view engine", "ejs");
app.set("views", "./test/views");
app.use(express.static(path.resolve(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
// auth middleware

app.use(authEngine.session());
app.use(authEngine.initialize());

app.use(function (req, res, next) {
  console.log(req.body);
  next();
});

// routes
app.use("/auth", authRoutes);
app.use(pagesRoutes);

app.listen(PORT, () => {
  console.clear();
  console.log(`Alive on http://localhost:${PORT}`);
});
