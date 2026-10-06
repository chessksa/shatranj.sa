const desktop=window.matchMedia('(min-width:901px)');

async function applyApprovedBackground(){
  if(!desktop.matches) return;
  const urls=Array.from({length:6},(_,index)=>
    new URL(`../../assets/site-bg-part-${String(index+1).padStart(2,'0')}.txt?v=20261007-bg-final1`,import.meta.url)
  );

  try{
    const parts=await Promise.all(urls.map(async url=>{
      const response=await fetch(url,{cache:'no-store'});
      if(!response.ok) throw new Error(`background part ${response.status}`);
      return (await response.text()).trim();
    }));

    const dataUrl=`data:image/webp;base64,${parts.join('')}`;
    const preload=new Image();
    preload.decoding='async';
    preload.src=dataUrl;

    const paint=()=>{
      if(!document.body) return;
      document.body.style.setProperty(
        'background',
        `linear-gradient(rgba(1,26,29,.58),rgba(1,22,25,.68)),url("${dataUrl}") center center / cover no-repeat fixed`,
        'important'
      );
      document.documentElement.classList.add('approved-site-background-ready');
    };

    if(preload.decode){
      await preload.decode().catch(()=>{});
      paint();
    }else{
      preload.onload=paint;
      preload.onerror=paint;
    }
  }catch(error){
    console.error('تعذر تحميل الخلفية المعتمدة',error);
  }
}

applyApprovedBackground();
desktop.addEventListener?.('change',event=>{
  if(event.matches) applyApprovedBackground();
});
