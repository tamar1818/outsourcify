<?php
/**
 * კომპონენტების (ბლოკების) და ჩანაწერების სქემები.
 * ერთი წყარო ადმინის ფორმებისთვის (ველები ავტომატურად იხატება) და
 * შენახვისას გასუფთავებისთვის (os_clean).
 *
 * ველის ტიპები: text · textarea · rich · image · link · icon · select · check · number · list · repeater
 * i18n => true — ველს აქვს ქართული და ინგლისური ვერსია.
 */
declare(strict_types=1);
require_once __DIR__ . '/icons.php';

function f(string $type, string $label, array $extra = []): array
{
    return ['type' => $type, 'label' => $label] + $extra;
}

/* საერთო ველები */
function f_head(): array
{
    return [
        'eyebrow' => f('text', 'ზედა წარწერა (eyebrow)', ['i18n' => true]),
        'title'   => f('text', 'სათაური', ['i18n' => true, 'hint' => 'აქცენტისთვის: <em>სიტყვა</em>']),
        'text'    => f('textarea', 'აღწერა', ['i18n' => true]),
    ];
}

function f_cta(string $n = '', string $label = 'ღილაკი'): array
{
    return [
        "cta{$n}_label" => f('text', "$label — ტექსტი", ['i18n' => true]),
        "cta{$n}_link"  => f('link', "$label — ბმული"),
    ];
}

