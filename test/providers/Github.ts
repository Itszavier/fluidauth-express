/** @format */

import { GithubProvider } from "../../lib/providers";
import { users } from "../mock";
import dotenv from "dotenv";
dotenv.config();
const Github = new GithubProvider({
  credential: {
    clientId: process.env.GITHUB_CLIENT_ID as string,
    clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    redirectUri: `${process.env.REDIRECT_ORIGIN as string}/github`,
  },

  async validateUser(data, profile) {
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

export default Github;
