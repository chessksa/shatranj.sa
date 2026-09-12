import { supabase, getSessionPlayer, rpc, escapeHtml } from '../platform/api.mjs';
const $=id=>document.getElementById(id);
let lessons=[],progress=new Map(),active=null,category='all',player=null;
