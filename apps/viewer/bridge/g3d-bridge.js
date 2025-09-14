/* Minimal bridge — publica una API global y reenvía mensajes al iframe del viewer */
(function(){
  const log = (...a)=>console.debug('[G3D Bridge]', ...a);
  function findIframe(){
    return document.querySelector('#g3d-viewer iframe');
  }
  const api = {
    apply(topic, payload){
      const iframe = findIframe();
      if (!iframe || !iframe.contentWindow){ log('iframe not ready'); return; }
      iframe.contentWindow.postMessage({ type:'g3d:apply', topic, payload }, '*');
    }
  };
  window.GAFAS3D = Object.assign(window.GAFAS3D || {}, api);
  window.G3DWizard = { apply: api.apply };
  window.gafas3dApply = api.apply;

  window.addEventListener('message', (ev)=>{
    if (!ev || !ev.data) return;
    if (ev.data.type === 'viewer:ready') log('viewer ready');
    if (ev.data.type === 'viewer:change') log('viewer change', ev.data);
  });
  log('bridge loaded');
})();
