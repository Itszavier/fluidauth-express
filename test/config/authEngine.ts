/** @format */

import { AuthService, Session, MemoryStore } from "../../lib";
import { users } from "../mock";
import { GoogleProvider, CredentialProvider } from "../../lib/providers";
import dotenv from "dotenv";
import Github from "../providers/Github";
import Credential from "../providers/credential";
import Google from "../providers/google";
import Discord from "../providers/discord";

dotenv.config();

const authService = new AuthService({
  providers: [Github, Credential, Google, Discord],
});


export default authService;
