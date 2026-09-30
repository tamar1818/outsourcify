<?php
/**
 * Outsourcify CMS — მართვის პანელი.
 * გვერდები (ბლოკების რედაქტორი), სერვისები, FAQ, შეფასებები, ინდუსტრიები, მენიუ,
 * პარამეტრები, ფოტოები, განაცხადები/ჯავშნები. ყველაფერი ორ ენაზე.
 */
declare(strict_types=1);
require_once dirname(__DIR__) . '/inc/auth.php';
require_once dirname(__DIR__) . '/inc/media.php';
require_once dirname(__DIR__) . '/inc/booking.php';
require_once __DIR__ . '/ui.php';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');

$p = preg_replace('~[^a-z_]~', '', (string) ($_GET['p'] ?? 'dashboard')) ?: 'dashboard';
os_session();
$msg = (string) ($_SESSION['flash_ok'] ?? '');
$err = (string) ($_SESSION['flash_err'] ?? '');
unset($_SESSION['flash_ok'], $_SESSION['flash_err']);

function done(string $ok, string $to): never
{
    $_SESSION['flash_ok'] = $ok;
    os_redirect($to);
}
function fail(string $e, string $to): never
{
    $_SESSION['flash_err'] = $e;
    os_redirect($to);
}
function json_out(array $d, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function payload(): array
{
    $d = json_decode((string) ($_POST['payload'] ?? ''), true);
    return is_array($d) ? $d : [];
}

/* ============================================================ ავტორიზაცია */
if (!os_is_installed()) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $u = trim((string) ($_POST['user'] ?? ''));
        $pw = (string) ($_POST['password'] ?? '');
        if (!os_csrf_check($_POST['_csrf'] ?? null)) {
            $err = 'სესია ამოიწურა — სცადეთ თავიდან';
        } elseif (mb_strlen($u) < 3) {
            $err = 'მომხმარებლის სახელი — მინიმუმ 3 სიმბოლო';
        } elseif (mb_strlen($pw) < 10) {
            $err = 'პაროლი — მინიმუმ 10 სიმბოლო';
        } elseif ($pw !== (string) ($_POST['password2'] ?? '')) {
            $err = 'პაროლები არ ემთხვევა';
        } elseif (os_install($u, $pw)) {
            done('ანგარიში შეიქმნა — შედით სისტემაში', a_url('login'));
        } else {
            $err = 'ჩაწერა ვერ მოხერხდა — შეამოწმეთ content/ დირექტორიის უფლებები';
        }
    }
    echo a_head('ანგარიშის შექმნა') . '<body class="auth"><form class="card auth__card" method="post">' . logo_sprite() . logo_full()
        . '<h1>CMS-ის პირველი გაშვება</h1><p class="muted">შექმენით ადმინისტრატორის ანგარიში.</p>' . flash('', $err) . os_csrf_field()
        . '<label class="fld"><span class="fld__label">მომხმარებელი</span><input name="user" required autocomplete="username"></label>'
        . '<label class="fld"><span class="fld__label">პაროლი (მინ. 10 სიმბოლო)</span><input name="password" type="password" required minlength="10" autocomplete="new-password"></label>'
        . '<label class="fld"><span class="fld__label">გაიმეორეთ პაროლი</span><input name="password2" type="password" required autocomplete="new-password"></label>'
        . '<button class="btn btn--block">ანგარიშის შექმნა</button></form></body></html>';
    exit;
}

if (os_user() === null) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $p === 'login') {
        if (!os_csrf_check($_POST['_csrf'] ?? null)) {
            $err = 'სესია ამოიწურა — სცადეთ თავიდან';
        } elseif (($left = os_login_locked()) > 0) {
            $err = 'ბევრი მცდელობა. სცადეთ ' . (int) ceil($left / 60) . ' წუთში';
        } elseif (os_login(trim((string) ($_POST['user'] ?? '')), (string) ($_POST['password'] ?? ''))) {
            os_redirect('index.php');
        } else {
            $err = 'მომხმარებელი ან პაროლი არასწორია';
        }
    }
    echo a_head('შესვლა') . '<body class="auth"><form class="card auth__card" method="post" action="' . a_url('login') . '">' . logo_sprite() . logo_full()
        . '<h1>მართვის პანელი</h1>' . flash($msg, $err) . os_csrf_field()
        . '<label class="fld"><span class="fld__label">მომხმარებელი</span><input name="user" required autocomplete="username" autofocus></label>'
        . '<label class="fld"><span class="fld__label">პაროლი</span><input name="password" type="password" required autocomplete="current-password"></label>'
        . '<button class="btn btn--block">შესვლა</button></form></body></html>';
    exit;
}

