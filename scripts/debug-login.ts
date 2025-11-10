import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

const prisma = new PrismaClient();

async function debugLogin() {
  try {
    console.log('=== DEBUG LOGIN ===\n');
    
    // Get all active users
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        fullName: true,
        isActive: true,
        deletedAt: true,
        passwordHash: true,
      },
    });

    console.log(`Found ${users.length} active users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} (${user.role})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Has Password Hash: ${!!user.passwordHash}`);
      console.log(`   Password Hash: ${user.passwordHash?.substring(0, 20)}...`);
      console.log('');
    });

    // Test password verification for admin
    const adminUser = users.find(u => u.role === 'ADMIN');
    if (adminUser) {
      console.log('\n=== TESTING PASSWORD VERIFICATION ===');
      console.log(`Testing for user: ${adminUser.email}`);
      
      // Test with common passwords
      const testPasswords = ['admin123', 'Admin123', 'password', 'admin'];
      
      for (const testPassword of testPasswords) {
        const isValid = await compare(testPassword, adminUser.passwordHash);
        console.log(`Password "${testPassword}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();
