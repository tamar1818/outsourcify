<?php
/**
 * კომპონენტების რენდერერები. ყველა გვერდი ამ ბლოკებისგან იკრიბება —
 * ქართული და ინგლისური ვერსიები ერთსა და იმავე მარკაპს იყენებს, იცვლება მხოლოდ ტექსტი.
 */
declare(strict_types=1);
require_once __DIR__ . '/content.php';
require_once __DIR__ . '/icons.php';
require_once __DIR__ . '/logo.php';
require_once __DIR__ . '/schema.php';

/* ------------------------------------------------------------ რეესტრი */
/** გვერდზე გამოტანილი FAQ-ები — FAQPage schema-სთვის */
function faq_registry(?array $add = null): array
{
    static $items = [];
    if ($add !== null) {
        $items[] = $add;
    }
    return $items;
}

/** სექციის უნიკალური id (ღუზებისთვის) */
function sec_id(string $base): string
{
    static $used = [];
    $id = os_slug($base) ?: 'section';
    $n = $used[$id] = ($used[$id] ?? 0) + 1;
    return $n > 1 ? $id . '-' . $n : $id;
}

/* ----------------------------------------------------------- დამხმარეები */
function btn(string $label, string $ref, string $variant = 'primary', string $iconName = 'arrow-right', string $extra = ''): string
{
    if (trim($label) === '' || trim($ref) === '') {
        return '';
    }
    $url = link_url($ref);
    $ext = is_external($url) ? ' target="_blank" rel="noopener"' : '';
    return '<a class="btn btn--' . e($variant) . '" href="' . e($url) . '"' . $ext . $extra . '><span>' . e($label) . '</span>'
         . ($iconName !== '' ? icon($iconName, 'btn__ico') : '') . '</a>';
}

function cta_btn(array $b, string $n = '', string $variant = 'primary'): string
{
    return btn((string) L($b["cta{$n}_label"] ?? ''), (string) ($b["cta{$n}_link"] ?? ''), $variant);
}

function sec_head(array $b, string $cls = '', string $tag = 'h2'): string
{
    $eyebrow = trim((string) L($b['eyebrow'] ?? ''));
    $title = trim((string) L($b['title'] ?? ''));
    $text = trim((string) L($b['text'] ?? ''));
    if ($eyebrow === '' && $title === '' && $text === '') {
        return '';
    }
    if ($text === '') {
        $cls = str_replace('sec-head--split', '', $cls); // ორსვეტიანი მხოლოდ მაშინ, როცა აღწერაც არის
    }
    $h = '<div class="sec-head ' . e($cls) . '" data-reveal>';
    if ($eyebrow !== '') {
        $h .= '<p class="eyebrow">' . e($eyebrow) . '</p>';
    }
    if ($title !== '') {
        $h .= "<$tag class=\"sec-title\">" . inline_html($title) . "</$tag>";
    }
    if ($text !== '') {
        $h .= '<p class="sec-text">' . inline_html($text) . '</p>';
    }
    return $h . '</div>';
}

/** სურათის ზომები — CLS-ის თავიდან ასაცილებლად width/height ატრიბუტები */
function img_size(string $src): array
{
    static $cache = [];
    if (isset($cache[$src])) {
        return $cache[$src];
    }
    $file = OS_ROOT . '/' . ltrim((string) parse_url($src, PHP_URL_PATH), '/');
    $s = (is_file($file) && !str_ends_with($file, '.svg')) ? @getimagesize($file) : false;
    return $cache[$src] = $s ? [$s[0], $s[1]] : [0, 0];
}

/**
 * <img> srcset-ით: assets/img/photos/NAME.webp-ს აქვს -960 და -560 ვერსიები.
 * $eager — პირველი ეკრანის სურათი (LCP): არ იტვირთება ზარმაცად, fetchpriority=high.
 */
