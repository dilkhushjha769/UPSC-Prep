import {
  ApiValidationError,
  getUserStudyProgress,
  updateUserStudyProgress,
} from '@/services/currentAffairsApi';

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');
    const data = await getUserStudyProgress(dateParam);
    return Response.json(data, { status: 200 });
  } catch (err: any) {
    if (err instanceof ApiValidationError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const body = await request.json();
    const dateParam = body?.date || url.searchParams.get('date');
    const data = await updateUserStudyProgress(dateParam, body || {});
    return Response.json(data, { status: 200 });
  } catch (err: any) {
    if (err instanceof ApiValidationError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

