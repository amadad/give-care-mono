export const requireHarnessToken = (token: string) => {
  const expected = process.env.HARNESS_API_TOKEN;
  if (!expected) {
    throw new Error('HARNESS_API_TOKEN is not configured in Convex environment');
  }
  if (token !== expected) {
    throw new Error('Unauthorized harness caller');
  }
};
