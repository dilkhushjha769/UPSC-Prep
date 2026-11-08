import { ApiValidationError, getModuleStories } from '@/services/currentAffairsApi';

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const moduleParam = url.searchParams.get('module') || 'daily-news';
    const sourceParam = url.searchParams.get('source') || 'all';
    const dateParam = url.searchParams.get('date') || undefined;
    const pageParam = Number(url.searchParams.get('page') || 1);
    const pageSizeParam = Number(url.searchParams.get('page_size') || 12);

    const data = await getModuleStories({
      module: moduleParam,
      source: sourceParam,
      date: dateParam,
      page: pageParam,
      pageSize: pageSizeParam,
    });

    return Response.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    if (err instanceof ApiValidationError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

