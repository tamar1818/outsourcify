<?php
/**
 * ადმინის UI: ველების უნივერსალური რენდერერი (სქემიდან), ლეიაუთი, დამხმარეები.
 * ფორმის მონაცემებს admin.js აგროვებს JSON-ად (data-scope / data-f ატრიბუტებით).
 */
declare(strict_types=1);
require_once dirname(__DIR__) . '/inc/content.php';
require_once dirname(__DIR__) . '/inc/schema.php';
require_once dirname(__DIR__) . '/inc/icons.php';
require_once dirname(__DIR__) . '/inc/logo.php';

const LANG_LABEL = ['ka' => 'ქართ', 'en' => 'ENG'];

function a_url(string $p, array $q = []): string
{
    return 'index.php?' . http_build_query(['p' => $p] + $q);
}

/** ბმულის არჩევანი: გვერდები, სერვისები, განყოფილებები */
function link_options(): array
{
    $pages = [];
    foreach (pages() as $p) {
        $pages['page:' . $p['id']] = (string) L($p['title'] ?? $p['id'], 'ka');
    }
    $svc = [];
    foreach (services(true) as $s) {
        $svc['service:' . $s['id']] = (string) L($s['title'] ?? $s['id'], 'ka');
    }
    return ['გვერდები' => $pages, 'სერვისები' => $svc, 'განყოფილებები' => [
        'page:contact#contact-form' => 'კონტაქტი → ფორმა',
        'page:book#booking' => 'დაჯავშნა → ჩატი',
    ]];
}

/** ერთი ველი (i18n-ის შემთხვევაში — ორი სვეტი: ქართული / ინგლისური) */
function field(string $key, array $def, mixed $value): string
{
    $type = $def['type'];
    $label = e($def['label']);
    $hint = !empty($def['hint']) ? '<small class="hint">' . e($def['hint']) . '</small>' : '';

    if ($type === 'repeater') {
        return repeater($key, $def, is_array($value) ? $value : []);
    }
    if ($type === 'check') {
        return '<label class="fld fld--check"><input type="checkbox" data-f="' . e($key) . '" data-type="check"' . (!empty($value) ? ' checked' : '') . '> <span>' . $label . '</span></label>';
    }
    if (!empty($def['i18n'])) {
        $h = '<div class="fld fld--i18n"><span class="fld__label">' . $label . '</span>' . $hint . '<div class="i18n">';
        foreach (OS_LANGS as $l) {
            $v = is_array($value) && !array_is_list($value) ? ($value[$l] ?? '') : ($l === 'ka' ? $value : '');
            $h .= '<div class="i18n__col"><span class="flag flag--' . $l . '">' . LANG_LABEL[$l] . '</span>' . control($key, $def, $v, $l) . '</div>';
        }
        return $h . '</div></div>';
    }
    return '<div class="fld"><span class="fld__label">' . $label . '</span>' . $hint . control($key, $def, $value, '') . '</div>';
}

