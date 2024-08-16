import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import FluidAuth from "./lib";
import { credentialProvider } from "./providers";

const app = express();

const fluidAuth = new FluidAuth({
  providers: [credentialProvider],
  session: {
    secret: "eefefregfeger",
  },
});

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fluidAuth.session());

app.use((req, res, next) => {
  console.log("Request Body:", req.body);
  next();
});

app.use(express.static(path.resolve(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages", "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages", "dashboard.html"));
});

// Post requests
app.post("/login", fluidAuth.authenticate("credential"), (req, res) => {
  res.status(200).json({
    message: "successfully logged in",
    user: req.user || null,
    session: req.session || null,
  });
});

app.listen(PORT, () => console.log(`Alive on http://localhost:${PORT}`));
