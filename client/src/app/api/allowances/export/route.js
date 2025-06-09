// app/api/payroll/allowances/export/route.js
import { NextResponse } from 'next/server';
import { AllowanceService } from '@/services/allowanceService';

export async function GET() {
  try {
    // Get CSV blob from service
    const csvBlob = await AllowanceService.exportAllowances();
    
    // Convert blob to buffer for Next.js response
    const arrayBuffer = await csvBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Return CSV as a blob
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=allowances.csv'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/payroll/allowances/export:', error);
    return NextResponse.json(
      { error: 'Failed to export allowances' },
      { status: 500 }
    );
  }
}