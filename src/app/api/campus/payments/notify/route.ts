import { NextResponse } from 'next/server'
import { handleCampusPaymentNotify } from '@/lib/actions/campus'

function toRecord(entries: Iterable<[string, string]>) {
  return Object.fromEntries(Array.from(entries).map(([key, value]) => [key, value])) as Record<string, string>
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    await handleCampusPaymentNotify(toRecord(searchParams.entries()))
    return new NextResponse('success', { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'notify failed'
    return new NextResponse(message, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const params = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]))
    await handleCampusPaymentNotify(params)
    return new NextResponse('success', { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'notify failed'
    return new NextResponse(message, { status: 400 })
  }
}
