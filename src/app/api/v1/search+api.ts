import { ApiValidationError, searchCurrentAffairsStories } from '@/services/currentAffairsApi';

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const data = await searchCurrentAffairsStories(q);
    return Response.json(data, { status: 200 });
  } catch (err: any) {
    if (err instanceof ApiValidationError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

