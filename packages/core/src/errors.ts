export class AutolinkError extends Error {
  readonly requestId: string;
  readonly code: string;

  constructor(message: string, code: string, requestId: string) {
    super(message);
    this.name = "AutolinkError";
    this.code = code;
    this.requestId = requestId;
  }
}

export class AutolinkAuthError extends AutolinkError {
  constructor(message: string, requestId: string) {
    super(message, "AUTHENTICATION_ERROR", requestId);
    this.name = "AutolinkAuthError";
  }
}

export class AutolinkForbiddenError extends AutolinkError {
  constructor(message: string, requestId: string) {
    super(message, "FORBIDDEN", requestId);
    this.name = "AutolinkForbiddenError";
  }
}

export class AutolinkNotFoundError extends AutolinkError {
  constructor(message: string, requestId: string) {
    super(message, "NOT_FOUND", requestId);
    this.name = "AutolinkNotFoundError";
  }
}

export class AutolinkValidationError extends AutolinkError {
  readonly fields: Record<string, string[]>;

  constructor(
    message: string,
    requestId: string,
    fields: Record<string, string[]> = {}
  ) {
    super(message, "VALIDATION_ERROR", requestId);
    this.name = "AutolinkValidationError";
    this.fields = fields;
  }
}

export class AutolinkRateLimitError extends AutolinkError {
  readonly retryAfter: number;

  constructor(message: string, requestId: string, retryAfter: number) {
    super(message, "RATE_LIMITED", requestId);
    this.name = "AutolinkRateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class AutolinkNetworkError extends AutolinkError {
  readonly cause: Error;

  constructor(message: string, cause: Error) {
    super(message, "NETWORK_ERROR", "");
    this.name = "AutolinkNetworkError";
    this.cause = cause;
  }
}
