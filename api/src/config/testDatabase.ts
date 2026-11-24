import "dotenv/config";
import prisma from "./database.js";

async function testDatabase() {
  try {
    await prisma.$connect();

    console.log("PostgreSQL connected successfully!");

    const result = await prisma.$queryRaw`
      SELECT NOW() AS current_time
    `;

    console.log(result);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();