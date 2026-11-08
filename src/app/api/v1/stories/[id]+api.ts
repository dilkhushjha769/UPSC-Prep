import { ApiValidationError, getStoryById } from '@/services/currentAffairsApi';

export async function GET(_request: Request, { id }: { id: string }): Promise<Response> {
  try {
    const story = await getStoryById(id);
    if (!story) {
      return Response.json({ error: `Story "${id}" not found` }, { status: 404 });
    }
    return Response.json(story, {
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