function picture(string $src, string $alt, string $sizes = '100vw', string $cls = '', bool $eager = false): string
{
    if ($src === '') {
        return '';
    }
    $url = img_url($src);
    [$w, $h] = img_size($url);
    $srcset = '';
    if (preg_match('~^(/assets/img/photos/[\w-]+)\.webp$~', $url, $m)) {
        $parts = [];
        foreach (['-560' => 560, '-960' => 960] as $suf => $wd) {
            if (is_file(OS_ROOT . $m[1] . $suf . '.webp')) {
                $parts[] = $m[1] . $suf . '.webp ' . $wd . 'w';
            }
        }
        if ($parts && $w) {
            $parts[] = $url . ' ' . $w . 'w';
            $srcset = ' srcset="' . e(implode(', ', $parts)) . '" sizes="' . e($sizes) . '"';
        }
    }
    return '<img class="' . e($cls) . '" src="' . e($url) . '"' . $srcset . ' alt="' . e($alt) . '"'
         . ($w ? ' width="' . $w . '" height="' . $h . '"' : '')
         . ($eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"') . '>';
}

function check_list(array $items, string $cls = 'checks'): string
{
    if (!$items) {
        return '';
    }
    $h = '<ul class="' . e($cls) . '">';
    foreach ($items as $i) {
        $h .= '<li>' . icon('check', 'checks__ico') . '<span>' . inline_html((string) $i) . '</span></li>';
    }
    return $h . '</ul>';
}

/* ---------------------------------------------------------------- ბლოკები */
function render_blocks(array $blocks, array $ctx = []): string
{
    $out = '';
    $first = true;
    foreach ($blocks as $b) {
        if (!empty($b['hidden'])) {
            continue;
        }
        $fn = 'block_' . ($b['type'] ?? '');
        if (function_exists($fn)) {
            $out .= $fn($b, $ctx + ['first' => $first]);
            $first = false;
        }
    }
    return $out;
}

function block_hero(array $b, array $ctx): string
{
    $img = (string) ($b['image'] ?? '');
    $h = '<section class="hero" aria-labelledby="hero-title">'
       . '<div class="hero__bg" aria-hidden="true"><span class="hero__glow hero__glow--1"></span><span class="hero__glow hero__glow--2"></span></div>'
       . '<div class="container hero__grid"><div class="hero__copy">';
    if (($e = (string) L($b['eyebrow'] ?? '')) !== '') {
        $h .= '<p class="eyebrow eyebrow--live" data-reveal><span class="eyebrow__dot"></span>' . e($e) . '</p>';
    }
    $h .= '<h1 class="hero__title" id="hero-title" data-reveal>' . inline_html((string) L($b['title'] ?? '')) . '</h1>';
    if (($t = (string) L($b['text'] ?? '')) !== '') {
        $h .= '<p class="hero__lead" data-reveal>' . inline_html($t) . '</p>';
    }
    $h .= '<div class="hero__actions" data-reveal>' . cta_btn($b, '1', 'primary') . cta_btn($b, '2', 'ghost') . '</div>';
    $h .= '<div data-reveal>' . check_list((array) L($b['points'] ?? []), 'hero__points') . '</div>';
    $h .= '</div><div class="hero__visual" aria-hidden="' . ($img === '' ? 'true' : 'false') . '">';
    $h .= logo_mark('hero__ring');
    if ($img !== '') {
        $h .= '<div class="hero__photo">' . picture($img, (string) L($b['image_alt'] ?? ''), '(max-width: 900px) 92vw, 46vw', '', true) . '</div>';
    }
    $cards = [
        ['card1', 'file-check', 'fc fc--1', true],
        ['card2', 'bars', 'fc fc--2', false],
        ['card3', 'shield', 'fc fc--3', false],
    ];
    foreach ($cards as [$k, $ic, $cls, $progress]) {
        $txt = (string) L($b[$k] ?? '');
        if ($txt === '') {
            continue;
        }
        $h .= '<div class="' . $cls . '"><span class="fc__ico">' . icon($ic) . '</span><span class="fc__txt">' . e($txt) . '</span>';
        if ($progress) {
            $h .= '<span class="fc__bar"><i></i></span>';
        }
        if ($k === 'card2') {
            $h .= '<span class="fc__chart"><i style="--h:40%"></i><i style="--h:62%"></i><i style="--h:48%"></i><i style="--h:80%"></i><i style="--h:70%"></i><i style="--h:94%"></i></span>';
        }
        $h .= '</div>';
    }
    return $h . '</div></div></section>';
}

function breadcrumbs_html(array $crumbs): string
{
    if (count($crumbs) < 2) {
        return '';
    }
    $h = '<nav class="crumbs" aria-label="' . e(t('breadcrumbs')) . '"><ol>';
    $last = count($crumbs) - 1;
    foreach ($crumbs as $i => [$name, $url]) {
        $h .= $i === $last
            ? '<li><span aria-current="page">' . e($name) . '</span></li>'
            : '<li><a href="' . e($url) . '">' . e($name) . '</a>' . icon('chevron-right', 'crumbs__sep') . '</li>';
    }
    return $h . '</ol></nav>';
}

function block_page_hero(array $b, array $ctx): string
{
    $img = (string) ($b['image'] ?? '');
    $h = '<section class="phero' . ($img !== '' ? ' phero--img' : '') . '"><div class="phero__bg" aria-hidden="true"></div>'
       . '<div class="container phero__grid"><div class="phero__copy">'
       . breadcrumbs_html($ctx['crumbs'] ?? []);
    if (($e = (string) L($b['eyebrow'] ?? '')) !== '') {
        $h .= '<p class="eyebrow" data-reveal>' . e($e) . '</p>';
    }
    $h .= '<h1 class="phero__title" data-reveal>' . inline_html((string) L($b['title'] ?? '')) . '</h1>';
    if (($t = (string) L($b['text'] ?? '')) !== '') {
        $h .= '<p class="phero__lead" data-reveal>' . inline_html($t) . '</p>';
    }
    if (($c = cta_btn($b)) !== '') {
        $h .= '<div class="phero__actions" data-reveal>' . $c . '</div>';
    }
    $h .= '</div>';
    if ($img !== '') {
        $h .= '<div class="phero__media" data-reveal>' . picture($img, (string) L($b['image_alt'] ?? ''), '(max-width: 900px) 92vw, 40vw', '', true)
            . logo_mark('phero__ring') . '</div>';
    }
    return $h . '</div></section>';
}

function block_cards(array $b, array $ctx): string
{
    $variant = (string) ($b['variant'] ?? 'grid');
    $items = (array) ($b['items'] ?? []);
    $dark = $variant === 'bento';
    $id = sec_id((string) L($b['title'] ?? 'cards', 'en'));
    $h = '<section class="section' . ($dark ? ' section--dark' : '') . ' cards-sec cards-sec--' . e($variant) . '" id="' . e($id) . '">';
    if ($dark) {
        $h .= '<div class="section--dark__glow" aria-hidden="true"></div>';
    }
    $h .= '<div class="container">' . sec_head($b, $variant === 'strip' ? 'sec-head--center' : 'sec-head--split');
    $tag = $variant === 'numbered' ? 'ol' : 'ul';
    $ht = trim((string) L($b['title'] ?? '')) === '' ? 'h2' : 'h3'; // სათაურის გარეშე სექციაში იერარქია არ წყდება
    $h .= "<$tag class=\"cards cards--" . e($variant) . ' cards--n' . count($items) . '" role="list">';
    foreach ($items as $i => $it) {
        $h .= '<li class="card" data-reveal style="--d:' . ($i % 4) . '">';
        if ($variant === 'numbered') {
            $h .= '<span class="card__num">' . str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT) . '</span>';
        } elseif (!empty($it['icon'])) {
            $h .= '<span class="card__ico">' . icon((string) $it['icon']) . '</span>';
        }
        $h .= '<div class="card__body"><' . $ht . ' class="card__title">' . inline_html((string) L($it['title'] ?? '')) . '</' . $ht . '>';
        if (($t = (string) L($it['text'] ?? '')) !== '') {
            $h .= '<p class="card__text">' . inline_html($t) . '</p>';
        }
        $h .= '</div></li>';
    }
    $h .= "</$tag>";
    if (($c = cta_btn($b, '', $dark ? 'light' : 'primary')) !== '') {
        $h .= '<div class="sec-actions" data-reveal>' . $c . '</div>';
    }
    return $h . '</div></section>';
}

