import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAlerts,
  getActiveAlerts,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert,
} from '@/lib/services/alert-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const alerts = activeOnly ? await getActiveAlerts() : await getAllAlerts();

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error: any) {
    console.error('Get alerts error:', error);
    return NextResponse.json(
      { error: `Failed to fetch alerts: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, action, acknowledgedBy, resolvedBy, resolutionNotes } =
      await request.json();

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Alert ID and action are required' },
        { status: 400 }
      );
    }

    let alert;

    switch (action) {
      case 'acknowledge':
        alert = await acknowledgeAlert(id, acknowledgedBy);
        break;
      case 'resolve':
        alert = await resolveAlert(id, resolvedBy, resolutionNotes);
        break;
      case 'dismiss':
        alert = await dismissAlert(id);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: alert,
    });
  } catch (error: any) {
    console.error('Update alert error:', error);
    return NextResponse.json(
      { error: `Failed to update alert: ${error.message}` },
      { status: 500 }
    );
  }
}
