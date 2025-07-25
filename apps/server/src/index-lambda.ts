// Lambda entry point for AWS Lambda runtime
import { handler as lambdaHandler } from "./lambda.js";

// Export the handler for AWS Lambda runtime
export const handler = lambdaHandler;

// Default export for compatibility
export default lambdaHandler;
