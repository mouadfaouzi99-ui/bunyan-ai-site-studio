const $ = (id) => document.getElementById(id);
const PROJECTS_KEY = 'bunyan.projects.v1';
const CONTACT_KEY = 'bunyan.contact.v1';
const formIds = ['businessName','businessType','brief','location','siteLanguage','phone','whatsapp','instagram','openingHours','offerings','mapUrl','mapEmbedUrl','reviewUrl','siteStyle'];
let reviewDrafts = [];
let siteCopy = {
  tagline: 'نكهة كتفكّر فيها… وتجربة كترجع ليها',
  headline: 'مرحبا بكم فدار النعناع',
  description: 'مائدة مغربية عامرة بالنكهة، وجلسة هادئة وسط قلب المدينة.',
  about: 'كنستقبلوكم بأطباق مغربية محضّرة بعناية، ففضاء دافئ كيجمع بين الضيافة والأجواء العصرية.',
  offerings: [
    { name: 'أطباق مغربية', description: 'نكهات موسمية ولمسة ديال الدار.', price: '' },
    { name: 'جلسة الفناء', description: 'فضاء هادئ للعائلة والأصدقاء.', price: '' },
    { name: 'حجز الطاولات', description: 'تواصلو معنا قبل الزيارة.', price: '' }
  ],
  faqs: [
    { question: 'كيفاش نقدر نحجز؟', answer: 'تواصل معنا عبر WhatsApp أو الهاتف باش نأكدوا ليك الحجز.' },
    { question: 'فين كاين النشاط؟', answer: 'تقدر تشوف العنوان وتفتح الطريق فـGoogle Maps.' }
  ],
  metaDescription: 'اكتشفوا تجربة دار النعناع وتواصلوا معنا للحجز.'
};
let generated = false;
let toastTimer;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2900);
}
function normalizePhone(value) { return String(value || '').replace(/[^\d]/g, '').replace(/^00/, ''); }
function safeUrl(value, hosts) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:') return '';
    const host = url.hostname.toLowerCase();
    return hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`)) ? url.href : '';
  } catch { return ''; }
}
function getMapsLink(data) {
  return safeUrl(data.mapUrl, ['google.com','goo.gl','maps.app.goo.gl']) || (data.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.location)}` : '');
}
function getReviewLink(data) { return safeUrl(data.reviewUrl, ['google.com','g.page','maps.app.goo.gl','goo.gl']); }
function getInstagramLink(data) { return safeUrl(data.instagram, ['instagram.com','instagr.am']); }
function getMapEmbed(data) {
  const url = safeUrl(data.mapEmbedUrl, ['google.com']);
  if (!url) return '';
  try { const parsed = new URL(url); return /\/maps\/embed(?:\/|\?|$)/i.test(parsed.pathname + parsed.search) ? url : ''; }
  catch { return ''; }
}
function parseOfferings(value) {
  return String(value || '').split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 12).map((line) => {
    const parts = line.split(/\s+(?:—|–|\|)\s+/);
    return { name: (parts[0] || '').slice(0, 80), description: '', price: (parts[1] || '').slice(0, 32) };
  });
}
function readForm() {
  const data = Object.fromEntries(formIds.map((id) => [id, $(id).value.trim()]));
  data.reviews = reviewDrafts.map((review) => ({ ...review }));
  data.offeringsList = parseOfferings(data.offerings);
  return data;
}
function typeLabel(type) { return ({ restaurant:'مطعم', cafe:'كافيه', hotel:'فندق / رياض', portfolio:'صفحة تعريفية' })[type] || 'موقع مهني'; }
function currentCopy(data) {
  const base = structuredClone(siteCopy);
  const typedOfferings = data.offeringsList;
  if (typedOfferings.length) base.offerings = typedOfferings;
  return base;
}
function create(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function addLink(parent, label, href, className = '') {
  const a = create('a', className, label);
  a.href = href || '#';
  if (href) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  else a.addEventListener('click', (event) => { event.preventDefault(); showToast('زيد رابط أو رقم التواصل فالتفاصيل باش يخدم هاد الزر.'); });
  parent.appendChild(a);
  return a;
}
function whatsappHref(phone, message) {
  const number = normalizePhone(phone);
  return number.length >= 8 && number.length <= 15 ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : '';
}
function makeElement(tag, className, text, parent) {
  const element = create(tag, className, text);
  parent.appendChild(element);
  return element;
}

function renderPreview() {
  const data = readForm();
  const copy = currentCopy(data);
  const preview = $('sitePreview');
  preview.replaceChildren();
  preview.className = `site-preview theme-${data.siteStyle || 'warm'}`;
  const isLtr = ['en','fr'].includes(data.siteLanguage);
  preview.dir = isLtr ? 'ltr' : 'rtl';
  const site = makeElement('article', 'mini-site', undefined, preview);
  const nav = makeElement('nav', 'mini-nav', undefined, site);
  makeElement('b', 'mini-brand', data.businessName || 'اسم النشاط', nav);
  const navLinks = makeElement('div', 'mini-links', undefined, nav);
  [['من نحن','#about'],['الخدمات','#offerings'],['الموقع','#location']].forEach(([label, href]) => addLink(navLinks, label, href));
  const primaryMessage = data.businessType === 'hotel' ? 'السلام عليكم، بغيت نستفسر على الحجز.' : 'السلام عليكم، بغيت ندير طلب مسبق.';
  const wa = whatsappHref(data.whatsapp, primaryMessage);
  addLink(nav, data.businessType === 'hotel' ? 'طلب حجز' : 'طلب مسبق', wa || '#order', 'mini-cta');

  const hero = makeElement('section', 'mini-hero', undefined, site);
  const copyBox = makeElement('div', 'mini-copy', undefined, hero);
  makeElement('span', 'mini-kicker', copy.tagline || typeLabel(data.businessType), copyBox);
  makeElement('h2', '', copy.headline || data.businessName || 'موقعك هنا', copyBox);
  makeElement('p', '', copy.description || data.brief, copyBox);
  const actions = makeElement('div', 'mini-hero-actions', undefined, copyBox);
  addLink(actions, data.businessType === 'hotel' ? 'استفسر على الحجز' : 'طلب عبر WhatsApp', wa || '#order', '');
  addLink(actions, 'شوف الطريق', getMapsLink(data) || '#location', 'secondary');
  makeElement('div', 'hero-art', undefined, hero).setAttribute('aria-hidden', 'true');

  const about = makeElement('section', 'mini-site-section', undefined, site);
  about.id = 'about';
  makeElement('h3', '', 'مرحبا بكم', about);
  makeElement('p', '', copy.about || copy.description, about);
  if (data.location) makeElement('span', 'mini-hours', `⌖  ${data.location}`, about);

  const offeringsSection = makeElement('section', 'mini-site-section', undefined, site);
  offeringsSection.id = 'offerings';
  makeElement('h3', '', data.businessType === 'hotel' ? 'الإقامة والخدمات' : data.businessType === 'portfolio' ? 'الخدمات والأعمال' : 'المنيو والخدمات', offeringsSection);
  makeElement('p', '', 'تفاصيل قابلة للتعديل — راجع الأسماء والأثمنة قبل النشر.', offeringsSection);
  const cards = makeElement('div', 'mini-offerings', undefined, offeringsSection);
  (copy.offerings || []).slice(0, 6).forEach((item) => {
    const card = makeElement('article', 'offering-card', undefined, cards);
    makeElement('b', '', item.name || 'خدمة', card);
    if (item.description) makeElement('p', '', item.description, card);
    if (item.price) makeElement('div', 'offering-price', item.price, card);
  });
  if (!(copy.offerings || []).length) makeElement('p', 'no-reviews', 'زيد المنيو أو الخدمات من لوحة التعديل.', cards);

  const orderSection = makeElement('section', 'mini-order', undefined, site);
  orderSection.id = 'order';
  const orderCopy = makeElement('div', '', undefined, orderSection);
  makeElement('b', '', data.businessType === 'hotel' ? 'الحجز والاستفسار' : data.businessType === 'portfolio' ? 'تواصل على مشروعك' : 'طلب مسبق بسهولة', orderCopy);
  makeElement('p', '', data.businessType === 'hotel' ? 'صيفط تاريخ الوصول وعدد الليالي باش نتواصلو معاك.' : 'ختار الخدمة وصيفط التفاصيل مباشرة عبر WhatsApp.', orderCopy);
  const orderBtn = addLink(orderSection, wa ? 'كمل الطلب فـWhatsApp' : 'زيد رقم WhatsApp', wa, '');
  if (!wa) orderBtn.href = '#order';

  const mapSection = makeElement('section', 'mini-site-section mini-map-section', undefined, site);
  mapSection.id = 'location';
  makeElement('h3', '', 'فين تلقانا؟', mapSection);
  const mapCard = makeElement('div', 'map-card', undefined, mapSection);
  const embed = getMapEmbed(data);
  if (embed) {
    const frame = document.createElement('iframe');
    frame.src = embed; frame.title = `خريطة ${data.businessName || 'المكان'}`; frame.loading = 'lazy'; frame.referrerPolicy = 'strict-origin-when-cross-origin'; frame.allowFullscreen = true;
    mapCard.appendChild(frame);
  } else {
    makeElement('span', 'map-pin', '⌖', mapCard);
    makeElement('b', '', data.location || 'زيد عنوان النشاط', mapCard);
    addLink(mapCard, getMapsLink(data) ? 'افتح فـGoogle Maps ↗' : 'زيد رابط Google Maps', getMapsLink(data), '');
  }

  const hours = makeElement('section', 'mini-site-section', undefined, site);
  makeElement('h3', '', 'ساعات العمل', hours);
  makeElement('span', 'mini-hours', data.openingHours || 'دخل ساعات العمل الصحيحة قبل النشر.', hours);

  const faqSection = makeElement('section', 'mini-site-section mini-faq', undefined, site);
  makeElement('h3', '', 'أسئلة كتتعاود', faqSection);
  (copy.faqs || []).slice(0, 4).forEach((item) => {
    const details = document.createElement('details');
    const summary = create('summary', '', item.question || 'سؤال');
    const answer = create('p', '', item.answer || 'تواصل معنا للمزيد من المعلومات.');
    details.append(summary, answer); faqSection.appendChild(details);
  });

  const reviewSection = makeElement('section', 'mini-site-section', undefined, site);
  makeElement('h3', '', 'آراء الزبناء', reviewSection);
  makeElement('p', '', 'كنعرضو غير التقييمات الحقيقية اللي دخلها صاحب النشاط بموافقة أصحابها.', reviewSection);
  if (data.reviews.length) {
    const reviewGrid = makeElement('div', 'mini-review-grid', undefined, reviewSection);
    data.reviews.forEach((review) => {
      const card = makeElement('article', 'mini-review', undefined, reviewGrid);
      makeElement('span', 'stars', `${'★'.repeat(Number(review.rating))}${'☆'.repeat(5 - Number(review.rating))}`, card);
      makeElement('b', '', review.name, card); makeElement('p', '', review.text, card);
    });
  } else {
    makeElement('div', 'no-reviews', 'ما تزاد حتى تعليق دابا. زيد تقييمات حقيقية أو خلي الزبناء يكتبوها فـGoogle Maps.', reviewSection);
  }
  const reviewLink = getReviewLink(data);
  if (reviewLink) addLink(reviewSection, 'كتب تقييمك فـGoogle Maps ↗', reviewLink, 'review-cta');

  const footer = makeElement('footer', 'mini-footer', undefined, site);
  makeElement('span', '', `${data.businessName || 'اسم النشاط'} © ${new Date().getFullYear()}`, footer);
  const socials = makeElement('span', '', undefined, footer);
  const insta = getInstagramLink(data);
  if (insta) addLink(socials, 'Instagram ↗', insta, '');
  if (data.phone) addLink(socials, `اتصل: ${data.phone}`, `tel:${normalizePhone(data.phone)}`, '');
  if (!insta && !data.phone) makeElement('span', '', 'زيد Instagram أو الهاتف قبل النشر.', socials);

  $('previewStatus').textContent = generated ? 'المحتوى واجد — راجع وعدّل قبل التصدير' : 'نموذج توضيحي — بدّل المعلومات';
  $('previewAddress').textContent = (data.businessName || 'my-business').toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g,'-').replace(/^-|-$/g,'') + '.site';
  $('exportBtn').disabled = !generated;
}

