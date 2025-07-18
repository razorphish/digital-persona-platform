exports.handler = async (event) => {
  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
    body: JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Digital Persona Platform API",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    }),
  };

  return response;
};
