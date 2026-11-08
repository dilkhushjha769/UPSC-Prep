import { ApiValidationError, submitDailyQuizAttempt } from '@/services/currentAffairsApi';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result = await submitDailyQuizAttempt({
      date: body?.date,
      answers: body?.answers || {},
    });
    return Response.json(result, { status: 200 });
  } catch (err: any) {
    if (err instanceof ApiValidationError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

