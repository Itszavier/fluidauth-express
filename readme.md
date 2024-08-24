<!-- @format -->

```js
import {authEngine} from "@fluidauth/express";
import {Google, Crediential} from "@fluidauth/express/providers";

const authEngine = new AuthEngine({
  providers: [Crediential, Google],
  session: {
    secret: "eefefregfeger",
  },
});

authEngine.serializeUser(function (user) {
  return user.id;
});

authEngine.deserializeUser(function (id) {
  const user = users.find((user) => user.id === id) || null;
  if (!user) console.log("[deserializeUser]: user not found");
  return user;
});
```
