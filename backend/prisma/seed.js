const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ticketevent.com' },
    update: {},
    create: {
      email: 'admin@ticketevent.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      phone: '+1234567890'
    }
  });

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@ticketevent.com' },
    update: {},
    create: {
      email: 'user@ticketevent.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      phone: '+1987654321'
    }
  });

  // Create venues
  const venues = await Promise.all([
    prisma.venue.upsert({
      where: { name: 'Madison Square Garden' },
      update: {},
      create: {
        name: 'Madison Square Garden',
        address: '4 Pennsylvania Plaza',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        capacity: 20789,
        description: 'The world\'s most famous arena',
        image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800'
      }
    }),
    prisma.venue.upsert({
      where: { name: 'Staples Center' },
      update: {},
      create: {
        name: 'Staples Center',
        address: '1111 S Figueroa St',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90015',
        country: 'USA',
        capacity: 19068,
        description: 'Home of the Lakers and Clippers',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
      }
    }),
    prisma.venue.upsert({
      where: { name: 'O2 Arena' },
      update: {},
      create: {
        name: 'O2 Arena',
        address: 'Peninsula Square',
        city: 'London',
        state: 'England',
        zipCode: 'SE10 0DX',
        country: 'UK',
        capacity: 20000,
        description: 'The world\'s busiest music venue',
        image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'
      }
    })
  ]);

  // Create seats for each venue
  for (const venue of venues) {
    const sections = ['A', 'B', 'C', 'D', 'E'];
    const rows = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    
    for (const section of sections) {
      for (const row of rows) {
        for (let seatNumber = 1; seatNumber <= 20; seatNumber++) {
          const price = section === 'A' ? 150.00 : 
                       section === 'B' ? 120.00 :
                       section === 'C' ? 100.00 :
                       section === 'D' ? 80.00 : 60.00;
          
          await prisma.seat.upsert({
            where: {
              row_number_section_venueId: {
                row,
                number: seatNumber,
                section,
                venueId: venue.id
              }
            },
            update: {},
            create: {
              row,
              number: seatNumber,
              section,
              price,
              venueId: venue.id
            }
          });
        }
      }
    }
  }

  // Create events
  const events = await Promise.all([
    prisma.event.upsert({
      where: { title: 'Taylor Swift - The Eras Tour' },
      update: {},
      create: {
        title: 'Taylor Swift - The Eras Tour',
        description: 'Experience the magic of Taylor Swift\'s greatest hits across all eras in this spectacular concert.',
        date: new Date('2024-06-15T20:00:00Z'),
        duration: 180,
        price: 150.00,
        category: 'Concert',
        venueId: venues[0].id, // Madison Square Garden
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'
      }
    }),
    prisma.event.upsert({
      where: { title: 'NBA Finals Game 7' },
      update: {},
      create: {
        title: 'NBA Finals Game 7',
        description: 'The ultimate showdown in basketball. Lakers vs Celtics in the championship game.',
        date: new Date('2024-06-20T19:30:00Z'),
        duration: 150,
        price: 200.00,
        category: 'Sports',
        venueId: venues[1].id, // Staples Center
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800'
      }
    }),
    prisma.event.upsert({
      where: { title: 'Ed Sheeran - Mathematics Tour' },
      update: {},
      create: {
        title: 'Ed Sheeran - Mathematics Tour',
        description: 'Join Ed Sheeran for an intimate evening of acoustic magic and chart-topping hits.',
        date: new Date('2024-07-10T19:00:00Z'),
        duration: 120,
        price: 100.00,
        category: 'Concert',
        venueId: venues[2].id, // O2 Arena
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'
      }
    }),
    prisma.event.upsert({
      where: { title: 'Hamilton - The Musical' },
      update: {},
      create: {
        title: 'Hamilton - The Musical',
        description: 'The revolutionary story of America\'s founding fathers told through hip-hop and R&B.',
        date: new Date('2024-08-05T20:00:00Z'),
        duration: 160,
        price: 180.00,
        category: 'Theater',
        venueId: venues[0].id, // Madison Square Garden
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'
      }
    }),
    prisma.event.upsert({
      where: { title: 'UFC 300: Championship Night' },
      update: {},
      create: {
        title: 'UFC 300: Championship Night',
        description: 'Witness the biggest night in UFC history with multiple championship fights.',
        date: new Date('2024-09-15T18:00:00Z'),
        duration: 240,
        price: 250.00,
        category: 'Sports',
        venueId: venues[1].id, // Staples Center
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800'
      }
    })
  ]);

  // Create some sample bookings
  const sampleSeats = await prisma.seat.findMany({
    where: { venueId: venues[0].id },
    take: 5
  });

  for (let i = 0; i < 3; i++) {
    await prisma.booking.upsert({
      where: { id: `sample-booking-${i + 1}` },
      update: {},
      create: {
        id: `sample-booking-${i + 1}`,
        userId: user.id,
        eventId: events[0].id, // Taylor Swift concert
        seatId: sampleSeats[i].id,
        status: 'CONFIRMED',
        totalPrice: sampleSeats[i].price
      }
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Created users: ${admin.email}, ${user.email}`);
  console.log(`🏟️ Created venues: ${venues.length}`);
  console.log(`🎭 Created events: ${events.length}`);
  console.log(`💺 Created seats: ${venues.length * 5 * 10 * 20}`);
  console.log(`🎫 Created sample bookings: 3`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 