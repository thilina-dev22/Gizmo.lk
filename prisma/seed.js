import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GIZMOTEK REAL PRODUCTS CATALOG
 * We add verified real dropshipping products here one by one.
 */
export const realProducts = [];

async function main() {
  console.log("Cleaning all mock data from GizmoTek.lk database...");

  // Delete all existing items, orders, reviews, and mock products
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  try {
    await prisma.review.deleteMany({});
  } catch (err) {}
  await prisma.product.deleteMany({});

  console.log("All mock products and sample orders cleared from database.");

  // Insert real products
  for (const item of realProducts) {
    await prisma.product.create({
      data: item,
    });
  }

  console.log(`Database successfully initialized with ${realProducts.length} real products!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
