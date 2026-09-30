<?php
/**
 * Outsourcify — ფრონტ-კონტროლერი. ყველა საჯარო მისამართი აქ გადის (.htaccess / router.php):
 * გვერდები, სერვისები, /sitemap.xml, /robots.txt და 404.
 */
declare(strict_types=1);
require_once __DIR__ . '/inc/layout.php';

$uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
$path = (string) parse_url($uri, PHP_URL_PATH);

/* ერთი კანონიკური ფორმა: ბოლო სლეში მხოლოდ /en/-ზე */
if ($path === '/en') {
    os_redirect('/en/', 301);
}
if ($path !== '/' && $path !== '/en/' && str_ends_with($path, '/')) {
    os_redirect(rtrim($path, '/'), 301);
}

$r = route($uri);
os_lang($r['lang']);

/* ---------------------------------------------------------------- sitemap */
if ($r['type'] === 'sitemap') {
    header('Content-Type: application/xml; charset=utf-8');
    $base = base_url();
    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
         . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' . "\n";
    $entry = static function (array $alts, string $lastmod, string $prio) use ($base): string {
        $out = '';
        foreach ($alts as $l => $u) {
            $out .= '  <url><loc>' . e($base . $u) . '</loc><lastmod>' . $lastmod . '</lastmod><priority>' . $prio . '</priority>';
            foreach ($alts as $l2 => $u2) {
                $out .= '<xhtml:link rel="alternate" hreflang="' . $l2 . '" href="' . e($base . $u2) . '"/>';
            }
            $out .= '<xhtml:link rel="alternate" hreflang="x-default" href="' . e($base . $alts[OS_DEFAULT_LANG]) . '"/></url>' . "\n";
        }
        return $out;
    };
    $mt = static fn(string $f) => date('Y-m-d', (int) (@filemtime(OS_CONTENT . "/$f.json") ?: time()));
    foreach (pages() as $p) {
        if (!empty($p['hidden']) || !empty($p['noindex'])) {
            continue;
        }
        $alts = [];
        foreach (OS_LANGS as $l) {
            $alts[$l] = url_page((string) $p['id'], $l);
        }
        $prio = ($p['template'] ?? '') === 'home' ? '1.0' : (in_array($p['id'], ['privacy', 'terms'], true) ? '0.3' : '0.8');
        $xml .= $entry($alts, $mt('pages'), $prio);
    }
    foreach (services() as $s) {
        $alts = [];
        foreach (OS_LANGS as $l) {
            $alts[$l] = url_service($s, $l);
        }
        $xml .= $entry($alts, $mt('services'), '0.9');
    }
    echo $xml . '</urlset>';
    exit;
}

/* ----------------------------------------------------------------- robots */
if ($r['type'] === 'robots') {
    header('Content-Type: text/plain; charset=utf-8');
    if (!empty(site()['settings']['noindex_all'])) {
        echo "User-agent: *\nDisallow: /\n";
        exit;
    }
    echo "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /content/\nDisallow: /inc/\n\n"
       . 'Sitemap: ' . base_url() . "/sitemap.xml\n";
    exit;
}

/* ------------------------------------------------------------ გვერდები */
$homeCrumb = [t('home'), url_page('home')];

if ($r['type'] === 'page') {
    $p = $r['page'];
    $name = (string) L($p['title'] ?? '');
    $isHome = ($p['template'] ?? '') === 'home';
    $crumbs = $isHome ? [$homeCrumb] : [$homeCrumb, [$name, url_page((string) $p['id'])]];
    $body = render_blocks((array) ($p['blocks'] ?? []), ['crumbs' => $crumbs]);
    $types = ['about' => 'AboutPage', 'contact' => 'ContactPage', 'faq' => 'FAQPage', 'services' => 'CollectionPage', 'book' => 'ContactPage'];
    $meta = [
        'title' => seo_title($p, $name),
        'description' => seo_desc($p),
        'crumbs' => $crumbs,
        'image' => (string) ($p['og_image'] ?? ''),
        'noindex' => !empty($p['noindex']),
        'page_type' => ($p['id'] ?? '') === 'faq' ? 'WebPage' : ($types[$p['id']] ?? 'WebPage'),
        'list_services' => ($p['id'] ?? '') === 'services',
        'body_class' => 'page-' . os_slug((string) $p['id']) . (($p['id'] ?? '') === 'book' ? ' is-booking' : ''),
    ];
    echo render_document($meta, $body, $r);
    exit;
}

if ($r['type'] === 'service') {
    $s = $r['service'];
    $name = (string) L($s['title'] ?? '');
    $sp = page_by_id('services');
    $crumbs = [$homeCrumb, [(string) L($sp['title'] ?? t('services')), url_page('services')], [$name, url_service($s)]];
    $body = render_service($s, ['crumbs' => $crumbs]);
    $meta = [
        'title' => seo_title($s, $name),
        'description' => seo_desc($s, (string) L($s['short'] ?? '')),
        'crumbs' => $crumbs,
        'image' => (string) ($s['image'] ?? ''),
        'service' => $s,
        'body_class' => 'page-service',
    ];
    echo render_document($meta, $body, $r);
    exit;
}

/* -------------------------------------------------------------------- 404 */
http_response_code(404);
$body = '<section class="nf"><div class="container nf__in">' . logo_mark('nf__ring')
      . '<p class="nf__code" aria-hidden="true">404</p><h1 class="nf__title">' . e(t('not_found_title')) . '</h1>'
      . '<p class="nf__text">' . e(t('not_found_text')) . '</p><div class="nf__actions">'
      . btn(t('back_home'), 'page:home', 'primary') . btn(t('explore'), 'page:services', 'ghost') . '</div></div></section>';
echo render_document([
    'title' => t('not_found_title') . ' | Outsourcify', 'description' => t('not_found_text'),
    'crumbs' => [], 'noindex' => true, 'body_class' => 'page-404',
], $body, $r);