function renderReviewDrafts() {
  const root = $('reviewDrafts'); root.replaceChildren();
  if (!reviewDrafts.length) { makeElement('span', 'empty-reviews', 'مازال ما زدتي حتى تقييم. ما كنولّدو حتى رأي وهمي.', root); return; }
  reviewDrafts.forEach((review, index) => {
    const card = makeElement('div', 'review-draft', undefined, root);
    const remove = create('button', '', 'حذف'); remove.type = 'button'; remove.addEventListener('click', () => { reviewDrafts.splice(index,1); renderReviewDrafts(); renderPreview(); }); card.appendChild(remove);
    makeElement('strong', '', review.name, card); makeElement('span', 'stars', `${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}`, card);
    makeElement('div', '', review.text, card);
  });
}

function reviewFromForm() {
  const name = $('reviewName').value.trim(); const text = $('reviewText').value.trim();
  if (!name || !text) { showToast('دخل اسم الزبون وتعليقه الحقيقي.'); return; }
  reviewDrafts.push({ name:name.slice(0,70), rating:Number($('reviewRating').value), text:text.slice(0,500) });
  $('reviewName').value=''; $('reviewText').value=''; renderReviewDrafts(); renderPreview();
  showToast('تزاد التقييم فالمعاينة. تأكد من موافقة صاحبه قبل النشر.');
}

