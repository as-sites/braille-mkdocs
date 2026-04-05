/**
 * Standardized error responses for the API.
 * Each error class defines an HTTP status code and message.
 */

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
    };
  }
}

/** 400 Bad Request — validation or malformed input */
export class ValidationError extends APIError {
  constructor(message: string) {
    super(400, message);
  }
}

/** 401 Unauthorized — missing or invalid credentials */
export class UnauthorizedError extends APIError {
  constructor(message: string = "Unauthorized") {
    super(401, message);
  }
}

/** 403 Forbidden — authenticated but lacks permissions */
export class ForbiddenError extends APIError {
  constructor(message: string = "Forbidden") {
    super(403, message);
  }
}

/** 404 Not Found */
export class NotFoundError extends APIError {
  constructor(message: string = "Not found") {
    super(404, message);
  }
}

/** 409 Conflict — e.g., duplicate path */
export class ConflictError extends APIError {
  constructor(message: string) {
    super(409, message);
  }
}

/** 422 Unprocessable Entity — business logic constraint violation */
export class BusinessLogicError extends APIError {
  constructor(message: string) {
    super(422, message);
  }
}

/** 500 Internal Server Error */
export class InternalError extends APIError {
  constructor(message: string = "Internal server error") {
    super(500, message);
  }
}
