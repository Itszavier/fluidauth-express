/** @format */

import { AuthService, Session, MemoryStore } from "../lib";
import { users } from "../mock";
import { GoogleProvider, CredentialProvider } from "../lib/providers";
import dotenv from "dotenv";
import { GithubProvider } from "../lib/providers/github";

dotenv.config();

const session = new Session({
  secret: "efwfrfergfrgetgvetgtrgtrgrt",
  store: new MemoryStore(),
  cookie: { httpOnly: true },
});

export const Github = new GithubProvider({
  credential: {
    clientId: process.env.GITHUB_CLIENT_ID as string,
    clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    redirectUri: process.env.REDIRECT_URI as string,
  },

  async verifyUser(data, profile) {
    const user = users.find((user) => user.email === (profile.email?.email as string));

    if (user) {
      return { user };
    }

    const createdUser = {
      name: profile.name || "rfrfef",
      id: profile.id.toString(),
      email: profile.email?.email as string,
      password: "",
    };

    users.push(createdUser);

    return { user: createdUser };
  },
});

const authService = new AuthService({
  redirect: {
    onLoginSuccess: "/dashboard",
  },
  providers: [Github],
  session,
});

authService.serializeUser(function (user) {
  return user.id;
});

authService.deserializeUser(async function (id) {
  const user = users.find((user) => user.id === id) || null;
  if (!user) console.log("[deserializeUser]: user not found");
  return user;
});

export default authService;