function service_card(array $s, int $i): string
{
    return '<li class="svc" data-reveal style="--d:' . ($i % 3) . '"><a class="svc__link" href="' . e(url_service($s)) . '">'
         . '<span class="svc__ico">' . icon((string) ($s['icon'] ?? 'briefcase')) . '</span>'
         . '<span class="svc__num">' . str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT) . '</span>'
         . '<h3 class="svc__title">' . e((string) L($s['title'] ?? '')) . '</h3>'
         . '<p class="svc__text">' . e((string) L($s['short'] ?? '')) . '</p>'
         . '<span class="svc__more">' . e(t('learn_more')) . icon('arrow-right') . '</span>'
         . '</a></li>';
}

function block_services(array $b, array $ctx): string
{
    $list = services();
    if (!empty($ctx['exclude'])) {
        $list = array_values(array_filter($list, static fn($s) => ($s['id'] ?? '') !== $ctx['exclude']));
    }
    $limit = (int) ($b['limit'] ?? 0);
    if ($limit > 0) {
        $list = array_slice($list, 0, $limit);
    }
    if (!$list) {
        return '';
    }
    $layout = (string) ($b['layout'] ?? 'grid');
    $h = '<section class="section services-sec" id="' . e(sec_id('services')) . '"><div class="container">'
       . sec_head($b, 'sec-head--split');
    if ($layout === 'list') {
        $h .= '<ol class="svc-list" role="list">';
        foreach ($list as $i => $s) {
            $h .= '<li data-reveal><a class="svc-row" href="' . e(url_service($s)) . '">'
                . '<span class="svc-row__num">' . str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT) . '</span>'
                . '<span class="svc-row__ico">' . icon((string) ($s['icon'] ?? 'briefcase')) . '</span>'
                . '<span class="svc-row__main"><h3 class="svc-row__title">' . e((string) L($s['title'] ?? '')) . '</h3>'
                . '<span class="svc-row__text">' . e((string) L($s['short'] ?? '')) . '</span></span>'
                . '<span class="svc-row__go">' . icon('arrow-up-right') . '</span></a></li>';
        }
        $h .= '</ol>';
    } else {
        $h .= '<ul class="svc-grid" role="list">';
        foreach ($list as $i => $s) {
            $h .= service_card($s, $i);
        }
        $h .= '</ul>';
    }
    if (($c = cta_btn($b, '', 'ghost')) !== '') {
        $h .= '<div class="sec-actions" data-reveal>' . $c . '</div>';
    }
    return $h . '</div></section>';
}

