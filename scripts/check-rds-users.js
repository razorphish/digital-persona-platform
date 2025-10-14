#!/usr/bin/env node

// Quick script to check users in AWS RDS dev01
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function checkRDSUsers() {
  console.log("🔍 Checking dev01 AWS RDS for users...\n");

  try {
    // Get password from AWS Secrets Manager
    console.log("🔑 Fetching database password from Secrets Manager...");
    const { stdout: secretOutput } = await execPromise(
      "aws secretsmanager get-secret-value --secret-id dev-dev01-dpp-database-password --region us-west-1 --query SecretString --output text"
    );
    const secret = JSON.parse(secretOutput);
    const password = secret.password;
    console.log("✅ Password retrieved\n");

    // Connection details
    const host =
      "dev-dev01-dpp-rds-proxy.proxy-cr6q082uklxj.us-west-1.rds.amazonaws.com";
    const username = "dpp_admin";
    const database = "digital_persona";

    console.log("📊 Attempting to connect to RDS database...");
    console.log(`   Host: ${host}`);
    console.log(`   User: ${username}`);
    console.log(`   Database: ${database}\n`);

    // Try to connect via psql (will timeout if not accessible)
    const query =
      "SELECT COUNT(*) as user_count, MIN(email) as first_user, MAX(email) as last_user FROM users;";

    try {
      const { stdout, stderr } = await execPromise(
        `PGPASSWORD="${password}" psql -h ${host} -U ${username} -d ${database} -c "${query}" -t`,
        { timeout: 10000 } // 10 second timeout
      );

      console.log("✅ Successfully connected to RDS!\n");
      console.log("📋 Query Results:");
      console.log(stdout);
    } catch (error) {
      if (error.killed || error.code === "ETIMEDOUT") {
        console.log("❌ Connection timed out.");
        console.log("   This is expected - RDS Proxy is in a private VPC.");
        console.log(
          "   The database is only accessible from within AWS (Lambda functions).\n"
        );
        console.log(
          "💡 Alternative: The deployed Lambda backend CAN access the database."
        );
        console.log(
          "   Users should exist if they were seeded during deployment."
        );
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkRDSUsers();
