// app/api/payroll/deductions/export/route.js
import { NextResponse } from 'next/server';
import { DeductionService } from '@/services/deductionService';

export async function GET() {
  try {
    // Get CSV content from service
    const csvContent = await DeductionService.exportDeductions();
    
    // Return CSV as a blob
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=deductions.csv'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/payroll/deductions/export:', error);
    return NextResponse.json(
      { error: 'Failed to export deductions' },
      { status: 500 }
    );
  }
}