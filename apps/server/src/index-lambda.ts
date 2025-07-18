// Lambda entry point
import { handler } from "./lambda.js";

// Export for AWS Lambda runtime
export { handler };

// For compatibility with different Lambda runtime configurations
export default handler;
