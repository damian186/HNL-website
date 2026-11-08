import { put, del } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
const LIMIT = 3 * 1024 * 1024;
const sizes = ['1/6 panel', '1/4 panel', '1/3 panel', '1/2 panel', 'Full panel', '2/3 panel'];
export function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Please complete the request form.');
  if (body.companyFax) throw new Error('Please leave the extra field empty.');
  const result = {};
  for (const [key, max, required] of [['name',100,true],['business',150,true],['email',254,true],['phone',40,false],['website',500,false],['area',400,true],['promotion',3000,true],['action',500,false],['notes',2000,false]]) {
    const value = body[key] ?? '';
    if (typeof value !== 'string' || value.length > max || (required && !value.trim()) || /\u0000/.test(value)) throw new Error('Please check your business and contact details.');
    result[key] = value.trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw new Error('Please enter a valid email address.');
  if (body.consent !== 'yes') throw new Error('Please confirm that HLN may contact you about your request.');
  if (body.size !== '' && !/^[0-5]$/.test(String(body.size))) throw new Error('Please choose a valid ad size.');
  result.adSize = body.size === '' ? 'Help me choose' : sizes[Number(body.size)];
  if (!Array.isArray(body.routes) || body.routes.length > 100 || !body.routes.every(id => typeof id === 'string' && /^77\d{3}[CRH]\d{3}$/.test(id))) throw new Error('Please check your selected routes.');
  result.requestedRoutes = [...new Set(body.routes)]; result.consent = true;
  if (!Array.isArray(body.assets) || body.assets.length > 3) throw new Error('Choose up to 3 artwork files.');
  let total = 0;
  result.assets = body.assets.map(asset => {
    if (!asset || typeof asset.name !== 'string' || asset.name.length > 255 || typeof asset.data !== 'string' || asset.data.length > Math.ceil(LIMIT / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(asset.data)) throw new Error('Please choose valid artwork files.');
    const bytes = Buffer.from(asset.data, 'base64'); total += bytes.length;
    let type = '', extension = '';
    if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) { type='image/png'; extension='png'; }
    else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) { type='image/jpeg'; extension='jpg'; }
    else if (bytes.subarray(0,5).toString() === '%PDF-') { type='application/pdf'; extension='pdf'; }
    else if (bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP') { type='image/webp'; extension='webp'; }
    if (!type || total > LIMIT) throw new Error('Use JPG, PNG, WebP, or PDF files, totaling 3 MB or less.');
    return { name: asset.name.replace(/[\x00-\x1f]/g, ''), type, extension, bytes };
  });
  return result;
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({error:'Use the sample request form to submit.'}); }
  const origin = req.headers.origin;
  if (origin && origin !== `https://${req.headers.host}` && !(process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin))) return res.status(403).json({error:'Please submit from the HLN website.'});
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({error:'Please use the sample request form.'});
  if (Number(req.headers['content-length']) > 4400000) return res.status(413).json({error:'Artwork must total 3 MB or less.'});
  let request;
  try { request = validate(typeof req.body === 'string' ? JSON.parse(req.body) : req.body); }
  catch(e) { return res.status(400).json({error:e instanceof SyntaxError ? 'Please use the sample request form.' : e.message}); }
  const id = randomUUID(); const createdAt = new Date().toISOString();
  const prefix = `sample-requests/${createdAt.slice(0,10)}/${id}`; const uploaded = [];
  try {
    const assets = [];
    for (const [i, asset] of request.assets.entries()) {
      const blob = await put(`${prefix}/artwork-${i+1}.${asset.extension}`, asset.bytes, {access:'private',contentType:asset.type,addRandomSuffix:false});
      uploaded.push(blob.url); assets.push({name:asset.name,contentType:asset.type,bytes:asset.bytes.length,pathname:blob.pathname});
    }
    await put(`${prefix}/request.json`, JSON.stringify({...request,assets,id,createdAt,status:'new'},null,2), {access:'private',contentType:'application/json',addRandomSuffix:false});
    return res.status(201).json({reference:id});
  } catch {
    if (uploaded.length) await del(uploaded).catch(()=>{});
    return res.status(503).json({error:'Your request could not be saved right now. Please try again. Your form is still here.'});
  }
}
