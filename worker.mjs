export default { async fetch(request, env) {
 const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
 if (request.method === 'OPTIONS') return new Response(null, { headers });
 if (request.method !== 'POST') return Response.json({ error: 'POST required' }, { status: 405, headers });
 if (!env.ACCESS_TOKEN || request.headers.get('Authorization') !== 'Bearer ' + env.ACCESS_TOKEN) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
 if (!env.GEMINI_API_KEY) return Response.json({ error: 'Gemini key is not configured' }, { status: 503, headers });
 try {
  const data = await request.json();
  const prompt = 'Türkçe mutfak asistanısın. İlk yanıtta webde tarif ara ve yalnızca ilk adımı anlat. Sonraki turlarda soruları yanıtla, yalnızca açıkça görülen hataları söyle, belirsizse sor. Görüntüden miktar veya güvenli pişirme sıcaklığı tahmin etme. Yeni bilgi yoksa sadece BEKLE yaz. Tarif: ' + String(data.dish || '').slice(0,300) + ' Önceki adımlar: ' + JSON.stringify(data.history || []).slice(0,3000);
  const parts = [{ text: prompt }];
  if (data.image) parts.push({ inline_data: { mime_type: 'image/jpeg', data: data.image } });
  if (data.audio && data.mime) parts.push({ inline_data: { mime_type: data.mime, data: data.audio } });
  const model = env.GEMINI_MODEL || 'gemini-2.0-flash';
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', { method: 'POST', headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }], tools: (data.history || []).length ? [] : [{ google_search: {} }] }) });
  const result = await response.json();
  if (!response.ok) return Response.json({ error: result.error?.message || 'Gemini request failed' }, { status: 502, headers });
  const candidate = result.candidates?.[0];
  const text = candidate?.content?.parts?.map(part => part.text || '').join('') || 'BEKLE';
  const sources = (candidate?.groundingMetadata?.groundingChunks || []).map(chunk => chunk.web?.uri).filter(Boolean);
  return Response.json({ text, sources }, { headers });
 } catch (error) { return Response.json({ error: String(error) }, { status: 400, headers }); }
} };
