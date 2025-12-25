import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    // Get total accounts count
    const accountsResult = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM service_accounts'
    );
    const totalAccounts = parseInt(accountsResult.rows[0].count.toString());

    // Get total service numbers count
    const serviceNumbersResult = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM service_numbers'
    );
    const totalServiceNumbers = parseInt(serviceNumbersResult.rows[0].count.toString());

    return NextResponse.json({
      success: true,
      data: {
        totalAccounts,
        totalServiceNumbers,
      },
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: `Failed to fetch stats: ${error.message}` },
      { status: 500 }
    );
  }
}



