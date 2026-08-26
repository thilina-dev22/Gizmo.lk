import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const prisma = new PrismaClient();

const SINHALA_NAMES = [
  'Kasun Perera',
  'Nimal Jayasinghe',
  'Chamara Bandara',
  'Sanduni Weerasinghe',
  'Tharindu Wickramasinghe',
  'Dinuka Fernando',
  'Kavinda Silva',
  'Dilshan Madushanka',
  'Nuwan Gunawardena',
  'Chathurika Silva',
  'Isuru Senanayake',
  'Rashmi Jayawardena',
  'Malith Samarasinghe',
  'Praveen Fonseka',
  'Oshada Wickremasinghe',
  'Dhanushka Alwis',
  'Supun Karunaratne',
  'Kusal Dissanayake',
  'Anura Ratnayake',
  'Saman Peiris',
  'Lakshan Gamage',
  'Ruwan Wijesinghe',
  'Sajith Liyanage',
  'Sachini Abeysekera',
  'Hiruni Kulatunga',
  'Madhavi Menaka',
  'Thisara Peiris',
  'Janaka Gunasekera',
  'Roshen Jayakody',
  'Hirantha Rajapakse',
  'Manjula Herath',
  'Amila Senaratne',
  'Gayan Wickramaratne',
  'Suranga Tennakoon',
  'Damith Ekanayake',
  'Thilina Kumara',
  'Asanka Jayasuriya',
  'Buddhika Ranasinghe',
  'Vimukthi Mendis',
  'Chinthaka Hettiarachchi'
];

const REVIEW_TEMPLATES_BY_CATEGORY = {
  Audio: [
    {
      comment: "Superb bass quality and clear vocals! Tested on my phone and audio latency is very low. Delivery rider from Koombiyo brought it safely to Kandy in 2 days. Highly recommended!",
      rating: 5,
    },
    {
      comment: "Good battery backup. Used it for almost 15 hours on a single charge during travel. Cash on Delivery made it very easy and trustworthy.",
      rating: 5,
    },
    {
      comment: "Noise isolation is very impressive for this price point. Mic quality during WhatsApp calls is crystal clear. 100% genuine product.",
      rating: 5,
    },
    {
      comment: "Nicely packaged with warranty. Sounds much better than cheap replicas found in local shops. Fast delivery to Colombo.",
      rating: 4,
    },
    {
      comment: "Comfortable in-ear fit, doesn't fall off while running or gym workouts. Connected immediately with Bluetooth 5.3.",
      rating: 5,
    },
  ],
  Wearables: [
    {
      comment: "Stunning HD screen and touch response is very smooth! Battery easily lasts 4-5 days with regular use. Very satisfied with GizmoTek service.",
      rating: 5,
    },
    {
      comment: "Bought this as a gift and the presentation box with interchangeable straps was top quality. Delivered to Gampaha in less than 48 hours.",
      rating: 5,
    },
    {
      comment: "Step tracking, heart rate, and call notifications work seamlessly with the companion app on Android and iPhone. Great value for money.",
      rating: 5,
    },
    {
      comment: "Build quality is solid and feels premium on the wrist. Looks identical to high-end smartwatches.",
      rating: 4,
    },
    {
      comment: "Very stylish watch, premium magnetic charging dock included. Prompt customer support on WhatsApp when I asked about setup.",
      rating: 5,
    },
  ],
  "Chargers & Cables": [
    {
      comment: "Super fast charging! The digital LED display is accurate and shows live wattage while charging. Heavy-duty braided cable.",
      rating: 5,
    },
    {
      comment: "No overheating issues with my phone. Charges my iPhone from 20% to 80% in around 35 minutes. Very reliable build.",
      rating: 5,
    },
    {
      comment: "Sturdy reinforced connectors. Usually cheap cables break near the neck, but this one has strong rubber strain relief.",
      rating: 5,
    },
    {
      comment: "Item arrived in factory sealed packaging with warranty. Fast delivery to Galle.",
      rating: 5,
    },
    {
      comment: "Extremely handy 3-in-1 multi cable for charging both Type-C, Lightning, and Micro-USB devices at the office.",
      rating: 4,
    },
  ],
  "Storage & Pen Drives": [
    {
      comment: "Tested read and write speeds on PC and speed is consistent. Dual OTG connector makes transferring phone photos super quick.",
      rating: 5,
    },
    {
      comment: "Solid metal body, very durable and compact on keychain. Genuine storage capacity verified with H2testw.",
      rating: 5,
    },
    {
      comment: "Great pen drive for vehicle audio and backup storage. Received in Kurunegala within 3 days via COD.",
      rating: 5,
    },
  ],
  "Computer Accessories": [
    {
      comment: "Very ergonomic design and clicks are smooth with no double-click issues. RGB lighting looks awesome on the desk.",
      rating: 5,
    },
    {
      comment: "Plug and play worked instantly on Windows 11 without any driver hassle. Highly recommended for office and gaming.",
      rating: 5,
    },
    {
      comment: "High precision tracking on wooden desk even without mouse pad. Excellent value for this price.",
      rating: 4,
    },
  ],
  DEFAULT: [
    {
      comment: "Product arrived in pristine condition within 2 days. Works exactly as described on the website. Excellent service by GizmoTek!",
      rating: 5,
    },
    {
      comment: "Quality is genuinely great and packaging was secure with bubble wrap. Cash on Delivery was seamless.",
      rating: 5,
    },
    {
      comment: "Value for money tech item in Sri Lanka. Customer support was very helpful on WhatsApp.",
      rating: 4,
    },
    {
      comment: "Very satisfied with my purchase. Will definitely order more gadgets from GizmoTek.lk.",
      rating: 5,
    },
  ],
};

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDateWithinLast60Days() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 55) + 2;
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date;
}