function block_split(array $b, array $ctx): string
{
    $rev = !empty($b['reverse']);
    $img = (string) ($b['image'] ?? '');
    $h = '<section class="section split' . ($rev ? ' split--rev' : '') . '" id="' . e(sec_id((string) L($b['title'] ?? 'split', 'en'))) . '">'
       . '<div class="container split__grid"><div class="split__copy">' . sec_head($b)
       . '<div data-reveal>' . check_list((array) L($b['points'] ?? [])) . '</div>';
    if (($c = cta_btn($b)) !== '') {
        $h .= '<div class="sec-actions sec-actions--left" data-reveal>' . $c . '</div>';
    }
    $h .= '</div>';
    if ($img !== '') {
        $h .= '<div class="split__media" data-reveal><div class="split__photo">'
            . picture($img, (string) L($b['image_alt'] ?? ''), '(max-width: 900px) 92vw, 44vw') . '</div>';
        $bt = (string) L($b['badge_title'] ?? '');
        if ($bt !== '') {
            $h .= '<div class="split__badge"><span class="split__badge-ico">' . icon('check-circle') . '</span><span><b>' . e($bt) . '</b>'
                . e((string) L($b['badge_text'] ?? '')) . '</span></div>';
        }
        $h .= '</div>';
    }
    return $h . '</div></section>';
}

function block_steps(array $b, array $ctx): string
{
    $items = !empty($b['use_global']) ? (array) (site()['process'] ?? []) : (array) ($b['items'] ?? []);
    if (!$items) {
        return '';
    }
    $h = '<section class="section steps-sec" id="' . e(sec_id('process')) . '"><div class="container">' . sec_head($b, 'sec-head--center')
       . '<ol class="steps steps--n' . count($items) . '" data-steps>';
    foreach ($items as $i => $s) {
        $h .= '<li class="step" data-reveal style="--d:' . $i . '"><span class="step__num">' . ($i + 1) . '</span>'
            . '<h3 class="step__title">' . e((string) L($s['title'] ?? '')) . '</h3>'
            . '<p class="step__text">' . inline_html((string) L($s['text'] ?? '')) . '</p></li>';
    }
    $h .= '</ol>';
    if (($c = cta_btn($b)) !== '') {
        $h .= '<div class="sec-actions" data-reveal>' . $c . '</div>';
    }
    return $h . '</div></section>';
}

function block_compare(array $b, array $ctx): string
{
    $rows = (array) ($b['rows'] ?? []);
    if (!$rows) {
        return '';
    }
    $a = (string) L($b['col_a'] ?? '');
    $bb = (string) L($b['col_b'] ?? '');
    $h = '<section class="section compare-sec" id="' . e(sec_id('compare')) . '"><div class="container container--mid">' . sec_head($b, 'sec-head--center')
       . '<div class="compare" data-reveal><table><thead><tr><th scope="col">' . e(t('compare_criteria')) . '</th>'
       . '<th scope="col">' . e($a) . '</th><th scope="col" class="compare__us">' . logo_mark('compare__mark') . e($bb) . '</th></tr></thead><tbody>';
    foreach ($rows as $r) {
        $h .= '<tr><th scope="row">' . e((string) L($r['criterion'] ?? '')) . '</th>'
            . '<td data-label="' . e($a) . '">' . e((string) L($r['a'] ?? '')) . '</td>'
            . '<td data-label="' . e($bb) . '" class="compare__us">' . icon('check-circle', 'compare__ok') . '<span>' . e((string) L($r['b'] ?? '')) . '</span></td></tr>';
    }
    return $h . '</tbody></table></div></div></section>';
}

