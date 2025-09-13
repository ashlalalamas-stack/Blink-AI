export interface Source { title: string; url: string; date?: string }

const ALLOWED_HOSTS = ['wikipedia.org','example.com','news.ycombinator.com'];

function allowed(url: string): boolean {
  const host = new URL(url).hostname;
  return ALLOWED_HOSTS.some(h => host === h || host.endsWith('.'+h));
}

export async function browse(q: string, maxSources = 3): Promise<Source[]> {
  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  const res = await fetch(searchUrl);
  if(!res.ok) return [];
  const html = await res.text();
  const hrefs = Array.from(html.matchAll(/<a rel="nofollow".*?href="(.*?)"/g)).map(m => m[1]);
  const out: Source[] = [];
  for(const h of hrefs){
    if(!allowed(h)) continue;
    try{
      const r = await fetch(h);
      if(!r.ok) continue;
      const body = await r.text();
      const title = body.match(/<title>(.*?)<\/title>/i)?.[1]?.trim() || '';
      const date = body.match(/<meta[^>]+(?:name|property)=["'](?:date|pubdate|published|article:published_time)["'][^>]*content=["'](.*?)["']/i)?.[1];
      out.push({title,url:h,date});
      if(out.length>=maxSources) break;
    } catch { /* ignore */ }
  }
  return out;
}
