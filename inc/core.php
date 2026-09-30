<?php
/**
 * Outsourcify — ბირთვი: გზები, ენები, JSON-საცავი, სესია, უსაფრთხოების დამხმარეები.
 * მონაცემები ინახება content/*.json ფაილებში — ბაზა არ სჭირდება.
 */
declare(strict_types=1);

date_default_timezone_set('Asia/Tbilisi');
mb_internal_encoding('UTF-8');

define('OS_ROOT', dirname(__DIR__));
define('OS_CONTENT', OS_ROOT . '/content');
define('OS_UPLOADS', OS_ROOT . '/assets/img/uploads');
define('OS_UPLOADS_URL', '/assets/img/uploads');

const OS_LANGS = ['ka', 'en'];
const OS_DEFAULT_LANG = 'ka';

/* ---------------------------------------------------------------- ენა */
function os_lang(?string $set = null): string
{
    static $lang = OS_DEFAULT_LANG;
    if ($set !== null && in_array($set, OS_LANGS, true)) {
        $lang = $set;
    }
    return $lang;
}

/** ორენოვანი მნიშვნელობა: ['ka' => …, 'en' => …] → მიმდინარე ენის ტექსტი (ცარიელზე — ქართული) */
function L(mixed $v, ?string $lang = null): mixed
{
    $lang ??= os_lang();
    if (is_array($v) && (array_key_exists('ka', $v) || array_key_exists('en', $v))) {
        $x = $v[$lang] ?? null;
        if ($x === null || $x === '' || $x === []) {
            $x = $v[OS_DEFAULT_LANG] ?? ($v['en'] ?? '');
        }
        return $x;
    }
    return $v ?? '';
}

/** UI-ს სტატიკური წარწერები (inc/strings.php) — ადმინიდან გადაფარვადი */
function t(string $key, ?string $lang = null): string
{
    static $strings = null;
    static $over = null;
    $lang ??= os_lang();
    if ($strings === null) {
        $strings = require __DIR__ . '/strings.php';
        $over = os_read('site')['ui'] ?? [];
    }
    $o = $over[$key][$lang] ?? '';
    if ($o !== '') {
        return $o;
    }
    return $strings[$key][$lang] ?? ($strings[$key]['ka'] ?? $key);
}

/* ---------------------------------------------------------- JSON საცავი */
function os_read(string $name, array $fallback = []): array
{
    $cache = &$GLOBALS['__os_json_cache'];
    $name = basename($name);
    if (isset($cache[$name])) {
        return $cache[$name];
    }
    $path = OS_CONTENT . '/' . $name . '.json';
    if (!is_file($path)) {
        return $fallback;
    }
    $data = json_decode((string) file_get_contents($path), true);
    if (!is_array($data)) {
        return $fallback;
    }
    return $cache[$name] = $data;
}

/** ატომური ჩაწერა: დროებითი ფაილი → rename, ნახევრად ჩაწერილი JSON არ რჩება */
function os_write(string $name, array $data): bool
{
    if (!is_dir(OS_CONTENT)) {
        mkdir(OS_CONTENT, 0775, true);
    }
    $path = OS_CONTENT . '/' . basename($name) . '.json';
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        return false;
    }
    $tmp = $path . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    if (!rename($tmp, $path)) {
        @unlink($tmp);
        return false;
    }
    @chmod($path, 0664);
    $GLOBALS['__os_json_cache'][basename($name)] = $data;
    return true;
}

/* -------------------------------------------------------------- სესია/CSRF */
function os_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => os_is_https(),
    ]);
    session_name('os_cms');
    session_start();
}

function os_is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function os_csrf(): string
{
    os_session();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function os_csrf_check(?string $token): bool
{
    os_session();
    return is_string($token) && !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $token);
}

function os_csrf_field(): string
{
    return '<input type="hidden" name="_csrf" value="' . e(os_csrf()) . '">';
}

