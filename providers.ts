/** @format */
import { CredentialProvider } from "./lib/providers/credential";
import { GithubProvider } from "./lib/providers/github";
import { GoogleProvider } from "./lib/providers/google";
import { users } from "./mock";
import dotenv from "dotenv";

dotenv.config();

export const credentialProvider = new CredentialProvider({
  async verifyUser(email, password) {
    const user = users.find((userData) => userData.email === email && userData.password === password);

    if (!user) {
      return { user: null, info: { message: "user not found" } };
    }

    return { user };
  },
});

export const googleProvider = new GoogleProvider({
  credentials: {
    clientId: process.env.CLIENT_ID as string,
    clientSecret: process.env.CLIENT_SECRET as string,
    redirectUri: "https://dfkpzk-3000.csb.app/redirect/google",
  },

  async verifyUser(data, profile) {
    const userExist = users.find((user) => user.email === profile.email);

    if (userExist) {
      return { user: userExist };
    }

    const user = {
      id: (Math.floor(Math.random() * (100 - 20 + 1)) + 20).toString(),
      email: profile.email,
      name: profile.name,
      password: "ewfrefrfrefgervgerg",
    };

    users.push(user);

    return { user };
  },
});

