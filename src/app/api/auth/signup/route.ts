import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role,
    }).returning();

    return NextResponse.json(
      { message: 'User created successfully', user: newUser[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error details:', error); // ADD THIS LINE
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}