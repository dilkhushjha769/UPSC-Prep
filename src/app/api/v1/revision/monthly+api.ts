import { ApiValidationError, getMonthlyRevision } from '@/services/currentAffairsApi';

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const monthParam = url.searchParams.get('month');
    const data = await getMonthlyRevision(monthParam);
    return Response.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (err: any) {
    if (err instanceof ApiValidationError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

