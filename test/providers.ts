/** @format */
import { CredentialProvider } from "../lib/providers/credential";
import { GithubProvider } from "../lib/providers/github";
import { GoogleProvider } from "../lib/providers/google";
import { users } from "../test/mock";
import dotenv from "dotenv";

dotenv.config();

export const googleProvider = new GoogleProvider({
  credential: {
    clientId: process.env.CLIENT_ID as string,
    clientSecret: process.env.CLIENT_SECRET as string,
    redirectUri: "https://dfkpzk-3000.csb.app/redirect/google",
  },

  async validateUser(data, profile) {
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