function block_industries(array $b, array $ctx): string
{
    $list = industries();
    if (!$list) {
        return '';
    }
    $h = '<section class="section section--soft ind-sec" id="' . e(sec_id('industries')) . '"><div class="container">' . sec_head($b, 'sec-head--split')
       . '<ul class="ind-grid" role="list">';
    foreach ($list as $i => $it) {
        $h .= '<li class="ind" data-reveal style="--d:' . ($i % 3) . '"><span class="ind__ico">' . icon((string) ($it['icon'] ?? 'building')) . '</span>'
            . '<h3 class="ind__title">' . e((string) L($it['title'] ?? '')) . '</h3>'
            . '<p class="ind__text">' . inline_html((string) L($it['text'] ?? '')) . '</p></li>';
    }
    $h .= '</ul>';
    if (($c = cta_btn($b)) !== '') {
        $h .= '<div class="sec-actions" data-reveal>' . $c . '</div>';
    }
    return $h . '</div></section>';
}

function block_testimonials(array $b, array $ctx): string
{
    $list = testimonials();
    if (!$list) {
        return ''; // გამოგონილ შეფასებებს არ ვაჩვენებთ — სექცია ჩნდება პირველი რეალური შეფასებისას
    }
    $h = '<section class="section testi-sec" id="' . e(sec_id('testimonials')) . '"><div class="container">' . sec_head($b, 'sec-head--split')
       . '<div class="testi" data-carousel><div class="testi__track" data-carousel-track tabindex="0">';
    foreach ($list as $t) {
        $h .= '<figure class="testi__card">' . icon('quote', 'testi__q') . '<blockquote><p>' . e((string) L($t['quote'] ?? '')) . '</p></blockquote>'
            . '<figcaption>';
        if (!empty($t['photo'])) {
            $h .= '<img src="' . e(img_url((string) $t['photo'])) . '" alt="" width="48" height="48" loading="lazy">';
        } else {
            $h .= '<span class="testi__avatar" aria-hidden="true">' . e(mb_substr((string) ($t['name'] ?? '?'), 0, 1)) . '</span>';
        }
        $h .= '<span><b>' . e((string) ($t['name'] ?? '')) . '</b><small>' . e((string) L($t['role'] ?? '')) . '</small></span></figcaption></figure>';
    }
    $h .= '</div>';
    if (count($list) > 1) {
        $h .= '<div class="testi__nav"><button type="button" class="icon-btn" data-carousel-prev aria-label="' . e(t('prev')) . '">' . icon('chevron-left') . '</button>'
            . '<button type="button" class="icon-btn" data-carousel-next aria-label="' . e(t('next')) . '">' . icon('chevron-right') . '</button></div>';
    }
    return $h . '</div></div></section>';
}

function faq_list(array $items): string
{
    $h = '<div class="faq__list">';
    foreach ($items as $i => $f) {
        $q = (string) L($f['q'] ?? '');
        $a = (string) L($f['a'] ?? '');
        if ($q === '') {
            continue;
        }
        faq_registry(['q' => $q, 'a' => $a]);
        $h .= '<details class="faq__item" data-reveal' . ($i === 0 ? ' open' : '') . '><summary><h3 class="faq__q">' . e($q) . '</h3>'
            . '<span class="faq__toggle" aria-hidden="true">' . icon('plus') . '</span></summary>'
            . '<div class="faq__a"><div>' . rich_html($a) . '</div></div></details>';
    }
    return $h . '</div>';
}

function block_faq(array $b, array $ctx): string
{
    $items = $ctx['faq_items'] ?? faqs((string) ($b['category'] ?? ''));
    $limit = (int) ($b['limit'] ?? 0);
    if ($limit > 0) {
        $items = array_slice($items, 0, $limit);
    }
    if (!$items) {
        return '';
    }
    $h = '<section class="section faq-sec" id="' . e(sec_id('faq')) . '"><div class="container faq"><div class="faq__aside">' . sec_head($b)
       . '<div class="faq__help" data-reveal><span class="faq__help-ico">' . icon('message') . '</span>'
       . '<p><b>' . e(t('sidebar_title')) . '</b>' . e(t('sidebar_text')) . '</p>'
       . btn(t('book_cta'), 'page:book', 'primary') . '</div>';
    if (($c = cta_btn($b, '', 'ghost')) !== '') {
        $h .= '<div class="sec-actions sec-actions--left">' . $c . '</div>';
    }
    return $h . '</div>' . faq_list($items) . '</div></section>';
}

