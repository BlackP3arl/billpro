import { NextRequest, NextResponse } from 'next/server';
import {
  getBillById,
  getLineItemsForBill,
  compareBills,
  linkBillToAccount,
} from '@/lib/services/bill-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const includeLineItems = searchParams.get('includeLineItems') === 'true';
    const compare = searchParams.get('compare') === 'true';

    const bill = await getBillById(id);

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    let lineItems = null;
    let comparison = null;

    if (includeLineItems) {
      lineItems = await getLineItemsForBill(id);
    }

    if (compare) {
      comparison = await compareBills(id);
    }

    return NextResponse.json({
      success: true,
      data: {
        bill,
        lineItems,
        comparison,
      },
    });
  } catch (error: any) {
    console.error('Get bill error:', error);
    return NextResponse.json(
      { error: `Failed to fetch bill: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { action, accountId } = await request.json();

    if (action === 'linkAccount') {
      if (!accountId) {
        return NextResponse.json(
          { error: 'Account ID is required' },
          { status: 400 }
        );
      }

      const bill = await linkBillToAccount(id, accountId);

      return NextResponse.json({
        success: true,
        data: bill,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Bill action error:', error);
    return NextResponse.json(
      { error: `Action failed: ${error.message}` },
      { status: 500 }
    );
  }
}