async function generateSite(event) {
  event.preventDefault();
  const data = readForm();
  if (!data.businessName) { showToast('دخل اسم النشاط الأول.'); $('businessName').focus(); return; }
  if (!data.brief || data.brief.length < 12) { showToast('شرح لينا الطلب بتفاصيل أكثر شوية.'); $('brief').focus(); return; }
  const button = $('generateBtn'); button.disabled = true; button.innerHTML = '<span class="loading-ring"></span> كنوجد المحتوى…';
  try {
    const response = await fetch('/api/generate-site', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({
      businessName:data.businessName, businessType:data.businessType, request:data.brief, location:data.location,
      language:data.siteLanguage, style:data.siteStyle, offerings:data.offerings, openingHours:data.openingHours
    }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'تعذر توليد المحتوى.');
    siteCopy = payload.content; generated = true; renderPreview();
    showToast('توجد المسودة. راجع التفاصيل والأثمنة قبل النشر.');
  } catch (error) {
    showToast(error.message || 'ما قدرناش نتاصلو بخدمة الـAI. شغّل Worker ديال Cloudflare.');
  } finally {
    button.disabled = false; button.innerHTML = '<span>✦</span> ولّد محتوى الموقع بالـAI <i>↗</i>';
  }
}

function collectProject() { return { ...readForm(), copy:structuredClone(siteCopy), generated:true, updatedAt:new Date().toISOString() }; }
function getProjects() { try { const parsed=JSON.parse(localStorage.getItem(PROJECTS_KEY)||'[]'); return Array.isArray(parsed)?parsed:[]; } catch { return []; } }
function saveProject() {
  if (!generated) { showToast('ولّد المحتوى بالـAI قبل ما تحفظ المشروع.'); return; }
  const project=collectProject(); const projects=getProjects();
  const index=projects.findIndex((item)=>item.businessName===project.businessName && item.businessType===project.businessType);
  if (index>=0) projects[index]=project; else projects.unshift(project);
  try { localStorage.setItem(PROJECTS_KEY,JSON.stringify(projects.slice(0,40))); } catch { showToast('المساحة المحلية عامرة؛ حذف بعض المشاريع القديمة.'); return; }
  updateProjectCount(); renderProjects(); showToast('تحفظ المشروع فهاد المتصفح.');
}
function loadProject(project) {
  formIds.forEach((id)=>{ if ($(id) && project[id] !== undefined) $(id).value=project[id]; });
  reviewDrafts=Array.isArray(project.reviews)?project.reviews:[]; siteCopy=project.copy||siteCopy; generated=true;
  renderReviewDrafts(); renderPreview(); showView('builder'); showToast('تحل المشروع.');
}
function deleteProject(index) {
  const projects=getProjects(); projects.splice(index,1); localStorage.setItem(PROJECTS_KEY,JSON.stringify(projects)); updateProjectCount(); renderProjects();
}
function updateProjectCount() { $('projectCount').textContent=String(getProjects().length); }
function renderProjects() {
  const list=$('projectList'); list.replaceChildren(); const projects=getProjects();
  if (!projects.length) { makeElement('div','empty-projects','مازال ما حفظتي حتى مشروع. ولّد موقعك ثم ضغط على ♡ للحفظ.',list); return; }
  projects.forEach((project,index)=>{
    const card=makeElement('article','project-card',undefined,list);
    makeElement('span','step-label',typeLabel(project.businessType),card); makeElement('b','',project.businessName,card);
    makeElement('p','',`${project.location||'بلا عنوان'} · تحدّث ${new Date(project.updatedAt||Date.now()).toLocaleDateString()}`,card);
    const load=create('button','','فتح'); load.type='button'; load.addEventListener('click',()=>loadProject(project)); card.appendChild(load);
    const del=create('button','delete-project','حذف'); del.type='button'; del.addEventListener('click',()=>deleteProject(index)); card.appendChild(del);
  });
}

function exportHtml(data, copy) {
  const title=escapeHtml(data.businessName || 'Business website');
  const description=escapeHtml(copy.metaDescription || copy.description || '');
  const mapLink=getMapsLink(data); const mapEmbed=getMapEmbed(data); const reviewLink=getReviewLink(data); const instagram=getInstagramLink(data);
  const phone=normalizePhone(data.phone); const waNumber=normalizePhone(data.whatsapp);
  const waBase=(message)=>waNumber&&waNumber.length>=8?`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`:'';
  const waOrder=waBase(data.businessType==='hotel'?'Hello, I would like to ask about a booking.':'Hello, I would like to place a pre-order.');
  const offerings=(copy.offerings||[]).slice(0,12).map((item)=>`<article class="item"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description||'')}</p>${item.price?`<b>${escapeHtml(item.price)}</b>`:''}</article>`).join('');
  const reviews=(data.reviews||[]).map((review)=>`<article class="review"><div class="stars">${'★'.repeat(Number(review.rating))}${'☆'.repeat(5-Number(review.rating))}</div><b>${escapeHtml(review.name)}</b><p>${escapeHtml(review.text)}</p></article>`).join('');
  const questions=(copy.faqs||[]).slice(0,6).map((faq)=>`<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`).join('');
  const mapBlock=mapEmbed?`<iframe class="map-iframe" src="${escapeHtml(mapEmbed)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="Map for ${title}"></iframe>`:`<div class="map-box"><span>⌖</span><b>${escapeHtml(data.location||'Add your business address')}</b>${mapLink?`<a class="button outline" href="${escapeHtml(mapLink)}" target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a>`:''}</div>`;
  const contactLinks=[phone?`<a href="tel:${phone}">Call us</a>`:'',instagram?`<a href="${escapeHtml(instagram)}" target="_blank" rel="noopener noreferrer">Instagram ↗</a>`:''].filter(Boolean).join('');
  const primaryCta=waOrder?`<a class="button" href="${escapeHtml(waOrder)}" target="_blank" rel="noopener noreferrer">${data.businessType==='hotel'?'Ask about a booking':'Pre-order on WhatsApp'}</a>`:mapLink?`<a class="button" href="${escapeHtml(mapLink)}" target="_blank" rel="noopener noreferrer">Find us</a>`:'';
  const reviewCta=reviewLink?`<a class="button outline" href="${escapeHtml(reviewLink)}" target="_blank" rel="noopener noreferrer">Leave an honest Google review ↗</a>`:'';
  const schema={ '@context':'https://schema.org','@type':data.businessType==='restaurant'?'Restaurant':data.businessType==='hotel'?'Hotel':data.businessType==='cafe'?'CafeOrCoffeeShop':'LocalBusiness', name:data.businessName||'', description:copy.metaDescription||copy.description||'' };
  if(data.location) schema.address={'@type':'PostalAddress','addressLocality':data.location};
  if(phone) schema.telephone=data.phone;
  if(data.openingHours && /^[A-Za-z]{2}(?:-[A-Za-z]{2})?\s+\d{2}:\d{2}-\d{2}:\d{2}$/.test(data.openingHours)) schema.openingHours=[data.openingHours];
  if(instagram) schema.sameAs=[instagram];
  const safeSchema=JSON.stringify(schema).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  const orderForm=waNumber?`<form id="orderForm"><label>Your name<input name="name" required maxlength="80"></label><label>${data.businessType==='hotel'?'Check-in date':'Preferred date / time'}<input name="time" type="text" placeholder="Day and time"></label><label>${data.businessType==='hotel'?'Room / request':'Item or service'}<select name="item">${(copy.offerings||[]).slice(0,12).map((item)=>`<option>${escapeHtml(item.name)}</option>`).join('')||'<option>General enquiry</option>'}</select></label><label>Notes<textarea name="notes" maxlength="400"></textarea></label><button class="button" type="submit">Send request on WhatsApp</button></form>`:`<p class="notice">Add a business WhatsApp number to enable pre-orders and booking inquiries.</p>`;
  return `<!doctype html><html lang="${['en','fr'].includes(data.siteLanguage)?data.siteLanguage:'ar'}" dir="${['en','fr'].includes(data.siteLanguage)?'ltr':'rtl'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><meta name="theme-color" content="#263f32"><script type="application/ld+json">${safeSchema}</script><style>*{box-sizing:border-box}body{margin:0;color:#2f342d;font:16px/1.7 system-ui,-apple-system,"Segoe UI",sans-serif}a{color:inherit}header,section,footer{padding:26px max(6vw,18px)}header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee}header b{font-size:21px}header nav{display:flex;gap:18px;font-size:13px}header a{text-decoration:none}.hero{display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:28px;min-height:350px;background:#f4f1e9}.eyebrow,.stars{color:#b17846;font-weight:700}.hero h1{font-size:clamp(32px,5vw,58px);line-height:1.15;color:#30473a;margin:10px 0}.hero p{max-width:560px;color:#6e756b}.hero-art{height:245px;border-radius:46% 46% 18px 18px;background:radial-gradient(circle at 50% 35%,#fff6dc 0 13%,transparent 14%),radial-gradient(ellipse at 50% 92%,#648268 0 32%,transparent 33%),linear-gradient(145deg,#e9c895,#bc7955 58%,#795843)}.button{display:inline-flex;background:#263f32;color:white;text-decoration:none;border:0;padding:11px 17px;border-radius:99px;font:700 13px system-ui;cursor:pointer}.outline{background:transparent;color:#2d523d;border:1px solid #cbd5c9}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:13px}.item,.review{border:1px solid #ecece5;border-radius:14px;padding:16px}.item h3,.review b{font-size:16px;margin:0}.item p,.review p,.about p{color:#747a70;font-size:14px}.item>b{color:#a66c3c}.order{background:#f3f5f0}.map-box{min-height:150px;background:#e8eee4;border-radius:14px;padding:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;text-align:center}.map-box span{font-size:27px;color:#b27552}.map-iframe{width:100%;min-height:260px;border:0;border-radius:14px}.notice{font-size:13px;color:#73796f}.hours{color:#677262}.reviews{background:#fbfaf7}.review-cta{margin-top:15px}details{border-top:1px solid #e8e9e2;padding:12px 0}summary{font-weight:700;cursor:pointer}footer{background:#263f32;color:white;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}footer a{margin-inline-start:14px}#orderForm{max-width:520px;display:grid;gap:12px}label{font-size:13px;font-weight:700}input,select,textarea{display:block;width:100%;margin-top:5px;border:1px solid #dfe3dc;border-radius:9px;padding:10px;font:inherit}@media(max-width:700px){header nav{display:none}.hero{grid-template-columns:1fr}.hero-art{height:160px}.mini-nav{flex-wrap:wrap}}</style></head><body><header><b>${title}</b><nav><a href="#about">About</a><a href="#offerings">${data.businessType==='hotel'?'Stay':'Menu & services'}</a><a href="#location">Location</a><a href="#reviews">Reviews</a></nav>${primaryCta}</header><main><section class="hero"><div><span class="eyebrow">${escapeHtml(copy.tagline||typeLabel(data.businessType))}</span><h1>${escapeHtml(copy.headline||title)}</h1><p>${escapeHtml(copy.description||'')}</p>${primaryCta}</div><div class="hero-art" aria-hidden="true"></div></section><section class="about" id="about"><h2>About us</h2><p>${escapeHtml(copy.about||copy.description||'')}</p>${data.location?`<p>⌖ ${escapeHtml(data.location)}</p>`:''}</section><section id="offerings"><h2>${data.businessType==='hotel'?'Accommodation & services':'Menu & services'}</h2><div class="grid">${offerings}</div></section><section class="order" id="order"><h2>${data.businessType==='hotel'?'Booking inquiry':'Pre-order / contact us'}</h2><p>Send your request directly to our WhatsApp. We will confirm availability and details.</p>${orderForm}</section><section id="location"><h2>Find us</h2>${mapBlock}${data.location?`<p>${escapeHtml(data.location)}</p>`:''}</section>${data.openingHours?`<section><h2>Opening hours</h2><p class="hours">${escapeHtml(data.openingHours)}</p></section>`:''}<section id="reviews" class="reviews"><h2>Customer reviews</h2>${reviews?`<div class="grid">${reviews}</div>`:'<p class="notice">No customer reviews have been added yet. Only publish genuine feedback with permission.</p>'}${reviewCta}</section>${questions?`<section><h2>Frequently asked questions</h2>${questions}</section>`:''}</main><footer><b>${title} · ${new Date().getFullYear()}</b><span>${contactLinks}</span></footer><script>const f=document.getElementById('orderForm');if(f)f.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(f);const msg=['Hello, I would like to make a request.','Name: '+d.get('name'),'Item/service: '+d.get('item'),'Preferred time: '+d.get('time'),'Notes: '+d.get('notes')].join('\\n');window.open('https://wa.me/${waNumber}?text='+encodeURIComponent(msg),'_blank','noopener')})</script></body></html>`;
}

function downloadSite() {
  if (!generated) return;
  const data=readForm(); const html=exportHtml(data,currentCopy(data));
  const blob=new Blob([html],{type:'text/html;charset=utf-8'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`${(data.businessName||'business-site').toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu,'-')}.html`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
  showToast('تحمّل ملف HTML. راجعو قبل النشر.');
}

function showView(view) {
  const projects=view==='projects'; $('builderView').classList.toggle('hidden',projects); $('projectsView').classList.toggle('hidden',!projects);
  document.querySelectorAll('.nav-item').forEach((item)=>item.classList.toggle('active',item.dataset.nav===view));
  $('crumbTitle').textContent=projects?'مشاريعي':'مولّد المواقع';
  if(projects)renderProjects();
  if(window.innerWidth<900)$('sidebar').classList.remove('open');
}

function loadContactDestination() { try { $('contactDestination').value=localStorage.getItem(CONTACT_KEY)||''; } catch {} }
function submitLead(event) {
  event.preventDefault();
  const name=$('leadName').value.trim(); const type=$('leadType').value; const brief=$('leadBrief').value.trim(); const destination=$('contactDestination').value.trim();
  try { localStorage.setItem(CONTACT_KEY,destination); } catch {}
  if (!destination) { showToast('دخل رقم WhatsApp أو الإيميل فإعداد جهة التواصل.'); $('contactDestination').focus(); return; }
  const message=`طلب تصميم موقع جديد\nالاسم: ${name}\nنوع الموقع: ${type}\nالتفاصيل: ${brief}`;
  if (destination.includes('@')) {
    const mail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination);
    if (!mail) { showToast('الإيميل ما باينش صحيح.'); return; }
    location.href=`mailto:${encodeURIComponent(destination)}?subject=${encodeURIComponent('طلب تصميم موقع عبر بنيان')}&body=${encodeURIComponent(message)}`;
  } else {
    const number=normalizePhone(destination);
    if(number.length<8||number.length>15){showToast('رقم WhatsApp خاصو يكون دولي، بحال 2126…');return;}
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`,'_blank','noopener');
  }
}

function bindEvents() {
  $('siteForm').addEventListener('submit',generateSite);
  $('addReviewBtn').addEventListener('click',reviewFromForm);
  $('saveBtn').addEventListener('click',saveProject);
  $('exportBtn').addEventListener('click',downloadSite);
  document.querySelectorAll('.device-btn').forEach((button)=>button.addEventListener('click',()=>{
    document.querySelectorAll('.device-btn').forEach((item)=>item.classList.toggle('active',item===button));
    $('previewShell').classList.toggle('mobile',button.dataset.device==='mobile');
  }));
  document.querySelectorAll('.nav-item').forEach((item)=>item.addEventListener('click',()=>showView(item.dataset.nav)));
  $('newProjectBtn').addEventListener('click',()=>showView('builder'));
  $('mobileMenu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
  $('contactBuilderBtn').addEventListener('click',()=>{$('contactModal').classList.remove('hidden');$('leadName').focus();});
  $('closeContact').addEventListener('click',()=>$('contactModal').classList.add('hidden'));
  $('contactModal').addEventListener('click',(event)=>{if(event.target===$('contactModal'))$('contactModal').classList.add('hidden');});
  $('contactForm').addEventListener('submit',submitLead);
  $('contactDestination').addEventListener('change',()=>{try{localStorage.setItem(CONTACT_KEY,$('contactDestination').value.trim());}catch{}});
  formIds.forEach((id)=>$(id).addEventListener('input',renderPreview));
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape')$('contactModal').classList.add('hidden');});
}

bindEvents(); loadContactDestination(); renderReviewDrafts(); renderPreview(); updateProjectCount();
