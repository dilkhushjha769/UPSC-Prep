import {
  ApiValidationError,
  getUserBookmarks,
  toggleUserBookmark,
} from '@/services/currentAffairsApi';

export async function GET(): Promise<Response> {
  const bookmarks = await getUserBookmarks();
  return Response.json({ bookmarks }, { status: 200 });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const res = await toggleUserBookmark({
      story_id: String(body?.story_id || ''),
      headline: String(body?.headline || ''),
      gs_paper: String(body?.gs_paper || 'GS2'),
      topic: String(body?.topic || 'Polity & Governance'),
      source_name: String(body?.source_name || 'PIB'),
      source_url: String(body?.source_url || 'https://pib.gov.in'),
      date_ist: body?.date_ist,
    });
    return Response.json(res, { status: 200 });
  } catch (err: any) {
    if (err instanceof ApiValidationError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const storyId = url.searchParams.get('story_id') || '';
    const res = await toggleUserBookmark({
      story_id: storyId,
      headline: '',
      gs_paper: 'GS2',
      topic: '',
      source_name: '',
      source_url: '',
    });
    return Response.json(res, { status: 200 });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
