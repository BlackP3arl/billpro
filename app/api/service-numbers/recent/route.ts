import { NextRequest, NextResponse } from 'next/server';
import { getRecentlyAddedServiceNumbers } from '@/lib/services/service-number-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);

    const serviceNumbers = await getRecentlyAddedServiceNumbers(hours);

    return NextResponse.json({
      success: true,
      data: serviceNumbers,
      count: serviceNumbers.length,
    });
  } catch (error: any) {
    console.error('Get recent service numbers error:', error);
    return NextResponse.json(
      { error: `Failed to fetch recent service numbers: ${error.message}` },
      { status: 500 }
    );
  }
}



