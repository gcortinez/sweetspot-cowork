import { NextRequest, NextResponse } from 'next/server'
import { updateServiceAction, deleteServiceAction, getServiceAction } from '@/lib/actions/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await getServiceAction({ id })
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: result.error || 'Service not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json()
    const { id } = await params
    
    const result = await updateServiceAction({
      id,
      ...data
    })
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to update service',
          fieldErrors: result.fieldErrors 
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await deleteServiceAction({ id })
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to delete service' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}