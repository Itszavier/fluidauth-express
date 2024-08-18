/** @format */

export enum ErrorNames {
"BadRequestError" = "BadRequestError",
"UnauthorizedError" = "UnauthorizedError",
  "ProviderNotFoundError" = "ProviderNotFoundError",
  "MissingProviderNameError" = "MissingProviderNameError",
}

// Define the type that allows for both predefined and custom values

export class FluidAuthError extends Error {
  code?: number;

  constructor(options: { name?: string; message?: string; code?: number }) {
    super(options.message);

    this.code = options.code;

    this.name = options.name || "FluidAuthError";
  }
}
