import { ApiValidationError, getSourceFilterOptions } from '@/services/currentAffairsApi';

export async function GET(): Promise<Response> {
  try {
    const data = await getSourceFilterOptions();
    return Response.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (err: any) {
    if (err instanceof ApiValidationError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

