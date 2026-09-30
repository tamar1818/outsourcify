<?php
/** თავისუფალი დროები ჩატ-დაჯავშნისთვის */
declare(strict_types=1);
ini_set('display_errors', '0');
require_once dirname(__DIR__) . '/inc/booking.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$lang = in_array($_GET['lang'] ?? '', OS_LANGS, true) ? $_GET['lang'] : OS_DEFAULT_LANG;
echo json_encode(['ok' => true, 'days' => os_booking_days($lang), 'slot' => os_booking_config()['slot']], JSON_UNESCAPED_UNICODE);