async function seedReviews() {
  console.log('🌟 Starting authentic Sinhala customer reviews seeding across all products...');

  const products = await prisma.product.findMany({
    select: { id: true, title: true, category: true, sku: true },
  });

  console.log(`Found ${products.length} products to seed reviews for.`);

  // Delete existing seeded reviews if any to avoid duplicates
  const deleted = await prisma.review.deleteMany({});
  console.log(`Cleared ${deleted.count} old reviews.`);

  let totalReviewsCreated = 0;

  for (const product of products) {
    // Determine category reviews pool
    let pool = REVIEW_TEMPLATES_BY_CATEGORY.DEFAULT;
    for (const [catKey, templates] of Object.entries(REVIEW_TEMPLATES_BY_CATEGORY)) {
      if (product.category.toLowerCase().includes(catKey.toLowerCase())) {
        pool = templates;
        break;
      }
    }

    // Generate 2 to 4 unique reviews per product
    const reviewCountForProduct = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4 reviews
    const usedNames = new Set();
    const createdReviewRatings = [];

    for (let i = 0; i < reviewCountForProduct; i++) {
      let authorName = getRandomItem(SINHALA_NAMES);
      while (usedNames.has(authorName)) {
        authorName = getRandomItem(SINHALA_NAMES);
      }
      usedNames.add(authorName);

      const template = getRandomItem(pool);
      const createdAt = getRandomDateWithinLast60Days();

      await prisma.review.create({
        data: {
          productId: product.id,
          authorName,
          rating: template.rating,
          comment: template.comment,
          isApproved: true,
          createdAt,
        },
      });

      createdReviewRatings.push(template.rating);
      totalReviewsCreated++;
    }

    // Calculate aggregate rating
    const avgRating = Number(
      (createdReviewRatings.reduce((sum, r) => sum + r, 0) / createdReviewRatings.length).toFixed(1)
    );

    // Update Product record
    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: avgRating,
        reviewCount: createdReviewRatings.length,
      },
    });
  }

  console.log(`✅ Successfully seeded ${totalReviewsCreated} approved reviews with authentic Sinhala names across ${products.length} products!`);
  await prisma.$disconnect();
}

seedReviews().catch((err) => {
  console.error('Failed to seed reviews:', err);
  process.exit(1);
});
