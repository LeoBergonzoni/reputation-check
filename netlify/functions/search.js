// netlify/functions/search.js
exports.handler = async (event) => {
    try {
      const { q = "", dateRestrict = "", num = "10" } = event.queryStringParameters || {};
      if (!q) return json(400, { error: "Missing query ?q=" });
  
      const key = process.env.GOOGLE_CSE_API_KEY;
      const cx  = process.env.GOOGLE_CSE_CX;
      if (!key || !cx) return json(500, { error: "Server not configured: missing env vars" });
  
      const url = new URL("https://www.googleapis.com/customsearch/v1");
      url.searchParams.set("key", key);
      url.searchParams.set("cx", cx);
      url.searchParams.set("q", q);
      url.searchParams.set("num", num);
      if (dateRestrict) url.searchParams.set("dateRestrict", dateRestrict); // es: m6, y1, y2
  
      const r = await fetch(url.toString()); // ← fetch nativo di Node 18
      if (!r.ok) {
        const text = await r.text();
        return json(r.status, { error: "Google CSE error", details: text });
      }
      const data = await r.json();
      const items = (data.items || []).map(it => ({
        title: it.title,
        link: it.link,
        snippet: it.snippet || (it.pagemap && it.pagemap.metatags && it.pagemap.metatags[0]?.description) || ""
      }));
  
      return json(200, { items });
    } catch (e) {
      return json(500, { error: e.message });
    }
  };
  
  function json(statusCode, body) {
    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(body)
    };
  }