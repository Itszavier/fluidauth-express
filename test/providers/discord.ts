/** @format */

import { DiscordProvider } from "../../lib/providers/discord";
import dotenv from "dotenv";

dotenv.config();

const Discord = new DiscordProvider({
  credential: {
    clientId: process.env.DISCORD_CLIENT_ID as string,
    clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    redirectUri: `${process.env.REDIRECT_ORIGIN as string}/discord`,
  },

  validateUser(discordData, profile) {
    return { user: null };
  },
});

export default Discord;
