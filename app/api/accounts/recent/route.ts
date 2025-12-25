import { NextRequest, NextResponse } from 'next/server';
import { getRecentlyAddedAccounts } from '@/lib/services/account-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);

    const accounts = await getRecentlyAddedAccounts(hours);

    return NextResponse.json({
      success: true,
      data: accounts,
      count: accounts.length,
    });
  } catch (error: any) {
    console.error('Get recent accounts error:', error);
    return NextResponse.json(
      { error: `Failed to fetch recent accounts: ${error.message}` },
      { status: 500 }
    );
  }
}



