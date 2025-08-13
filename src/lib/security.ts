// src/lib/security.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'handyman';
  };
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async function(request: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    (request as AuthenticatedRequest).user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as 'customer' | 'handyman'
    };

    return handler(request as AuthenticatedRequest);
  };
}