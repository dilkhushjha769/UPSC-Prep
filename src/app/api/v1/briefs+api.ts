import { ApiValidationError, getDailyBriefByDate } from '@/services/currentAffairsApi';

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');
    const data = await getDailyBriefByDate(dateParam);
    return Response.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    if (err instanceof ApiValidationError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

