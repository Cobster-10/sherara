import { NextResponse } from 'next/server';
import { agents } from '@/lib/fixtures';

export function GET() { return NextResponse.json({ agents }); }
