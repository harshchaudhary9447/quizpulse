import { successResponse } from '@/server/auth';

export async function POST() {
  return successResponse({ message: 'Successfully logged out' }, 200);
}