/* ============================================================== მოქმედებები */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ajax = ($_POST['ajax'] ?? '') === '1';
    if (!os_csrf_check($_POST['_csrf'] ?? null)) {
        $ajax ? json_out(['ok' => false, 'error' => 'CSRF — განაახლეთ გვერდი'], 403) : fail('უსაფრთხოების შემოწმება ვერ გაიარა — განაახლეთ გვერდი', a_url($p));
    }
    $action = (string) ($_POST['action'] ?? '');

    /* ---- ფოტოს ატვირთვა (AJAX, ფორმის შიგნიდან ან ბიბლიოთეკიდან) */
    if ($action === 'upload') {
        $r = os_upload($_FILES['file'] ?? [], (string) ($_POST['name'] ?? 'image'));
        if ($ajax) {
            json_out($r, $r['ok'] ? 200 : 422);
        }
        $r['ok'] ? done('ფოტო აიტვირთა', a_url('media')) : fail($r['error'] ?? 'შეცდომა', a_url('media'));
    }
    if ($action === 'media_delete') {
        os_media_delete((string) ($_POST['name'] ?? '')) ? done('ფოტო წაიშალა', a_url('media')) : fail('წაშლა ვერ მოხერხდა', a_url('media'));
    }

    /* ---- გვერდი */
    if ($action === 'save_page') {
        $data = payload();
        $all = os_read('pages', ['pages' => []]);
        $list = $all['pages'] ?? [];
        $id = (string) ($_POST['id'] ?? '');
        $idx = null;
        foreach ($list as $i => $pg) {
            if (($pg['id'] ?? '') === $id) {
                $idx = $i;
            }
        }
        $meta = (array) ($data['meta'] ?? []);
        $clean = os_clean([
            'title' => f('text', '', ['i18n' => true]), 'slug' => f('text', '', ['i18n' => true]),
            'seo_title' => f('text', '', ['i18n' => true]), 'seo_desc' => f('textarea', '', ['i18n' => true]),
            'keywords' => f('text', '', ['i18n' => true]), 'og_image' => f('image', ''),
            'hidden' => f('check', ''), 'noindex' => f('check', ''),
        ], $meta);
        $isNew = $idx === null;
        $isHome = !$isNew && ($list[$idx]['template'] ?? '') === 'home';
        // slug: ლათინური, უნიკალური; ცარიელზე — სათაურიდან
        $slug = [];
        foreach (OS_LANGS as $l) {
            $s = os_slug((string) ($clean['slug'][$l] ?: $clean['title'][$l] ?: $clean['title']['ka']));
            if ($isHome) {
                $s = '';
            } elseif ($s === '' || in_array($s, ['en', 'ka', 'admin', 'api', 'assets', 'content', 'inc', 'tools', 'sitemap-xml', 'robots-txt'], true)) {
                $s = 'page-' . substr(md5((string) microtime(true) . $l), 0, 6);
            }
            foreach ($list as $i => $pg) {
                if ($i !== $idx && ($pg['slug'][$l] ?? null) === $s && $s !== '') {
                    $s .= '-2';
                }
            }
            $slug[$l] = $s;
        }
        if (trim((string) $clean['title']['ka']) === '') {
            fail('გვერდის სათაური (ქართულად) სავალდებულოა', $isNew ? a_url('page', ['new' => 1]) : a_url('page', ['id' => $id]));
        }
        $blocks = [];
        foreach ((array) ($data['blocks'] ?? []) as $b) {
            if (is_array($b)) {
                $b['hidden'] = empty($b['visible']);
                $blocks[] = $b;
            }
        }
        $page = [
            'id' => $isNew ? (os_slug((string) $clean['title']['en']) ?: $slug['en']) : $id,
            'template' => $isNew ? 'page' : ($list[$idx]['template'] ?? 'page'),
            'system' => !$isNew && !empty($list[$idx]['system']),
            'slug' => $slug,
            'title' => $clean['title'],
            'seo' => ['title' => $clean['seo_title'], 'description' => $clean['seo_desc'], 'keywords' => $clean['keywords']],
            'og_image' => $clean['og_image'],
            'hidden' => $clean['hidden'] && !$isHome,
            'noindex' => $clean['noindex'],
            'blocks' => os_clean_blocks($blocks),
        ];
        if ($isNew) {
            foreach ($list as $pg) {
                if (($pg['id'] ?? '') === $page['id']) {
                    $page['id'] .= '-' . substr(md5((string) microtime(true)), 0, 4);
                }
            }
            $list[] = $page;
        } else {
            $list[$idx] = $page;
        }
        $all['pages'] = array_values($list);
        os_write('pages', $all) ? done('გვერდი შენახულია', a_url('page', ['id' => $page['id']])) : fail('შენახვა ვერ მოხერხდა', a_url('pages'));
    }
    if ($action === 'delete_page') {
        $all = os_read('pages', ['pages' => []]);
        $id = (string) ($_POST['id'] ?? '');
        $all['pages'] = array_values(array_filter($all['pages'] ?? [], static fn($pg) => ($pg['id'] ?? '') !== $id || !empty($pg['system'])));
        os_write('pages', $all) ? done('გვერდი წაიშალა', a_url('pages')) : fail('წაშლა ვერ მოხერხდა', a_url('pages'));
    }

    /* ---- სერვისი */
    if ($action === 'save_service') {
        $data = payload();
        $all = os_read('services', ['services' => []]);
        $list = $all['services'] ?? [];
        $id = (string) ($_POST['id'] ?? '');
        $item = os_clean(record_defs()['service'], $data);
        if (trim((string) $item['title']['ka']) === '') {
            fail('სერვისის სახელი (ქართულად) სავალდებულოა', $id ? a_url('service', ['id' => $id]) : a_url('service', ['new' => 1]));
        }
        $idx = null;
        foreach ($list as $i => $s) {
            if (($s['id'] ?? '') === $id) {
                $idx = $i;
            }
        }
        foreach (OS_LANGS as $l) {
            $s = os_slug((string) ($item['slug'][$l] ?: $item['title'][$l] ?: $item['title']['ka']));
            foreach ($list as $i => $o) {
                if ($i !== $idx && ($o['slug'][$l] ?? null) === $s) {
                    $s .= '-2';
                }
            }
            $item['slug'][$l] = $s ?: 'service-' . substr(md5((string) microtime(true)), 0, 5);
        }
        $item['seo_title'] = $item['seo_title'];
        if ($idx === null) {
            $item = ['id' => os_slug((string) $item['title']['en']) ?: $item['slug']['en']] + $item;
            foreach ($list as $o) {
                if (($o['id'] ?? '') === $item['id']) {
                    $item['id'] .= '-' . substr(md5((string) microtime(true)), 0, 4);
                }
            }
            $list[] = $item;
        } else {
            $list[$idx] = ['id' => $id] + $item;
            $item['id'] = $id;
        }
        $all['services'] = array_values($list);
        os_write('services', $all) ? done('სერვისი შენახულია', a_url('service', ['id' => $item['id']])) : fail('შენახვა ვერ მოხერხდა', a_url('services'));
    }
    if (in_array($action, ['delete_service', 'move_service', 'toggle_service'], true)) {
        $all = os_read('services', ['services' => []]);
        $list = $all['services'] ?? [];
        $id = (string) ($_POST['id'] ?? '');
        foreach ($list as $i => $s) {
            if (($s['id'] ?? '') !== $id) {
                continue;
            }
            if ($action === 'delete_service') {
                unset($list[$i]);
            } elseif ($action === 'toggle_service') {
                $list[$i]['hidden'] = empty($s['hidden']);
            } else {
                $j = $i + (($_POST['dir'] ?? '') === 'up' ? -1 : 1);
                if (isset($list[$j])) {
                    [$list[$i], $list[$j]] = [$list[$j], $list[$i]];
                }
            }
            break;
        }
        $all['services'] = array_values($list);
        os_write('services', $all) ? done('ცვლილება შენახულია', a_url('services')) : fail('შენახვა ვერ მოხერხდა', a_url('services'));
    }

    /* ---- კოლექციები: FAQ, შეფასებები, ინდუსტრიები */
    $collections = ['save_faqs' => ['faqs', 'faq'], 'save_testimonials' => ['testimonials', 'testimonial'], 'save_industries' => ['industries', 'industry']];
    if (isset($collections[$action])) {
        [$file, $def] = $collections[$action];
        $clean = os_clean(['items' => f('repeater', '', ['fields' => record_defs()[$def]])], payload());
        os_write($file, ['items' => $clean['items']]) ? done('შენახულია', a_url($file)) : fail('შენახვა ვერ მოხერხდა', a_url($file));
    }

    /* ---- მენიუ */
    if ($action === 'save_menus') {
        $menu = record_defs()['menu'];
        $plain = $menu;
        unset($plain['mega']);
        $clean = os_clean([
            'header' => f('repeater', '', ['fields' => $menu]),
            'footer_company_title' => f('text', '', ['i18n' => true]),
            'footer_company' => f('repeater', '', ['fields' => $plain]),
            'footer_legal_title' => f('text', '', ['i18n' => true]),
            'footer_legal' => f('repeater', '', ['fields' => $plain]),
        ], payload());
        $site = os_read('site');
        $site['menus'] = $clean;
        os_write('site', $site) ? done('მენიუ შენახულია', a_url('menus')) : fail('შენახვა ვერ მოხერხდა', a_url('menus'));
    }

    /* ---- პარამეტრები */
    if ($action === 'save_settings') {
        $d = payload();
        $site = os_read('site');
        $site['settings'] = os_clean(settings_defs(), (array) ($d['settings'] ?? []));
        $site['settings']['domain'] = rtrim((string) $site['settings']['domain'], '/');
        $site['seo'] = os_clean(['org_description' => f('textarea', '', ['i18n' => true])], (array) ($d['seo'] ?? []));
        $site['process'] = os_clean(['items' => f('repeater', '', ['fields' => record_defs()['step']])], ['items' => $d['process'] ?? []])['items'];
        $site['cta'] = os_clean(block_defs()['cta']['fields'], (array) ($d['cta'] ?? []));
        $bk = (array) ($d['booking'] ?? []);
        $site['booking'] = [
            'days' => array_values(array_map('intval', array_filter((array) ($bk['days'] ?? []), static fn($x) => (int) $x >= 1 && (int) $x <= 7))),
            'start' => (string) ($bk['start'] ?? '10:00'), 'end' => (string) ($bk['end'] ?? '18:00'),
            'slot' => (int) ($bk['slot'] ?? 30), 'notice' => (int) ($bk['notice'] ?? 3), 'ahead' => (int) ($bk['ahead'] ?? 21),
            'blocked' => array_values(array_filter(array_map('trim', preg_split('~[\s,]+~', (string) ($bk['blocked'] ?? '')) ?: []), static fn($x) => (bool) preg_match('~^\d{4}-\d{2}-\d{2}$~', $x))),
        ];
        $ui = [];
        foreach ((array) ($d['ui'] ?? []) as $k => $v) {
            if (is_string($k) && is_array($v)) {
                foreach (OS_LANGS as $l) {
                    $t = trim(strip_tags((string) ($v[$l] ?? '')));
                    if ($t !== '') {
                        $ui[$k][$l] = mb_substr($t, 0, 600);
                    }
                }
            }
        }
        $site['ui'] = $ui;
        os_write('site', $site) ? done('პარამეტრები შენახულია', a_url('settings', ['tab' => (string) ($_POST['tab'] ?? '')])) : fail('შენახვა ვერ მოხერხდა', a_url('settings'));
    }

    /* ---- განაცხადები და ჯავშნები */
    if (in_array($action, ['entry_status', 'entry_delete'], true)) {
        $kind = ($_POST['kind'] ?? '') === 'leads' ? 'leads' : 'bookings';
        $store = os_read($kind, [$kind => []]);
        $id = (string) ($_POST['id'] ?? '');
        foreach ($store[$kind] ?? [] as $i => $it) {
            if (($it['id'] ?? '') === $id) {
                if ($action === 'entry_delete') {
                    unset($store[$kind][$i]);
                } else {
                    $st = (string) ($_POST['status'] ?? 'new');
                    $store[$kind][$i]['status'] = in_array($st, ['new', 'contacted', 'done', 'cancelled'], true) ? $st : 'new';
                }
            }
        }
        $store[$kind] = array_values($store[$kind] ?? []);
        os_write($kind, $store) ? done('შენახულია', a_url('inbox', ['tab' => $kind])) : fail('შენახვა ვერ მოხერხდა', a_url('inbox'));
    }

    /* ---- პაროლის შეცვლა */
    if ($action === 'password') {
        $c = os_auth_config();
        $new = (string) ($_POST['new'] ?? '');
        if (!password_verify((string) ($_POST['current'] ?? ''), (string) ($c['hash'] ?? ''))) {
            fail('მიმდინარე პაროლი არასწორია', a_url('account'));
        }
        if (mb_strlen($new) < 10 || $new !== (string) ($_POST['new2'] ?? '')) {
            fail('ახალი პაროლი მინ. 10 სიმბოლო უნდა იყოს და ორივე ველში ერთნაირი', a_url('account'));
        }
        os_install((string) $c['user'], $new) ? done('პაროლი შეიცვალა', a_url('account')) : fail('შენახვა ვერ მოხერხდა', a_url('account'));
    }
    fail('უცნობი მოქმედება', a_url('dashboard'));
}

