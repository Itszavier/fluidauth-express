/** @format */

import { GoogleProvider } from "../../lib/providers";
import { users } from "../mock";
import dotenv from "dotenv";
dotenv.config();

export function generateRandomId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
const Google = new GoogleProvider({
  credential: {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    redirectUri: `${process.env.REDIRECT_ORIGIN as string}/google`,
  },

  async validateUser(google, profile) {
    const user = users.find((user) => user.email === (profile.email as string));

    if (user) {
      return { user };
    }

    const createdUser = {
      name: profile.name || "rfrfef",
      id: generateRandomId(),
      email: profile.email as string,
      password: "",
    };

    users.push(createdUser);

    return { user: createdUser };
  },
});

export default Google;
