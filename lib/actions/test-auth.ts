'use server';

import { auth } from '@/lib/auth/auth';

/**
 * Test action to verify authentication is working
 */
export async function testAuth() {
  try {
    const session = await auth();
    return {
      success: true,
      session: session ? 'exists' : 'none',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}