function block_stats(array $b, array $ctx): string
{
    $items = (array) ($b['items'] ?? []);
    if (!$items) {
        return '';
    }
    $h = '<section class="section stats-sec"><div class="container">' . sec_head($b, 'sec-head--center') . '<dl class="stats">';
    foreach ($items as $i => $s) {
        $h .= '<div class="stat" data-reveal style="--d:' . $i . '"><dt>' . e((string) L($s['label'] ?? '')) . '</dt>'
            . '<dd data-count="' . e((string) ($s['value'] ?? '')) . '">' . e((string) ($s['value'] ?? '')) . '</dd></div>';
    }
    return $h . '</dl></div></section>';
}

function block_richtext(array $b, array $ctx): string
{
    $body = rich_html((string) L($b['body'] ?? ''));
    $toc = '';
    if (!empty($b['toc'])) {
        $n = 0;
        $links = '';
        $body = preg_replace_callback('~<h2>(.*?)</h2>~s', static function ($m) use (&$n, &$links) {
            $n++;
            $id = 's' . $n;
            $links .= '<li><a href="#' . $id . '">' . strip_tags($m[1]) . '</a></li>';
            return '<h2 id="' . $id . '">' . $m[1] . '</h2>';
        }, $body) ?? $body;
        if ($links !== '') {
            $toc = '<aside class="prose__toc"><nav aria-label="TOC"><ol>' . $links . '</ol></nav></aside>';
        }
    }
    $title = (string) L($b['title'] ?? '');
    $h = '<section class="section prose-sec"><div class="container' . ($toc ? ' prose-wrap' : ' container--narrow') . '">' . $toc . '<div class="prose">';
    if ($title !== '') {
        $h .= sec_head(['eyebrow' => $b['eyebrow'] ?? '', 'title' => $b['title'] ?? '']);
    }
    return $h . $body . '</div></div></section>';
}

function block_booking(array $b, array $ctx): string
{
    $h = '<section class="section book-sec" id="booking"><div class="container book"><div class="book__aside">' . sec_head($b)
       . '<div data-reveal>' . check_list((array) L($b['points'] ?? [])) . '</div>'
       . contact_mini() . '</div>'
       . '<div class="book__chat" data-reveal><div class="chat chat--inline" data-chat-inline>'
       . '<noscript><p class="chat__noscript">' . e(t('f_error')) . '</p></noscript></div></div>'
       . '</div></section>';
    return $h;
}

function contact_mini(): string
{
    $phone = setting('phone');
    $email = setting('email');
    $h = '<ul class="cmini" role="list">';
    if ($phone !== '') {
        $h .= '<li><a href="tel:' . e(preg_replace('~[^\d+]~', '', $phone)) . '">' . icon('phone') . '<span><small>' . e(t('call_us')) . '</small>' . e($phone) . '</span></a></li>';
    }
    if ($email !== '') {
        $h .= '<li><a href="mailto:' . e($email) . '">' . icon('mail') . '<span><small>' . e(t('write_us')) . '</small>' . e($email) . '</span></a></li>';
    }
    return $h . '</ul>';
}

