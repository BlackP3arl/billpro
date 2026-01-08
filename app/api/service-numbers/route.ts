import { NextRequest, NextResponse } from 'next/server';
import { getServiceNumbers, updateServiceNumber } from '@/lib/services/service-number-service';

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('PUT request body:', body);
    const { id, package_name, division_name, is_active, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Service number ID is required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (package_name !== undefined) updates.package_name = package_name || null;
    if (division_name !== undefined) updates.division_name = division_name || null;
    if (is_active !== undefined) updates.is_active = is_active;
    if (notes !== undefined) updates.notes = notes || null;

    console.log('Updates to apply:', updates);

    const updatedServiceNumber = await updateServiceNumber(id, updates);

    console.log('Updated service number:', updatedServiceNumber);

    return NextResponse.json({
      success: true,
      data: updatedServiceNumber,
    });
  } catch (error: any) {
    console.error('Error updating service number:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: `Failed to update service number: ${error.message}` },
      { status: 500 }
    );
  }
}
