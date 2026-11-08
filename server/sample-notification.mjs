import { zipSync, strToU8 } from 'fflate';
export const NOTIFICATION_RECIPIENT = 'smartcadenceprocurement@gmail.com';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function notificationPayload(request, id, createdAt) {
  const entries = [['Reference',id],['Received',createdAt],['Name',request.name],['Business',request.business],['Email',request.email],['Phone',request.phone || 'Not provided'],['Website or social page',request.website || 'Not provided'],['Service area',request.area],['Promotion',request.promotion],['Customer action',request.action || 'Not provided'],['Ad size',request.adSize],['Requested routes',request.requestedRoutes.join(', ') || 'Not selected'],['Notes',request.notes || 'None'],['Artwork',request.assets.length ? `${request.assets.length} file(s) in the attached ZIP` : 'Not provided'],['Consent','Customer agreed to contact about the sample and confirmed permission to share uploaded artwork.']];
  const text = entries.map(([key,value]) => `${key}: ${value}`).join('\n\n');
  const files = {'request.txt':strToU8(text)};
  for (const [i, asset] of request.assets.entries()) files[`artwork-${i+1}.${asset.extension}`] = new Uint8Array(asset.bytes);
  return {subject:`New HLN sample-ad request: ${request.business.replace(/[\r\n]/g,' ')}`,html:`<h1>New sample-ad request</h1><p>Reply using the customer's email listed below. This is a free sample request, not a paid booking or route reservation.</p><table>${entries.map(([key,value])=>`<tr><th style="text-align:left;vertical-align:top;padding:8px">${escape(key)}</th><td style="padding:8px;white-space:pre-wrap">${escape(value)}</td></tr>`).join('')}</table>`,artworkZip:Buffer.from(zipSync(files,{level:0})).toString('base64')};
}
export async function notifySampleRequest(request, id, createdAt, send = fetch) {
  const url = process.env.HLN_SAMPLE_NOTIFICATION_WEBHOOK;
  if (!url) throw new Error('Notification delivery is not configured');
  const response = await send(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(notificationPayload(request,id,createdAt)),signal:AbortSignal.timeout(20000)});
  const result = await response.json().catch(()=>null);
  if (!response.ok || result?.sent !== true) throw new Error('Notification delivery was not confirmed');
}
