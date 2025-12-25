import { NextRequest, NextResponse } from 'next/server';
import { getServiceNumbers } from '@/lib/services/service-number-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      accountId: searchParams.get('accountId') || undefined,
      serviceNumber: searchParams.get('serviceNumber') || undefined,
      packageName: searchParams.get('packageName') || undefined,
      divisionName: searchParams.get('divisionName') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true :
                searchParams.get('isActive') === 'false' ? false : undefined,
    };

    const serviceNumbers = await getServiceNumbers(filters);

    return NextResponse.json({
      success: true,
      data: serviceNumbers,
    });
  } catch (error: any) {
    console.error('Error fetching service numbers:', error);
    return NextResponse.json(
      { error: `Failed to fetch service numbers: ${error.message}` },
      { status: 500 }
    );
  }
}
