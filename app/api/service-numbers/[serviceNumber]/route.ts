import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyChargesForServiceNumber, getTotalChargesForServiceNumber } from '@/lib/services/monthly-charge-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { serviceNumber: string } }
) {
  try {
    const serviceNumber = params.serviceNumber;

    // Get monthly charge history
    const monthlyCharges = await getMonthlyChargesForServiceNumber(serviceNumber);

    // Get totals
    const totals = await getTotalChargesForServiceNumber(serviceNumber);

    return NextResponse.json({
      success: true,
      data: {
        serviceNumber,
        monthlyCharges,
        totals,
      },
    });
  } catch (error: any) {
    console.error('Error fetching service number details:', error);
    return NextResponse.json(
      { error: `Failed to fetch service number details: ${error.message}` },
      { status: 500 }
    );
  }
}
