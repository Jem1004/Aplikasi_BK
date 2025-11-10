import { NextRequest, NextResponse } from 'next/server';
import { getSchoolInfoPublic, upsertSchoolInfo } from '@/lib/actions/admin/school-info';
import type { SchoolInfoFormData } from '@/lib/validations/school-info';

export async function GET() {
  try {
    const result = await getSchoolInfoPublic();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch school info' },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate that body contains required fields
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Extract form data
    const formData: SchoolInfoFormData = {
      name: body.name,
      address: body.address,
      phone: body.phone,
      email: body.email,
      website: body.website || '',
      principalName: body.principalName,
      principalNip: body.principalNip,
    };

    // Call server action
    const result = await upsertSchoolInfo(formData);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to update school info',
          errors: result.errors || null
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('School info POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Use POST handler for PUT as well (idempotent)
  return POST(request);
}