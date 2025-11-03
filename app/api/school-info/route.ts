import { NextRequest, NextResponse } from 'next/server';
import { getSchoolInfoPublic } from '@/lib/actions/admin/school-info';

export async function GET() {
  try {
    const result = await getSchoolInfoPublic();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch school info' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('School info API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}