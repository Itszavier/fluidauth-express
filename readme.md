# Fluid Auth Express

fluidauth-express makes adding authentication to your Express app easy. Follow these steps to get started quickly.


## Documentation

For a comprehensive guide on using FluidAuth Express, including installation, setup, and API reference, please visit the official documentation:

[FluidAuth Documentation](https://fluidauth.vercel.app/)

### Key Points

- **Body Parser Required**: You need to use `body-parser` to handle request data.
- **Cookie Parser Required**: You need to use `cookie-parser` to handle cookies.

- **Initialize Middleware**: Use `authService.initialize()` after setting up the session middleware to configure necessary helper functions.
Here’s the Quick Start guide using `require`:



## Quick Start

```js
// Import GithubProvider from FluidAuth-Express
const { GithubProvider } = require("@fluidauth/express/providers");

// Initialize GitHub provider with credentials
const Github = new GithubProvider({
  credential: {
    clientId: "your-client-id",
    clientSecret: "your-client-secret",
    redirectUri: "your-redirect-uri",
  },
  async verifyUser(data) {
    const user = await findUserByEmail(data.email);
    return user ? { user } : { user: null, info: { message: "User not found" } };
  }
});
```

```js
// Express server setup
const express = require('express');
const cookieParser = require('cookie-parser');
const { AuthService, Session } = require('@fluidauth/express');

const app = express();
const authService = new AuthService({
  providers: [Github],
  session: new Session({ secret: "your-session-secret" }),
  redirect: { onLoginSuccess: "/dashboard" },
});

app.use(express.json());
app.use(cookieParser());
app.use(authService.session());
app.use(authService.initialize());

app.listen(3000, () => console.log("Server running on port 3000"));
```

## Module Support

FluidAuth Express supports both CommonJS and ES Modules, allowing flexibility in how you import the package.

### CommonJS

If you're using CommonJS, you can require the package like this:

```javascript
const { AuthService } = require("@fluidauth/express");
```

### ES Modules

For projects using ES Modules, you can import the package like this:

```javascript
import { AuthService } from "@fluidauth/express";
```

Both module systems are fully supported to ensure compatibility with various environments.
