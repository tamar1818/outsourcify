<?php
/**
 * კონტენტის ჩამტვირთავები, მისამართების აგება და მარშრუტიზაცია.
 *   ქართული (მთავარი): /, /chven-shesakheb, /servisebi/<slug>
 *   ინგლისური:         /en/, /en/about-us, /en/services/<slug>
 */
declare(strict_types=1);
require_once __DIR__ . '/core.php';

function site(): array
{
    return os_read('site');
}

function setting(string $key, string $default = ''): string
{
    $v = site()['settings'][$key] ?? $default;
    return is_array($v) ? (string) L($v) : (string) $v;
}

/** @return list<array> */
function pages(): array
{
    return os_read('pages', ['pages' => []])['pages'] ?? [];
}

function page_by_id(string $id): ?array
{
    foreach (pages() as $p) {
        if (($p['id'] ?? '') === $id) {
            return $p;
        }
    }
    return null;
}

/** @return list<array> ხილული სერვისები თანმიმდევრობით */
function services(bool $all = false): array
{
    $list = os_read('services', ['services' => []])['services'] ?? [];
    return array_values(array_filter($list, static fn($s) => $all || empty($s['hidden'])));
}

function service_by_id(string $id): ?array
{
    foreach (services(true) as $s) {
        if (($s['id'] ?? '') === $id) {
            return $s;
        }
    }
    return null;
}

function faqs(string $cat = ''): array
{
    $list = os_read('faqs', ['items' => []])['items'] ?? [];
    return array_values(array_filter($list, static fn($f) =>
        empty($f['hidden']) && ($cat === '' || ($f['category'] ?? '') === $cat)));
}

function testimonials(): array
{
    $list = os_read('testimonials', ['items' => []])['items'] ?? [];
    return array_values(array_filter($list, static fn($t) => empty($t['hidden']) && trim((string) L($t['quote'] ?? '')) !== ''));
}

function industries(): array
{
    $list = os_read('industries', ['items' => []])['items'] ?? [];
    return array_values(array_filter($list, static fn($i) => empty($i['hidden'])));
}

/* ------------------------------------------------------------ მისამართები */
function lang_prefix(?string $lang = null): string
{
    return ($lang ?? os_lang()) === OS_DEFAULT_LANG ? '' : '/' . ($lang ?? os_lang());
}

function url_page(string $id, ?string $lang = null): string
{
    $lang ??= os_lang();
    $p = page_by_id($id);
    if (!$p) {
        return lang_prefix($lang) . '/';
    }
    $slug = (string) ($p['slug'][$lang] ?? '');
    if (($p['template'] ?? '') === 'home' || $slug === '') {
        return lang_prefix($lang) . '/';
    }
    return lang_prefix($lang) . '/' . $slug;
}

function services_base(?string $lang = null): string
{
    $lang ??= os_lang();
    $p = page_by_id('services');
    return (string) ($p['slug'][$lang] ?? ($lang === 'ka' ? 'servisebi' : 'services'));
}

function url_service(array|string $s, ?string $lang = null): string
{
    $lang ??= os_lang();
    if (is_string($s)) {
        $s = service_by_id($s) ?? [];
    }
    $slug = (string) ($s['slug'][$lang] ?? ($s['id'] ?? ''));
    return lang_prefix($lang) . '/' . services_base($lang) . '/' . $slug;
}

/**
 * ბმულის რეფერენსი → მისამართი მიმდინარე ენაზე.
 * page:about · service:tax-consulting · page:contact#form · https://… · tel:… · mailto:… · #anchor
 */
function link_url(string $ref, ?string $lang = null): string
{
    $ref = trim($ref);
    if ($ref === '') {
        return '#';
    }
    $hash = '';
    if (preg_match('~^(page|service):([a-z0-9_-]+)(#[\w-]+)?$~i', $ref, $m)) {
        $hash = $m[3] ?? '';
        return ($m[1] === 'page' ? url_page($m[2], $lang) : url_service($m[2], $lang)) . $hash;
    }
    if (preg_match('~^(https?:|mailto:|tel:|/|#)~i', $ref)) {
        return $ref;
    }
    return '#';
}

function is_external(string $url): bool
{
    return (bool) preg_match('~^https?://~i', $url) && !str_starts_with($url, base_url());
}

/* ---------------------------------------------------------- მარშრუტიზაცია */
/**
 * @return array{type:string, lang:string, page?:array, service?:array, path:string}
 */
function route(string $uri): array
{
    $path = '/' . trim((string) parse_url($uri, PHP_URL_PATH), '/');
    $path = rawurldecode($path);
    $lang = OS_DEFAULT_LANG;
    $rest = ltrim($path, '/');

    foreach (OS_LANGS as $l) {
        if ($l !== OS_DEFAULT_LANG && ($rest === $l || str_starts_with($rest, $l . '/'))) {
            $lang = $l;
            $rest = ltrim(substr($rest, strlen($l)), '/');
            break;
        }
    }

    $out = ['type' => '404', 'lang' => $lang, 'path' => $path];

    if ($lang === OS_DEFAULT_LANG && $rest === 'sitemap.xml') {
        return ['type' => 'sitemap'] + $out;
    }
    if ($lang === OS_DEFAULT_LANG && $rest === 'robots.txt') {
        return ['type' => 'robots'] + $out;
    }

    $visible = static fn(array $p): bool => empty($p['hidden']);

    if ($rest === '') {
        foreach (pages() as $p) {
            if (($p['template'] ?? '') === 'home') {
                return ['type' => 'page', 'page' => $p] + $out;
            }
        }
        return $out;
    }

    $parts = explode('/', $rest);
    if (count($parts) === 1) {
        foreach (pages() as $p) {
            if (($p['template'] ?? '') !== 'home' && ($p['slug'][$lang] ?? null) === $parts[0] && $visible($p)) {
                return ['type' => 'page', 'page' => $p] + $out;
            }
        }
    } elseif (count($parts) === 2 && $parts[0] === services_base($lang)) {
        foreach (services() as $s) {
            if (($s['slug'][$lang] ?? null) === $parts[1]) {
                return ['type' => 'service', 'service' => $s] + $out;
            }
        }
    }
    return $out;
}

/** იგივე გვერდის მისამართი ყველა ენაზე (hreflang-ისა და ენის გადამრთველისთვის) */
function alternates(array $r): array
{
    $out = [];
    foreach (OS_LANGS as $l) {
        if (isset($r['service'])) {
            $out[$l] = url_service($r['service'], $l);
        } elseif (isset($r['page'])) {
            $out[$l] = url_page((string) $r['page']['id'], $l);
        } else {
            $out[$l] = lang_prefix($l) . '/';
        }
    }
    return $out;
}
