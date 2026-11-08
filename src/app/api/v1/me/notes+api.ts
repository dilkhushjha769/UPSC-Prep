import {
  ApiValidationError,
  deleteUserNote,
  getUserNotes,
  saveUserNote,
} from '@/services/currentAffairsApi';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const storyId = url.searchParams.get('story_id') || undefined;
  const notes = await getUserNotes(storyId);
  return Response.json({ notes }, { status: 200 });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const notes = await saveUserNote({
      id: body?.id,
      story_id: body?.story_id,
      date_ist: body?.date_ist,
      title: String(body?.title || ''),
      content: String(body?.content || ''),
      gs_paper: body?.gs_paper,
      tags: body?.tags,
    });
    return Response.json({ notes }, { status: 200 });
  } catch (err: any) {
    if (err instanceof ApiValidationError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  const notes = await deleteUserNote(id);
  return Response.json({ notes }, { status: 200 });
}

