// app/api/payroll/deductions/route.js
import { NextResponse } from 'next/server';
import { DeductionService } from '@/app/services/deductionService';



// Handler for fetching all deductions
export async function GET() {
  try {
    const deductions = await DeductionService.getAllDeductions();
    return NextResponse.json(deductions);
    const safeDeductions = Array.isArray(deductions) ? deductions : [];

  } catch (error) {
    console.error('Error in GET ${BASE_URL}/deductions:', error);
    return NextResponse.json(
      {deductions: safeDeductions},
      { error: 'Failed to fetch deductions' },
      { status: 500 }
    );
  }
}

// Handler for adding a new deduction
export async function POST(request) {
  try {
    const newDeduction = await request.json();
    
    // Validate required fields
    if (!newDeduction.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    const createdDeduction = await DeductionService.createDeduction(newDeduction);
    return NextResponse.json(createdDeduction, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/payroll/deductions:', error);
    return NextResponse.json(
      { error: 'Failed to create deduction' },
      { status: 500 }
    );
  }
}

// Handler for updating deductions

export async function PATCH(request) {
  try {
    const updatedDeductions = await request.json();
    
    // Validate that it's an array
    if (!Array.isArray(updatedDeductions)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected an array of deductions.' },
        { status: 400 }
      );
    }

    // Additional validation: Ensure each deduction has the required properties
    for (const deduction of updatedDeductions) {
      if (!deduction.id || !deduction.deductionType || !deduction.status || !deduction.amount) {
        return NextResponse.json(
          { error: `Invalid deduction data: Missing required fields for deduction with ID ${deduction.id}` },
          { status: 400 }
        );
      }
    }

    // If validation passes, update deductions
    await DeductionService.updateDeductions(updatedDeductions);
    return NextResponse.json({ message: 'Deductions updated successfully' });
  } catch (error) {
    console.error('Error in PUT /api/payroll/deductions:', error);
    return NextResponse.json(
      { error: 'Failed to update deductions' },
      { status: 500 }
    );
  }
}

// Handler for deleting a deduction
// export async function DELETE(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const id = searchParams.get('id');
    
//     if (!id) {
//       return NextResponse.json(
//         { error: 'Deduction ID is required' },
//         { status: 400 }
//       );
//     }
    
//     await DeductionService.deleteDeduction(id);
//     return NextResponse.json({ message: 'Deduction deleted successfully' });
//   } catch (error) {
//     console.error('Error in DELETE /api/payroll/deductions:', error);
//     return NextResponse.json(
//       { error: 'Failed to delete deduction' },
//       { status: 500 }
//     );
//   }
// }