// CMS API კლიენტი — ქუქი-სესია + X-CSRF ჰედერი ყველა ცვლილებისთვის
let csrf = "";
export const setCsrf = (t) => { csrf = t || ""; };

async function request(method, url, body, isForm = false) {
  const opts = { method, credentials: "same-origin", headers: {} };
  if (method !== "GET") opts.headers["X-CSRF"] = csrf;
  if (body !== undefined) {
    if (isForm) opts.body = body;
    else {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch("/admin/api" + url, opts);
  let data = null;
  try { data = await res.json(); } catch { /* ცარიელი პასუხი */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || "შეცდომა (" + res.status + ")");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (u) => request("GET", u),
  post: (u, b) => request("POST", u, b ?? {}),
  put: (u, b) => request("PUT", u, b),
  patch: (u, b) => request("PATCH", u, b),
  del: (u) => request("DELETE", u),
  upload: (u, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return request("POST", u, fd, true);
  },
};
