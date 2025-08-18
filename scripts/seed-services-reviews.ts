// scripts/seed-services-reviews.ts
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users, handymanServices, reviews } from "../src/lib/schema";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seedServicesAndReviews() {
  try {
    console.log("🔧 Adding handyman services and reviews...");

    // Get all handymen and customers
    const handymen = await db
      .select()
      .from(users)
      .where(eq(users.role, "handyman"));
    const customers = await db
      .select()
      .from(users)
      .where(eq(users.role, "customer"));

    if (handymen.length === 0) {
      console.log("❌ No handymen found. Run the main seed script first.");
      return;
    }

    // Add services for each handyman
    for (const handyman of handymen) {
      console.log(`Adding services for ${handyman.name}...`);

      interface Service {
        name: string;
        description: string;
        price: string;
      }

      let services: Service[] = [];

      // Different services based on handyman
      if (handyman.name.includes("Mike Rodriguez")) {
        services = [
          {
            name: "Plumbing Repairs",
            description: "Fix leaks, clogs, and pipe issues",
            price: "75.00",
          },
          {
            name: "Emergency Plumbing",
            description: "24/7 emergency plumbing services",
            price: "120.00",
          },
        ];
      } else if (handyman.name.includes("Sarah Chen")) {
        services = [
          {
            name: "Interior Painting",
            description: "Professional interior wall painting",
            price: "65.00",
          },
          {
            name: "Color Consultation",
            description: "Help choose perfect colors",
            price: "50.00",
          },
        ];
      } else if (handyman.name.includes("Carlos Martinez")) {
        services = [
          {
            name: "Electrical Repairs",
            description: "Outlet, switch, and wiring repairs",
            price: "85.00",
          },
          {
            name: "Lighting Installation",
            description: "Install fixtures and ceiling fans",
            price: "100.00",
          },
        ];
      } else if (handyman.name.includes("Amanda Johnson")) {
        services = [
          {
            name: "Furniture Assembly",
            description: "IKEA and other furniture assembly",
            price: "55.00",
          },
          {
            name: "TV Mounting",
            description: "Wall mount TVs safely",
            price: "80.00",
          },
        ];
      } else if (handyman.name.includes("David Kim")) {
        services = [
          {
            name: "Kitchen Remodeling",
            description: "Complete kitchen renovation",
            price: "90.00",
          },
          {
            name: "Custom Carpentry",
            description: "Built-in cabinets and woodwork",
            price: "95.00",
          },
        ];
      } else if (handyman.name.includes("Lisa Thompson")) {
        services = [
          {
            name: "Home Maintenance",
            description: "Regular upkeep and seasonal prep",
            price: "60.00",
          },
          {
            name: "Pressure Washing",
            description: "Exterior cleaning services",
            price: "80.00",
          },
        ];
      }

      // Insert services
      for (const service of services) {
        await db.insert(handymanServices).values({
          handymanId: handyman.id,
          serviceName: service.name,
          description: service.description,
          basePrice: service.price,
        });
      }
    }

    // Add sample reviews
    if (customers.length > 0) {
      console.log("⭐ Adding sample reviews...");

      const sampleReviews = [
        {
          handymanName: "Mike Rodriguez",
          rating: 5,
          comment:
            "Fixed our kitchen sink leak quickly and professionally. Highly recommend!",
          serviceType: "Plumbing Repairs",
        },
        {
          handymanName: "Mike Rodriguez",
          rating: 5,
          comment:
            "Emergency call - came right over and fixed our burst pipe. Lifesaver!",
          serviceType: "Emergency Plumbing",
        },
        {
          handymanName: "Sarah Chen",
          rating: 4,
          comment:
            "Great paint job on our living room. Very neat and professional work.",
          serviceType: "Interior Painting",
        },
        {
          handymanName: "Sarah Chen",
          rating: 5,
          comment:
            "Sarah helped us pick perfect colors and the results are amazing!",
          serviceType: "Color Consultation",
        },
        {
          handymanName: "Carlos Martinez",
          rating: 5,
          comment:
            "Carlos installed our new ceiling fan perfectly. Very knowledgeable electrician.",
          serviceType: "Lighting Installation",
        },
        {
          handymanName: "Amanda Johnson",
          rating: 5,
          comment:
            "Assembled our entire IKEA bedroom set in just 2 hours. Amazing!",
          serviceType: "Furniture Assembly",
        },
        {
          handymanName: "David Kim",
          rating: 5,
          comment:
            "David built us custom shelves that fit perfectly. Great craftsmanship.",
          serviceType: "Custom Carpentry",
        },
        {
          handymanName: "Lisa Thompson",
          rating: 4,
          comment:
            "Thorough home maintenance service. Very reliable and professional.",
          serviceType: "Home Maintenance",
        },
      ];

      for (const review of sampleReviews) {
        const handyman = handymen.find((h) =>
          h.name.includes(review.handymanName)
        );
        const customer =
          customers[Math.floor(Math.random() * customers.length)];

        if (handyman && customer) {
          await db.insert(reviews).values({
            customerId: customer.id,
            handymanId: handyman.id,
            rating: review.rating,
            comment: review.comment,
            serviceType: review.serviceType,
          });
        }
      }
    }

    console.log("🎉 Services and reviews added successfully!");
    console.log("📊 Summary:");
    console.log(`   • Added services for ${handymen.length} handymen`);
    console.log(`   • Added sample reviews`);
    console.log("");
    console.log("✅ Your handyman profiles should now show real data!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  }
}

seedServicesAndReviews();
