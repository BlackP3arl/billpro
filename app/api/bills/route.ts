import { NextRequest, NextResponse } from 'next/server';
import {
  getAllBills,
  getBillsSummary,
  getBillById,
  updateBill,
  deleteBill,
  verifyBill,
} from '@/lib/services/bill-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const summary = searchParams.get('summary') === 'true';

    const bills = summary ? await getBillsSummary() : await getAllBills();

    return NextResponse.json({
      success: true,
      data: bills,
    });
  } catch (error: any) {
    console.error('Get bills error:', error);
    return NextResponse.json(
      { error: `Failed to fetch bills: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Bill ID is required' },
        { status: 400 }
      );
    }

    const bill = await updateBill(id, data);

    return NextResponse.json({
      success: true,
      data: bill,
    });
  } catch (error: any) {
    console.error('Update bill error:', error);
    return NextResponse.json(
      { error: `Failed to update bill: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Bill ID is required' },
        { status: 400 }
      );
    }

    await deleteBill(id);

    return NextResponse.json({
      success: true,
      message: 'Bill deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete bill error:', error);
    return NextResponse.json(
      { error: `Failed to delete bill: ${error.message}` },
      { status: 500 }
    );
  }
}