/* ------------------------------------------------------------ დამხმარეები */
function e(mixed $v): string
{
    return htmlspecialchars((string) (is_scalar($v) ? $v : ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** სათაურებისთვის: დაშვებულია მხოლოდ <em>, <strong>, <br> — დანარჩენი ესკეიპდება */
function inline_html(string $s): string
{
    $s = e($s);
    return preg_replace(
        ['~&lt;(/?)(em|strong|b|i)&gt;~i', '~&lt;br\s*/?&gt;~i'],
        ['<$1$2>', '<br>'],
        $s
    ) ?? $s;
}

/** მდიდარი ტექსტი (ადმინიდან): უსაფრთხო ტეგების თეთრი სია, ატრიბუტები იშლება (href-ის გარდა) */
function rich_html(string $html): string
{
    $html = trim($html);
    if ($html === '') {
        return '';
    }
    // უბრალო ტექსტი → აბზაცები
    if (!preg_match('~<(p|h[2-4]|ul|ol|table|blockquote)\b~i', $html)) {
        $parts = preg_split('~\R{2,}~', $html) ?: [];
        $html = implode('', array_map(static fn($p) => '<p>' . nl2br(trim($p), false) . '</p>', $parts));
    }
    $html = preg_replace('~<(script|style|iframe|object|embed|form|svg|math)\b[^>]*>.*?</\1>~is', '', $html) ?? '';
    $html = strip_tags($html, '<p><br><h2><h3><h4><ul><ol><li><strong><b><em><i><a><blockquote><table><thead><tbody><tr><th><td>');
    // ატრიბუტების გასუფთავება
    $html = preg_replace_callback('~<(\w+)(\s[^>]*)?>~', static function ($m) {
        $tag = strtolower($m[1]);
        if ($tag === 'a' && !empty($m[2]) && preg_match('~href\s*=\s*("|\')(.*?)\1~i', $m[2], $h)) {
            $href = html_entity_decode($h[2], ENT_QUOTES);
            if (!preg_match('~^(https?:|mailto:|tel:|/|#)~i', $href)) {
                $href = '#';
            }
            $ext = preg_match('~^https?:~i', $href) ? ' target="_blank" rel="noopener"' : '';
            return '<a href="' . e($href) . '"' . $ext . '>';
        }
        return '<' . $tag . '>';
    }, $html) ?? '';
    return $html;
}

/** ქართული → ლათინური ტრანსლიტერაცია SEO-მისამართებისთვის */
function os_slug(string $v): string
{
    static $map = [
        'ა' => 'a', 'ბ' => 'b', 'გ' => 'g', 'დ' => 'd', 'ე' => 'e', 'ვ' => 'v', 'ზ' => 'z', 'თ' => 't',
        'ი' => 'i', 'კ' => 'k', 'ლ' => 'l', 'მ' => 'm', 'ნ' => 'n', 'ო' => 'o', 'პ' => 'p', 'ჟ' => 'zh',
        'რ' => 'r', 'ს' => 's', 'ტ' => 't', 'უ' => 'u', 'ფ' => 'p', 'ქ' => 'k', 'ღ' => 'gh', 'ყ' => 'q',
        'შ' => 'sh', 'ჩ' => 'ch', 'ც' => 'ts', 'ძ' => 'dz', 'წ' => 'ts', 'ჭ' => 'ch', 'ხ' => 'kh', 'ჯ' => 'j',
        'ჰ' => 'h',
    ];
    $v = strtr(mb_strtolower(trim($v)), $map);
    $v = preg_replace('~[^a-z0-9]+~', '-', $v) ?? '';
    return trim($v, '-');
}

function os_redirect(string $url, int $code = 302): never
{
    header('Location: ' . $url, true, $code);
    exit;
}

/** აბსოლუტური საბაზისო მისამართი (კანონიკურისთვის): პარამეტრებიდან ან მოთხოვნიდან */
function base_url(): string
{
    $d = trim((string) (os_read('site')['settings']['domain'] ?? ''));
    if ($d !== '' && preg_match('~^https?://~', $d)) {
        return rtrim($d, '/');
    }
    $host = preg_replace('~[^a-z0-9.:-]~i', '', (string) ($_SERVER['HTTP_HOST'] ?? 'localhost')) ?: 'localhost';
    return (os_is_https() ? 'https' : 'http') . '://' . $host;
}

/** ასეტი ვერსიით (ფაილის ცვლილების დრო) — ქეში ავტომატურად ახლდება */
function asset(string $path): string
{
    $path = '/' . ltrim($path, '/');
    $file = OS_ROOT . $path;
    return $path . (is_file($file) ? '?v=' . substr(md5((string) filemtime($file)), 0, 8) : '');
}

/** სურათის მისამართი: აბსოლუტური, ან საიტის ფესვიდან */
function img_url(string $src): string
{
    if ($src === '' || preg_match('~^(https?:)?//~', $src)) {
        return $src;
    }
    return '/' . ltrim($src, '/');
}
