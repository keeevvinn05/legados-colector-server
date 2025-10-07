export class APIError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

export const codes = {
  INTERNAL_ERROR: 4,
  INVALID_USER: 5,
  INVALID_PRODUCT: 6,
  INVALID_ORDER: 7,
};
