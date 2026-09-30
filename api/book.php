<?php
/**
 * კონსულტაციის ჯავშანი ჩატიდან. ორმაგი ჯავშნისგან დაცულია (flock).
 * დრო არასავალდებულოა: „მოგვიანებით შევათანხმოთ“ → ჯავშანი დროის გარეშე.
 */
declare(strict_types=1);
ini_set('display_errors', '0');
require_once dirname(__DIR__) . '/inc/booking.php';
require_once dirname(__DIR__) . '/inc/mail.php';
require_once dirname(__DIR__) . '/inc/content.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$fail = static function (int $code, array $payload): never {
    http_response_code($code);
    echo json_encode(['ok' => false] + $payload, JSON_UNESCAPED_UNICODE);
    exit;
};

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    $fail(405, ['error' => 'method not allowed']);
}
$in = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($in)) {
    $in = $_POST;
}
if (!empty($in['company_website'])) {             // honeypot
    echo json_encode(['ok' => true, 'label' => '']);
    exit;
}
$get = static fn(string $k, int $max = 300): string => mb_substr(trim(strip_tags((string) (is_scalar($in[$k] ?? '') ? ($in[$k] ?? '') : ''))), 0, $max);
$lang = in_array($in['lang'] ?? '', OS_LANGS, true) ? (string) $in['lang'] : OS_DEFAULT_LANG;
os_lang($lang);

$name = $get('name', 120);
$email = $get('email', 160);
$phone = $get('phone', 60);
$date = $get('date', 10);
$time = $get('time', 5);
$flexible = !empty($in['flexible']) || ($date === '' && $time === '');
$support = array_slice(array_map(static fn($x) => mb_substr(strip_tags((string) $x), 0, 80), is_array($in['support'] ?? null) ? $in['support'] : []), 0, 10);

$errors = [];
if ($name === '') $errors[] = 'name';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'email';
if (strlen(preg_replace('~\D~', '', $phone) ?? '') < 7) $errors[] = 'phone';
if (!$flexible && (!preg_match('~^\d{4}-\d{2}-\d{2}$~', $date) || !preg_match('~^\d{2}:\d{2}$~', $time))) $errors[] = 'slot';
if ($errors) {
    $fail(422, ['fields' => $errors]);
}

$lock = fopen(OS_CONTENT . '/.bookings.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX)) {
    $fail(500, ['error' => 'lock']);
}
$store = os_read('bookings', ['bookings' => []]);
$list = $store['bookings'] ?? [];

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$recent = count(array_filter($list, static fn($b) => ($b['ip'] ?? '') === $ip && time() - (int) ($b['ts'] ?? 0) < 3600));
if ($recent >= 4) {
    $fail(429, ['error' => 'too many requests']);
}
if (!$flexible && !in_array($time, os_day_slots($date), true)) {
    $fail(409, ['error' => 'taken']);
}

$svc = service_by_id($get('service', 80));
$item = [
    'id'       => bin2hex(random_bytes(8)),
    'ts'       => time(),
    'created'  => date('Y-m-d H:i'),
    'date'     => $flexible ? '' : $date,
    'time'     => $flexible ? '' : $time,
    'flexible' => $flexible,
    'name'     => $name,
    'email'    => $email,
    'phone'    => $phone,
    'service'  => $svc ? (string) L($svc['title'] ?? '', 'ka') : $get('service_label', 120),
    'business' => $get('business', 1500),
    'support'  => $support,
    'message'  => $get('message', 3000),
    'lang'     => $lang,
    'page'     => $get('page', 200),
    'status'   => 'new',
    'ip'       => $ip,
];
$list[] = $item;
$store['bookings'] = array_slice($list, -3000);
if (!os_write('bookings', $store)) {
    $fail(500, ['error' => 'storage']);
}
flock($lock, LOCK_UN);
fclose($lock);

$slot = os_booking_config()['slot'];
$labelKa = $flexible ? 'დრო შესათანხმებელია' : os_booking_label($date, $time, 'ka');
$label = $flexible ? '' : os_booking_label($date, $time, $lang);

// გუნდს (ქართულად)
os_mail(os_team_email(), 'ახალი კონსულტაცია: ' . $labelKa . ' — ' . $name,
    "ახალი ჯავშანი საიტიდან\n\n" . os_mail_lines([
        'დრო' => $flexible ? $labelKa : $labelKa . " ($slot წთ, თბილისის დროით)",
        'სახელი' => $name, 'ელფოსტა' => $email, 'ტელეფონი' => $phone,
        'სერვისი' => $item['service'], 'მხარდაჭერა' => $support, 'ენა' => $lang,
    ])
    . ($item['business'] !== '' ? "\nბიზნესი:\n" . $item['business'] . "\n" : '')
    . ($item['message'] !== '' ? "\nშეტყობინება:\n" . $item['message'] . "\n" : '')
    . "\nყველა ჯავშანი: " . base_url() . "/admin/?p=inbox\n",
    $email);

// კლიენტს — კლიენტის ენაზე
$gcal = '';
if (!$flexible) {
    $start = new DateTimeImmutable("$date $time");
    $end = $start->modify("+$slot minutes");
    $utc = new DateTimeZone('UTC');
    $gcal = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
          . '&text=' . rawurlencode($lang === 'ka' ? 'კონსულტაცია — Outsourcify' : 'Consultation — Outsourcify')
          . '&dates=' . $start->setTimezone($utc)->format('Ymd\THis\Z') . '/' . $end->setTimezone($utc)->format('Ymd\THis\Z')
          . '&details=' . rawurlencode(($lang === 'ka' ? 'კითხვები: ' : 'Questions: ') . os_team_email());
}
if ($lang === 'ka') {
    $body = "გამარჯობა, $name!\n\nმადლობა — თქვენი მოთხოვნა მიღებულია.\n"
          . ($flexible ? "ჩვენი გუნდი მალე დაგიკავშირდებათ მოსახერხებელი დროის შესათანხმებლად.\n"
                       : "კონსულტაციის დრო: $label (თბილისის დროით, $slot წუთი).\nჩვენი გუნდი დაგიკავშირდებათ დათქმულ დროს.\n\nკალენდარში დამატება: $gcal\n")
          . "\nთუ რამე შეიცვალა, უბრალოდ უპასუხეთ ამ წერილს.\n\n— Outsourcify\n" . base_url() . "\n";
    $subject = $flexible ? 'მოთხოვნა მიღებულია — Outsourcify' : 'კონსულტაცია დაჯავშნილია — ' . $label;
} else {
    $body = "Hello $name,\n\nThank you — we have received your request.\n"
          . ($flexible ? "Our team will contact you shortly to agree on a convenient time.\n"
                       : "Consultation time: $label (Tbilisi time, $slot minutes).\nOur team will contact you at the agreed time.\n\nAdd to calendar: $gcal\n")
          . "\nIf anything changes, simply reply to this email.\n\n— Outsourcify\n" . base_url() . "/en/\n";
    $subject = $flexible ? 'Request received — Outsourcify' : 'Consultation booked — ' . $label;
}
os_mail($email, $subject, $body, os_team_email());

echo json_encode(['ok' => true, 'label' => $label, 'gcal' => $gcal, 'flexible' => $flexible], JSON_UNESCAPED_UNICODE);
