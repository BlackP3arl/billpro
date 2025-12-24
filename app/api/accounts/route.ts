import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAccounts,
  getAccountsWithStats,
  createAccount,
  updateAccount,
  deleteAccount,
} from '@/lib/services/account-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const withStats = searchParams.get('stats') === 'true';

    const accounts = withStats
      ? await getAccountsWithStats()
      : await getAllAccounts();

    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error: any) {
    console.error('Get accounts error:', error);
    return NextResponse.json(
      { error: `Failed to fetch accounts: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.account_number || !data.account_name) {
      return NextResponse.json(
        { error: 'Account number and name are required' },
        { status: 400 }
      );
    }

    const account = await createAccount(data);

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    console.error('Create account error:', error);
    return NextResponse.json(
      { error: `Failed to create account: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const account = await updateAccount(id, data);

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    console.error('Update account error:', error);
    return NextResponse.json(
      { error: `Failed to update account: ${error.message}` },
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
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    await deleteAccount(id);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: `Failed to delete account: ${error.message}` },
      { status: 500 }
    );
  }
}
