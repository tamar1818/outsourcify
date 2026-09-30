<?php
/**
 * გვერდის ჩარჩო: <head> (SEO, Open Graph, hreflang, Schema.org), ჰედერი, mega-menu,
 * მობილური მენიუ, ფუტერი, ჩატ-დაჯავშნის კონფიგურაცია.
 */
declare(strict_types=1);
require_once __DIR__ . '/blocks.php';

function lang_names(): array
{
    return ['ka' => ['short' => 'ქარ', 'name' => 'ქართული'], 'en' => ['short' => 'EN', 'name' => 'English']];
}

function lang_switch(array $alts, string $cls = 'lang'): string
{
    $h = '<div class="' . e($cls) . '" role="group" aria-label="' . e(t('lang_switch')) . '">';
    foreach (lang_names() as $l => $n) {
        $cur = $l === os_lang();
        $h .= '<a href="' . e($alts[$l] ?? '/') . '" hreflang="' . $l . '" lang="' . $l . '"'
            . ($cur ? ' aria-current="true" class="is-on"' : '') . ' title="' . e($n['name']) . '">' . e($n['short']) . '</a>';
    }
    return $h . '</div>';
}

function menu_items(string $key): array
{
    return (array) (site()['menus'][$key] ?? []);
}

function current_path(): string
{
    return '/' . trim((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
}

function is_current(string $url): bool
{
    $p = rtrim(current_path(), '/');
    $u = rtrim($url, '/');
    if ($u === '' || $u === '/en') {
        return $p === $u;
    }
    return $p === $u || str_starts_with($p, $u . '/');
}

function mega_menu(): string
{
    $h = '<div class="mega" id="mega-services"><div class="mega__in"><ul class="mega__list" role="list">';
    foreach (services() as $s) {
        $h .= '<li><a class="mega__item" href="' . e(url_service($s)) . '"><span class="mega__ico">' . icon((string) ($s['icon'] ?? 'briefcase')) . '</span>'
            . '<span><b>' . e((string) L($s['title'] ?? '')) . '</b><small>' . e((string) L($s['short'] ?? '')) . '</small></span></a></li>';
    }
    $h .= '</ul><div class="mega__promo">' . logo_mark('mega__ring')
        . '<p class="mega__promo-title">' . e(t('sidebar_title')) . '</p><p>' . e(t('sidebar_text')) . '</p>'
        . btn(t('book_cta'), 'page:book', 'light') . '<a class="mega__all" href="' . e(url_page('services')) . '">' . e(t('all_services')) . icon('arrow-right') . '</a></div>'
        . '</div></div>';
    return $h;
}

function site_header(array $alts): string
{
    $home = url_page('home');
    $h = '<a class="skip" href="#main">' . e(t('skip')) . '</a>'
       . '<header class="hdr" data-header><div class="container hdr__in">'
       . '<a class="hdr__logo" href="' . e($home) . '" aria-label="Outsourcify — ' . e(t('home')) . '">' . logo_lockup() . '</a>'
       . '<nav class="nav" aria-label="Main"><ul class="nav__list" role="list">';
    foreach (menu_items('header') as $i => $m) {
        $url = link_url((string) ($m['link'] ?? ''));
        $label = (string) L($m['label'] ?? '');
        $cur = is_current($url) ? ' aria-current="page"' : '';
        if (!empty($m['mega'])) {
            $h .= '<li class="nav__item nav__item--mega" data-mega><a class="nav__link" href="' . e($url) . '"' . $cur . '>' . e($label) . '</a>'
                . '<button class="nav__caret" type="button" aria-expanded="false" aria-controls="mega-services" aria-label="' . e($label) . ' — ' . e(t('menu')) . '">' . icon('chevron-down') . '</button>'
                . mega_menu() . '</li>';
        } else {
            $h .= '<li class="nav__item"><a class="nav__link" href="' . e($url) . '"' . $cur . '>' . e($label) . '</a></li>';
        }
    }
    $h .= '</ul></nav><div class="hdr__end">' . lang_switch($alts)
        . btn(t('book_short'), 'page:book', 'primary', 'calendar', ' data-open-chat')
        . '<button class="burger" type="button" aria-expanded="false" aria-controls="drawer" aria-label="' . e(t('menu')) . '"><span></span><span></span><span></span></button>'
        . '</div></div></header>';

    // მობილური მენიუ
    $h .= '<div class="drawer" id="drawer" hidden><div class="drawer__in"><nav aria-label="Mobile"><ul class="drawer__list" role="list">';
    foreach (menu_items('header') as $m) {
        $url = link_url((string) ($m['link'] ?? ''));
        $label = (string) L($m['label'] ?? '');
        if (!empty($m['mega'])) {
            $h .= '<li><details class="drawer__acc"><summary>' . e($label) . icon('chevron-down') . '</summary><ul role="list">';
            foreach (services() as $s) {
                $h .= '<li><a href="' . e(url_service($s)) . '">' . icon((string) ($s['icon'] ?? 'briefcase')) . e((string) L($s['title'] ?? '')) . '</a></li>';
            }
            $h .= '<li><a class="drawer__all" href="' . e($url) . '">' . e(t('all_services')) . icon('arrow-right') . '</a></li></ul></details></li>';
        } else {
            $h .= '<li><a href="' . e($url) . '"' . (is_current($url) ? ' aria-current="page"' : '') . '>' . e($label) . '</a></li>';
        }
    }
    $h .= '</ul></nav><div class="drawer__foot">' . btn(t('book_cta'), 'page:book', 'primary') . contact_mini()
        . lang_switch($alts, 'lang lang--lg') . '</div></div></div>';
    return $h;
}

function site_footer(array $alts): string
{
    $s = site()['settings'] ?? [];
    $company = (string) ($s['company'] ?? 'Outsourcify');
    $h = '<footer class="ftr"><div class="container"><div class="ftr__top">'
       . '<div class="ftr__brand"><a href="' . e(url_page('home')) . '" class="ftr__logo" aria-label="Outsourcify">' . logo_lockup() . '</a>'
       . '<p>' . e((string) L($s['footer_text'] ?? '')) . '</p>' . social_links('socials socials--dark') . '</div>';

    $h .= '<div class="ftr__col"><h2 class="ftr__h">' . e(t('services')) . '</h2><ul role="list">';
    foreach (services() as $sv) {
        $h .= '<li><a href="' . e(url_service($sv)) . '">' . e((string) L($sv['title'] ?? '')) . '</a></li>';
    }
    $h .= '</ul></div>';

    foreach (['footer_company' => 'footer_company_title', 'footer_legal' => 'footer_legal_title'] as $menu => $titleKey) {
        $items = menu_items($menu);
        if (!$items) {
            continue;
        }
        $h .= '<div class="ftr__col"><h2 class="ftr__h">' . e((string) L(site()['menus'][$titleKey] ?? '')) . '</h2><ul role="list">';
        foreach ($items as $m) {
            $h .= '<li><a href="' . e(link_url((string) ($m['link'] ?? ''))) . '">' . e((string) L($m['label'] ?? '')) . '</a></li>';
        }
        $h .= '</ul></div>';
    }

    $h .= '<div class="ftr__col ftr__contact"><h2 class="ftr__h">' . e(t('write_us')) . '</h2>' . contact_mini();
    if (($addr = (string) L($s['address'] ?? '')) !== '') {
        $h .= '<p class="ftr__addr">' . icon('pin') . e($addr) . '</p>';
    }
    $h .= '</div></div>';

    $h .= '<div class="ftr__bottom"><p>© ' . date('Y') . ' ' . e($company) . '. ' . e(t('rights')) . '</p>' . lang_switch($alts, 'lang lang--dark') . '</div>'
        . '</div></footer>';

    // მობილურზე მიმაგრებული ზოლი
    $phone = (string) ($s['phone'] ?? '');
    $h .= '<div class="mbar" data-mbar>';
    if ($phone !== '') {
        $h .= '<a class="mbar__call" href="tel:' . e(preg_replace('~[^\d+]~', '', $phone)) . '" aria-label="' . e(t('call_us')) . '">' . icon('phone') . '</a>';
    }
    $h .= btn(t('book_cta'), 'page:book', 'primary', 'calendar', ' data-open-chat') . '</div>';
    return $h;
}

/** ჩატ-დაჯავშნის კონფიგურაცია — JS-ს გადაეცემა JSON-ად */
function chat_config(): string
{
    $keys = ['chat_title', 'chat_sub', 'chat_open', 'chat_nudge', 'chat_step', 'chat_of', 'chat_back', 'chat_continue', 'chat_skip',
        'chat_edit', 'chat_placeholder', 'chat_send', 'chat_q_service', 'chat_q_business', 'chat_business_ph', 'chat_q_support',
        'chat_q_date', 'chat_flexible', 'chat_no_slots', 'chat_q_name', 'chat_q_email', 'chat_q_phone', 'chat_q_message',
        'chat_message_ph', 'chat_q_summary', 'chat_confirm', 'chat_sending', 'chat_done_title', 'chat_done_text', 'chat_done_flex',
        'chat_gcal', 'chat_restart', 'chat_taken', 'chat_s_service', 'chat_s_business', 'chat_s_support', 'chat_s_time',
        'chat_s_contact', 'chat_s_message', 'chat_other', 'f_bad_email', 'f_bad_phone', 'f_required', 'f_error', 'close', 'back_home',
        'f_consent', 'f_name', 'f_email', 'f_phone', 'f_ok_title', 'f_ok_text', 'f_sending'];
    $str = [];
    foreach ($keys as $k) {
        $str[$k] = t($k);
    }
    $svc = array_map(static fn($s) => ['id' => $s['id'], 'title' => (string) L($s['title'] ?? ''), 'icon' => icon((string) ($s['icon'] ?? 'briefcase'))], services());
    $sup = [];
    foreach (['sup_ongoing', 'sup_onetime', 'sup_tax', 'sup_fix', 'sup_staff', 'sup_advice'] as $k) {
        $sup[] = ['id' => substr($k, 4), 'title' => t($k)];
    }
    $cfg = [
        'lang' => os_lang(), 'str' => $str, 'services' => $svc, 'support' => $sup,
        'slots' => '/api/slots.php?lang=' . os_lang(), 'book' => '/api/book.php',
        'bookUrl' => url_page('book'), 'privacy' => url_page('privacy'), 'home' => url_page('home'),
        'icons' => ['check' => icon('check'), 'back' => icon('chevron-left'), 'send' => icon('send'), 'x' => icon('x'),
                    'cal' => icon('calendar'), 'edit' => icon('settings'), 'msg' => icon('message'), 'ok' => icon('check-circle')],
        'mark' => logo_mark('chat__mark'),
    ];
    return '<script type="application/json" id="chat-config">' . json_encode($cfg, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP) . '</script>';
}

/* ------------------------------------------------------------ Schema.org */
function schema_graph(array $meta): array
{
    $base = base_url();
    $s = site()['settings'] ?? [];
    $orgId = $base . '/#organization';
    $lang = os_lang();
    $org = [
        '@type' => ['Organization', 'AccountingService'],
        '@id' => $orgId,
        'name' => (string) ($s['company'] ?? 'Outsourcify'),
        'url' => $base . url_page('home'),
        'logo' => ['@type' => 'ImageObject', 'url' => $base . '/assets/img/brand/outsourcify-logo.png', 'width' => 512, 'height' => 512],
        'image' => $base . '/assets/img/og-image.jpg',
        'description' => (string) L(site()['seo']['org_description'] ?? ''),
        'areaServed' => ['@type' => 'Country', 'name' => 'Georgia'],
        'knowsLanguage' => ['ka', 'en'],
    ];
    if (!empty($s['email'])) {
        $org['email'] = $s['email'];
    }
    if (!empty($s['phone'])) {
        $org['telephone'] = preg_replace('~[^\d+]~', '', (string) $s['phone']);
        $org['contactPoint'] = [['@type' => 'ContactPoint', 'telephone' => $org['telephone'], 'contactType' => 'customer service',
            'availableLanguage' => ['Georgian', 'English'], 'areaServed' => 'GE']];
    }
    if (($addr = (string) L($s['address'] ?? '', 'en')) !== '') {
        $org['address'] = ['@type' => 'PostalAddress', 'streetAddress' => $addr, 'addressLocality' => (string) ($s['city'] ?? 'Tbilisi'), 'addressCountry' => 'GE'];
    }
    $same = array_values(array_filter([$s['facebook'] ?? '', $s['linkedin'] ?? '', $s['instagram'] ?? ''], static fn($u) => str_starts_with((string) $u, 'https://')));
    if ($same) {
        $org['sameAs'] = $same;
    }
    $graph = [$org, [
        '@type' => 'WebSite', '@id' => $base . '/#website', 'url' => $base . '/', 'name' => 'Outsourcify',
        'inLanguage' => ['ka-GE', 'en'], 'publisher' => ['@id' => $orgId],
    ]];

    $pageUrl = $meta['canonical'];
    $page = [
        '@type' => $meta['page_type'] ?? 'WebPage', '@id' => $pageUrl . '#webpage', 'url' => $pageUrl,
        'name' => $meta['title'], 'description' => $meta['description'], 'inLanguage' => $lang === 'ka' ? 'ka-GE' : 'en',
        'isPartOf' => ['@id' => $base . '/#website'], 'about' => ['@id' => $orgId],
    ];
    if (count($meta['crumbs']) > 1) {
        $page['breadcrumb'] = ['@id' => $pageUrl . '#breadcrumb'];
        $items = [];
        foreach ($meta['crumbs'] as $i => [$name, $url]) {
            $items[] = ['@type' => 'ListItem', 'position' => $i + 1, 'name' => $name, 'item' => $base . $url];
        }
        $graph[] = ['@type' => 'BreadcrumbList', '@id' => $pageUrl . '#breadcrumb', 'itemListElement' => $items];
    }
    $graph[] = $page;

    if (!empty($meta['service'])) {
        $sv = $meta['service'];
        $graph[] = [
            '@type' => 'Service', '@id' => $pageUrl . '#service', 'name' => (string) L($sv['title'] ?? ''),
            'serviceType' => (string) L($sv['title'] ?? '', 'en'), 'description' => (string) L($sv['short'] ?? ''),
            'url' => $pageUrl, 'provider' => ['@id' => $orgId], 'areaServed' => ['@type' => 'Country', 'name' => 'Georgia'],
            'availableLanguage' => ['ka', 'en'],
        ];
    }
    if (!empty($meta['list_services'])) {
        $items = [];
        foreach (services() as $i => $sv) {
            $items[] = ['@type' => 'ListItem', 'position' => $i + 1, 'url' => $base . url_service($sv), 'name' => (string) L($sv['title'] ?? '')];
        }
        $graph[] = ['@type' => 'ItemList', 'name' => $meta['title'], 'itemListElement' => $items];
    }
    $faq = faq_registry();
    if ($faq) {
        $graph[] = [
            '@type' => 'FAQPage', '@id' => $pageUrl . '#faq', 'inLanguage' => $page['inLanguage'],
            'mainEntity' => array_map(static fn($f) => ['@type' => 'Question', 'name' => $f['q'],
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => trim(strip_tags(rich_html($f['a'])))]], $faq),
        ];
    }
    return ['@context' => 'https://schema.org', '@graph' => $graph];
}

/* ----------------------------------------------------------- მთლიანი გვერდი */
function render_document(array $meta, string $body, array $route): string
{
    $lang = os_lang();
    $alts = alternates($route);
    $base = base_url();
    $meta['canonical'] = $base . ($alts[$lang] ?? current_path());
    $og = $meta['image'] ?? '';
    $og = $og !== '' ? (preg_match('~^https?://~', $og) ? $og : $base . img_url($og)) : $base . '/assets/img/og-image.jpg';
    $s = site();
    $noindex = !empty($meta['noindex']) || !empty($s['settings']['noindex_all']);

    $h = '<!doctype html><html lang="' . ($lang === 'ka' ? 'ka' : 'en') . '" class="no-js"><head><meta charset="utf-8">'
       . '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
       . '<title>' . e($meta['title']) . '</title>'
       . '<meta name="description" content="' . e($meta['description']) . '">'
       . ($noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">')
       . '<link rel="canonical" href="' . e($meta['canonical']) . '">';
    if (($route['type'] ?? '') !== '404') {
        foreach ($alts as $l => $u) {
            $h .= '<link rel="alternate" hreflang="' . ($l === 'ka' ? 'ka' : 'en') . '" href="' . e($base . $u) . '">';
        }
        $h .= '<link rel="alternate" hreflang="x-default" href="' . e($base . $alts[OS_DEFAULT_LANG]) . '">';
    }
    $h .= '<meta property="og:type" content="website"><meta property="og:site_name" content="Outsourcify">'
        . '<meta property="og:title" content="' . e($meta['title']) . '"><meta property="og:description" content="' . e($meta['description']) . '">'
        . '<meta property="og:url" content="' . e($meta['canonical']) . '"><meta property="og:image" content="' . e($og) . '">'
        . '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
        . '<meta property="og:locale" content="' . ($lang === 'ka' ? 'ka_GE' : 'en_US') . '"><meta property="og:locale:alternate" content="' . ($lang === 'ka' ? 'en_US' : 'ka_GE') . '">'
        . '<meta name="twitter:card" content="summary_large_image">'
        . '<meta name="theme-color" content="#0D4E8B">'
        . '<link rel="icon" href="/assets/img/brand/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="32x32">'
        . '<link rel="apple-touch-icon" href="/assets/img/brand/apple-touch-icon.png">'
        . '<link rel="preload" href="/assets/fonts/tbcx-bold.woff2" as="font" type="font/woff2" crossorigin>'
        . '<link rel="preload" href="/assets/fonts/tbcx-regular.woff2" as="font" type="font/woff2" crossorigin>'
        . '<link rel="stylesheet" href="' . e(asset('assets/css/site.css')) . '">'
        . '<script>document.documentElement.classList.replace("no-js","js")</script>';
    if (($v = trim((string) ($s['settings']['gsc_verification'] ?? ''))) !== '') {
        $h .= '<meta name="google-site-verification" content="' . e($v) . '">';
    }
    $h .= '<script type="application/ld+json">' . json_encode(schema_graph($meta), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) . '</script>';
    if (preg_match('~^G-[A-Z0-9]+$~', $ga = trim((string) ($s['settings']['ga_id'] ?? '')))) {
        $h .= '<script async src="https://www.googletagmanager.com/gtag/js?id=' . $ga . '"></script>'
            . '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","' . $ga . '")</script>';
    }
    $h .= '</head><body class="' . e($meta['body_class'] ?? '') . '">' . logo_sprite() . site_header($alts)
        . '<main id="main" tabindex="-1">' . $body . '</main>' . site_footer($alts)
        . chat_config()
        . '<script src="' . e(asset('assets/js/site.js')) . '" defer></script></body></html>';
    return $h;
}

function seo_title(array $item, string $fallback): string
{
    $t = trim((string) L($item['seo']['title'] ?? ($item['seo_title'] ?? '')));
    return $t !== '' ? $t : $fallback . ' | Outsourcify';
}

function seo_desc(array $item, string $fallback = ''): string
{
    $d = trim((string) L($item['seo']['description'] ?? ($item['seo_desc'] ?? '')));
    return $d !== '' ? $d : $fallback;
}