function control(string $key, array $def, mixed $v, string $lang): string
{
    $attrs = 'data-f="' . e($key) . '"' . ($lang !== '' ? ' data-lang="' . $lang . '"' : '') . ' data-type="' . e($def['type']) . '"';
    if ($lang !== '') {
        $attrs .= ' lang="' . $lang . '"';
    }
    $counter = !empty($def['counter']) ? ' data-counter="' . (int) $def['counter'] . '"' : '';
    switch ($def['type']) {
        case 'textarea':
            return '<textarea ' . $attrs . $counter . ' rows="3">' . e((string) $v) . '</textarea>';
        case 'rich':
            return '<div class="rich"><div class="rich__bar" role="toolbar">'
                . '<button type="button" data-wrap="strong" title="Bold"><b>B</b></button>'
                . '<button type="button" data-wrap="em" title="Italic"><i>I</i></button>'
                . '<button type="button" data-wrap="h2" title="ქვესათაური">H2</button>'
                . '<button type="button" data-wrap="h3" title="H3">H3</button>'
                . '<button type="button" data-list title="სია">• სია</button>'
                . '<button type="button" data-link title="ბმული">🔗</button></div>'
                . '<textarea ' . $attrs . ' rows="10" class="mono">' . e((string) $v) . '</textarea></div>';
        case 'list':
            return '<textarea ' . $attrs . ' rows="4">' . e(implode("\n", (array) $v)) . '</textarea>';
        case 'number':
            return '<input type="number" min="0" max="999" ' . $attrs . ' value="' . e((string) (int) $v) . '">';
        case 'select':
            $h = '<select ' . $attrs . '>';
            foreach ($def['options'] ?? [] as $ov => $ol) {
                $h .= '<option value="' . e((string) $ov) . '"' . ((string) $v === (string) $ov ? ' selected' : '') . '>' . e($ol) . '</option>';
            }
            return $h . '</select>';
        case 'link':
            $opts = link_options();
            $known = false;
            $h = '<div class="lnk" ' . $attrs . '><select class="lnk__sel"><option value="">— ბმულის გარეშე —</option>';
            foreach ($opts as $group => $items) {
                $h .= '<optgroup label="' . e($group) . '">';
                foreach ($items as $ov => $ol) {
                    $sel = (string) $v === $ov;
                    $known = $known || $sel;
                    $h .= '<option value="' . e($ov) . '"' . ($sel ? ' selected' : '') . '>' . e($ol) . '</option>';
                }
                $h .= '</optgroup>';
            }
            $custom = !$known && (string) $v !== '';
            $h .= '<option value="__custom"' . ($custom ? ' selected' : '') . '>სხვა მისამართი (URL, tel:, mailto:)…</option></select>'
                . '<input type="text" class="lnk__url" placeholder="https://… ან tel:+995…" value="' . e($custom ? (string) $v : '') . '"' . ($custom ? '' : ' hidden') . '></div>';
            return $h;
        case 'image':
            $v = (string) $v;
            return '<div class="img" ' . $attrs . '><div class="img__prev">' . ($v !== '' ? '<img src="' . e(img_url($v)) . '" alt="">' : '<span>სურათი არ არის</span>') . '</div>'
                . '<div class="img__ctl"><input type="text" class="img__url" value="' . e($v) . '" placeholder="/assets/img/…">'
                . '<div class="img__btns"><button type="button" class="btn btn--sm" data-media-pick>ბიბლიოთეკიდან</button>'
                . '<label class="btn btn--sm btn--ghost">ატვირთვა<input type="file" accept="image/*" data-media-upload hidden></label>'
                . '<button type="button" class="link" data-img-clear>წაშლა</button></div></div></div>';
        case 'icon':
            $v = (string) $v;
            $h = '<details class="icp" ' . $attrs . ' data-value="' . e($v) . '"><summary><span class="icp__cur">' . ($v !== '' ? icon($v) : '—') . '</span><span class="icp__name">' . e($v ?: 'არჩევა') . '</span></summary><div class="icp__grid">';
            $h .= '<button type="button" data-icon="" title="ხატულის გარეშე">—</button>';
            foreach (array_keys(ICONS) as $n) {
                if (in_array($n, ['menu', 'x', 'plus', 'minus', 'chevron-down', 'chevron-left', 'chevron-right', 'facebook', 'linkedin', 'instagram'], true)) {
                    continue;
                }
                $h .= '<button type="button" data-icon="' . e($n) . '" title="' . e($n) . '"' . ($n === $v ? ' class="on"' : '') . '>' . icon($n) . '</button>';
            }
            return $h . '</div></details>';
        default:
            return '<input type="text" ' . $attrs . $counter . ' value="' . e((string) $v) . '">';
    }
}

function fields(array $defs, array $data): string
{
    $h = '';
    foreach ($defs as $k => $def) {
        $h .= field($k, $def, $data[$k] ?? null);
    }
    return $h;
}

function repeater(string $key, array $def, array $items): string
{
    $tpl = rep_item($def['fields'], []);
    $h = '<div class="rep" data-f="' . e($key) . '" data-type="repeater"><div class="rep__head"><span class="fld__label">' . e($def['label']) . '</span>'
       . '<span class="rep__count">' . count($items) . '</span></div><div class="rep__items">';
    foreach ($items as $it) {
        $h .= rep_item($def['fields'], (array) $it);
    }
    return $h . '</div><template>' . $tpl . '</template><button type="button" class="btn btn--sm btn--ghost" data-rep-add>+ ' . e($def['add'] ?? 'დამატება') . '</button></div>';
}

function rep_item(array $defs, array $data): string
{
    $title = '';
    foreach (['title', 'q', 'label', 'criterion', 'name', 'value'] as $k) {
        if (isset($data[$k])) {
            $title = (string) L($data[$k], 'ka');
            break;
        }
    }
    return '<div class="rep-item" data-scope><div class="rep-item__bar"><button type="button" class="rep-item__toggle" data-collapse aria-expanded="true">'
        . '<span class="rep-item__title">' . e($title !== '' ? $title : 'ახალი ჩანაწერი') . '</span></button>'
        . '<span class="tools"><button type="button" data-up title="ზემოთ">↑</button><button type="button" data-down title="ქვემოთ">↓</button>'
        . '<button type="button" data-dup title="დუბლირება">⧉</button><button type="button" data-del class="danger" title="წაშლა">✕</button></span></div>'
        . '<div class="rep-item__body">' . fields($defs, $data) . '</div></div>';
}

