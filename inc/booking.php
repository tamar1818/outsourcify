<?php
/** კონსულტაციების დაჯავშნა — სამუშაო საათები, თავისუფალი დროები, ჯავშნები (ორენოვანი) */
declare(strict_types=1);
require_once __DIR__ . '/core.php';

const OS_BOOKING_DEFAULTS = [
    'days'    => [1, 2, 3, 4, 5],   // ორშ–პარ (ISO: 1 = ორშაბათი)
    'start'   => '10:00',
    'end'     => '18:00',
    'slot'    => 30,                // წუთი
    'notice'  => 3,                 // მინ. საათი ჯავშნამდე
    'ahead'   => 21,                // რამდენი დღით წინ
    'blocked' => [],                // დაკეტილი თარიღები Y-m-d
];

function os_weekdays(string $lang, bool $full = false): array
{
    if ($lang === 'en') {
        return $full
            ? [1 => 'Monday', 2 => 'Tuesday', 3 => 'Wednesday', 4 => 'Thursday', 5 => 'Friday', 6 => 'Saturday', 7 => 'Sunday']
            : [1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 7 => 'Sun'];
    }
    return $full
        ? [1 => 'ორშაბათი', 2 => 'სამშაბათი', 3 => 'ოთხშაბათი', 4 => 'ხუთშაბათი', 5 => 'პარასკევი', 6 => 'შაბათი', 7 => 'კვირა']
        : [1 => 'ორშ', 2 => 'სამ', 3 => 'ოთხ', 4 => 'ხუთ', 5 => 'პარ', 6 => 'შაბ', 7 => 'კვი'];
}

function os_months(string $lang): array
{
    return $lang === 'en'
        ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        : ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'];
}

function os_booking_config(): array
{
    $c = (array) (os_read('site')['booking'] ?? []);
    $cfg = array_merge(OS_BOOKING_DEFAULTS, array_filter($c, static fn($v) => $v !== '' && $v !== null));
    $cfg['days'] = array_values(array_filter(array_map('intval', (array) $cfg['days']), static fn($d) => $d >= 1 && $d <= 7));
    $cfg['slot'] = max(15, min(120, (int) $cfg['slot']));
    $cfg['notice'] = max(0, min(72, (int) $cfg['notice']));
    $cfg['ahead'] = max(1, min(90, (int) $cfg['ahead']));
    foreach (['start', 'end'] as $k) {
        if (!preg_match('~^([01]\d|2[0-3]):[0-5]\d$~', (string) $cfg[$k])) {
            $cfg[$k] = OS_BOOKING_DEFAULTS[$k];
        }
    }
    $cfg['blocked'] = array_values(array_filter((array) $cfg['blocked'], static fn($d) => (bool) preg_match('~^\d{4}-\d{2}-\d{2}$~', (string) $d)));
    return $cfg;
}

function os_bookings(): array
{
    return os_read('bookings', ['bookings' => []])['bookings'] ?? [];
}

/** დაკავებული დროები: ['Y-m-d H:i' => true] (გაუქმებულის გარდა) */
function os_booked_map(): array
{
    $map = [];
    foreach (os_bookings() as $b) {
        if (($b['status'] ?? 'new') !== 'cancelled' && !empty($b['date'])) {
            $map[$b['date'] . ' ' . ($b['time'] ?? '')] = true;
        }
    }
    return $map;
}

function os_day_slots(string $date, ?array $cfg = null, ?array $booked = null): array
{
    $cfg ??= os_booking_config();
    $booked ??= os_booked_map();
    $day = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    if (!$day || in_array($date, $cfg['blocked'], true) || !in_array((int) $day->format('N'), $cfg['days'], true)) {
        return [];
    }
    $earliest = (new DateTimeImmutable())->modify('+' . $cfg['notice'] . ' hours');
    $t = new DateTimeImmutable($date . ' ' . $cfg['start']);
    $end = new DateTimeImmutable($date . ' ' . $cfg['end']);
    $out = [];
    while ($t->modify('+' . $cfg['slot'] . ' minutes') <= $end) {
        $hm = $t->format('H:i');
        if ($t >= $earliest && empty($booked[$date . ' ' . $hm])) {
            $out[] = $hm;
        }
        $t = $t->modify('+' . $cfg['slot'] . ' minutes');
    }
    return $out;
}

/** მომდევნო დღეები — მხოლოდ სამუშაო დღეები, თავისუფალი დროებით */
function os_booking_days(string $lang): array
{
    $cfg = os_booking_config();
    $booked = os_booked_map();
    $dow = os_weekdays($lang);
    $mon = os_months($lang);
    $out = [];
    $d = new DateTimeImmutable('today');
    for ($i = 0; $i < $cfg['ahead']; $i++, $d = $d->modify('+1 day')) {
        if (!in_array((int) $d->format('N'), $cfg['days'], true)) {
            continue;
        }
        $date = $d->format('Y-m-d');
        $out[] = [
            'date'  => $date,
            'dow'   => $dow[(int) $d->format('N')],
            'day'   => (int) $d->format('j'),
            'month' => mb_substr($mon[(int) $d->format('n') - 1], 0, 3),
            'slots' => os_day_slots($date, $cfg, $booked),
        ];
    }
    return $out;
}

/** „ხუთშაბათი, 2 ოქტომბერი, 11:30“ / „Thursday, 2 October, 11:30“ */
function os_booking_label(string $date, string $time, string $lang = 'ka'): string
{
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    if (!$d) {
        return trim($date . ' ' . $time);
    }
    return os_weekdays($lang, true)[(int) $d->format('N')] . ', ' . (int) $d->format('j') . ' '
         . os_months($lang)[(int) $d->format('n') - 1] . ', ' . $time;
}
