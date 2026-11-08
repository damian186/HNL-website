import { useEffect, useState, type FormEvent } from 'react';
import { AD_SIZES, AD_SIZE_ORDER } from './route-planner';
import './sample-request.css';

function savedPlan() {
  try {
    const p = JSON.parse(localStorage.getItem('hln-route-plan-v1') || 'null');
    if (p?.version !== 1) return { routes: [] as string[], size: '' };
    return { routes: Array.isArray(p.selected) ? [...new Set(p.selected.filter((id: unknown): id is string => typeof id === 'string' && /^77\d{3}[CRH]\d{3}$/.test(id)))].slice(0, 100) as string[] : [], size: Number.isInteger(p.sizeIndex) && AD_SIZES[p.sizeIndex] ? String(p.sizeIndex) : '' };
  } catch { return { routes: [] as string[], size: '' }; }
}
const MAX_BYTES = 3 * 1024 * 1024;
function encoded(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(new Error('That file could not be read. Please select it again.')); reader.readAsDataURL(file); });
}
export default function SampleRequestPage() {
  const [plan] = useState(savedPlan);
  const [size, setSize] = useState(plan.size);
  const [routes, setRoutes] = useState(plan.routes);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');
  useEffect(() => { document.title = 'Get your free sample ad | Houston Local Network'; }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    setError(''); setBusy(true);
    try {
      if (files.length > 3 || files.reduce((n, f) => n + f.size, 0) > MAX_BYTES) throw new Error('Choose up to 3 files, totaling 3 MB or less. You can also send your request without artwork.');
      const assets = await Promise.all(files.map(async file => ({ name: file.name, type: file.type, data: await encoded(file) })));
      const response = await fetch('/api/sample-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...Object.fromEntries(form.entries()), size, routes, assets }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.reference) throw new Error(result.error || 'Your request could not be saved. Please try again.');
      setReference(result.reference);
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again. Your request has not been saved.'); }
    finally { setBusy(false); }
  }
  return <div className="request-page">
    <header className="request-header"><a href="/" aria-label="Houston Local Network home"><strong>HLN<span>®</span></strong><span>HOUSTON LOCAL NETWORK</span></a><a href="/">← Back to the mailer</a></header>
    <main className="request-layout">
      <aside className="request-intro"><p className="eyebrow">Your business. Our next good idea.</p><h1>Let’s make<br />something<br /><span>local.</span></h1><p className="request-script">Your free sample ad starts here.</p><p>Give us a little about your business and what you’d like to promote. We’ll use it to create a sample of your ad in the HLN mailer.</p><div className="request-promise"><strong>Free sample. Zero commitment.</strong><p>No payment, routes, or ad size required. Have a logo or photo? Send it along. Starting from scratch works, too.</p></div><ol className="request-next"><li>You share your business.</li><li>We put together your sample.</li><li>You decide what comes next.</li></ol></aside>
      {reference ? <section className="request-form request-success" role="status"><p className="eyebrow">You’re on the list</p><h2>Request received.</h2><p>Your information{files.length ? ' and artwork have' : ' has'} been saved for the HLN team to review. We’ll use the contact details you shared to follow up about your sample.</p><p className="request-reference">Reference: {reference}</p><a className="btn btn--solid" href="/">Back to the mailer →</a></section> : <form className="request-form" onSubmit={submit}>
        <fieldset disabled={busy}><legend><span>01</span> Meet your business.</legend><p className="request-help">* Required fields</p><div className="request-grid">
          <label>Your name *<input name="name" autoComplete="name" required maxLength={100} /></label>
          <label>Business name *<input name="business" autoComplete="organization" required maxLength={150} /></label>
          <label>Email address *<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
          <label>Phone number <small>(optional)</small><input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
          <label className="request-wide">Website or social page <small>(optional)</small><input name="website" placeholder="Your website, Facebook, or Instagram" maxLength={500} /></label>
          <label className="request-wide">Where do you serve? *<input name="area" placeholder="Cities, neighborhoods, or ZIP codes" required maxLength={400} /></label>
        </div></fieldset>
        <fieldset disabled={busy}><legend><span>02</span> Give us the good stuff.</legend><label>What would you like to promote? *<textarea name="promotion" rows={4} required maxLength={3000} placeholder="Your main service, a special offer, a new opening… Tell us what customers should know." /></label><label>What should customers do? <small>(optional)</small><input name="action" maxLength={500} placeholder="Call for a quote, visit your shop, book online…" /></label><label>Preferred ad size<select name="adSize" value={size} onChange={e => setSize(e.target.value)}><option value="">Not sure — help me choose</option>{AD_SIZE_ORDER.map(index => <option key={index} value={index}>{AD_SIZES[index].label}</option>)}</select></label>
          {routes.length > 0 && <div className="request-route-note"><strong>Your selected routes came along.</strong><p>{routes.join(', ')}</p><button type="button" onClick={() => setRoutes([])}>Leave routes out of this request</button><small>These are preferences, not a reservation. We’ll confirm availability before booking.</small></div>}
          <label>Anything else we should know? <small>(optional)</small><textarea name="notes" rows={2} maxLength={2000} placeholder="Brand colors, design ideas, or offer details and dates" /></label>
        </fieldset>
        <fieldset disabled={busy}><legend><span>03</span> Make it yours.</legend><p>A logo, business photo, or existing ad is a great start. Artwork is optional.</p><label className="request-upload">Add your artwork<input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" multiple onChange={e => { setFiles(Array.from(e.target.files || [])); setError(''); }} /><small>JPG, PNG, WebP, or PDF · Up to 3 files · 3 MB total</small></label>{files.length > 0 && <ul className="request-files">{files.map((file, i) => <li key={`${file.name}-${i}`}>{file.name} <small>({Math.ceil(file.size / 1024)} KB)</small></li>)}</ul>}
          <label className="request-consent"><input name="consent" type="checkbox" required value="yes" /> <span>I’m allowed to share any artwork I upload, and HLN may contact me about this sample request. *</span></label>
          <div className="request-trap" aria-hidden="true"><label>Leave this empty<input name="companyFax" tabIndex={-1} autoComplete="off" /></label></div>
          <p className="request-help">Your details and artwork are stored privately for preparing your sample and following up with you.</p>
          {error && <p className="request-error" role="alert">{error}</p>}
          <button className="btn btn--solid request-submit" type="submit">{busy ? 'Saving your request…' : 'Get my free sample ad →'}</button><p className="request-help">No payment required. This request does not book an ad or reserve a route.</p>
        </fieldset>
      </form>}
    </main><footer className="request-footer">Made for the businesses that make a neighborhood. <a href="/">Houston Local Network ↗</a></footer>
  </div>;
}
