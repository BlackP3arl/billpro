import { NextRequest, NextResponse } from 'next/server';
import { getServiceNumberMonthlyTotals } from '@/lib/services/monthly-charge-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { serviceNumber: string } }
) {
  try {
    const { serviceNumber } = params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10);

    const monthlyTotals = await getServiceNumberMonthlyTotals(serviceNumber, year);

    return NextResponse.json({
      success: true,
      data: monthlyTotals,
    });
  } catch (error: any) {
    console.error('Get monthly totals error:', error);
    return NextResponse.json(
      { error: `Failed to fetch monthly totals: ${error.message}` },
      { status: 500 }
    );
  }
}