function settings_defs(): array
{
    return [
        'company'   => f('text', 'კომპანიის სახელი'),
        'domain'    => f('text', 'საიტის მისამართი (კანონიკური)', ['hint' => 'მაგ. https://outsourcify.ge — გამოიყენება canonical, sitemap და Open Graph ბმულებში']),
        'phone'     => f('text', 'ტელეფონი'),
        'email'     => f('text', 'საკონტაქტო ელფოსტა'),
        'notify_email' => f('text', 'შეტყობინებების ელფოსტა', ['hint' => 'სად მოვიდეს ახალი ჯავშნები და განაცხადები. ცარიელზე — საკონტაქტო ელფოსტაზე']),
        'address'   => f('text', 'მისამართი', ['i18n' => true]),
        'city'      => f('text', 'ქალაქი (Schema.org)'),
        'hours'     => f('text', 'სამუშაო საათები', ['i18n' => true]),
        'map_embed' => f('text', 'Google Maps embed ბმული', ['hint' => 'Google Maps → Share → Embed a map → src მისამართი (https://www.google.com/maps/embed?…)']),
        'facebook'  => f('text', 'Facebook'),
        'linkedin'  => f('text', 'LinkedIn'),
        'instagram' => f('text', 'Instagram'),
        'footer_text' => f('textarea', 'ფუტერის ტექსტი', ['i18n' => true]),
        'ga_id'     => f('text', 'Google Analytics 4 ID', ['hint' => 'მაგ. G-XXXXXXX — ცარიელზე ანალიტიკა გამორთულია']),
        'gsc_verification' => f('text', 'Google Search Console ვერიფიკაციის კოდი'),
        'noindex_all' => f('check', 'საიტის დამალვა საძიებოებისგან (მხოლოდ ტესტირებისას!)'),
    ];
}

/* =============================================================== ხედები */
$leads = os_read('leads', ['leads' => []])['leads'] ?? [];
$bookings = os_bookings();
$newCount = count(array_filter($leads, static fn($x) => ($x['status'] ?? 'new') === 'new'))
          + count(array_filter($bookings, static fn($x) => ($x['status'] ?? 'new') === 'new'));

/* CSV ექსპორტი */
if ($p === 'export') {
    $kind = ($_GET['kind'] ?? '') === 'leads' ? 'leads' : 'bookings';
    $rows = $kind === 'leads' ? $leads : $bookings;
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="outsourcify-' . $kind . '-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    $cols = $kind === 'leads'
        ? ['date', 'name', 'company', 'email', 'phone', 'service', 'message', 'lang', 'status']
        : ['created', 'date', 'time', 'flexible', 'name', 'email', 'phone', 'service', 'support', 'business', 'message', 'lang', 'status'];
    fputcsv($out, $cols);
    foreach (array_reverse($rows) as $r) {
        fputcsv($out, array_map(static fn($c) => is_array($r[$c] ?? '') ? implode('; ', $r[$c]) : (is_bool($r[$c] ?? '') ? ($r[$c] ? 'yes' : '') : (string) ($r[$c] ?? '')), $cols));
    }
    exit;
}

