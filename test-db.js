// Set environment variable before importing
process.env.DATABASE_URL = "postgresql://postgres.ridsppgxnwjxaoiopbnm:01090886364Mm@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&uselibpqcompat=true";

import { db } from "./src/lib/db.js";

async function testConnection() {
  try {
    console.log("\n🔍 Testing database connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:]+@/, ':***@'));
    
    // Test basic query
    const users = await db.user.findMany({ take: 5 });
    console.log("✅ Connection successful!");
    console.log(`Found ${users.length} users`);
    
    if (users.length > 0) {
      console.log("\nFirst user:", {
        id: users[0].id,
        email: users[0].email,
        name: users[0].name,
        role: users[0].role,
      });
    }
  } catch (error) {
    console.error("❌ Connection failed:", error instanceof Error ? error.message : error);
  } finally {
    await db.$disconnect();
  }
}

testConnection();