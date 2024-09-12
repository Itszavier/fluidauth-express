<!-- @format -->

# Fluid Auth Express

fluidauth-express makes adding authentication to your Express app easy. Follow these steps to get started quickly.

## Key Points

- **Experimental Session Management**: The session management feature in FluidAuth is still in beta. It is actively being developed and might change, so please keep this in mind as you integrate it into your project.

- **Body Parser Required**: You need to use `body-parser` to handle request data.
- **Cookie Parser Required**: You need to use `cookie-parser` to handle cookies.

- **Initialize Middleware**: Use `authService.initialize()` after setting up the session middleware to configure necessary helper functions.

## Documentation

For a comprehensive guide on using FluidAuth Express, including installation, setup, and API reference, please visit the official documentation:

[FluidAuth Documentation](https://quickstack.gitbook.io/fluidauth/)

This resource provides everything you need to integrate authentication into your Express.js applications, from setting up providers to managing sessions.

Here’s the Markdown text for a section about CommonJS and ES module support:

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