function block_defs(): array
{
    static $d = null;
    if ($d !== null) {
        return $d;
    }
    $item_card = [
        'icon'  => f('icon', 'ხატულა'),
        'title' => f('text', 'სათაური', ['i18n' => true]),
        'text'  => f('textarea', 'ტექსტი', ['i18n' => true]),
    ];
    return $d = [
        'hero' => ['label' => 'მთავარი Hero', 'desc' => 'მთავარი გვერდის პირველი ეკრანი', 'fields' =>
            f_head() + f_cta('1', 'მთავარი ღილაკი') + f_cta('2', 'მეორე ღილაკი') + [
                'points'    => f('list', 'მოკლე უპირატესობები (თითო ხაზზე ერთი)', ['i18n' => true]),
                'image'     => f('image', 'სურათი'),
                'image_alt' => f('text', 'სურათის alt ტექსტი', ['i18n' => true]),
                'card1'     => f('text', 'მცურავი ბარათი 1', ['i18n' => true]),
                'card2'     => f('text', 'მცურავი ბარათი 2', ['i18n' => true]),
                'card3'     => f('text', 'მცურავი ბარათი 3', ['i18n' => true]),
            ]],
        'page_hero' => ['label' => 'გვერდის სათაური', 'desc' => 'შიდა გვერდის ზედა ბლოკი ბილიკით', 'fields' =>
            f_head() + f_cta('', 'ღილაკი') + [
                'image'     => f('image', 'სურათი (არასავალდებულო)'),
                'image_alt' => f('text', 'სურათის alt ტექსტი', ['i18n' => true]),
            ]],
        'cards' => ['label' => 'ბარათები', 'desc' => 'უპირატესობები, ღირებულებები, მახასიათებლები', 'fields' =>
            f_head() + [
                'variant' => f('select', 'სტილი', ['options' => [
                    'grid' => 'ბადე (თეთრი ბარათები)', 'strip' => 'ზოლი (კომპაქტური)',
                    'bento' => 'მუქი bento', 'numbered' => 'დანომრილი სია']]),
                'items' => f('repeater', 'ბარათები', ['fields' => $item_card, 'add' => 'ბარათის დამატება']),
            ] + f_cta('', 'ღილაკი')],
        'services' => ['label' => 'სერვისების ბადე', 'desc' => 'სერვისები ავტომატურად — „სერვისები“ განყოფილებიდან', 'fields' =>
            f_head() + [
                'layout' => f('select', 'განლაგება', ['options' => ['grid' => 'ბარათები', 'list' => 'ინტერაქტიული სია']]),
                'limit'  => f('number', 'რაოდენობა (0 = ყველა)'),
            ] + f_cta('', 'ღილაკი')],
        'split' => ['label' => 'სურათი + ტექსტი', 'desc' => 'მონაცვლე სექცია სურათითა და სიით', 'fields' =>
            f_head() + [
                'points'    => f('list', 'პუნქტები (თითო ხაზზე ერთი)', ['i18n' => true]),
                'image'     => f('image', 'სურათი'),
                'image_alt' => f('text', 'სურათის alt ტექსტი', ['i18n' => true]),
                'reverse'   => f('check', 'სურათი მარცხნივ'),
                'badge_title' => f('text', 'სურათზე ბარათი — სათაური', ['i18n' => true]),
                'badge_text'  => f('text', 'სურათზე ბარათი — ტექსტი', ['i18n' => true]),
            ] + f_cta('', 'ღილაკი')],
        'steps' => ['label' => 'პროცესი / ნაბიჯები', 'desc' => 'როგორ ვმუშაობთ', 'fields' =>
            f_head() + [
                'use_global' => f('check', 'საერთო ნაბიჯები (პარამეტრები → პროცესი)'),
                'items' => f('repeater', 'საკუთარი ნაბიჯები', ['fields' => [
                    'title' => f('text', 'სათაური', ['i18n' => true]),
                    'text'  => f('textarea', 'ტექსტი', ['i18n' => true]),
                ], 'add' => 'ნაბიჯის დამატება']),
            ] + f_cta('', 'ღილაკი')],
        'compare' => ['label' => 'შედარების ცხრილი', 'desc' => 'მაგ. შიდა ბუღალტერი vs აუთსორსინგი', 'fields' =>
            f_head() + [
                'col_a' => f('text', 'სვეტი A (სათაური)', ['i18n' => true]),
                'col_b' => f('text', 'სვეტი B (სათაური, გამოკვეთილი)', ['i18n' => true]),
                'rows'  => f('repeater', 'სტრიქონები', ['fields' => [
                    'criterion' => f('text', 'კრიტერიუმი', ['i18n' => true]),
                    'a' => f('text', 'A', ['i18n' => true]),
                    'b' => f('text', 'B', ['i18n' => true]),
                ], 'add' => 'სტრიქონის დამატება']),
            ]],
        'industries' => ['label' => 'ვისთან ვმუშაობთ', 'desc' => 'კლიენტების ტიპები — „ინდუსტრიები“ განყოფილებიდან', 'fields' =>
            f_head() + f_cta('', 'ღილაკი')],
        'testimonials' => ['label' => 'შეფასებები', 'desc' => 'ჩნდება მხოლოდ მაშინ, როცა შეფასება დამატებულია', 'fields' => f_head()],
        'faq' => ['label' => 'FAQ', 'desc' => 'კითხვები „FAQ“ განყოფილებიდან + FAQ schema', 'fields' =>
            f_head() + [
                'category' => f('select', 'კატეგორია', ['options' => ['' => 'ყველა'] + faq_categories()]),
                'limit'    => f('number', 'რაოდენობა (0 = ყველა)'),
            ] + f_cta('', 'ღილაკი')],
        'cta' => ['label' => 'CTA ბლოკი', 'desc' => 'დიდი მოწოდება მოქმედებისკენ', 'fields' =>
            f_head() + f_cta('1', 'მთავარი ღილაკი') + f_cta('2', 'მეორე ღილაკი')],
        'stats' => ['label' => 'ციფრები', 'desc' => 'მხოლოდ რეალური, დადასტურებული ციფრებისთვის', 'fields' =>
            f_head() + ['items' => f('repeater', 'ციფრები', ['fields' => [
                'value' => f('text', 'მნიშვნელობა (მაგ. 120+)'),
                'label' => f('text', 'აღწერა', ['i18n' => true]),
            ], 'add' => 'ციფრის დამატება'])]],
        'richtext' => ['label' => 'ტექსტური ბლოკი', 'desc' => 'სტატია, წესები, პოლიტიკა', 'fields' => [
            'eyebrow' => f('text', 'ზედა წარწერა', ['i18n' => true]),
            'title'   => f('text', 'სათაური', ['i18n' => true]),
            'body'    => f('rich', 'ტექსტი', ['i18n' => true, 'hint' => 'ცარიელი ხაზი = ახალი აბზაცი. შეგიძლიათ HTML: <h2>, <ul>, <strong>, <a>']),
            'toc'     => f('check', 'სარჩევის ჩვენება (h2-ებიდან)'),
        ]],
        'booking' => ['label' => 'დაჯავშნის ჩატი', 'desc' => 'ინტერაქტიული ჩატ-დაჯავშნა', 'fields' =>
            f_head() + ['points' => f('list', 'რას უნდა ელოდოთ (თითო ხაზზე)', ['i18n' => true])]],
        'contact' => ['label' => 'კონტაქტი + ფორმა', 'desc' => 'საკონტაქტო ბარათები, ფორმა და რუკა', 'fields' =>
            f_head() + [
                'form_title' => f('text', 'ფორმის სათაური', ['i18n' => true]),
                'show_map'   => f('check', 'რუკის ჩვენება (პარამეტრები → რუკა)'),
            ]],
    ];
}

