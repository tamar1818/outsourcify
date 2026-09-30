<?php
/** საკონტაქტო ფორმის მიმღები — ინახავს content/leads.json-ში და აგზავნის შეტყობინებას */
declare(strict_types=1);
ini_set('display_errors', '0');
require_once dirname(__DIR__) . '/inc/mail.php';
require_once dirname(__DIR__) . '/inc/content.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method not allowed']);
    exit;
}
$in = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($in)) {
    $in = $_POST;
}
if (!empty($in['company_website'])) {   // honeypot
    echo json_encode(['ok' => true]);
    exit;
}
$get = static fn(string $k, int $max = 500): string => mb_substr(trim(strip_tags((string) (is_scalar($in[$k] ?? '') ? ($in[$k] ?? '') : ''))), 0, $max);

$name = $get('name', 120);
$email = $get('email', 160);
$phone = $get('phone', 60);
$errors = [];
if ($name === '') $errors[] = 'name';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'email';
if (strlen(preg_replace('~\D~', '', $phone) ?? '') < 7) $errors[] = 'phone';
if (($in['consent'] ?? '') !== 'yes') $errors[] = 'consent';
if ($errors) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'fields' => $errors]);
    exit;
}

$lock = fopen(OS_CONTENT . '/.leads.lock', 'c');
if ($lock) {
    flock($lock, LOCK_EX);
}
$store = os_read('leads', ['leads' => []]);
$leads = $store['leads'] ?? [];
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$recent = count(array_filter($leads, static fn($l) => ($l['ip'] ?? '') === $ip && time() - (int) ($l['ts'] ?? 0) < 600));
if ($recent >= 5) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'too many requests']);
    exit;
}
$svc = service_by_id($get('service', 80));
$lead = [
    'id'      => bin2hex(random_bytes(8)),
    'ts'      => time(),
    'date'    => date('Y-m-d H:i'),
    'name'    => $name,
    'email'   => $email,
    'phone'   => $phone,
    'company' => $get('company', 160),
    'service' => $svc ? (string) L($svc['title'] ?? '', 'ka') : '',
    'message' => $get('message', 4000),
    'lang'    => in_array($in['lang'] ?? '', OS_LANGS, true) ? $in['lang'] : 'ka',
    'page'    => $get('page', 200),
    'status'  => 'new',
    'ip'      => $ip,
];
$leads[] = $lead;
$store['leads'] = array_slice($leads, -3000);
$ok = os_write('leads', $store);
if ($lock) {
    flock($lock, LOCK_UN);
    fclose($lock);
}
if (!$ok) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'storage']);
    exit;
}

os_mail(os_team_email(), 'ახალი შეტყობინება საიტიდან — ' . $name,
    "ახალი შეტყობინება საკონტაქტო ფორმიდან\n\n" . os_mail_lines([
        'სახელი' => $name, 'კომპანია' => $lead['company'], 'ელფოსტა' => $email, 'ტელეფონი' => $phone,
        'სერვისი' => $lead['service'], 'ენა' => $lead['lang'], 'გვერდი' => $lead['page'],
    ]) . ($lead['message'] !== '' ? "\n" . $lead['message'] . "\n" : '')
    . "\nყველა შეტყობინება: " . base_url() . "/admin/?p=inbox\n",
    $email);

echo json_encode(['ok' => true]);