/* მედია ბიბლიოთეკა JSON-ად (ფოტოს ამრჩევისთვის) */
if ($p === 'media_json') {
    json_out(['ok' => true, 'items' => os_media_list(), 'csrf' => os_csrf()]);
}

$titles = ['dashboard' => 'მთავარი', 'pages' => 'გვერდები', 'page' => 'გვერდის რედაქტირება', 'services' => 'სერვისები', 'service' => 'სერვისი',
    'faqs' => 'FAQ', 'testimonials' => 'შეფასებები', 'industries' => 'ვისთან ვმუშაობთ', 'menus' => 'მენიუ და ფუტერი', 'media' => 'ფოტოები',
    'inbox' => 'განაცხადები და ჯავშნები', 'settings' => 'პარამეტრები', 'account' => 'ანგარიში'];
if (!isset($titles[$p])) {
    $p = 'dashboard';
}

echo a_head($titles[$p]) . '<body data-csrf="' . e(os_csrf()) . '"><div class="shell">' . a_nav($p, ['inbox' => $newCount]) . '<main class="main">';
echo flash($msg, $err);

$statusLabels = ['new' => 'ახალი', 'contacted' => 'დაკავშირებული', 'done' => 'დასრულებული', 'cancelled' => 'გაუქმებული'];