function faq_categories(): array
{
    return [
        'general'  => 'ზოგადი',
        'services' => 'სერვისები',
        'process'  => 'თანამშრომლობა',
        'booking'  => 'კონსულტაცია',
    ];
}

/** ჩანაწერების სქემები (სერვისი, FAQ, შეფასება, ინდუსტრია, მენიუ) */
function record_defs(): array
{
    return [
        'service' => [
            'title'     => f('text', 'სახელი', ['i18n' => true]),
            'slug'      => f('text', 'URL (slug)', ['i18n' => true, 'hint' => 'მხოლოდ ლათინური, ციფრები და „-“. ცარიელზე ავტომატურად შეიქმნება სახელიდან']),
            'hidden'    => f('check', 'დამალვა საიტზე'),
            'icon'      => f('icon', 'ხატულა'),
            'image'     => f('image', 'სურათი'),
            'image_alt' => f('text', 'სურათის alt ტექსტი', ['i18n' => true]),
            'short'     => f('textarea', 'მოკლე აღწერა (ბარათისთვის)', ['i18n' => true]),
            'intro'     => f('textarea', 'შესავალი (გვერდის თავში)', ['i18n' => true]),
            'body'      => f('rich', 'დეტალური აღწერა', ['i18n' => true]),
            'includes'  => f('repeater', 'რას მოიცავს', ['fields' => [
                'icon'  => f('icon', 'ხატულა'),
                'title' => f('text', 'სათაური', ['i18n' => true]),
                'text'  => f('textarea', 'ტექსტი', ['i18n' => true]),
            ], 'add' => 'პუნქტის დამატება']),
            'audience'  => f('list', 'ვისთვისაა (თითო ხაზზე ერთი)', ['i18n' => true]),
            'benefits'  => f('repeater', 'სარგებელი', ['fields' => [
                'icon'  => f('icon', 'ხატულა'),
                'title' => f('text', 'სათაური', ['i18n' => true]),
                'text'  => f('textarea', 'ტექსტი', ['i18n' => true]),
            ], 'add' => 'სარგებლის დამატება']),
            'faq'       => f('repeater', 'სერვისის კითხვები (FAQ schema)', ['fields' => [
                'q' => f('text', 'კითხვა', ['i18n' => true]),
                'a' => f('textarea', 'პასუხი', ['i18n' => true]),
            ], 'add' => 'კითხვის დამატება']),
            'seo_title' => f('text', 'SEO სათაური', ['i18n' => true, 'counter' => 60]),
            'seo_desc'  => f('textarea', 'Meta აღწერა', ['i18n' => true, 'counter' => 160]),
            'keywords'  => f('text', 'საკვანძო სიტყვები (შიდა შენიშვნა)', ['i18n' => true]),
        ],
        'faq' => [
            'category' => f('select', 'კატეგორია', ['options' => faq_categories()]),
            'q'        => f('text', 'კითხვა', ['i18n' => true]),
            'a'        => f('textarea', 'პასუხი', ['i18n' => true]),
            'hidden'   => f('check', 'დამალვა'),
        ],
        'testimonial' => [
            'name'    => f('text', 'სახელი'),
            'role'    => f('text', 'პოზიცია, კომპანია', ['i18n' => true]),
            'quote'   => f('textarea', 'შეფასება', ['i18n' => true]),
            'photo'   => f('image', 'ფოტო / ლოგო'),
            'hidden'  => f('check', 'დამალვა'),
        ],
        'industry' => [
            'icon'   => f('icon', 'ხატულა'),
            'title'  => f('text', 'სათაური', ['i18n' => true]),
            'text'   => f('textarea', 'ტექსტი', ['i18n' => true]),
            'hidden' => f('check', 'დამალვა'),
        ],
        'menu' => [
            'label' => f('text', 'წარწერა', ['i18n' => true]),
            'link'  => f('link', 'ბმული'),
            'mega'  => f('check', 'სერვისების ჩამოსაშლელი მენიუ'),
        ],
        'step' => [
            'title' => f('text', 'სათაური', ['i18n' => true]),
            'text'  => f('textarea', 'ტექსტი', ['i18n' => true]),
        ],
    ];
}

