// app/api/payroll/allowances/route.js
import { NextResponse } from 'next/server';
import { AllowanceService } from '@/services/allowanceService';
import api, { BASE_URL } from '../../../config/api';


// GET handler for fetching all allowances
export async function GET() {
  try {
    const allowances = await AllowanceService.getAllAllowances();
    return NextResponse.json(allowances);
  } catch (error) {
    console.error('Error in GET /api/payroll/allowances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allowances' },
      { status: 500 }
    );
  }
}

// POST handler for adding a new allowance
export async function POST(request) {
  try {
    const newAllowance = await request.json();
    
    // Validate required fields
    if (!newAllowance.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    const createdAllowance = await AllowanceService.createAllowance(newAllowance);
    return NextResponse.json(createdAllowance, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/payroll/allowances:', error);
    return NextResponse.json(
      { error: 'Failed to create allowance' },
      { status: 500 }
    );
  }
}

// PUT handler for updating allowances
export async function PUT(request) {
  try {
    const updatedAllowances = await request.json();
    
    // Validate the array
    if (!Array.isArray(updatedAllowances)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected an array of allowances.' },
        { status: 400 }
      );
    }
    
    await AllowanceService.updateAllowances(updatedAllowances);
    return NextResponse.json({ message: 'Allowances updated successfully' });
  } catch (error) {
    console.error('Error in PUT /api/payroll/allowances:', error);
    return NextResponse.json(
      { error: 'Failed to update allowances' },
      { status: 500 }
    );
  }
}

// DELETE handler for removing an allowance
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Allowance ID is required' },
        { status: 400 }
      );
    }
    
    await AllowanceService.deleteAllowance(id);
    return NextResponse.json({ message: 'Allowance deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/payroll/allowances:', error);
    return NextResponse.json(
      { error: 'Failed to delete allowance' },
      { status: 500 }
    );
  }
}