function contact_form(string $title = ''): string
{
    $opts = '<option value="">' . e(t('f_service_any')) . '</option>';
    foreach (services() as $s) {
        $opts .= '<option value="' . e((string) $s['id']) . '">' . e((string) L($s['title'] ?? '')) . '</option>';
    }
    $h = '<form class="form" data-lead-form novalidate action="/api/lead.php" method="post">';
    if ($title !== '') {
        $h .= '<h2 class="form__title">' . e($title) . '</h2>';
    }
    $field = static function (string $name, string $label, string $type = 'text', bool $req = true, string $auto = '') {
        return '<div class="field"><label for="f-' . $name . '">' . e($label) . ($req ? ' <span aria-hidden="true">*</span>' : '') . '</label>'
            . '<input id="f-' . $name . '" name="' . $name . '" type="' . $type . '"' . ($req ? ' required aria-required="true"' : '')
            . ($auto ? ' autocomplete="' . $auto . '"' : '') . ' aria-describedby="f-' . $name . '-err">'
            . '<p class="field__err" id="f-' . $name . '-err" aria-live="polite"></p></div>';
    };
    $h .= '<div class="form__row">' . $field('name', t('f_name'), 'text', true, 'name') . $field('company', t('f_company'), 'text', false, 'organization') . '</div>'
        . '<div class="form__row">' . $field('email', t('f_email'), 'email', true, 'email') . $field('phone', t('f_phone'), 'tel', true, 'tel') . '</div>'
        . '<div class="field"><label for="f-service">' . e(t('f_service')) . '</label><div class="select"><select id="f-service" name="service">' . $opts . '</select>' . icon('chevron-down') . '</div></div>'
        . '<div class="field"><label for="f-message">' . e(t('f_message')) . '</label><textarea id="f-message" name="message" rows="4"></textarea></div>'
        . '<div class="field field--check"><input id="f-consent" name="consent" type="checkbox" value="yes" required aria-describedby="f-consent-err">'
        . '<label for="f-consent">' . e(t('f_consent')) . ' <a href="' . e(url_page('privacy')) . '">↗</a></label><p class="field__err" id="f-consent-err" aria-live="polite"></p></div>'
        . '<div class="hp" aria-hidden="true"><label>Website<input name="company_website" tabindex="-1" autocomplete="off"></label></div>'
        . '<input type="hidden" name="lang" value="' . e(os_lang()) . '">'
        . '<button class="btn btn--primary btn--block" type="submit"><span>' . e(t('f_send')) . '</span>' . icon('send', 'btn__ico') . '</button>'
        . '<p class="form__status" role="status" aria-live="polite"></p>'
        . '</form>';
    return $h;
}

function block_contact(array $b, array $ctx): string
{
    $s = site()['settings'] ?? [];
    $cards = [];
    if (!empty($s['phone'])) {
        $cards[] = ['phone', t('call_us'), (string) $s['phone'], 'tel:' . preg_replace('~[^\d+]~', '', (string) $s['phone'])];
    }
    if (!empty($s['email'])) {
        $cards[] = ['mail', t('write_us'), (string) $s['email'], 'mailto:' . $s['email']];
    }
    if (($addr = (string) L($s['address'] ?? '')) !== '') {
        $cards[] = ['pin', t('visit_us'), $addr, ''];
    }
    if (($hours = (string) L($s['hours'] ?? '')) !== '') {
        $cards[] = ['clock', t('hours'), $hours, ''];
    }
    $h = '<section class="section contact-sec" id="contact-form"><div class="container contact"><div class="contact__info">' . sec_head($b)
       . '<ul class="ccards" role="list">';
    foreach ($cards as $i => [$ic, $label, $val, $href]) {
        $inner = '<span class="ccard__ico">' . icon($ic) . '</span><span><small>' . e($label) . '</small><b>' . nl2br(e($val), false) . '</b></span>';
        $h .= '<li class="ccard" data-reveal style="--d:' . $i . '">' . ($href !== '' ? '<a href="' . e($href) . '">' . $inner . '</a>' : '<div>' . $inner . '</div>') . '</li>';
    }
    $h .= '</ul>' . social_links() . '</div><div class="contact__form" data-reveal>' . contact_form((string) L($b['form_title'] ?? '')) . '</div></div>';
    $map = trim((string) ($s['map_embed'] ?? ''));
    if (!empty($b['show_map']) && preg_match('~^https://(www\.)?google\.[a-z.]+/maps/embed\?~', $map)) {
        $h .= '<div class="container"><div class="map" data-reveal><iframe src="' . e($map) . '" title="' . e(t('visit_us')) . '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div></div>';
    }
    return $h . '</section>';
}

function social_links(string $cls = 'socials'): string
{
    $s = site()['settings'] ?? [];
    $h = '';
    foreach (['facebook' => 'Facebook', 'linkedin' => 'LinkedIn', 'instagram' => 'Instagram'] as $k => $name) {
        $u = trim((string) ($s[$k] ?? ''));
        if (preg_match('~^https://~', $u)) {
            $h .= '<li><a href="' . e($u) . '" target="_blank" rel="noopener" aria-label="' . $name . '">' . icon($k) . '</a></li>';
        }
    }
    return $h !== '' ? '<ul class="' . e($cls) . '" role="list">' . $h . '</ul>' : '';
}