/* ------------------------------------------------------------ გასუფთავება */
function os_clean_value(array $def, mixed $v): mixed
{
    $type = $def['type'];
    switch ($type) {
        case 'check':
            return !empty($v) && $v !== 'false';
        case 'number':
            return max(0, min(999, (int) $v));
        case 'icon':
            return is_string($v) && isset(ICONS[$v]) ? $v : '';
        case 'select':
            $v = (string) $v;
            return array_key_exists($v, $def['options'] ?? []) ? $v : (string) array_key_first($def['options'] ?? ['' => '']);
        case 'link':
            $v = trim((string) $v);
            return preg_match('~^((page|service):[a-z0-9_-]+(#[\w-]+)?|https?://\S+|mailto:\S+|tel:[\d+\s()-]+|/\S*|#[\w-]*)$~i', $v) ? $v : '';
        case 'image':
            $v = trim((string) $v);
            return preg_match('~^(/?assets/[\w./-]+|https://\S+)$~i', $v) ? $v : '';
        case 'rich':
            return rich_html((string) $v);
        case 'list':
            $arr = is_array($v) ? $v : preg_split('~\R~', (string) $v);
            return array_values(array_filter(array_map(static fn($x) => mb_substr(trim(strip_tags((string) $x)), 0, 400), $arr ?: []), 'strlen'));
        case 'textarea':
            return mb_substr(trim(strip_tags((string) $v, '<em><strong><br>')), 0, 6000);
        case 'repeater':
            $out = [];
            foreach (is_array($v) ? $v : [] as $item) {
                if (is_array($item)) {
                    $out[] = os_clean($def['fields'], $item);
                }
            }
            return $out;
        default: // text
            return mb_substr(trim(strip_tags((string) $v, '<em><strong><br>')), 0, 600);
    }
}

/** მონაცემების გასუფთავება სქემის მიხედვით (უცნობი ველები იშლება) */
function os_clean(array $fields, array $data): array
{
    $out = [];
    foreach ($fields as $key => $def) {
        $raw = $data[$key] ?? null;
        if (!empty($def['i18n'])) {
            $out[$key] = [];
            foreach (OS_LANGS as $l) {
                $out[$key][$l] = os_clean_value($def, is_array($raw) && !array_is_list($raw) ? ($raw[$l] ?? '') : ($l === 'ka' ? $raw : ''));
            }
        } else {
            $out[$key] = os_clean_value($def, $raw);
        }
    }
    return $out;
}

function os_clean_blocks(array $blocks): array
{
    $defs = block_defs();
    $out = [];
    foreach ($blocks as $b) {
        $type = (string) ($b['type'] ?? '');
        if (!isset($defs[$type])) {
            continue;
        }
        $out[] = ['type' => $type, 'hidden' => !empty($b['hidden'])] + os_clean($defs[$type]['fields'], $b);
    }
    return $out;
}