switch ($p) {
    /* ------------------------------------------------------------ მთავარი */
    case 'dashboard':
        $upcoming = array_filter($bookings, static fn($b) => ($b['status'] ?? '') !== 'cancelled' && (!empty($b['flexible']) || ($b['date'] ?? '') >= date('Y-m-d')));
        usort($upcoming, static fn($a, $b) => strcmp(($a['date'] ?? '9') . ($a['time'] ?? ''), ($b['date'] ?? '9') . ($b['time'] ?? '')));
        echo '<h1>გამარჯობა, ' . e((string) os_user()) . ' 👋</h1><div class="tiles">'
            . '<a class="tile" href="' . a_url('inbox') . '"><b>' . $newCount . '</b><span>ახალი განაცხადი / ჯავშანი</span></a>'
            . '<a class="tile" href="' . a_url('inbox', ['tab' => 'bookings']) . '"><b>' . count($upcoming) . '</b><span>მომავალი კონსულტაცია</span></a>'
            . '<a class="tile" href="' . a_url('pages') . '"><b>' . count(pages()) . '</b><span>გვერდი</span></a>'
            . '<a class="tile" href="' . a_url('services') . '"><b>' . count(services(true)) . '</b><span>სერვისი</span></a></div>';

        echo '<div class="grid2"><section class="card"><div class="head"><h2>მომავალი კონსულტაციები</h2><a class="link" href="' . a_url('inbox', ['tab' => 'bookings']) . '">ყველა →</a></div>';
        if (!$upcoming) {
            echo '<p class="muted">ჯერ არცერთი ჯავშანი არ არის.</p>';
        }
        foreach (array_slice($upcoming, 0, 6) as $b) {
            echo '<div class="row-item"><b>' . e(!empty($b['flexible']) ? 'დრო შესათანხმებელია' : os_booking_label((string) $b['date'], (string) $b['time'])) . '</b><span>'
                . e((string) $b['name']) . ' · ' . e((string) ($b['service'] ?? '')) . '</span></div>';
        }
        echo '</section>';

        // SEO შემოწმება
        echo '<section class="card"><div class="head"><h2>SEO შემოწმება</h2></div><p class="muted small">სათაური: 30–60 სიმბოლო, აღწერა: 120–160 სიმბოლო (ორივე ენაზე).</p><ul class="seo-check">';
        $issues = 0;
        $check = static function (string $name, string $url, array $t, array $d) use (&$issues) {
            foreach (OS_LANGS as $l) {
                $tt = (string) ($t[$l] ?? '');
                $dd = (string) ($d[$l] ?? '');
                $ct = seo_len_class($tt, 30, 60);
                $cd = seo_len_class($dd, 120, 160);
                if ($ct !== 'ok' || $cd !== 'ok') {
                    $issues++;
                    echo '<li><a href="' . e($url) . '">' . e($name) . '</a> <span class="flag flag--' . $l . '">' . LANG_LABEL[$l] . '</span>'
                        . ' <span class="pill pill--' . $ct . '">სათაური ' . mb_strlen($tt) . '</span> <span class="pill pill--' . $cd . '">აღწერა ' . mb_strlen($dd) . '</span></li>';
                }
            }
        };
        foreach (pages() as $pg) {
            $check((string) L($pg['title'] ?? '', 'ka'), a_url('page', ['id' => $pg['id']]), (array) ($pg['seo']['title'] ?? []), (array) ($pg['seo']['description'] ?? []));
        }
        foreach (services(true) as $s) {
            $check((string) L($s['title'] ?? '', 'ka'), a_url('service', ['id' => $s['id']]), (array) ($s['seo_title'] ?? []), (array) ($s['seo_desc'] ?? []));
        }
        if (!$issues) {
            echo '<li class="ok">✓ ყველა გვერდის SEO სათაური და აღწერა რეკომენდებულ ფარგლებშია.</li>';
        }
        echo '</ul></section></div>';
        echo '<section class="card"><h2>სწრაფი ბმულები</h2><div class="quick">'
            . '<a class="btn btn--ghost" href="' . a_url('page', ['id' => 'home']) . '">მთავარი გვერდის რედაქტირება</a>'
            . '<a class="btn btn--ghost" href="' . a_url('service', ['new' => 1]) . '">+ ახალი სერვისი</a>'
            . '<a class="btn btn--ghost" href="' . a_url('page', ['new' => 1]) . '">+ ახალი გვერდი</a>'
            . '<a class="btn btn--ghost" href="' . a_url('settings') . '">კონტაქტები</a>'
            . '<a class="btn btn--ghost" href="/sitemap.xml" target="_blank">sitemap.xml</a></div></section>';
        break;

    /* ------------------------------------------------------------ გვერდები */
    case 'pages':
        echo '<div class="head"><h1>გვერდები</h1><a class="btn" href="' . a_url('page', ['new' => 1]) . '">+ ახალი გვერდი</a></div>'
            . '<table class="table"><thead><tr><th>გვერდი</th><th>მისამართი (ქართ / ENG)</th><th>SEO</th><th></th></tr></thead><tbody>';
        foreach (pages() as $pg) {
            $st = (string) L($pg['seo']['title'] ?? '', 'ka');
            $sd = (string) L($pg['seo']['description'] ?? '', 'ka');
            echo '<tr><td><a href="' . a_url('page', ['id' => $pg['id']]) . '"><b>' . e((string) L($pg['title'] ?? '', 'ka')) . '</b></a>'
                . (!empty($pg['hidden']) ? ' <span class="pill pill--off">დამალული</span>' : '') . (!empty($pg['noindex']) ? ' <span class="pill pill--warn">noindex</span>' : '')
                . '<br><small class="muted">' . count($pg['blocks'] ?? []) . ' ბლოკი</small></td>'
                . '<td><a href="' . e(url_page((string) $pg['id'], 'ka')) . '" target="_blank">' . e(url_page((string) $pg['id'], 'ka')) . '</a><br>'
                . '<a class="muted" href="' . e(url_page((string) $pg['id'], 'en')) . '" target="_blank">' . e(url_page((string) $pg['id'], 'en')) . '</a></td>'
                . '<td><span class="pill pill--' . seo_len_class($st, 30, 60) . '">T ' . mb_strlen($st) . '</span> <span class="pill pill--' . seo_len_class($sd, 120, 160) . '">D ' . mb_strlen($sd) . '</span></td>'
                . '<td class="right"><a class="btn btn--sm btn--ghost" href="' . a_url('page', ['id' => $pg['id']]) . '">რედაქტირება</a></td></tr>';
        }
        echo '</tbody></table>';
        break;

    case 'page':
        $isNew = !empty($_GET['new']);
        $pg = $isNew ? ['id' => '', 'template' => 'page', 'title' => ['ka' => '', 'en' => ''], 'slug' => ['ka' => '', 'en' => ''], 'blocks' => [
            ['type' => 'page_hero', 'title' => ['ka' => '', 'en' => '']], ['type' => 'richtext'], ['type' => 'cta'] + (site()['cta'] ?? []),
        ]] : page_by_id((string) ($_GET['id'] ?? ''));
        if (!$pg) {
            echo '<p>გვერდი ვერ მოიძებნა.</p>';
            break;
        }
        $isHome = ($pg['template'] ?? '') === 'home';
        $meta = [
            'title' => $pg['title'] ?? [], 'slug' => $pg['slug'] ?? [],
            'seo_title' => $pg['seo']['title'] ?? [], 'seo_desc' => $pg['seo']['description'] ?? [], 'keywords' => $pg['seo']['keywords'] ?? [],
            'og_image' => $pg['og_image'] ?? '', 'hidden' => !empty($pg['hidden']), 'noindex' => !empty($pg['noindex']),
        ];
        $metaDefs = [
            'title' => f('text', 'გვერდის სახელი (მენიუსა და ბილიკში)', ['i18n' => true]),
            'slug' => f('text', 'URL (slug)', ['i18n' => true, 'hint' => $isHome ? 'მთავარ გვერდს მისამართი არ აქვს' : 'მხოლოდ ლათინური; ქართულიდან ავტომატურად ტრანსლიტერირდება. შეცვლისას ძველი ბმულები აღარ იმუშავებს!']),
            'seo_title' => f('text', 'SEO სათაური (<title>)', ['i18n' => true, 'counter' => 60, 'hint' => 'რეკომენდებულია 50–60 სიმბოლო']),
            'seo_desc' => f('textarea', 'Meta აღწერა', ['i18n' => true, 'counter' => 160, 'hint' => 'რეკომენდებულია 140–160 სიმბოლო']),
            'keywords' => f('text', 'საკვანძო სიტყვები (შიდა შენიშვნა, საიტზე არ ჩანს)', ['i18n' => true]),
            'og_image' => f('image', 'სოციალური გაზიარების სურათი (1200×630, არასავალდებულო)'),
            'noindex' => f('check', 'საძიებოებისგან დამალვა (noindex)'),
        ];
        if (!$isHome) {
            $metaDefs['hidden'] = f('check', 'გვერდის გამორთვა (404)');
        }
        echo '<form method="post" class="editor" data-editor action="' . a_url('page', ['id' => $pg['id']]) . '">' . os_csrf_field()
            . '<input type="hidden" name="action" value="save_page"><input type="hidden" name="id" value="' . e((string) $pg['id']) . '"><input type="hidden" name="payload">'
            . '<div class="head sticky"><div><a class="link" href="' . a_url('pages') . '">← გვერდები</a><h1>' . e($isNew ? 'ახალი გვერდი' : (string) L($pg['title'] ?? '', 'ka')) . '</h1></div><div class="head__act">';
        if (!$isNew) {
            echo '<a class="btn btn--ghost" href="' . e(url_page((string) $pg['id'], 'ka')) . '" target="_blank">ქართ ↗</a><a class="btn btn--ghost" href="' . e(url_page((string) $pg['id'], 'en')) . '" target="_blank">ENG ↗</a>';
        }
        echo '<button class="btn">შენახვა</button></div></div>';
        echo '<details class="card" ' . ($isNew ? 'open' : '') . '><summary><h2>გვერდის პარამეტრები და SEO</h2></summary><div data-scope data-meta>' . fields($metaDefs, $meta) . '</div></details>';
        echo '<h2 class="sub">ბლოკები <small class="muted">— დააჭირეთ ბლოკს გასაშლელად; ↑↓ რიგის შესაცვლელად</small></h2><div class="blocks" data-blocks>';
        foreach ((array) ($pg['blocks'] ?? []) as $b) {
            echo block_editor((array) $b);
        }
        echo '</div><div class="card add-block"><label class="fld"><span class="fld__label">ახალი ბლოკის დამატება</span><select data-add-type>';
        foreach (block_defs() as $k => $d) {
            echo '<option value="' . e($k) . '">' . e($d['label'] . ' — ' . $d['desc']) . '</option>';
        }
        echo '</select></label><button type="button" class="btn btn--ghost" data-add-block>+ დამატება</button></div>';
        foreach (block_defs() as $k => $d) {
            echo '<template data-tpl="' . e($k) . '">' . str_replace('<div class="blk__body" hidden>', '<div class="blk__body">', block_editor(['type' => $k])) . '</template>';
        }
        echo '</form>';
        if (!$isNew && empty($pg['system'])) {
            echo '<form method="post" class="danger-zone" onsubmit="return confirm(\'წავშალოთ გვერდი?\')">' . os_csrf_field()
                . '<input type="hidden" name="action" value="delete_page"><input type="hidden" name="id" value="' . e((string) $pg['id']) . '"><button class="link link--danger">გვერდის წაშლა</button></form>';
        }
        break;

    /* ------------------------------------------------------------ სერვისები */
    case 'services':
        echo '<div class="head"><h1>სერვისები</h1><a class="btn" href="' . a_url('service', ['new' => 1]) . '">+ ახალი სერვისი</a></div>'
            . '<p class="muted">სერვისები ავტომატურად ჩნდება მენიუში, მთავარ გვერდზე, ფუტერში, ჩატ-დაჯავშნასა და sitemap-ში. თითოეულს აქვს საკუთარი SEO-გვერდი ორ ენაზე.</p>'
            . '<table class="table"><thead><tr><th>#</th><th>სერვისი</th><th>მისამართი</th><th>სტატუსი</th><th></th></tr></thead><tbody>';
        $list = services(true);
        foreach ($list as $i => $s) {
            $act = static fn(string $a, string $label, array $extra = [], string $cls = 'link') => '<form method="post" class="inline">' . os_csrf_field()
                . '<input type="hidden" name="action" value="' . $a . '"><input type="hidden" name="id" value="' . e((string) $s['id']) . '">'
                . implode('', array_map(static fn($k, $v) => '<input type="hidden" name="' . e($k) . '" value="' . e($v) . '">', array_keys($extra), $extra))
                . '<button class="' . $cls . '"' . ($a === 'delete_service' ? ' onclick="return confirm(\'წავშალოთ სერვისი?\')"' : '') . '>' . $label . '</button></form>';
            echo '<tr><td class="nowrap">' . ($i > 0 ? $act('move_service', '↑', ['dir' => 'up']) : '') . ($i < count($list) - 1 ? $act('move_service', '↓', ['dir' => 'down']) : '') . '</td>'
                . '<td><span class="svc-ico">' . icon((string) ($s['icon'] ?? 'briefcase')) . '</span><a href="' . a_url('service', ['id' => $s['id']]) . '"><b>' . e((string) L($s['title'] ?? '', 'ka')) . '</b></a><br><small class="muted">' . e((string) L($s['title'] ?? '', 'en')) . '</small></td>'
                . '<td><a href="' . e(url_service($s, 'ka')) . '" target="_blank">' . e(url_service($s, 'ka')) . '</a><br><a class="muted" href="' . e(url_service($s, 'en')) . '" target="_blank">' . e(url_service($s, 'en')) . '</a></td>'
                . '<td>' . (!empty($s['hidden']) ? '<span class="pill pill--off">დამალული</span>' : '<span class="pill pill--ok">ჩანს</span>') . '</td>'
                . '<td class="right nowrap"><a class="btn btn--sm btn--ghost" href="' . a_url('service', ['id' => $s['id']]) . '">რედაქტირება</a> '
                . $act('toggle_service', !empty($s['hidden']) ? 'გამოჩენა' : 'დამალვა') . ' ' . $act('delete_service', 'წაშლა', [], 'link link--danger') . '</td></tr>';
        }
        echo '</tbody></table>';
        break;

    case 'service':
        $isNew = !empty($_GET['new']);
        $s = $isNew ? ['id' => '', 'icon' => 'briefcase'] : service_by_id((string) ($_GET['id'] ?? ''));
        if (!$s) {
            echo '<p>სერვისი ვერ მოიძებნა.</p>';
            break;
        }
        $defs = record_defs()['service'];
        $groups = [
            'ძირითადი' => ['title', 'slug', 'hidden', 'icon', 'image', 'image_alt', 'short', 'intro'],
            'გვერდის შინაარსი' => ['body', 'audience', 'includes', 'benefits'],
            'FAQ' => ['faq'],
            'SEO' => ['seo_title', 'seo_desc', 'keywords'],
        ];
        echo '<form method="post" class="editor" data-editor>' . os_csrf_field() . '<input type="hidden" name="action" value="save_service"><input type="hidden" name="id" value="' . e((string) $s['id']) . '"><input type="hidden" name="payload">'
            . '<div class="head sticky"><div><a class="link" href="' . a_url('services') . '">← სერვისები</a><h1>' . e($isNew ? 'ახალი სერვისი' : (string) L($s['title'] ?? '', 'ka')) . '</h1></div><div class="head__act">';
        if (!$isNew) {
            echo '<a class="btn btn--ghost" href="' . e(url_service($s, 'ka')) . '" target="_blank">ქართ ↗</a><a class="btn btn--ghost" href="' . e(url_service($s, 'en')) . '" target="_blank">ENG ↗</a>';
        }
        echo '<button class="btn">შენახვა</button></div></div><div data-scope data-root>';
        foreach ($groups as $g => $keys) {
            echo '<section class="card"><h2>' . e($g) . '</h2>';
            foreach ($keys as $k) {
                echo field($k, $defs[$k], $s[$k] ?? null);
            }
            echo '</section>';
        }
        echo '</div></form>';
        break;

    /* ------------------------------------------------------------ კოლექციები */
    case 'faqs':
    case 'testimonials':
    case 'industries':
        $cfg = [
            'faqs' => ['faq', 'კითხვები FAQ გვერდზე, მთავარ გვერდსა და სხვა გვერდების FAQ ბლოკებში. კატეგორია განსაზღვრავს, სად გამოჩნდება. Google-ისთვის FAQ schema ავტომატურად იქმნება.', 'კითხვის დამატება'],
            'testimonials' => ['testimonial', 'შეფასებების ბლოკი საიტზე მხოლოდ მაშინ ჩნდება, როცა ერთი შეფასება მაინც არის დამატებული. დაამატეთ მხოლოდ რეალური კლიენტების შეფასებები, მათი თანხმობით.', 'შეფასების დამატება'],
            'industries' => ['industry', 'კლიენტების ტიპები „ვისთან ვმუშაობთ“ ბლოკისთვის.', 'ჩანაწერის დამატება'],
        ][$p];
        $items = os_read($p, ['items' => []])['items'] ?? [];
        echo '<form method="post" class="editor" data-editor>' . os_csrf_field() . '<input type="hidden" name="action" value="save_' . $p . '"><input type="hidden" name="payload">'
            . '<div class="head sticky"><h1>' . e($titles[$p]) . '</h1><button class="btn">შენახვა</button></div><p class="muted">' . e($cfg[1]) . '</p>'
            . '<div class="card" data-scope data-root>' . repeater('items', f('repeater', 'ჩანაწერები', ['fields' => record_defs()[$cfg[0]], 'add' => $cfg[2]]), $items) . '</div></form>';
        break;

    /* ------------------------------------------------------------ მენიუ */
    case 'menus':
        $m = site()['menus'] ?? [];
        $menu = record_defs()['menu'];
        $plain = $menu;
        unset($plain['mega']);
        echo '<form method="post" class="editor" data-editor>' . os_csrf_field() . '<input type="hidden" name="action" value="save_menus"><input type="hidden" name="payload">'
            . '<div class="head sticky"><h1>მენიუ და ფუტერი</h1><button class="btn">შენახვა</button></div><div data-scope data-root>'
            . '<section class="card"><h2>მთავარი მენიუ (ჰედერი)</h2><p class="muted small">„სერვისების ჩამოსაშლელი მენიუ“ ავტომატურად აჩვენებს ყველა სერვისს.</p>' . repeater('header', f('repeater', 'პუნქტები', ['fields' => $menu, 'add' => 'პუნქტის დამატება']), (array) ($m['header'] ?? [])) . '</section>'
            . '<section class="card"><h2>ფუტერი — სვეტი 1</h2>' . field('footer_company_title', f('text', 'სვეტის სათაური', ['i18n' => true]), $m['footer_company_title'] ?? []) . repeater('footer_company', f('repeater', 'ბმულები', ['fields' => $plain, 'add' => 'ბმულის დამატება']), (array) ($m['footer_company'] ?? [])) . '</section>'
            . '<section class="card"><h2>ფუტერი — სვეტი 2</h2>' . field('footer_legal_title', f('text', 'სვეტის სათაური', ['i18n' => true]), $m['footer_legal_title'] ?? []) . repeater('footer_legal', f('repeater', 'ბმულები', ['fields' => $plain, 'add' => 'ბმულის დამატება']), (array) ($m['footer_legal'] ?? [])) . '</section>'
            . '<p class="muted small">სერვისების სვეტი და საკონტაქტო ინფორმაცია ფუტერში ავტომატურად ივსება. ფუტერის ტექსტი — პარამეტრებში.</p></div></form>';
        break;

    /* ------------------------------------------------------------ პარამეტრები */
    case 'settings':
        $site = site();
        $tab = preg_replace('~[^a-z]~', '', (string) ($_GET['tab'] ?? 'contacts')) ?: 'contacts';
        $bk = os_booking_config();
        $tabs = ['contacts' => 'კონტაქტები', 'seo' => 'SEO და ანალიტიკა', 'booking' => 'დაჯავშნის განრიგი', 'process' => 'პროცესი და CTA', 'ui' => 'ინტერფეისის ტექსტები'];
        echo '<form method="post" class="editor" data-editor>' . os_csrf_field() . '<input type="hidden" name="action" value="save_settings"><input type="hidden" name="tab" value="' . e($tab) . '"><input type="hidden" name="payload">'
            . '<div class="head sticky"><h1>პარამეტრები</h1><button class="btn">შენახვა</button></div><nav class="tabs" role="tablist">';
        foreach ($tabs as $k => $l) {
            echo '<button type="button" role="tab" data-tab="' . $k . '" aria-selected="' . ($k === $tab ? 'true' : 'false') . '">' . e($l) . '</button>';
        }
        echo '</nav><div data-scope data-root>';
        $sd = settings_defs();
        $pick = static fn(array $keys) => array_intersect_key($sd, array_flip($keys));
        echo '<div class="tabpane" data-pane="contacts"' . ($tab === 'contacts' ? '' : ' hidden') . '><section class="card" data-scope data-group="settings">'
            . fields($pick(['company', 'phone', 'email', 'notify_email', 'address', 'city', 'hours', 'map_embed', 'facebook', 'linkedin', 'instagram', 'footer_text']), $site['settings'] ?? [])
            . '</section></div>';
        // იგივე „settings“ ჯგუფი — admin.js ორივე სექციას ერთ ობიექტად აერთიანებს
        echo '<div class="tabpane" data-pane="seo"' . ($tab === 'seo' ? '' : ' hidden') . '><section class="card" data-scope data-group="settings">'
            . fields($pick(['domain', 'ga_id', 'gsc_verification', 'noindex_all']), $site['settings'] ?? []) . '</section>'
            . '<section class="card" data-scope data-group="seo">' . field('org_description', f('textarea', 'კომპანიის აღწერა (Organization schema)', ['i18n' => true]), $site['seo']['org_description'] ?? []) . '</section>'
            . '<section class="card"><h2>ტექნიკური SEO</h2><ul class="muted small"><li>sitemap.xml: <a href="/sitemap.xml" target="_blank">/sitemap.xml</a> — ავტომატურად ახლდება</li><li>robots.txt: <a href="/robots.txt" target="_blank">/robots.txt</a></li><li>Schema.org: Organization/AccountingService, WebSite, WebPage, BreadcrumbList, Service, FAQPage — ავტომატურად</li><li>hreflang (ka/en/x-default) და canonical — ავტომატურად</li></ul></section></div>';
        $dayNames = os_weekdays('ka', true);
        echo '<div class="tabpane" data-pane="booking"' . ($tab === 'booking' ? '' : ' hidden') . '><section class="card" data-scope data-group="booking"><h2>კონსულტაციის განრიგი</h2><div class="fld"><span class="fld__label">სამუშაო დღეები</span><div class="days">';
        foreach ($dayNames as $n => $dn) {
            echo '<label class="fld--check"><input type="checkbox" data-f="days" data-type="multi" value="' . $n . '"' . (in_array($n, $bk['days'], true) ? ' checked' : '') . '> ' . e($dn) . '</label>';
        }
        echo '</div></div><div class="row">'
            . '<label class="fld"><span class="fld__label">დაწყება</span><input type="time" data-f="start" value="' . e($bk['start']) . '"></label>'
            . '<label class="fld"><span class="fld__label">დასრულება</span><input type="time" data-f="end" value="' . e($bk['end']) . '"></label></div><div class="row3">'
            . '<label class="fld"><span class="fld__label">ხანგრძლივობა (წთ)</span><input type="number" min="15" max="120" step="5" data-f="slot" value="' . (int) $bk['slot'] . '"></label>'
            . '<label class="fld"><span class="fld__label">მინ. საათი ჯავშნამდე</span><input type="number" min="0" max="72" data-f="notice" value="' . (int) $bk['notice'] . '"></label>'
            . '<label class="fld"><span class="fld__label">რამდენი დღით წინ</span><input type="number" min="1" max="90" data-f="ahead" value="' . (int) $bk['ahead'] . '"></label></div>'
            . '<label class="fld"><span class="fld__label">დაკეტილი თარიღები (უქმეები, შვებულება)</span><small class="hint">ფორმატი: 2026-01-01, თითო ხაზზე ან მძიმით</small><textarea data-f="blocked" rows="3">' . e(implode("\n", $bk['blocked'])) . '</textarea></label></section></div>';
        echo '<div class="tabpane" data-pane="process"' . ($tab === 'process' ? '' : ' hidden') . '><section class="card" data-scope data-group="_root"><h2>საერთო პროცესი</h2><p class="muted small">გამოიყენება „პროცესი“ ბლოკებში (მონიშნული „საერთო ნაბიჯები“) და ყველა სერვისის გვერდზე.</p>'
            . repeater('process', f('repeater', 'ნაბიჯები', ['fields' => record_defs()['step'], 'add' => 'ნაბიჯის დამატება']), (array) ($site['process'] ?? [])) . '</section>'
            . '<section class="card" data-scope data-group="cta"><h2>საერთო CTA ბლოკი</h2><p class="muted small">ჩნდება სერვისების გვერდების ბოლოს.</p>' . fields(block_defs()['cta']['fields'], (array) ($site['cta'] ?? [])) . '</section></div>';
        $strings = require dirname(__DIR__) . '/inc/strings.php';
        $ui = $site['ui'] ?? [];
        echo '<div class="tabpane" data-pane="ui"' . ($tab === 'ui' ? '' : ' hidden') . '><section class="card" data-scope data-group="ui"><h2>ინტერფეისის ტექსტები</h2><p class="muted small">ღილაკები, ფორმის ლეიბლები და ჩატის კითხვები. ცარიელი ველი = ნაგულისხმევი ტექსტი (ნაცრისფრად ჩანს). {name} — კლიენტის სახელი.</p><div class="ui-list">';
        foreach ($strings as $k => $v) {
            echo '<div class="fld fld--i18n"><span class="fld__label mono small">' . e($k) . '</span><div class="i18n">';
            foreach (OS_LANGS as $l) {
                echo '<div class="i18n__col"><span class="flag flag--' . $l . '">' . LANG_LABEL[$l] . '</span><input type="text" data-f="' . e($k) . '" data-lang="' . $l . '" placeholder="' . e($v[$l] ?? '') . '" value="' . e((string) ($ui[$k][$l] ?? '')) . '"></div>';
            }
            echo '</div></div>';
        }
        echo '</div></section></div></div></form>';
        break;

    /* ------------------------------------------------------------ ფოტოები */
    case 'media':
        echo '<h1>ფოტოები</h1><form class="card upload" method="post" enctype="multipart/form-data">' . os_csrf_field() . '<input type="hidden" name="action" value="upload">'
            . '<label class="fld"><span class="fld__label">ფოტოს ატვირთვა (JPG, PNG, WebP, SVG — მაქს. 8 MB)</span><input type="file" name="file" accept="image/*" required></label>'
            . '<button class="btn">ატვირთვა</button><small class="muted">დიდი ფოტოები ავტომატურად მცირდება (2000px) და WebP-ად გარდაიქმნება. ფაილის სახელი SEO-სთვის ორიგინალიდან აიღება — ატვირთვამდე დაარქვით აღწერითი სახელი (მაგ. accountant-office-tbilisi.jpg).</small></form><div class="media-grid">';
        foreach (os_media_list() as $m) {
            echo '<figure class="shot"><img src="' . e($m['url']) . '" alt="" loading="lazy"><figcaption><code>' . e($m['name']) . '</code>'
                . '<button type="button" class="btn btn--sm btn--ghost" data-copy="' . e($m['url']) . '">მისამართის კოპირება</button>';
            if ($m['deletable']) {
                echo '<form method="post" onsubmit="return confirm(\'წავშალოთ ფოტო? შეამოწმეთ, რომ არსად გამოიყენება.\')">' . os_csrf_field() . '<input type="hidden" name="action" value="media_delete"><input type="hidden" name="name" value="' . e($m['name']) . '"><button class="link link--danger">წაშლა</button></form>';
            } else {
                echo '<small class="muted">ბრენდის ფოტო</small>';
            }
            echo '</figcaption></figure>';
        }
        echo '</div>';
        break;

    /* ------------------------------------------------------------ განაცხადები */
    case 'inbox':
        $tab = ($_GET['tab'] ?? '') === 'leads' ? 'leads' : 'bookings';
        $rows = array_reverse($tab === 'leads' ? $leads : $bookings);
        echo '<div class="head"><h1>განაცხადები და ჯავშნები</h1><a class="btn btn--ghost" href="' . a_url('export', ['kind' => $tab]) . '">CSV ექსპორტი</a></div>'
            . '<nav class="tabs"><a href="' . a_url('inbox', ['tab' => 'bookings']) . '" aria-selected="' . ($tab === 'bookings' ? 'true' : 'false') . '">კონსულტაციები (' . count($bookings) . ')</a>'
            . '<a href="' . a_url('inbox', ['tab' => 'leads']) . '" aria-selected="' . ($tab === 'leads' ? 'true' : 'false') . '">საკონტაქტო ფორმა (' . count($leads) . ')</a></nav>';
        if (!$rows) {
            echo '<div class="card"><p class="muted">ჯერ ჩანაწერი არ არის.</p></div>';
        }
        foreach ($rows as $r) {
            $st = (string) ($r['status'] ?? 'new');
            $when = $tab === 'bookings' ? (!empty($r['flexible']) ? 'დრო შესათანხმებელია' : os_booking_label((string) ($r['date'] ?? ''), (string) ($r['time'] ?? ''))) : (string) ($r['date'] ?? '');
            echo '<details class="card entry entry--' . e($st) . '"><summary><span class="entry__main"><b>' . e((string) ($r['name'] ?? '')) . '</b><span class="muted">' . e((string) ($r['service'] ?? '')) . '</span></span>'
                . '<span class="entry__when">' . e($when) . '</span><span class="pill pill--st-' . e($st) . '">' . e($statusLabels[$st] ?? $st) . '</span></summary><dl class="entry__dl">';
            $fields = $tab === 'bookings'
                ? ['ელფოსტა' => 'email', 'ტელეფონი' => 'phone', 'ბიზნესი' => 'business', 'მხარდაჭერა' => 'support', 'შეტყობინება' => 'message', 'ენა' => 'lang', 'გაიგზავნა' => 'created', 'გვერდი' => 'page']
                : ['ელფოსტა' => 'email', 'ტელეფონი' => 'phone', 'კომპანია' => 'company', 'შეტყობინება' => 'message', 'ენა' => 'lang', 'გვერდი' => 'page'];
            foreach ($fields as $lab => $k) {
                $v = $r[$k] ?? '';
                $v = is_array($v) ? implode(', ', $v) : (string) $v;
                if ($v === '') {
                    continue;
                }
                if ($k === 'email') {
                    $v = '<a href="mailto:' . e($v) . '">' . e($v) . '</a>';
                } elseif ($k === 'phone') {
                    $v = '<a href="tel:' . e(preg_replace('~[^\d+]~', '', $v)) . '">' . e($v) . '</a>';
                } else {
                    $v = nl2br(e($v), false);
                }
                echo '<dt>' . e($lab) . '</dt><dd>' . $v . '</dd>';
            }
            echo '</dl><div class="entry__act"><form method="post" class="inline">' . os_csrf_field() . '<input type="hidden" name="action" value="entry_status"><input type="hidden" name="kind" value="' . $tab . '"><input type="hidden" name="id" value="' . e((string) $r['id']) . '"><select name="status" onchange="this.form.submit()">';
            foreach ($statusLabels as $sk => $sl) {
                echo '<option value="' . $sk . '"' . ($sk === $st ? ' selected' : '') . '>' . e($sl) . '</option>';
            }
            echo '</select></form><form method="post" class="inline" onsubmit="return confirm(\'წავშალოთ ჩანაწერი?\')">' . os_csrf_field() . '<input type="hidden" name="action" value="entry_delete"><input type="hidden" name="kind" value="' . $tab . '"><input type="hidden" name="id" value="' . e((string) $r['id']) . '"><button class="link link--danger">წაშლა</button></form></div></details>';
        }
        if ($tab === 'bookings') {
            echo '<p class="muted small">„გაუქმებული“ სტატუსი დროს ისევ ათავისუფლებს ონლაინ დაჯავშნისთვის.</p>';
        }
        break;

    /* ------------------------------------------------------------ ანგარიში */
    case 'account':
        echo '<h1>პაროლის შეცვლა</h1><form method="post" class="card narrow">' . os_csrf_field() . '<input type="hidden" name="action" value="password">'
            . '<label class="fld"><span class="fld__label">მიმდინარე პაროლი</span><input type="password" name="current" required autocomplete="current-password"></label>'
            . '<label class="fld"><span class="fld__label">ახალი პაროლი (მინ. 10)</span><input type="password" name="new" required minlength="10" autocomplete="new-password"></label>'
            . '<label class="fld"><span class="fld__label">გაიმეორეთ</span><input type="password" name="new2" required autocomplete="new-password"></label>'
            . '<button class="btn">შეცვლა</button></form>';
        break;
}

echo '</main></div>'
    . '<dialog class="media-modal" id="media-modal"><div class="media-modal__head"><h2>ფოტოს არჩევა</h2><button type="button" class="link" data-close>დახურვა ✕</button></div><div class="media-modal__grid"></div></dialog>'
    . a_foot();