/** ერთი ბლოკი გვერდის რედაქტორში */
function block_editor(array $b): string
{
    $defs = block_defs();
    $type = (string) ($b['type'] ?? '');
    if (!isset($defs[$type])) {
        return '';
    }
    $d = $defs[$type];
    $sum = trim(strip_tags((string) L($b['title'] ?? '', 'ka')));
    return '<div class="blk' . (!empty($b['hidden']) ? ' is-hidden' : '') . '" data-scope data-block="' . e($type) . '">'
        . '<div class="blk__bar"><button type="button" class="blk__toggle" data-collapse aria-expanded="false"><span class="blk__type">' . e($d['label']) . '</span>'
        . '<span class="blk__sum">' . e($sum) . '</span></button>'
        . '<span class="tools"><label class="blk__vis" title="საიტზე ჩვენება"><input type="checkbox" data-f="visible" data-type="check"' . (empty($b['hidden']) ? ' checked' : '') . '> ჩანს</label>'
        . '<button type="button" data-up title="ზემოთ">↑</button><button type="button" data-down title="ქვემოთ">↓</button>'
        . '<button type="button" data-dup title="დუბლირება">⧉</button><button type="button" data-del class="danger" title="წაშლა">✕</button></span></div>'
        . '<div class="blk__body" hidden><p class="muted small">' . e($d['desc']) . '</p>' . fields($d['fields'], $b) . '</div></div>';
}

/* ------------------------------------------------------------ ლეიაუთი */
function a_head(string $title): string
{
    return '<!doctype html><html lang="ka"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex, nofollow"><title>' . e($title) . ' — Outsourcify CMS</title>'
        . '<link rel="icon" href="/assets/img/brand/favicon.svg" type="image/svg+xml">'
        . '<link rel="stylesheet" href="' . e(asset('admin/admin.css')) . '"></head>';
}

function a_nav(string $cur, array $badges = []): string
{
    $items = [
        'dashboard' => ['მთავარი', 'bars'],
        'pages' => ['გვერდები', 'layers'],
        'services' => ['სერვისები', 'briefcase'],
        'faqs' => ['FAQ', 'message'],
        'testimonials' => ['შეფასებები', 'quote'],
        'industries' => ['ვისთან ვმუშაობთ', 'building'],
        'menus' => ['მენიუ და ფუტერი', 'menu'],
        'media' => ['ფოტოები', 'folder'],
        'inbox' => ['განაცხადები', 'mail'],
        'settings' => ['პარამეტრები', 'settings'],
    ];
    $h = '<aside class="side">' . logo_sprite() . '<a class="side__brand" href="index.php">' . logo_lockup() . '<span>CMS</span></a><nav>';
    foreach ($items as $k => [$label, $ic]) {
        $on = $cur === $k || ($cur === 'page' && $k === 'pages') || ($cur === 'service' && $k === 'services');
        $badge = !empty($badges[$k]) ? '<b class="badge">' . (int) $badges[$k] . '</b>' : '';
        $h .= '<a href="' . a_url($k) . '"' . ($on ? ' class="on" aria-current="page"' : '') . '>' . icon($ic) . '<span>' . e($label) . '</span>' . $badge . '</a>';
    }
    return $h . '</nav><div class="side__foot"><a href="/" target="_blank" rel="noopener">' . icon('arrow-up-right') . ' საიტის ნახვა</a>'
        . '<a href="' . a_url('account') . '">' . icon('lock') . ' პაროლი</a>'
        . '<a href="logout.php">' . icon('x') . ' გასვლა</a></div></aside>';
}

function a_foot(): string
{
    return '<script src="' . e(asset('admin/admin.js')) . '" defer></script></body></html>';
}

function flash(string $msg, string $err): string
{
    return ($msg !== '' ? '<div class="alert alert--ok" role="status">' . e($msg) . '</div>' : '')
         . ($err !== '' ? '<div class="alert alert--err" role="alert">' . e($err) . '</div>' : '');
}

/** SEO-ს სიგრძის შეფასება */
function seo_len_class(string $s, int $min, int $max): string
{
    $n = mb_strlen($s);
    return $n === 0 ? 'bad' : ($n < $min || $n > $max + 8 ? 'warn' : 'ok');
}
