<?php
/**
 * SEO-ს ცხრილის გენერატორი: php tools/seo-report.php > SEO.md
 * კითხულობს content/*.json-ს — ანგარიში ყოველთვის ემთხვევა საიტზე რეალურად გამოტანილს.
 */
declare(strict_types=1);
require_once dirname(__DIR__) . '/inc/content.php';

$base = rtrim((string) (site()['settings']['domain'] ?? 'https://outsourcify.ge'), '/');
$len = static fn(string $s): string => (string) mb_strlen($s);
$kw = static function (string $s): array {
    $parts = array_map('trim', explode(';', $s, 2));
    return [$parts[0] ?? '', $parts[1] ?? ''];
};

$rows = [];
foreach (pages() as $p) {
    if (!empty($p['hidden'])) {
        continue;
    }
    $rows[] = ['name' => (string) L($p['title'] ?? '', 'ka') . ' / ' . (string) L($p['title'] ?? '', 'en'),
        'url_ka' => url_page((string) $p['id'], 'ka'), 'url_en' => url_page((string) $p['id'], 'en'),
        't' => (array) ($p['seo']['title'] ?? []), 'd' => (array) ($p['seo']['description'] ?? []), 'k' => (array) ($p['seo']['keywords'] ?? [])];
}
foreach (services() as $s) {
    $rows[] = ['name' => (string) L($s['title'] ?? '', 'ka') . ' / ' . (string) L($s['title'] ?? '', 'en'),
        'url_ka' => url_service($s, 'ka'), 'url_en' => url_service($s, 'en'),
        't' => (array) ($s['seo_title'] ?? []), 'd' => (array) ($s['seo_desc'] ?? []), 'k' => (array) ($s['keywords'] ?? [])];
}

echo "# Outsourcify — SEO სათაურები, აღწერები და URL-ები\n\n";
echo "გენერირებულია `php tools/seo-report.php`-ით " . date('Y-m-d') . "-ს — წყარო: CMS-ის კონტენტი. ";
echo "ქართული ვერსია მთავარია (`/`), ინგლისური — `/en/`. რიცხვი ფრჩხილებში — სიმბოლოების რაოდენობა ";
echo "(რეკომენდაცია: სათაური ≈50–60, აღწერა ≈140–160). საკვანძო სიტყვები შიდა შენიშვნაა — საიტზე meta keywords არ გამოიტანება.\n\n";

foreach ($rows as $i => $r) {
    [$mk, $sk] = $kw((string) ($r['k']['ka'] ?? ''));
    [$mke, $ske] = $kw((string) ($r['k']['en'] ?? ''));
    echo '## ' . ($i + 1) . '. ' . $r['name'] . "\n\n";
    echo "| | ქართული (მთავარი) | English |\n|---|---|---|\n";
    echo '| **SEO Title** | ' . ($r['t']['ka'] ?? '') . ' (' . $len((string) ($r['t']['ka'] ?? '')) . ') | ' . ($r['t']['en'] ?? '') . ' (' . $len((string) ($r['t']['en'] ?? '')) . ") |\n";
    echo '| **Meta Description** | ' . ($r['d']['ka'] ?? '') . ' (' . $len((string) ($r['d']['ka'] ?? '')) . ') | ' . ($r['d']['en'] ?? '') . ' (' . $len((string) ($r['d']['en'] ?? '')) . ") |\n";
    echo '| **URL** | `' . $base . $r['url_ka'] . '` | `' . $base . $r['url_en'] . "` |\n";
    echo '| **Main keyword** | ' . ($mk ?: '—') . ' | ' . ($mke ?: '—') . " |\n";
    echo '| **Supporting keywords** | ' . ($sk ?: '—') . ' | ' . ($ske ?: '—') . " |\n\n";
}
