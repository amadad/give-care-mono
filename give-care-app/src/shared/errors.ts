export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BudgetExceededError';
  }
}

export class PolicyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PolicyViolationError';
  }
}

export class CapabilityNotFoundError extends Error {
  constructor(name: string) {
    super(`Capability ${name} not found`);
    this.name = 'CapabilityNotFoundError';
  }
}

export class ConsentRequiredError extends Error {
  constructor(name: string) {
    super(`Capability ${name} requires consent`);
    this.name = 'ConsentRequiredError';
  }
}

export class TransientToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransientToolError';
  }
}
