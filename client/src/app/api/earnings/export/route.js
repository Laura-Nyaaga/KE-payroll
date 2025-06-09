// app/api/payroll/earnings/export/route.js
import { NextResponse } from 'next/server';
import { EarningService } from '@/services/earningService';

export async function GET() {
  try {
    // Get CSV blob from service
    const csvBlob = await EarningService.exportEarnings();
    
    // Convert blob to buffer for Next.js response
    const arrayBuffer = await csvBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Return CSV as a blob
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=earnings.csv'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/payroll/earnings/export:', error);
    return NextResponse.json(
      { error: 'Failed to export earnings' },
      { status: 500 }
    );
  }
}