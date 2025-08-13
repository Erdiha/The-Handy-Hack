// scripts/seed-handymen.ts
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local properly
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, handymanProfiles, neighborhoods } from '../src/lib/schema';
import bcrypt from 'bcryptjs';

// Initialize DB connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const SEED_DATA = {
  neighborhoods: [
    { name: 'Highland Park', slug: 'highland-park', city: 'Los Angeles', state: 'CA' },
    { name: 'Eagle Rock', slug: 'eagle-rock', city: 'Los Angeles', state: 'CA' },
    { name: 'Silverlake', slug: 'silverlake', city: 'Los Angeles', state: 'CA' },
  ],

  handymen: [
    {
      name: 'Mike Rodriguez',
      email: 'mike.rodriguez@email.com',
      phone: '(323) 555-0123',
      bio: 'Local plumber with 8+ years experience. Specializing in kitchen and bathroom repairs, leak detection, and emergency fixes. Available weekends!',
      hourlyRate: '75.00',
      neighborhood: 'Highland Park',
      isVerified: true
    },
    {
      name: 'Sarah Chen',
      email: 'sarah.chen@email.com', 
      phone: '(323) 555-0124',
      bio: 'Professional painter and decorator. Expert in interior/exterior painting, color consultation, and drywall repair. Eco-friendly materials available.',
      hourlyRate: '65.00',
      neighborhood: 'Highland Park',
      isVerified: true
    },
    {
      name: 'Carlos Martinez',
      email: 'carlos.martinez@email.com',
      phone: '(323) 555-0125', 
      bio: 'Experienced electrician serving Highland Park for 10+ years. Licensed for all electrical work including panel upgrades, outlet installation, and lighting.',
      hourlyRate: '85.00',
      neighborhood: 'Highland Park',
      isVerified: true
    },
    {
      name: 'Amanda Johnson',
      email: 'amanda.j@email.com',
      phone: '(323) 555-0126',
      bio: 'Furniture assembly specialist and handywoman. IKEA certified, tool-equipped, and great with complex builds. Same-day service available.',
      hourlyRate: '55.00', 
      neighborhood: 'Eagle Rock',
      isVerified: false
    },
    {
      name: 'David Kim',
      email: 'david.kim@email.com',
      phone: '(323) 555-0127',
      bio: 'General contractor and carpenter. Kitchen remodels, custom shelving, door installation, and home repairs. Licensed and insured.',
      hourlyRate: '90.00',
      neighborhood: 'Silverlake', 
      isVerified: true
    },
    {
      name: 'Lisa Thompson',
      email: 'lisa.t@email.com',
      phone: '(323) 555-0128',
      bio: 'Home maintenance expert specializing in seasonal prep, gutter cleaning, pressure washing, and general upkeep. Reliable and thorough.',
      hourlyRate: '60.00',
      neighborhood: 'Highland Park',
      isVerified: true
    }
  ]
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');

    // 1. Check/Insert neighborhoods
    console.log('📍 Checking neighborhoods...');
    let allNeighborhoods = await db.select().from(neighborhoods);
    
    if (allNeighborhoods.length === 0) {
      console.log('📍 Adding neighborhoods...');
      allNeighborhoods = await db.insert(neighborhoods)
        .values(SEED_DATA.neighborhoods)
        .returning();
    } else {
      console.log(`✅ Found ${allNeighborhoods.length} existing neighborhoods`);
    }

    // 2. Create neighborhood lookup
    const neighborhoodMap = new Map();
    allNeighborhoods.forEach(n => {
      neighborhoodMap.set(n.name, n.id);
    });

    // 3. Insert handymen users and profiles
    console.log('👨‍🔧 Adding handymen...');
    
    for (const handyman of SEED_DATA.handymen) {
      // Create user account
      const hashedPassword = await bcrypt.hash('demo123', 12);
      
      const [newUser] = await db.insert(users).values({
        name: handyman.name,
        email: handyman.email,
        phone: handyman.phone,
        password: hashedPassword,
        role: 'handyman'
      }).returning();

      // Create handyman profile
      const neighborhoodId = neighborhoodMap.get(handyman.neighborhood);
      
      await db.insert(handymanProfiles).values({
        userId: newUser.id,
        bio: handyman.bio,
        hourlyRate: handyman.hourlyRate,
        isVerified: handyman.isVerified,
        neighborhoodId: neighborhoodId
      });

      console.log(`✅ Added ${handyman.name} in ${handyman.neighborhood}`);
    }

    console.log('🎉 Database seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   • ${allNeighborhoods.length} neighborhoods (existing)`);
    console.log(`   • ${SEED_DATA.handymen.length} handymen (new)`);
    console.log('');
    console.log('🔑 All handymen passwords: demo123');
    console.log('');
    console.log('🚀 Your search page should now show real results!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
  }
}

// Run the seed
seedDatabase();