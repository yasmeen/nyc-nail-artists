export async function onRequest({ next }) {
  const response = await next();
  const contentType = response.headers.get('content-type') || '';
  if (response.status === 200 && !/application\/json\b/i.test(contentType)) {
    return new Response(null, { status: 404 });
  }
  return response;
}
