<?xml version="1.0" encoding="UTF-8"?>
<!-- sitemap.xml-ის ადამიანისთვის წასაკითხი ხედი ბრაუზერში. Google XML-ს უცვლელად კითხულობს. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  exclude-result-prefixes="s xhtml image">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html lang="ka">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>Sitemap — Outsourcify</title>
<style>
@font-face { font-family: "TBCX"; src: url("/assets/fonts/tbcx-regular.woff2") format("woff2"); font-weight: 400; }
@font-face { font-family: "TBCX"; src: url("/assets/fonts/tbcx-bold.woff2") format("woff2"); font-weight: 700; }
* { box-sizing: border-box; }
body { margin: 0; font-family: "TBCX", system-ui, -apple-system, "Segoe UI", sans-serif; background: #f3f6f9; color: #0b1a2c; font-size: 15px; line-height: 1.5; }
.wrap { max-width: 1120px; margin: 0 auto; padding: 32px 20px 64px; }
.head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
h1 { margin: 0; font-size: 1.8rem; letter-spacing: -.02em; }
.sub { margin: 6px 0 0; color: #5b697c; }
.stats { display: flex; gap: 8px; flex-wrap: wrap; }
.stat { padding: 8px 14px; border-radius: 999px; background: #fff; border: 1px solid #e1e7ee; font-weight: 700; font-size: .88rem; }
.stat span { color: #5b697c; font-weight: 400; }
.note { margin: 0 0 18px; padding: 12px 16px; border-radius: 14px; background: #eaf3fc; color: #0d4e8b; font-size: .9rem; }
.card { background: #fff; border: 1px solid #e1e7ee; border-radius: 20px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-size: .78rem; text-transform: uppercase; letter-spacing: .04em; color: #5b697c; background: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e1e7ee; }
td { padding: 12px 16px; border-bottom: 1px solid #eef2f6; vertical-align: top; }
tr:last-child td { border-bottom: 0; }
tr:hover td { background: #f8fbff; }
a { color: #0d4e8b; text-decoration: none; word-break: break-all; }
a:hover { text-decoration: underline; }
.lang { display: inline-block; min-width: 34px; padding: 2px 8px; border-radius: 999px; font-size: .74rem; font-weight: 700; text-align: center; }
.ka { background: #eaf3fc; color: #0d4e8b; }
.en { background: #eefaf2; color: #1f5e36; }
.alt { display: block; margin-top: 3px; font-size: .82rem; color: #5b697c; }
.prio { display: inline-block; width: 60px; height: 6px; border-radius: 6px; background: #e8edf3; vertical-align: middle; overflow: hidden; margin-right: 8px; }
.prio i { display: block; height: 100%; background: #3370e3; }
.num { color: #5b697c; font-size: .85rem; white-space: nowrap; }
@media (max-width: 720px) { .hide-sm { display: none; } td, th { padding: 10px 12px; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <div>
      <h1>Outsourcify — Sitemap</h1>
      <p class="sub">საიტის ყველა გვერდი, რომელიც საძიებო სისტემებისთვისაა განკუთვნილი · All pages submitted to search engines</p>
    </div>
    <div class="stats">
      <span class="stat"><xsl:value-of select="count(s:urlset/s:url)"/> <span>URL</span></span>
      <span class="stat"><xsl:value-of select="count(s:urlset/s:url[not(contains(s:loc, '.ge/en/'))])"/> <span>ქართ.</span></span>
      <span class="stat"><xsl:value-of select="count(s:urlset/s:url[contains(s:loc, '.ge/en/')])"/> <span>English</span></span>
      <span class="stat"><xsl:value-of select="count(s:urlset/s:url/image:image)"/> <span>სურათი</span></span>
    </div>
  </div>
  <p class="note">ეს არის XML საიტმეპი Google-ისა და სხვა საძიებოებისთვის. Search Console-ში დაამატეთ: <b>https://outsourcify.ge/sitemap.xml</b></p>
  <div class="card">
    <table>
      <thead><tr><th>#</th><th>ენა</th><th>გვერდი</th><th class="hide-sm">პრიორიტეტი</th><th class="hide-sm">სურათები</th><th class="hide-sm">განახლდა</th></tr></thead>
      <tbody>
        <xsl:for-each select="s:urlset/s:url">
          <xsl:variable name="en" select="contains(s:loc, '.ge/en/')"/>
          <tr>
            <td class="num"><xsl:value-of select="position()"/></td>
            <td><xsl:choose><xsl:when test="$en"><span class="lang en">EN</span></xsl:when><xsl:otherwise><span class="lang ka">KA</span></xsl:otherwise></xsl:choose></td>
            <td>
              <a href="{s:loc}"><xsl:value-of select="s:loc"/></a>
              <xsl:for-each select="xhtml:link[@hreflang != 'x-default'][@href != current()/s:loc]">
                <span class="alt">↔ <xsl:value-of select="@hreflang"/>: <a href="{@href}"><xsl:value-of select="@href"/></a></span>
              </xsl:for-each>
            </td>
            <td class="hide-sm num"><span class="prio"><i style="width:{s:priority * 100}%"></i></span><xsl:value-of select="s:priority"/></td>
            <td class="hide-sm num"><xsl:value-of select="count(image:image)"/></td>
            <td class="hide-sm num"><xsl:value-of select="s:lastmod"/></td>
          </tr>
        </xsl:for-each>
      </tbody>
    </table>
  </div>
</div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
