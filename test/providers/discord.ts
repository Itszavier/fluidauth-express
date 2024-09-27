/** @format */

import { DiscordProvider } from "../../lib/providers/discord";
import dotenv from "dotenv";
import { generateRandomId } from "./google";
import { users } from "../mock";

dotenv.config();

const Discord = new DiscordProvider({
  credential: {
    clientId: process.env.DISCORD_CLIENT_ID as string,
    clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    redirectUri: `${process.env.REDIRECT_ORIGIN as string}/discord`,
  },

  validateUser(discordData, profile) {
    console.log(discordData, profile);

    const user = users.find((user) => user.email === (profile.email as string));

    if (user) {
      return { user };
    }

    const createdUser = {
      name: profile.username || "rfrfef",
      id: generateRandomId(),
      email: profile.email as string,
      password: "",
    };

    users.push(createdUser);

    return { user: createdUser };
  },
});

export default Discord;
