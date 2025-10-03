/* Minimal demo JS: product data, carousel, cart + admin CRUD using localStorage */
(function(){
  const LS_PRODUCTS = 'wm_products_v1';
  const LS_CART = 'wm_cart_v1';

  const defaults = [
    {id:'p1',name:'BARF Csirkemell 1kg',price:3499,cat:'dogs',img:'assets/placeholder-1.svg',desc:'Friss csirkemell, ideális kölyöknek.'},
    {id:'p2',name:'BARF Marha 500g',price:2799,cat:'cats',img:'assets/placeholder-2.svg',desc:'Kalciumban gazdag.'},
    {id:'p3',name:'Reptile Mix 200g',price:1499,cat:'exotics',img:'assets/placeholder-3.svg',desc:'Különleges hüllőknek.'}
  ];

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

    const page = document.body.dataset.page;
    if(page==='home') initHome();
    if(page==='shop') initShop();
    if(page==='product') initProduct();
    if(page==='cart') initCart();
    if(page==='admin') initAdmin();
  });

  function initHome(){
    const slides = [
      {id:'s1',text:'Friss BARF alapok – Hűtött kiszállítás'},
      {id:'s2',text:'Kutyáknak és macskáknak - válogatott alapanyagok'},
      {id:'s3',text:'Exotikus speciális keverékek'}
    ];
    const carousel = document.getElementById('hero-carousel');
    slides.forEach(s=>{
      const slide = document.createElement('div'); slide.className='slide'; slide.textContent = s.text; carousel.appendChild(slide);
    });
    // rotate
    let idx=0; setInterval(()=>{
      const slides = carousel.querySelectorAll('.slide'); if(!slides.length) return;
      slides.forEach((el,i)=>el.style.display = (i===idx)?'flex':'none');
      idx = (idx+1)%slides.length;
    },4000);

    renderGrid('product-grid');
  }

  function renderGrid(elId){
    const grid = document.getElementById(elId); if(!grid) return;
    grid.innerHTML='';
    const prods = readProducts();
    prods.forEach(p=>{
      const card = document.createElement('article'); card.className='product-card';
      card.innerHTML = `
        <a class="card-link" href="product.html?id=${p.id}">
          <div class="product-media"><img src="${p.img}" alt="${p.name}"></div>
        </a>
        <div class="product-body">
          <a class="card-link" href="product.html?id=${p.id}"><h3 class="product-title">${p.name}</h3></a>
          <div class="product-meta muted">${p.cat}</div>
          <div class="price">${p.price.toLocaleString('hu-HU')} Ft</div>
          <div class="actions"><button data-id="${p.id}" class="btn primary add-btn">Kosárba teszem</button></div>
        </div>
      `;
      // full-card hover effect handled by CSS; attach add listener
      grid.appendChild(card);
    });

    document.querySelectorAll('.add-btn').forEach(b=>b.addEventListener('click',e=>{
      const id = e.currentTarget.dataset.id; addToCart(id,1);
    }));
  }

  function addToCart(id,qty){
    const cart = readCart(); const found = cart.find(i=>i.id===id);
    if(found) found.qty += qty; else cart.push({id,qty});
    writeCart(cart); updateCartCount(); alert('Hozzáadva a kosárhoz');
  }

  function updateCartCount(){
    const el = document.getElementById('cart-count'); if(!el) return; el.textContent = readCart().reduce((s,i)=>s+i.qty,0);
  }

  function initShop(){ renderGrid('product-grid-shop'); }

  function initProduct(){
    const params = new URLSearchParams(location.search); const id = params.get('id') || 'p1';
    const p = readProducts().find(x=>x.id===id) || readProducts()[0];
    if(!p) return;
    document.getElementById('product-image').src = p.img;
    document.getElementById('product-title').textContent = p.name;
    document.getElementById('product-meta').textContent = `${p.cat} · 500g`;
    document.getElementById('product-price').textContent = p.price.toLocaleString('hu-HU') + ' Ft';
    document.getElementById('product-desc').textContent = p.desc;
    document.getElementById('add-to-cart').addEventListener('click',()=>{
      const qty = parseInt(document.getElementById('qty').value||1,10); addToCart(p.id,qty);
    });
  }

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
    cartEl.querySelectorAll('.cart-qty').forEach(inp=>inp.addEventListener('change',e=>{
      const id = e.currentTarget.dataset.id; const v = parseInt(e.currentTarget.value,10)||1; const c = readCart(); const it = c.find(x=>x.id===id); if(it){it.qty=v; writeCart(c); initCart(); updateCartCount();}
    }));

    cartEl.querySelectorAll('.remove').forEach(btn=>btn.addEventListener('click',e=>{
      const id = e.currentTarget.dataset.id; let c = readCart(); c = c.filter(x=>x.id!==id); writeCart(c); initCart(); updateCartCount();
    }));

    document.getElementById('checkout').addEventListener('click',()=>{alert('Checkout demo - nincs tényleges fizetés a prototípusban.');});
  }

  function initAdmin(){
    const form = document.getElementById('product-form'); const list = document.getElementById('admin-list');
    function renderAdmin(){
      const ps = readProducts(); list.innerHTML=''; ps.forEach(p=>{
        const card = document.createElement('article'); card.className='product-card'; card.innerHTML = `
          <div class="product-media"><img src="${p.img}" alt="${p.name}"></div>
          <div class="product-body">
            <h3 class="product-title">${p.name}</h3>
            <div class="price">${p.price.toLocaleString('hu-HU')} Ft</div>
            <div class="actions"><button data-id="${p.id}" class="btn ghost edit">Szerkeszt</button><button data-id="${p.id}" class="btn ghost del">Töröl</button></div>
          </div>
        `; list.appendChild(card);
      });
      list.querySelectorAll('.edit').forEach(b=>b.addEventListener('click',e=>{
        const id=e.currentTarget.dataset.id; const p = readProducts().find(x=>x.id===id); if(!p) return; document.getElementById('p-id').value=p.id; document.getElementById('p-name').value=p.name; document.getElementById('p-price').value=p.price; document.getElementById('p-cat').value=p.cat; document.getElementById('p-img').value=p.img; document.getElementById('p-desc').value=p.desc;
      }));
      list.querySelectorAll('.del').forEach(b=>b.addEventListener('click',e=>{
        const id = e.currentTarget.dataset.id; let ps = readProducts(); ps = ps.filter(x=>x.id!==id); writeProducts(ps); renderAdmin();
      }));
    }
    renderAdmin();

    document.getElementById('save-product').addEventListener('click',e=>{
      e.preventDefault(); const id = document.getElementById('p-id').value || ('p'+Date.now()); const p = {id:id,name:document.getElementById('p-name').value || 'Új termék',price:parseInt(document.getElementById('p-price').value,10)||0,cat:document.getElementById('p-cat').value,img:document.getElementById('p-img').value||'assets/placeholder-1.svg',desc:document.getElementById('p-desc').value}; let ps = readProducts(); const idx = ps.findIndex(x=>x.id===id); if(idx>=0){ps[idx]=p}else{ps.unshift(p)} writeProducts(ps); renderAdmin(); form.reset(); document.getElementById('p-id').value='';
    });
    document.getElementById('reset-product').addEventListener('click',()=>{document.getElementById('p-id').value=''; form.reset();});
  }

})();
// Simple carousel placeholder - cycles slides every 4s
(function(){
  const slides = document.querySelectorAll('.carousel .slide');
  if(!slides.length) return;
  let idx = 0;
  setInterval(()=>{
    slides[idx].classList.remove('current');
    idx = (idx+1) % slides.length;
    slides[idx].classList.add('current');
  },4000);
})();
