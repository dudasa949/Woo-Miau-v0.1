/* Enhanced demo JS: product data, improved carousel, product slider, search + filters */
(function(){
  const LS_PRODUCTS = 'wm_products_v1';
  const LS_CART = 'wm_cart_v1';

  // generate a larger demo product set (placeholders) so mega-carousels can show many items
  const demoCats = ['dogs','cats','exotics'];
  const defaults = [];
  for(let i=1;i<=60;i++){
    const cat = demoCats[i % demoCats.length];
    const img = `assets/placeholder-${(i%3)+1}.svg`;
    const price = 990 + (i*123)%5000;
    const tags = [];
    if(i%5===0) tags.push('bestseller');
    if(i%7===0) tags.push('new');
    if(i%6===0) tags.push('discount');
    if(i%9===0) tags.push('special');
    if(i%11===0) tags.push('recommended');
    defaults.push({id:`p${i}`,name:`Demo termék #${i}`,price,cat,img,desc:`Placeholder leírás a ${i}. termékhez.`,tags});
  }

  function readProducts(){
    try{const raw=localStorage.getItem(LS_PRODUCTS);return raw?JSON.parse(raw):defaults}catch(e){return defaults}
  }
  function writeProducts(arr){localStorage.setItem(LS_PRODUCTS,JSON.stringify(arr))}

  function readCart(){try{const raw=localStorage.getItem(LS_CART);return raw?JSON.parse(raw):[]}catch(e){return[]}}
  function writeCart(c){localStorage.setItem(LS_CART,JSON.stringify(c))}

  // expose for other pages
  window.WM = window.WM || {};
  window.WM.data = { readProducts, writeProducts, readCart, writeCart };

  // common boot
  document.addEventListener('DOMContentLoaded',()=>{
    const cartCountEl = document.getElementById('cart-count');
    if(cartCountEl){cartCountEl.textContent = readCart().reduce((s,i)=>s+i.qty,0)}
    // header/menu removed per user request; no nav wiring

    const page = document.body.dataset.page;
    if(page==='home') initHome();
    if(page==='shop') initShop();
    if(page==='product') initProduct();
    if(page==='cart') initCart();
    // admin intentionally not wired automatically
  });

  // Minimal nav behavior: mobile toggle and dropdown clicks
  document.addEventListener('DOMContentLoaded', ()=>{
    const navToggle = document.getElementById('nav-toggle');
    const nav = document.querySelector('.nav');
    if(navToggle && nav){
      navToggle.addEventListener('click', ()=>{
        const isOpen = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen? 'true':'false');
      });
    }

    // dropdown toggle click (useful on mobile)
    document.querySelectorAll('.dropdown-toggle').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const li = btn.closest('.nav-item'); if(!li) return;
        const expanded = li.classList.toggle('open');
        btn.setAttribute('aria-expanded', expanded? 'true':'false');
      });
    });

    // Hover behavior: open product dropdown on hover for desktop with small delay to avoid flicker
    document.querySelectorAll('.nav-item.has-mega').forEach(mega=>{
      let openTimer = null; let closeTimer = null;
      const btn = mega.querySelector('.dropdown-toggle');
      const menu = mega.querySelector('.dropdown-menu');
      function open(){ clearTimeout(closeTimer); mega.classList.add('open'); if(btn) btn.setAttribute('aria-expanded','true'); if(menu) menu.style.display='block'; }
      function close(){ clearTimeout(openTimer); closeTimer = setTimeout(()=>{ mega.classList.remove('open'); if(btn) btn.setAttribute('aria-expanded','false'); if(menu) menu.style.display='none'; },200); }
      mega.addEventListener('mouseenter', ()=>{ openTimer = setTimeout(open,80); });
      mega.addEventListener('mouseleave', ()=>{ close(); });
      // ensure flyout stays open when hovering into it
      mega.querySelectorAll('.subcat').forEach(sc=>{
        const fly = sc.querySelector('.flyout'); let ft=null;
        sc.addEventListener('mouseenter', ()=>{ clearTimeout(closeTimer); if(fly) fly.style.display='block'; });
        sc.addEventListener('mouseleave', ()=>{ if(fly) ft = setTimeout(()=>{ fly.style.display='none'; },160); });
        if(fly){ fly.addEventListener('mouseenter', ()=>{ clearTimeout(ft); fly.style.display='block'; }); fly.addEventListener('mouseleave', ()=>{ fly.style.display='none'; }); }
      });
    });
  });

  // Global handlers: close dropdowns on Escape and click outside
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      document.querySelectorAll('.nav-item.has-mega.open').forEach(n=>{ n.classList.remove('open'); const btn = n.querySelector('.dropdown-toggle'); if(btn) btn.setAttribute('aria-expanded','false'); const menu = n.querySelector('.dropdown-menu'); if(menu) menu.style.display='none'; });
    }
    // keyboard nav: ArrowDown/ArrowUp inside a shown dropdown
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      const focused = document.activeElement; if(!focused) return; const menu = focused.closest('.dropdown-menu'); if(!menu) return;
      e.preventDefault(); const items = Array.from(menu.querySelectorAll('a')); if(!items.length) return; const idx = items.indexOf(focused.tagName==='A'? focused : items.find(i=>i===focused.closest('a')));
      let next = 0;
      if(e.key === 'ArrowDown') next = (idx+1) < items.length ? idx+1 : 0; else next = (idx-1)>=0 ? idx-1 : items.length-1;
      items[next].focus();
    }
  });

  // close dropdowns on outside click
  document.addEventListener('click', (e)=>{
    if(e.target.closest('.nav-item.has-mega')) return; // clicked inside nav
    document.querySelectorAll('.nav-item.has-mega.open').forEach(n=>{ n.classList.remove('open'); const btn = n.querySelector('.dropdown-toggle'); if(btn) btn.setAttribute('aria-expanded','false'); const menu = n.querySelector('.dropdown-menu'); if(menu) menu.style.display='none'; });
  });

  // NAV dropdown click behavior and outside click close
  document.addEventListener('DOMContentLoaded', ()=>{
    // header/menu removed — no dropdown handling required
  });

  // Populate flyout category lists for dogs and cats and wire interactions
  document.addEventListener('DOMContentLoaded', ()=>{
    const prods = readProducts();
    // derive categories/subcategories for demo: use tags as categories, plus static examples
    const dogCats = new Set(); const catCats = new Set();
    prods.forEach(p=>{
      if(!p || !p.cat) return;
      if(p.cat === 'dogs') dogCats.add(p.tags && p.tags.length ? p.tags[0] : 'Alap');
      if(p.cat === 'cats') catCats.add(p.tags && p.tags.length ? p.tags[0] : 'Alap');
    });
    // fallback sample lists
    if(dogCats.size===0) ['Száraztáp','BARF','Jutalomfalat','Kiegészítők'].forEach(s=>dogCats.add(s));
    if(catCats.size===0) ['Hal','Hús','Játék','Póráz'].forEach(s=>catCats.add(s));

    function fillFlyout(id, items){
      const ul = document.querySelector('#'+id+' .fly-list'); if(!ul) return; ul.innerHTML='';
      Array.from(items).slice(0,12).forEach(it=>{ const li = document.createElement('li'); const a = document.createElement('a'); a.href = 'shop.html?cat='+encodeURIComponent(id.includes('dogs')? 'dogs':'cats')+'&sub='+encodeURIComponent(it); a.textContent = it; a.style.textDecoration='none'; li.appendChild(a); ul.appendChild(li); });
    }

    fillFlyout('fly-dogs', dogCats);
    fillFlyout('fly-cats', catCats);

    // interaction: on desktop, hover shows flyout (handled by CSS :hover). Add keyboard accessibility.
    document.querySelectorAll('.subcat').forEach(el=>{
      el.addEventListener('mouseenter', ()=>{ el.classList.add('hover'); el.querySelector('.flyout')?.setAttribute('aria-hidden','false'); });
      el.addEventListener('mouseleave', ()=>{ el.classList.remove('hover'); el.querySelector('.flyout')?.setAttribute('aria-hidden','true'); });
      el.addEventListener('focusin', ()=>{ el.classList.add('hover'); el.querySelector('.flyout')?.setAttribute('aria-hidden','false'); });
      el.addEventListener('focusout', ()=>{ el.classList.remove('hover'); el.querySelector('.flyout')?.setAttribute('aria-hidden','true'); });
      // on small screens clicking the parent toggles the nested flyout visible
      el.addEventListener('click', (e)=>{
        if(window.innerWidth <= 900){ e.preventDefault(); el.classList.toggle('open'); }
      });
    });

    // search button behavior: trigger Enter-like search
    document.querySelectorAll('.search-btn').forEach(b=> b.addEventListener('click', ()=>{ const s = document.getElementById('global-search'); if(s){ if(location.pathname.endsWith('shop.html')){ s.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'})); } else { location.href = 'shop.html?q='+encodeURIComponent(s.value||''); } } }));
  });

  /* ---------- Home / Hero ---------- */
function initHome(){
  const slides = [
    {id:'s1',title:'Friss BARF alapok',desc:'Hűtött kiszállítás, friss alapanyagok',img:'assets/placeholder-1.svg'},
    {id:'s2',title:'Új: Hal menük macskáknak',desc:'Alacsony szénhidrát, magas fehérje — bevezető ár',img:'assets/placeholder-2.svg'},
    {id:'s3',title:'Kutyáknak összeállított csomag',desc:'Komplett heti adagok kényelmes kiszállítással',img:'assets/placeholder-3.svg'}
  ];

  const carousel = document.getElementById('hero-carousel');
  if(!carousel) return;

  carousel.innerHTML = '';
  slides.forEach((s,i)=>{
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.style.setProperty('--bg-image', `url(${s.img})`);
    slide.innerHTML = `
      <div class="slide-content">
        <h1>${s.title}</h1>
        <p>${s.desc}</p>
        <div class="hero-ctas">
          <a class="btn btn-primary" href="shop.html">Nézd meg</a>
          <a class="btn btn-outline" href="shop.html">Akciók</a>
        </div>
      </div>
    `;
    carousel.appendChild(slide);
  });

  let idx = 0, intervalId = null;
  const slidesEls = carousel.querySelectorAll('.slide');

  function showSlide(i){
    slidesEls.forEach((el,j)=> el.classList.toggle('active', j===i));
  }

  function startAutoplay(){
    if(intervalId) return;
    intervalId = setInterval(()=>{
      idx = (idx+1) % slidesEls.length;
      showSlide(idx);
    }, 5000);
  }

  function stopAutoplay(){
    clearInterval(intervalId);
    intervalId = null;
  }

  showSlide(0);
  startAutoplay();

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  // render featured products carousel on home
  // render 10 featured products
  const featured = getNProducts(null, 10);
  renderCarousel('product-grid', featured);

  // populate each mega-section with up to 10 relevant items
  const bests = getNProducts(p=> (p.tags||[]).includes('bestseller'), 10);
  populateMegaSection('mega-bestsellers', ()=>false); // clear then fill
  renderCarousel('mega-bestsellers', bests);
  const news = getNProducts(p=> (p.tags||[]).includes('new'), 10);
  renderCarousel('mega-new', news);
  const specials = getNProducts(p=> (p.tags||[]).includes('special'), 10);
  renderCarousel('mega-specials', specials);
  const discounts = getNProducts(p=> (p.tags||[]).includes('discount'), 10);
  renderCarousel('mega-discounts', discounts);
  const rec = getNProducts(p=> (p.tags||[]).includes('recommended'), 10);
  renderCarousel('mega-recommended', rec);
}

/* ---------- Product rendering (carousel) ---------- */
function renderCarousel(elId, items){
    const grid = document.getElementById(elId); if(!grid) return;
    grid.innerHTML = '';
    const prods = items || readProducts();
    const isMega = grid.classList.contains('mega-carousel') || grid.classList.contains('mega-super');
    prods.forEach((p,idx)=>{
      const card = document.createElement('article'); card.className='product-card';
      const titleTag = isMega ? 'h4' : 'h3';
      const mediaClazz = isMega ? 'card-media' : 'card-media';
      const bodyHtml = `\n        <a class="card-link" href="product.html?id=${p.id}">\n          <div class="${mediaClazz}"><img src="${p.img}" alt="${p.name}"></div>\n        </a>\n        <div class="card-body">\n          <a class="card-link" href="product.html?id=${p.id}"><${titleTag} class="product-title">${p.name}</${titleTag}></a>\n          <div class="product-meta muted">${p.cat}</div>\n          <div class="price">${p.price.toLocaleString('hu-HU')} Ft</div>\n          <div class="card-footer"><button data-id="${p.id}" class="btn btn-primary add-btn">Kosárba</button></div>\n        </div>\n      `;
      card.innerHTML = bodyHtml;
      grid.appendChild(card);
      if(!isMega && ((idx+1)%6===0)){
        const promo = document.createElement('div'); promo.className='promo-card product-card'; promo.innerHTML = '<strong>Promóció</strong><div class="muted">Különleges ajánlat</div>';
        grid.appendChild(promo);
      }
    });
    // reset scroll
    grid.scrollLeft = 0;

    // bind add buttons
    grid.querySelectorAll('.add-btn').forEach(b=>b.addEventListener('click',e=>{ addToCart(e.currentTarget.dataset.id,1); }));
  }

  // helper: get up to n products matching predicate, fill with others if not enough
  function getNProducts(predicate, n){
    const all = readProducts();
    const matched = predicate ? all.filter(predicate) : all.slice();
    const results = matched.slice(0,n);
    if(results.length < n){
      // fill with other products not already included
      const remaining = all.filter(p=>!results.find(r=>r.id===p.id));
      for(let i=0;i<remaining.length && results.length<n;i++) results.push(remaining[i]);
    }
    return results;
  }

  function addToCart(id,qty){
    const cart = readCart(); const found = cart.find(i=>i.id===id);
    if(found) found.qty += qty; else cart.push({id,qty});
    writeCart(cart); updateCartCount(); alert('Hozzáadva a kosárhoz');
  }

  function updateCartCount(){
    const el = document.getElementById('cart-count'); if(!el) return; el.textContent = readCart().reduce((s,i)=>s+i.qty,0);
  }

  /* ---------- Shop page: search + filters + arrows ---------- */
  function initShop(){
    // prefill search from query
    const urlParams = new URLSearchParams(location.search); const q = urlParams.get('q') || '';
    const searchInput = document.getElementById('global-search'); if(searchInput && q){ searchInput.value = q; }

    // render first page of shop (paginated grid)
    const all = readProducts();
    let shopState = { allFiltered: all, page: 0, perPage: 40 };
    function renderPage(){
      const start = shopState.page * shopState.perPage;
      const pageItems = shopState.allFiltered.slice(start, start + shopState.perPage);
      // render into grid (4 cols x 10 rows)
      renderListAll('product-list-all', pageItems);
      const total = shopState.allFiltered.length;
      const shownFrom = total? start+1:0; const shownTo = Math.min(start+shopState.perPage, total);
      document.getElementById('shop-indicator').textContent = `${shownFrom}–${shownTo} / ${total}`;
      document.getElementById('shop-prev').disabled = shopState.page===0;
      document.getElementById('shop-next').disabled = (start+shopState.perPage)>=total;
    }
    // initialize
    shopState.allFiltered = readProducts(); shopState.page = 0; renderPage();

    // wire search on header to shop behavior: if not on shop page, user typing will navigate to shop
    const globalSearch = document.getElementById('global-search');
    if(globalSearch){
      globalSearch.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); if(location.pathname.endsWith('shop.html')){ applyFiltersAndSearch(); } else { location.href = 'shop.html?q='+encodeURIComponent(globalSearch.value); } } });
      globalSearch.addEventListener('input',debounce(()=>{ if(location.pathname.endsWith('shop.html')) applyFiltersAndSearch(); },300));
    }

  document.getElementById('apply-filters')?.addEventListener('click',()=>{ applyFiltersAndSearch(); });
  document.getElementById('clear-filters')?.addEventListener('click',()=>{ document.querySelectorAll('.filters input[type="checkbox"]').forEach(ch=>ch.checked=false); document.getElementById('min-price').value=''; document.getElementById('max-price').value=''; shopState.allFiltered = readProducts(); shopState.page=0; renderPage(); });

    document.querySelectorAll('.carousel-arrow').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const target = document.getElementById(btn.dataset.target); if(!target) return; const dir = btn.classList.contains('next') ? 1 : -1; slideCarouselPage(target,dir);
      });
    });

    // shop pagination controls
    document.getElementById('shop-prev')?.addEventListener('click',()=>{ if(shopState.page>0){ shopState.page--; renderPage(); window.scrollTo({top:200,behavior:'smooth'}); } });
    document.getElementById('shop-next')?.addEventListener('click',()=>{ const total = shopState.allFiltered.length; if((shopState.page+1)*shopState.perPage < total){ shopState.page++; renderPage(); window.scrollTo({top:200,behavior:'smooth'}); } });

  // populate mega sections if present
    populateMegaSection('mega-bestsellers', p=> (p.tags||[]).includes('bestseller'));
    populateMegaSection('mega-new', p=> (p.tags||[]).includes('new'));
    populateMegaSection('mega-specials', p=> (p.tags||[]).includes('special'));
    populateMegaSection('mega-discounts', p=> (p.tags||[]).includes('discount'));
    populateMegaSection('mega-recommended', p=> (p.tags||[]).includes('recommended'));

  // if a category or filter is requested, render a list view as well
  const params = urlParams; // reuse parsed URLSearchParams
  const cat = params.get('cat'); const filter = params.get('filter');
    const titleEl = document.getElementById('shop-title');
    if(cat){ if(titleEl) titleEl.textContent = 'Bolt — ' + cat; const list = readProducts().filter(p=>p.cat===cat); renderListAll('product-list-all', list); }
    else if(filter){ if(titleEl) titleEl.textContent = 'Bolt — ' + filter; let list = [];
      if(filter==='bestsellers') list = readProducts().filter(p=> (p.tags||[]).includes('bestseller'));
      if(filter==='new') list = readProducts().filter(p=> (p.tags||[]).includes('new'));
      if(filter==='specials') list = readProducts().filter(p=> (p.tags||[]).includes('special'));
      if(filter==='discounts') list = readProducts().filter(p=> (p.tags||[]).includes('discount'));
      renderListAll('product-list-all', list);
    } else {
      // default: show all in the list (collapsed)
      renderListAll('product-list-all', readProducts());
    }
  }

  function renderListAll(elId, items){
    const el = document.getElementById(elId); if(!el) return; el.innerHTML='';
    const prods = items || readProducts();
    prods.forEach(p=>{
      const card = document.createElement('article'); card.className='product-card';
      card.innerHTML = `<a class="card-link" href="product.html?id=${p.id}"><div class="card-media"><img src="${p.img}" alt="${p.name}"></div></a><div class="card-body"><h3 class="product-title">${p.name}</h3><div class="product-meta muted">${p.cat}</div><div class="price">${p.price.toLocaleString('hu-HU')} Ft</div><div class="card-footer"><button data-id="${p.id}" class="btn btn-primary add-btn">Kosárba</button></div></div>`;
      el.appendChild(card);
    });
    // bind add buttons
    el.querySelectorAll('.add-btn').forEach(b=>b.addEventListener('click',e=>{ addToCart(e.currentTarget.dataset.id,1); }));
  }

  function populateMegaSection(elId, predicate){
    const el = document.getElementById(elId); if(!el) return;
    const prods = readProducts().filter(predicate);
    if(!prods.length) {
      // fallback: show first N products
      renderMegaFallback(el, readProducts().slice(0,24));
      return;
    }
    el.innerHTML='';
    prods.forEach(p=>{
      const card = document.createElement('article'); card.className='product-card';
      card.innerHTML = `<a class="card-link" href="product.html?id=${p.id}"><div class="card-media"><img src="${p.img}" alt="${p.name}"></div></a><div class="card-body"><h4 class="product-title">${p.name}</h4><div class="price">${p.price.toLocaleString('hu-HU')} Ft</div></div>`;
      el.appendChild(card);
    });
  }

  function renderMegaFallback(el, prods){ el.innerHTML=''; prods.forEach(p=>{ const card = document.createElement('article'); card.className='product-card'; card.innerHTML = `<a class="card-link" href="product.html?id=${p.id}"><div class="card-media"><img src="${p.img}" alt="${p.name}"></div></a><div class="card-body"><h4 class="product-title">${p.name}</h4><div class="price">${p.price.toLocaleString('hu-HU')} Ft</div></div>`; el.appendChild(card); }); }

  function applyFiltersAndSearch(){
    const q = (document.getElementById('global-search')?.value||'').toLowerCase().trim();
    const cats = Array.from(document.querySelectorAll('.filters input[type=checkbox]:checked')).map(i=>i.getAttribute('data-filter')||i.value).filter(Boolean);
    const min = parseInt(document.getElementById('min-price')?.value||'0',10)||0; const max = parseInt(document.getElementById('max-price')?.value||'0',10)||0;
    let prods = readProducts();
    if(q) prods = prods.filter(p=>p.name.toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q));
    if(cats.length) prods = prods.filter(p=>cats.includes(p.cat));
    if(min) prods = prods.filter(p=>p.price>=min);
    if(max) prods = prods.filter(p=>p.price<=max);
    renderCarousel('product-grid-shop',prods);
  }

  /* ---------- Product page ---------- */
  function initProduct(){
    const params = new URLSearchParams(location.search); const id = params.get('id') || 'p1';
    const p = readProducts().find(x=>x.id===id) || readProducts()[0];
    if(!p) return;
    // main info
    document.getElementById('product-image').src = p.img;
    document.getElementById('product-title').textContent = p.name;
    document.getElementById('product-meta').textContent = `${p.cat} · 500g`;
    document.getElementById('product-price').textContent = p.price.toLocaleString('hu-HU') + ' Ft';
    document.getElementById('product-desc').textContent = p.desc;
    document.getElementById('product-long-desc').textContent = (p.longDesc || p.desc + ' Részletes információk: összetevők, tárolás, adagolás.');

    // gallery thumbnails (use placeholders for demo)
    const thumbs = document.getElementById('gallery-thumbs'); if(thumbs){ thumbs.innerHTML=''; const imgs = [p.img,'assets/placeholder-2.svg','assets/placeholder-3.svg']; imgs.forEach(src=>{ const b = document.createElement('button'); b.className='thumb'; b.innerHTML = `<img src="${src}" alt="thumb" style="width:64px;height:64px;object-fit:cover;border-radius:8px">`; b.addEventListener('click',()=>{ document.getElementById('product-image').src = src; }); thumbs.appendChild(b); }); }

    // reviews placeholder
    const reviewsList = document.getElementById('reviews-list'); if(reviewsList){ reviewsList.innerHTML = '<p class="muted">Nincsenek valós értékelések ebben a demóban.</p>'; }

    // related products (same category)
    const related = readProducts().filter(x=>x.cat === p.cat && x.id !== p.id).slice(0,8);
    renderCarousel('related-products', related);

    document.getElementById('add-to-cart').addEventListener('click',()=>{ const qty = parseInt(document.getElementById('qty').value||1,10); addToCart(p.id,qty); });
  }

  /* ---------- Cart ---------- */
  function initCart(){
    const cartEl = document.getElementById('cart-items'); const totalEl = document.getElementById('cart-total');
    const prods = readProducts(); const cart = readCart();
    if(cart.length===0){cartEl.innerHTML='<p> A kosarad üres. </p>'; totalEl.textContent='0 Ft'; return}
    cartEl.innerHTML=''; let sum=0;
    cart.forEach(item=>{
      const p = prods.find(x=>x.id===item.id); if(!p) return;
      const row = document.createElement('div'); row.className='cart-item';
      row.innerHTML = `<img src="${p.img}" alt="${p.name}" style="width:72px;height:72px;object-fit:cover;border-radius:8px"><div><strong>${p.name}</strong><div class=muted>${p.cat}</div></div><div style="margin-left:auto;text-align:right">${(p.price*item.qty).toLocaleString('hu-HU')} Ft<br><small class=muted>db: <input type=number min=1 value=${item.qty} data-id="${item.id}" class="cart-qty" style="width:64px"></small></div><button data-id="${item.id}" class="btn ghost remove">Törlés</button>`;
      cartEl.appendChild(row); sum += p.price*item.qty;
    });
    totalEl.textContent = sum.toLocaleString('hu-HU') + ' Ft';

    // qty changes
    cartEl.querySelectorAll('.cart-qty').forEach(inp=>inp.addEventListener('change',e=>{ const id = e.currentTarget.dataset.id; const v = parseInt(e.currentTarget.value,10)||1; const c = readCart(); const it = c.find(x=>x.id===id); if(it){it.qty=v; writeCart(c); initCart(); updateCartCount();} }));

    cartEl.querySelectorAll('.remove').forEach(btn=>btn.addEventListener('click',e=>{ const id = e.currentTarget.dataset.id; let c = readCart(); c = c.filter(x=>x.id!==id); writeCart(c); initCart(); updateCartCount(); }));

    document.getElementById('checkout').addEventListener('click',()=>{ alert('Checkout demo - nincs tényleges fizetés a prototípusban.'); });
  }

  /* ---------- Admin (disabled in UI) ---------- */
  function initAdmin(){
    console.info('Admin UI is not enabled in this demo. Use localStorage to manage products.');
  }

  /* ---------- Helpers ---------- */
  // slide by one viewport (page)
  function slideCarouselPage(container,dir){
    if(!container) return;
    // prefer viewport width of the container; if children exist estimate by child width * visible count
    let width = container.clientWidth;
    const firstCard = container.querySelector('.product-card');
    if(width <= 0 && firstCard){ width = firstCard.clientWidth * 5; }
    if(!width || width<=0) width = 800; // safe fallback
    try{ container.scrollBy({left:dir*width,behavior:'smooth'}); }catch(e){ container.scrollLeft += dir*width; }
  }

  function debounce(fn,ms){let t; return (...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};}

})();
