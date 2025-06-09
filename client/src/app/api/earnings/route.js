// app/api/payroll/earnings/route.js
import { NextResponse } from 'next/server';
import { EarningService } from '@/services/earningService';

// GET handler for fetching all earnings
export async function GET() {
  try {
    const earnings = await EarningService.getAllEarnings();
    return NextResponse.json(earnings);
  } catch (error) {
    console.error('Error in GET /api/payroll/earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}

// POST handler for adding a new earning
export async function POST(request) {
  try {
    const newEarning = await request.json();
    
    // Validate required fields
    if (!newEarning.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    const createdEarning = await EarningService.createEarning(newEarning);
    return NextResponse.json(createdEarning, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/payroll/earnings:', error);
    return NextResponse.json(
      { error: 'Failed to create earning' },
      { status: 500 }
    );
  }
}

// PUT handler for updating earnings
export async function PUT(request) {
  try {
    const updatedEarnings = await request.json();
    
    // Validate the array
    if (!Array.isArray(updatedEarnings)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected an array of earnings.' },
        { status: 400 }
      );
    }
    
    await EarningService.updateEarnings(updatedEarnings);
    return NextResponse.json({ message: 'Earnings updated successfully' });
  } catch (error) {
    console.error('Error in PUT /api/payroll/earnings:', error);
    return NextResponse.json(
      { error: 'Failed to update earnings' },
      { status: 500 }
    );
  }
}

// DELETE handler for removing an earning
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Earning ID is required' },
        { status: 400 }
      );
    }
    
    await EarningService.deleteEarning(id);
    return NextResponse.json({ message: 'Earning deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/payroll/earnings:', error);
    return NextResponse.json(
      { error: 'Failed to delete earning' },
      { status: 500 }
    );
  }
}