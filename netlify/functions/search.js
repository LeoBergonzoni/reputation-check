// netlify/functions/search.js
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

exports.handler = async (event) => {
  try {
    const { q = "", dateRestrict = "", num = "10" } = event.queryStringParameters || {};
    if (!q) return resp(400, { error: "Missing query ?q=" });

    const key = process.env.GOOGLE_CSE_API_KEY;
    const cx  = process.env.GOOGLE_CSE_CX;
    if (!key || !cx) return resp(500, { error: "Server not configured: missing env vars" });

    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", key);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", q);
    url.searchParams.set("num", num);
    if (dateRestrict) url.searchParams.set("dateRestrict", dateRestrict);

    const r = await fetch(url.toString());
    const data = await r.json();

    const items = (data.items || []).map(it => ({
      title: it.title,
      link: it.link,
      snippet: it.snippet || (it.pagemap && it.pagemap.metatags && it.pagemap.metatags[0]?.description) || ""
    }));

    return resp(200, { items });
  } catch (e) {
    return resp(500, { error: e.message });
  }
};

function resp(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}