/* ---------------------------------------------------------- CTA ზოლი */
function block_cta(array $b, array $ctx = []): string
{
    $phone = setting('phone');
    $h = '<section class="section cta-sec"><div class="container"><div class="cta" data-reveal>'
       . '<div class="cta__deco" aria-hidden="true">' . logo_mark('cta__ring') . '</div><div class="cta__copy">';
    if (($e = (string) L($b['eyebrow'] ?? '')) !== '') {
        $h .= '<p class="eyebrow eyebrow--light">' . e($e) . '</p>';
    }
    $h .= '<h2 class="cta__title">' . inline_html((string) L($b['title'] ?? '')) . '</h2>';
    if (($t = (string) L($b['text'] ?? '')) !== '') {
        $h .= '<p class="cta__text">' . inline_html($t) . '</p>';
    }
    $h .= '<div class="cta__actions">' . cta_btn($b, '1', 'light') . cta_btn($b, '2', 'outline-light');
    if ($phone !== '') {
        $h .= '<a class="cta__phone" href="tel:' . e(preg_replace('~[^\d+]~', '', $phone)) . '">' . icon('phone') . e($phone) . '</a>';
    }
    return $h . '</div></div></div></div></section>';
}

/* ----------------------------------------------------------- სერვისის გვერდი */
function render_service(array $s, array $ctx): string
{
    $title = (string) L($s['title'] ?? '');
    $h = block_page_hero([
        'eyebrow' => ['ka' => t('services', 'ka'), 'en' => t('services', 'en')],
        'title' => $s['title'] ?? '', 'text' => $s['intro'] ?? '',
        'image' => $s['image'] ?? '', 'image_alt' => $s['image_alt'] ?? '',
        'cta_label' => ['ka' => t('book_cta', 'ka'), 'en' => t('book_cta', 'en')], 'cta_link' => 'page:book',
    ], $ctx);

    // დეტალური აღწერა + გვერდითი ბარათი
    $body = rich_html((string) L($s['body'] ?? ''));
    $aud = (array) L($s['audience'] ?? []);
    $h .= '<section class="section svc-detail"><div class="container svc-detail__grid"><div class="prose" data-reveal>' . $body;
    if ($aud) {
        $h .= '<h2>' . e(t('for_whom')) . '</h2>' . check_list($aud);
    }
    $h .= '</div><aside class="svc-aside" data-reveal><div class="svc-aside__card"><span class="svc-aside__ico">' . icon((string) ($s['icon'] ?? 'briefcase')) . '</span>'
        . '<h2 class="svc-aside__title">' . e(t('sidebar_title')) . '</h2><p>' . e(t('sidebar_text')) . '</p>'
        . btn(t('book_cta'), 'page:book', 'primary', 'calendar', ' data-service="' . e((string) $s['id']) . '"')
        . contact_mini() . '</div></aside></div></section>';

    if (!empty($s['includes'])) {
        $h .= block_cards(['title' => ['ka' => t('included', 'ka'), 'en' => t('included', 'en')], 'variant' => 'grid', 'items' => $s['includes']], $ctx);
    }
    if (!empty($s['benefits'])) {
        $h .= block_cards(['eyebrow' => ['ka' => 'რატომ Outsourcify', 'en' => 'Why Outsourcify'], 'title' => ['ka' => 'რას იღებთ ჩვენთან თანამშრომლობით', 'en' => 'What you gain by working with us'], 'variant' => 'bento', 'items' => $s['benefits']], $ctx);
    }
    $h .= block_steps(['eyebrow' => ['ka' => 'პროცესი', 'en' => 'Process'], 'title' => ['ka' => 'როგორ ვიწყებთ თანამშრომლობას', 'en' => 'How we get started'], 'use_global' => true], $ctx);
    if (!empty($s['faq'])) {
        $h .= block_faq(['eyebrow' => ['ka' => 'FAQ', 'en' => 'FAQ'], 'title' => ['ka' => t('service_faq', 'ka'), 'en' => t('service_faq', 'en')]], $ctx + ['faq_items' => $s['faq']]);
    }
    $h .= block_services(['eyebrow' => ['ka' => t('services', 'ka'), 'en' => t('services', 'en')], 'title' => ['ka' => t('related', 'ka'), 'en' => t('related', 'en')], 'limit' => 3, 'cta_label' => ['ka' => t('all_services', 'ka'), 'en' => t('all_services', 'en')], 'cta_link' => 'page:services'], $ctx + ['exclude' => $s['id']]);
    $cta = site()['cta'] ?? [];
    if ($cta) {
        $h .= block_cta($cta);
    }
    return $h;
}
