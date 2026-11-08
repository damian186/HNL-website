const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function notificationPayload(request, id, createdAt) {
  const entries = [['Reference',id],['Received',createdAt],['Name',request.name],['Business',request.business],['Email',request.email],['Phone',request.phone || 'Not provided'],['Website or social page',request.website || 'Not provided'],['Service area',request.area],['Promotion',request.promotion],['Customer action',request.action || 'Not provided'],['Ad size',request.adSize],['Requested routes',request.requestedRoutes.join(', ') || 'Not selected'],['Notes',request.notes || 'None'],['Artwork',request.assets.length ? `${request.assets.length} attached file(s)` : 'Not provided'],['Consent','Customer agreed to contact about the sample and confirmed permission to share uploaded artwork.']];
  const text = entries.map(([key,value]) => `${key}: ${value}`).join('\n\n');
  return {from: process.env.HLN_NOTIFICATION_FROM || 'Houston Local Network <notifications@houstonlocalnetwork.com>', to:[process.env.HLN_NOTIFICATION_TO], reply_to:request.email, text, subject:`New HLN sample-ad request: ${request.business.replace(/[\r\n]/g,' ')}`,html:`<h1>New sample-ad request</h1><p>Reply using the customer's email listed below. This is a free sample request, not a paid booking or route reservation.</p><table>${entries.map(([key,value])=>`<tr><th style="text-align:left;vertical-align:top;padding:8px">${escape(key)}</th><td style="padding:8px;white-space:pre-wrap">${escape(value)}</td></tr>`).join('')}</table>`,attachments:request.assets.map((asset,i)=>({filename:`artwork-${i+1}.${asset.extension}`,content:Buffer.from(asset.bytes).toString('base64')}))};
}
export async function notifySampleRequest(request, id, createdAt, send = fetch) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !process.env.HLN_NOTIFICATION_TO) throw new Error('Notification delivery is not configured');
  const payload = notificationPayload(request,id,createdAt);
  // The key stays on the server. Each saved request has one stable delivery key.
  const response = await send('https://api.resend.com/emails', {method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','User-Agent':'HLN-Website/1.0','Idempotency-Key':`hln-sample/${id}`},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
  const result = await response.json().catch(()=>null);
  if (!response.ok || typeof result?.id !== 'string') {
    const error = new Error('Notification delivery was not confirmed');
    error.status = response.status;
    throw error;
  }
  return result.id;
}
