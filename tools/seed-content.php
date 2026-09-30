<?php
/**
 * საწყისი კონტენტის გენერატორი — ქმნის content/*.json ფაილებს.
 *
 *   php tools/seed-content.php          # ქმნის მხოლოდ იმ ფაილებს, რომლებიც ჯერ არ არსებობს
 *   php tools/seed-content.php --force  # გადაწერს ყველაფერს (CMS-ში შეტანილი ცვლილებები დაიკარგება!)
 *
 * ფაქტობრივი ინფორმაცია აღებულია outsourcify.ge-დან და ბრენდბუქიდან. ციფრები, კლიენტები,
 * სერტიფიკატები და შეფასებები განზრახ არ არის ჩაწერილი — ემატება მხოლოდ რეალური მონაცემებით CMS-იდან.
 */
declare(strict_types=1);
require_once dirname(__DIR__) . '/inc/core.php';

$force = in_array('--force', $argv ?? [], true);

/** ორენოვანი მნიშვნელობა */
function b(string|array $ka, string|array $en): array
{
    return ['ka' => $ka, 'en' => $en];
}
function img(string $name): string
{
    return '/assets/img/photos/' . $name . '.webp';
}
function seo(string $tka, string $dka, string $ten, string $den, string $kwka = '', string $kwen = ''): array
{
    return ['title' => b($tka, $ten), 'description' => b($dka, $den), 'keywords' => b($kwka, $kwen)];
}
function card(string $icon, string $tka, string $ten, string $xka, string $xen): array
{
    return ['icon' => $icon, 'title' => b($tka, $ten), 'text' => b($xka, $xen)];
}
function qa(string $qka, string $qen, string $aka, string $aen, string $cat = 'general'): array
{
    return ['category' => $cat, 'q' => b($qka, $qen), 'a' => b($aka, $aen), 'hidden' => false];
}

$BOOK = ['cta_label' => b('კონსულტაციის დაჯავშნა', 'Book a consultation'), 'cta_link' => 'page:book'];

/* =================================================================== SITE */
$site = [
    'settings' => [
        'company'          => 'Outsourcify',
        'domain'           => 'https://outsourcify.ge',
        'phone'            => '+995 591 171 888',
        'email'            => 'info@outsourcify.ge',
        'notify_email'     => '',
        'address'          => b('', ''),
        'city'             => 'Tbilisi',
        'hours'            => b('', ''),
        'map_embed'        => '',
        'facebook'         => '',
        'linkedin'         => '',
        'instagram'        => '',
        'footer_text'      => b(
            'ბუღალტრული მომსახურება, საგადასახადო კონსულტაცია და ბიზნეს-პროცესების აუთსორსინგი — ინდივიდუალური მიდგომით, ყველა ზომის ბიზნესისთვის.',
            'Accounting, tax consulting and business process outsourcing — with a tailored approach for businesses of every size.'
        ),
        'ga_id'            => '',
        'gsc_verification' => '',
        'noindex_all'      => false,
    ],
    'seo' => [
        'org_description' => b(
            'Outsourcify — ბუღალტრული და ბიზნეს-პროცესების აუთსორსინგის კომპანია საქართველოში: ბუღალტრული აღრიცხვა, საგადასახადო კონსულტაცია, დეკლარაციები, აღრიცხვის აღდგენა და BPO.',
            'Outsourcify is an accounting and business process outsourcing company in Georgia: bookkeeping, tax consulting, tax returns, accounting records correction and BPO.'
        ),
    ],
    'menus' => [
        'header' => [
            ['label' => b('სერვისები', 'Services'), 'link' => 'page:services', 'mega' => true],
            ['label' => b('ჩვენ შესახებ', 'About'), 'link' => 'page:about', 'mega' => false],
            ['label' => b('როგორ ვმუშაობთ', 'How it works'), 'link' => 'page:how', 'mega' => false],
            ['label' => b('ვისთან ვმუშაობთ', 'Who we serve'), 'link' => 'page:industries', 'mega' => false],
            ['label' => b('FAQ', 'FAQ'), 'link' => 'page:faq', 'mega' => false],
            ['label' => b('კონტაქტი', 'Contact'), 'link' => 'page:contact', 'mega' => false],
        ],
        'footer_company_title' => b('კომპანია', 'Company'),
        'footer_company' => [
            ['label' => b('ჩვენ შესახებ', 'About us'), 'link' => 'page:about'],
            ['label' => b('რატომ Outsourcify', 'Why Outsourcify'), 'link' => 'page:why'],
            ['label' => b('როგორ ვმუშაობთ', 'How it works'), 'link' => 'page:how'],
            ['label' => b('ვისთან ვმუშაობთ', 'Who we serve'), 'link' => 'page:industries'],
            ['label' => b('ხშირად დასმული კითხვები', 'FAQ'), 'link' => 'page:faq'],
            ['label' => b('კონტაქტი', 'Contact'), 'link' => 'page:contact'],
        ],
        'footer_legal_title' => b('ინფორმაცია', 'Information'),
        'footer_legal' => [
            ['label' => b('კონსულტაციის დაჯავშნა', 'Book a consultation'), 'link' => 'page:book'],
            ['label' => b('კონფიდენციალურობის პოლიტიკა', 'Privacy Policy'), 'link' => 'page:privacy'],
            ['label' => b('წესები და პირობები', 'Terms & Conditions'), 'link' => 'page:terms'],
        ],
    ],
    'process' => [
        ['title' => b('გაცნობითი კონსულტაცია', 'Intro consultation'),
         'text' => b('ვეცნობით თქვენს ბიზნესს, აღრიცხვის ამჟამინდელ მდგომარეობასა და იმას, რაში გჭირდებათ დახმარება.',
                     'We get to know your business, the current state of your accounting and where you need support.')],
        ['title' => b('ანალიზი და შეთავაზება', 'Review & proposal'),
         'text' => b('ვაფასებთ დოკუმენტაციასა და პროცესებს და გთავაზობთ თქვენზე მორგებულ მომსახურების ფორმატს.',
                     'We review your documents and processes and propose a service format tailored to you.')],
        ['title' => b('ჩართვა', 'Onboarding'),
         'text' => b('ვთანხმდებით პასუხისმგებლობებზე, ვადებსა და დოკუმენტების მიწოდების წესზე, ვაწყობთ აღრიცხვას პროგრამაში.',
                     'We agree on responsibilities, deadlines and how documents are shared, and set up your accounting in our software.')],
        ['title' => b('მუდმივი მხარდაჭერა', 'Ongoing support'),
         'text' => b('ვაწარმოებთ აღრიცხვას, ვამზადებთ ანგარიშებსა და დეკლარაციებს — თქვენ ყოველთვის იცით, ვის მიმართოთ.',
                     'We keep your books, prepare reports and tax returns — and you always know who to turn to.')],
    ],
    'cta' => [
        'eyebrow' => b('დავიწყოთ', 'Let’s get started'),
        'title'   => b('გადმოგვეცით ბუღალტერია — <em>თქვენ კი ბიზნესს მიხედეთ</em>', 'Hand over your accounting — <em>and focus on your business</em>'),
        'text'    => b('დაჯავშნეთ კონსულტაცია: გავეცნობით თქვენს საჭიროებებს და შემოგთავაზებთ თქვენს ბიზნესზე მორგებულ გადაწყვეტას.',
                       'Book a consultation: we’ll learn about your needs and suggest a solution tailored to your business.'),
        'cta1_label' => b('კონსულტაციის დაჯავშნა', 'Book a consultation'), 'cta1_link' => 'page:book',
        'cta2_label' => b('მოგვწერეთ', 'Contact us'), 'cta2_link' => 'page:contact',
    ],
    'booking' => ['days' => [1, 2, 3, 4, 5], 'start' => '10:00', 'end' => '18:00', 'slot' => 30, 'notice' => 3, 'ahead' => 21, 'blocked' => []],
    'ui' => new stdClass(),
];

/* =============================================================== SERVICES */
$services = [
    [
        'id' => 'accounting', 'icon' => 'calculator', 'hidden' => false,
        'slug' => b('bughaltruli-momsakhureba', 'accounting-services'),
        'title' => b('ბუღალტრული მომსახურება', 'Accounting & Bookkeeping'),
        'image' => img('accountant-reviewing-tax-documents'),
        'image_alt' => b('ბუღალტერი ამოწმებს ფინანსურ დოკუმენტებს კალკულატორით', 'Accountant reviewing financial documents with a calculator'),
        'short' => b('ბუღალტრული აღრიცხვის სრული წარმოება სერტიფიცირებული ბუღალტრების გუნდით — თქვენს ბიზნესზე მორგებული ფორმატით.',
                     'Complete bookkeeping handled by a team of certified accountants — in a format tailored to your business.'),
        'intro' => b('აღრიცხვა, რომელიც ყოველთვის წესრიგშია. ვაწარმოებთ თქვენი კომპანიის ბუღალტერიას ეფექტური პროგრამული უზრუნველყოფით და ვზრუნავთ, რომ ფინანსური ინფორმაცია იყოს ზუსტი, დროული და კანონმდებლობასთან შესაბამისი.',
                     'Accounting that is always in order. We keep your company’s books using effective accounting software and make sure your financial information is accurate, timely and compliant.'),
        'body' => b(
            "ბევრი მეწარმისთვის ბუღალტერია ყოველდღიური საზრუნავია: დოკუმენტები გროვდება, ვადები ახლოვდება, ხოლო შიდა ბუღალტრის აყვანა და შენარჩუნება მნიშვნელოვან ხარჯს მოითხოვს.\n\nOutsourcify ამ პროცესს საკუთარ თავზე იღებს. ჩვენი სერტიფიცირებული ბუღალტრები აწარმოებენ თქვენს აღრიცხვას, აწესრიგებენ დოკუმენტაციას და ამზადებენ იმ ინფორმაციას, რომელიც სწორი გადაწყვეტილებების მისაღებად გჭირდებათ.\n\nმომსახურების ფორმატს ერთად ვირჩევთ — ბიზნესის ზომის, საქმიანობის სპეციფიკისა და თქვენი საჭიროებების მიხედვით.",
            "For many business owners, accounting is a daily worry: paperwork piles up, deadlines approach, and hiring and keeping an in-house accountant is a significant cost.\n\nOutsourcify takes this off your plate. Our certified accountants keep your books, organise your documentation and prepare the information you need to make the right decisions.\n\nWe choose the service format together — based on the size of your business, the nature of your activity and what you need."
        ),
        'includes' => [
            card('receipt', 'პირველადი დოკუმენტების დამუშავება', 'Processing primary documents', 'ინვოისები, ზედნადებები, ხელშეკრულებები და სხვა დოკუმენტები აღრიცხვაში სწორად და დროულად აისახება.', 'Invoices, waybills, contracts and other documents are recorded correctly and on time.'),
            card('chart', 'ბუღალტრული აღრიცხვის წარმოება', 'Bookkeeping', 'ოპერაციების აღრიცხვა ბუღალტრულ პროგრამაში, ანგარიშების შეჯერება და კონტროლი.', 'Recording transactions in accounting software, reconciling accounts and keeping everything under control.'),
            card('file-check', 'საგადასახადო ვალდებულებების კონტროლი', 'Tax obligations under control', 'ვადების დაცვა და დეკლარაციების დროული მომზადება — სიურპრიზების გარეშე.', 'Deadlines tracked and returns prepared on time — no surprises.'),
            card('bars', 'ფინანსური ანგარიშგება', 'Financial reporting', 'პერიოდული ანგარიშები, რომლებიც ბიზნესის რეალურ მდგომარეობას აჩვენებს.', 'Regular reports that show the real state of your business.'),
            card('folder', 'მოწესრიგებული დოკუმენტაცია', 'Organised records', 'სისტემური არქივი, რომელშიც ნებისმიერი დოკუმენტი მარტივად მოიძებნება.', 'A structured archive where any document is easy to find.'),
            card('message', 'კონსულტაცია ყოველდღიურ საკითხებზე', 'Day-to-day advice', 'გყავთ ბუღალტერი, რომელსაც ნებისმიერ ფინანსურ კითხვაზე შეგიძლიათ მიმართოთ.', 'You have an accountant you can turn to with any financial question.'),
        ],
        'audience' => b(
            ['ახალი კომპანიები, რომლებსაც აღრიცხვის თავიდანვე სწორად აწყობა სურთ', 'მცირე და საშუალო ბიზნესი, რომელსაც შიდა ბუღალტერი არ ჰყავს', 'კომპანიები, რომლებიც ბუღალტრული ფუნქციის აუთსორსინგს გეგმავენ', 'ინდმეწარმეები, რომლებსაც ვალდებულებების მართვაში დახმარება სჭირდებათ'],
            ['New companies that want to set up accounting correctly from day one', 'Small and medium businesses without an in-house accountant', 'Companies planning to outsource their accounting function', 'Individual entrepreneurs who need help managing their obligations']
        ),
        'benefits' => [
            card('shield', 'სიზუსტე და შესაბამისობა', 'Accuracy & compliance', 'აღრიცხვა, რომელიც კანონმდებლობის მოთხოვნებს შეესაბამება.', 'Books that meet regulatory requirements.'),
            card('clock', 'დაზოგილი დრო', 'Time back', 'თქვენ ბიზნესზე ფოკუსირდებით, ჩვენ — ციფრებზე.', 'You focus on the business, we focus on the numbers.'),
            card('users', 'გუნდი ერთი ბუღალტრის ნაცვლად', 'A team, not one person', 'სერტიფიცირებული ბუღალტრების ცოდნა და გამოცდილება.', 'The knowledge and experience of certified accountants.'),
        ],
        'faq' => [
            ['q' => b('რა დოკუმენტები დაგჭირდებათ თანამშრომლობის დასაწყებად?', 'What documents do you need to get started?'),
             'a' => b('ზუსტი ჩამონათვალი თქვენი საქმიანობის სპეციფიკაზეა დამოკიდებული. პირველ კონსულტაციაზე ერთად განვსაზღვრავთ, რა დოკუმენტებია საჭირო და რა ფორმით მოგვაწვდით მათ.', 'The exact list depends on your type of business. In the first consultation we agree together which documents are needed and how you will share them.')],
            ['q' => b('შეგიძლიათ არსებული ბუღალტრის ნაცვლად იმუშაოთ?', 'Can you take over from our current accountant?'),
             'a' => b('დიახ. ვიღებთ აღრიცხვას არსებული ბუღალტრისგან ან პროგრამიდან, ვამოწმებთ მის მდგომარეობას და ვაგრძელებთ წარმოებას. თუ წარსულ აღრიცხვაში უზუსტობებია, შეგვიძლია მათი გასწორებაც.', 'Yes. We take over the books from your current accountant or software, check their condition and continue from there. If past records contain errors, we can correct them too.')],
            ['q' => b('რა ღირს ბუღალტრული მომსახურება?', 'How much does accounting cost?'),
             'a' => b('ფასი დამოკიდებულია ოპერაციების მოცულობაზე, საქმიანობის ტიპსა და საჭირო მომსახურებაზე. ზუსტ შეთავაზებას კონსულტაციის შემდეგ მოგიმზადებთ.', 'Pricing depends on transaction volume, the type of business and the services you need. We prepare an exact proposal after the consultation.')],
        ],
        'seo_title' => b('ბუღალტრული მომსახურება ბიზნესისთვის | Outsourcify', 'Accounting & Bookkeeping Services in Georgia | Outsourcify'),
        'seo_desc'  => b('ბუღალტრული აღრიცხვის სრული წარმოება სერტიფიცირებული ბუღალტრებით: მოწესრიგებული დოკუმენტაცია, ანგარიშგება და კონსულტაცია. დაჯავშნეთ შეხვედრა.',
                         'Outsourced bookkeeping by certified accountants in Georgia: organised records, financial reporting and day-to-day advice tailored to your business.'),
        'keywords' => b('ბუღალტრული მომსახურება; ბუღალტერიის აუთსორსინგი, ბუღალტრული აღრიცხვა, აუთსორს ბუღალტერი', 'accounting services Georgia; outsourced bookkeeping, bookkeeping Tbilisi, outsourced accountant'),
    ],
    [
        'id' => 'tax-consulting', 'icon' => 'percent', 'hidden' => false,
        'slug' => b('sagadasakhado-konsultatsia', 'tax-consulting'),
        'title' => b('საგადასახადო კონსულტაცია', 'Tax Consulting'),
        'image' => img('calculator-balance-sheet-figures'),
        'image_alt' => b('კალკულატორი და ბალანსის ციფრები საგადასახადო ანალიზისთვის', 'Calculator and balance sheet figures for tax analysis'),
        'short' => b('ექსპერტული რჩევა საგადასახადო საკითხებზე — რომ გადაწყვეტილებები ინფორმირებულად მიიღოთ და რისკები შეამციროთ.',
                     'Expert advice on tax matters — so you make informed decisions and reduce risk.'),
        'intro' => b('საგადასახადო კანონმდებლობა ხშირად იცვლება, ერთმა შეცდომამ კი შეიძლება ბიზნესს დამატებითი ხარჯი მოუტანოს. გეხმარებით, გაერკვეთ თქვენს ვალდებულებებში და ყოველი ნაბიჯი წინასწარ დაგეგმოთ.',
                     'Tax rules change often, and a single mistake can mean unexpected costs. We help you understand your obligations and plan every step ahead.'),
        'body' => b(
            "საგადასახადო კითხვები ჩნდება ბიზნესის ყველა ეტაპზე — კომპანიის დაფუძნებისას, ახალი საქმიანობის დაწყებისას, მსხვილი გარიგების წინ თუ ყოველდღიურ ოპერაციებში.\n\nჩვენი სპეციალისტები განიხილავენ თქვენს კონკრეტულ სიტუაციას და გაძლევენ გასაგებ, პრაქტიკულ რჩევას: რა ვალდებულებები გაქვთ, რა ვარიანტები არსებობს და რა გავლენას მოახდენს თითოეული გადაწყვეტილება.",
            "Tax questions come up at every stage of a business — when you set up a company, start a new activity, prepare for a major deal or simply run day-to-day operations.\n\nOur specialists look at your specific situation and give clear, practical advice: what your obligations are, what options exist and how each decision will affect you."
        ),
        'includes' => [
            card('search', 'ვალდებულებების ანალიზი', 'Obligations review', 'ვარკვევთ, რა გადასახადები და ვადები ეხება თქვენს ბიზნესს.', 'We clarify which taxes and deadlines apply to your business.'),
            card('scale', 'რეჟიმისა და სტატუსის შერჩევა', 'Choosing the right regime', 'რჩევა საგადასახადო რეჟიმისა და სტატუსის შესახებ თქვენი საქმიანობის მიხედვით.', 'Advice on tax regime and status based on your activity.'),
            card('briefcase', 'გარიგებების შეფასება', 'Transaction review', 'დაგეგმილი გარიგებებისა და ოპერაციების საგადასახადო შედეგების ანალიზი.', 'Analysis of the tax implications of planned deals and operations.'),
            card('message', 'პასუხები მიმდინარე კითხვებზე', 'Answers to ongoing questions', 'გასაგები განმარტებები ყოველდღიურ საგადასახადო საკითხებზე.', 'Clear explanations for everyday tax questions.'),
        ],
        'audience' => b(
            ['კომპანიები, რომლებიც ახალ საქმიანობას ან გარიგებას გეგმავენ', 'მეწარმეები, რომლებიც საქართველოში ბიზნესს იწყებენ', 'ბიზნესები, რომლებსაც საგადასახადო სპეციალისტი არ ჰყავთ', 'ინდმეწარმეები, რომლებსაც ვალდებულებების გარკვევა სჭირდებათ'],
            ['Companies planning a new activity or transaction', 'Entrepreneurs starting a business in Georgia', 'Businesses without an in-house tax specialist', 'Individual entrepreneurs who need clarity on their obligations']
        ),
        'benefits' => [
            card('lightbulb', 'ინფორმირებული გადაწყვეტილებები', 'Informed decisions', 'იცით, რა შედეგი მოჰყვება თითოეულ ნაბიჯს.', 'You know the consequences of each step in advance.'),
            card('shield', 'ნაკლები რისკი', 'Lower risk', 'შეცდომებს ვერიდებით მანამ, სანამ ისინი მოხდება.', 'We help you avoid mistakes before they happen.'),
            card('message', 'გასაგები ენა', 'Plain language', 'რთულ საკითხებს მარტივად გიხსნით.', 'We explain complex matters simply.'),
        ],
        'faq' => [
            ['q' => b('შესაძლებელია ერთჯერადი კონსულტაცია?', 'Can I get a one-off consultation?'),
             'a' => b('დაგვიკავშირდით და ერთად განვსაზღვრავთ თქვენთვის შესაფერის ფორმატს — ერთჯერადი საკითხისთვის თუ მუდმივი მხარდაჭერისთვის.', 'Get in touch and we will agree on the right format for you — whether it is a single question or ongoing support.')],
            ['q' => b('რა ინფორმაცია უნდა მოვამზადო კონსულტაციისთვის?', 'What should I prepare for the consultation?'),
             'a' => b('მოკლე აღწერა თქვენი საქმიანობისა და კითხვისა საკმარისია დასაწყებად. თუ საჭირო იქნება დოკუმენტები, წინასწარ გეტყვით.', 'A short description of your business and your question is enough to start. If documents are needed, we will let you know in advance.')],
        ],
        'seo_title' => b('საგადასახადო კონსულტაცია ბიზნესისთვის | Outsourcify', 'Tax Consulting for Businesses in Georgia | Outsourcify'),
        'seo_desc'  => b('ექსპერტული საგადასახადო კონსულტაცია: ვალდებულებები, საგადასახადო რეჟიმი და გარიგებების შეფასება. მიიღეთ გასაგები რჩევა Outsourcify-ისგან.',
                         'Expert tax consulting in Georgia: obligations, tax regimes and transaction reviews. Get clear, practical advice from the Outsourcify team.'),
        'keywords' => b('საგადასახადო კონსულტაცია; საგადასახადო კონსულტანტი, გადასახადები ბიზნესისთვის, საგადასახადო რჩევა', 'tax consulting Georgia; tax advisor Tbilisi, business tax advice, Georgian tax'),
    ],
    [
        'id' => 'tax-returns', 'icon' => 'file-check', 'hidden' => false,
        'slug' => b('deklaratsiebis-momzadeba', 'tax-return-preparation'),
        'title' => b('დეკლარაციების მომზადება და წარდგენა', 'Tax Return Preparation & Filing'),
        'image' => img('bookkeeper-calculating-invoices'),
        'image_alt' => b('ბუღალტერი ამზადებს საგადასახადო დეკლარაციას', 'Bookkeeper preparing a tax return'),
        'short' => b('საგადასახადო დეკლარაციების ზუსტი მომზადება და დროული წარდგენა — ვადების სრული კონტროლით.',
                     'Accurate preparation and timely filing of tax returns — with every deadline under control.'),
        'intro' => b('დეკლარაცია არ არის უბრალოდ ფორმა — ეს ბიზნესის ფინანსური მდგომარეობის ოფიციალური ასახვაა. ვამზადებთ და ვაბარებთ დეკლარაციებს ზუსტ მონაცემებზე დაყრდნობით და ვადების დაცვით.',
                     'A tax return is more than a form — it is the official record of your business’s financial position. We prepare and file returns based on accurate data and on schedule.'),
        'body' => b(
            "დაგვიანებული ან არასწორად შევსებული დეკლარაცია ბიზნესისთვის ზედმეტ ხარჯსა და სტრესს ნიშნავს. ჩვენ ვადებს წინასწარ ვგეგმავთ, მონაცემებს ვამოწმებთ და დეკლარაციებს დროულად ვამზადებთ.\n\nსერვისი შეგიძლიათ გამოიყენოთ როგორც ბუღალტრული მომსახურების ნაწილი, ისე ცალკე — თუ აღრიცხვას თავად აწარმოებთ, მაგრამ დეკლარაციებისთვის სპეციალისტი გჭირდებათ.",
            "A late or incorrectly completed return means extra cost and stress. We plan deadlines in advance, check the data and prepare returns on time.\n\nYou can use this service as part of our accounting package or on its own — if you keep your own books but want a specialist to handle your returns."
        ),
        'includes' => [
            card('calendar', 'ვადების კალენდარი', 'Deadline calendar', 'თქვენს ბიზნესზე მორგებული ვადების გეგმა — წინასწარი შეხსენებით.', 'A filing schedule tailored to your business, with advance reminders.'),
            card('search', 'მონაცემების შემოწმება', 'Data review', 'ვამოწმებთ, რომ დეკლარაციაში შესატანი ინფორმაცია სრული და ზუსტია.', 'We check that the information going into each return is complete and accurate.'),
            card('file-check', 'დეკლარაციის მომზადება', 'Return preparation', 'დეკლარაციების შევსება მოქმედი მოთხოვნების შესაბამისად.', 'Returns completed in line with current requirements.'),
            card('send', 'წარდგენა', 'Filing', 'დეკლარაციების დროული წარდგენა და დადასტურების შენახვა.', 'Timely submission and a record of every confirmation.'),
        ],
        'audience' => b(
            ['კომპანიები, რომლებსაც რეგულარული დეკლარირება სჭირდებათ', 'ინდმეწარმეები', 'ბიზნესები, რომლებიც აღრიცხვას თავად აწარმოებენ', 'კომპანიები, რომლებსაც დეკლარაციები გადაცილებული აქვთ'],
            ['Companies with regular filing obligations', 'Individual entrepreneurs', 'Businesses that keep their own books', 'Companies with overdue returns']
        ),
        'benefits' => [
            card('clock', 'ვადები კონტროლის ქვეშ', 'Deadlines under control', 'ყველა ვადა წინასწარაა დაგეგმილი.', 'Every deadline is planned in advance.'),
            card('check-circle', 'სიზუსტე', 'Accuracy', 'მონაცემები მოწმდება წარდგენამდე.', 'Data is checked before filing.'),
            card('zap', 'ნაკლები სტრესი', 'Less stress', 'დეკლარირების პერიოდი აღარ არის პრობლემა.', 'Filing season is no longer a headache.'),
        ],
        'faq' => [
            ['q' => b('შემიძლია მხოლოდ დეკლარაციების მომზადება შევუკვეთო?', 'Can I order tax return preparation only?'),
             'a' => b('დიახ, სერვისი ცალკეც არის ხელმისაწვდომი. კონსულტაციაზე განვიხილავთ, რა დეკლარაციები გჭირდებათ და რა მონაცემები დაგჭირდებათ.', 'Yes, the service is available on its own. In the consultation we review which returns you need and what data is required.')],
            ['q' => b('რა ხდება, თუ დეკლარაცია უკვე გადაცილებულია?', 'What if a return is already overdue?'),
             'a' => b('დაგვიკავშირდით რაც შეიძლება მალე — შევაფასებთ სიტუაციას და დაგეხმარებით ვალდებულებების მოწესრიგებაში.', 'Contact us as soon as possible — we will assess the situation and help you bring your obligations up to date.')],
        ],
        'seo_title' => b('დეკლარაციების მომზადება და წარდგენა | Outsourcify', 'Tax Return Preparation & Filing in Georgia | Outsourcify'),
        'seo_desc'  => b('საგადასახადო დეკლარაციების ზუსტი მომზადება და დროული წარდგენა კომპანიებისა და ინდმეწარმეებისთვის. ვადების კონტროლი და მონაცემების შემოწმება.',
                         'Accurate preparation and timely filing of tax returns for companies and individual entrepreneurs in Georgia, with deadline tracking and data checks.'),
        'keywords' => b('დეკლარაციის მომზადება; საგადასახადო დეკლარაცია, დეკლარაციის წარდგენა, ინდმეწარმის დეკლარაცია', 'tax return preparation Georgia; tax filing, tax declaration Georgia, individual entrepreneur tax return'),
    ],
    [
        'id' => 'records-correction', 'icon' => 'history', 'hidden' => false,
        'slug' => b('aghritskhvis-aghdgena', 'accounting-records-correction'),
        'title' => b('ისტორიული აღრიცხვის აღდგენა და გასწორება', 'Accounting Records Correction'),
        'image' => img('financial-report-chart-analysis'),
        'image_alt' => b('ფინანსური ანგარიშის ანალიზი გრაფიკითა და კალმით', 'Financial report analysis with a chart and a pen'),
        'short' => b('წარსული პერიოდების აღრიცხვის შემოწმება, აღდგენა და გასწორება — რომ ფინანსური სურათი ისევ ზუსტი იყოს.',
                     'Reviewing, restoring and correcting past accounting records — so your financial picture is accurate again.'),
        'intro' => b('არეული ან დაკარგული აღრიცხვა ხშირად მაშინ ჩნდება, როცა ბუღალტერი იცვლება ან ბიზნესი სწრაფად იზრდება. ვპოულობთ უზუსტობებს, ვაღდგენთ დანაკლისს და აღრიცხვას წესრიგში მოგვყავს.',
                     'Messy or missing records often appear when accountants change or a business grows fast. We find the errors, fill the gaps and bring your books back in order.'),
        'body' => b(
            "ისტორიული აღრიცხვის შეცდომები დროთა განმავლობაში გროვდება და რთულს ხდის როგორც ყოველდღიურ მართვას, ისე ანგარიშგებას, ბანკთან ურთიერთობას ან ინვესტორთან მოლაპარაკებას.\n\nჩვენ ვიწყებთ არსებული აღრიცხვის დეტალური შემოწმებით, ვადგენთ პრობლემების ჩამონათვალს და ვთანხმდებით გასწორების გეგმაზე. შედეგად იღებთ მოწესრიგებულ აღრიცხვას, რომელზეც შემდგომი მუშაობა შეიძლება.",
            "Errors in historical records build up over time and make everything harder — daily management, reporting, dealing with banks or talking to investors.\n\nWe start with a detailed review of your existing records, list the issues and agree on a correction plan. The result is clean, reliable books you can build on."
        ),
        'includes' => [
            card('search', 'არსებული აღრიცხვის შემოწმება', 'Review of existing records', 'ვაფასებთ, რამდენად სრული და ზუსტია წარსული პერიოდების აღრიცხვა.', 'We assess how complete and accurate past records are.'),
            card('target', 'შეცდომების იდენტიფიცირება', 'Identifying errors', 'ვადგენთ უზუსტობების, გამოტოვებებისა და შეუსაბამობების ჩამონათვალს.', 'We list the inaccuracies, omissions and mismatches.'),
            card('history', 'აღრიცხვის აღდგენა', 'Restoring records', 'ვაღდგენთ დაკარგულ ან არასრულ აღრიცხვას დოკუმენტებზე დაყრდნობით.', 'We rebuild missing or incomplete records from source documents.'),
            card('check-circle', 'გასწორება და შეჯერება', 'Correction & reconciliation', 'ვასწორებთ ჩანაწერებს და ვაჯერებთ ნაშთებს.', 'We correct entries and reconcile balances.'),
            card('file-check', 'დასკვნა და რეკომენდაციები', 'Findings & recommendations', 'გაძლევთ მკაფიო ანგარიშს — რა შეიცვალა და რა უნდა გავითვალისწინოთ მომავალში.', 'A clear report on what changed and what to watch out for.'),
        ],
        'audience' => b(
            ['კომპანიები, რომლებმაც ბუღალტერი შეიცვალეს', 'ბიზნესები, რომელთა აღრიცხვაც დიდი ხნის განმავლობაში არ წარმოებულა სათანადოდ', 'კომპანიები, რომლებიც ბანკთან, ინვესტორთან ან პარტნიორთან შეხვედრისთვის ემზადებიან', 'ბიზნესები, რომლებმაც ანგარიშებში შეუსაბამობა შენიშნეს'],
            ['Companies that have changed accountants', 'Businesses whose books have not been properly kept for some time', 'Companies preparing for a bank, investor or partner review', 'Businesses that have noticed discrepancies in their accounts']
        ),
        'benefits' => [
            card('check-circle', 'ზუსტი ფინანსური სურათი', 'An accurate financial picture', 'გადაწყვეტილებებს რეალურ ციფრებზე იღებთ.', 'You make decisions based on real numbers.'),
            card('shield', 'ნაკლები რისკი', 'Lower risk', 'პრობლემები ვლინდება და სწორდება დროულად.', 'Issues are found and fixed in time.'),
            card('rocket', 'სუფთა საწყისი', 'A clean start', 'მოწესრიგებული აღრიცხვა შემდგომი მუშაობისთვის.', 'Well-organised books to build on.'),
        ],
        'faq' => [
            ['q' => b('რამდენ ხანს გრძელდება აღრიცხვის აღდგენა?', 'How long does correcting records take?'),
             'a' => b('ვადა დამოკიდებულია პერიოდის სიგრძეზე, ოპერაციების მოცულობასა და დოკუმენტების ხელმისაწვდომობაზე. შემოწმების შემდეგ გეტყვით სავარაუდო ვადას.', 'It depends on the length of the period, transaction volume and how available the documents are. After the review we give you an estimated timeline.')],
            ['q' => b('რა ხდება, თუ დოკუმენტების ნაწილი დაკარგულია?', 'What if some documents are missing?'),
             'a' => b('ერთად განვსაზღვრავთ, როგორ შეიძლება დაკარგული ინფორმაციის აღდგენა ან დადასტურება, და ამას გასწორების გეგმაში ვითვალისწინებთ.', 'We work out together how the missing information can be restored or confirmed and build that into the correction plan.')],
        ],
        'seo_title' => b('ბუღალტრული აღრიცხვის აღდგენა და გასწორება | Outsourcify', 'Accounting Records Correction & Clean-up | Outsourcify'),
        'seo_desc'  => b('წარსული პერიოდების ბუღალტრული აღრიცხვის შემოწმება, აღდგენა და გასწორება. ვპოულობთ შეცდომებს, ვავსებთ დანაკლისს და აღრიცხვას წესრიგში მოგვყავს.',
                         'Review, restoration and correction of historical accounting records in Georgia. We find the errors, fill the gaps and bring your books back in order.'),
        'keywords' => b('ბუღალტრული აღრიცხვის აღდგენა; აღრიცხვის გასწორება, ისტორიული აღრიცხვა, ბუღალტერიის მოწესრიგება', 'accounting records correction; bookkeeping clean-up, catch-up bookkeeping, historical accounting'),
    ],
    [
        'id' => 'bpo', 'icon' => 'users', 'hidden' => false,
        'slug' => b('biznes-protsesebis-autsorsingi', 'business-process-outsourcing'),
        'title' => b('ბიზნეს-პროცესების აუთსორსინგი (BPO)', 'Business Process Outsourcing (BPO)'),
        'image' => img('team-collaborating-laptops-office'),
        'image_alt' => b('გუნდი მუშაობს ლეპტოპებით ოფისში', 'Team working on laptops in an office'),
        'short' => b('კვალიფიციური თანამშრომელი, რომელიც თქვენს ოფისში მუშაობს — დაქირავებისა და ადმინისტრირების საზრუნავის გარეშე.',
                     'A qualified specialist working in your own office — without the hassle of hiring and administration.'),
        'intro' => b('ზოგჯერ ბიზნესს სპეციალისტი ადგილზე სჭირდება. BPO მოდელით გთავაზობთ თანამშრომელს, რომელიც თქვენს ოფისში, თქვენს გუნდთან ერთად მუშაობს, ხოლო ორგანიზაციულ საკითხებზე Outsourcify ზრუნავს.',
                     'Sometimes a business needs a specialist on site. With our BPO model you get a team member who works in your office alongside your people, while Outsourcify takes care of the organisational side.'),
        'body' => b(
            "BPO გიხსნით ცალკეული ბიზნეს-პროცესის — მაგალითად, ბუღალტრული ფუნქციის — სრულ ადმინისტრირებას. თანამშრომელი ჩართულია თქვენს ყოველდღიურ საქმიანობაში, თქვენ კი არ გიწევთ შერჩევაზე, ადმინისტრირებასა და ჩანაცვლებაზე ფიქრი.\n\nმოდელი განსაკუთრებით მოსახერხებელია კომპანიებისთვის, რომლებსაც სპეციალისტის ადგილზე ყოფნა სჭირდებათ, მაგრამ დამატებითი HR-ტვირთის აღება არ სურთ.",
            "BPO takes the full administration of a business process — such as your accounting function — off your hands. The specialist is part of your day-to-day operations, while you don’t have to worry about recruitment, administration or cover.\n\nThis model is especially convenient for companies that need someone on site but don’t want the extra HR workload."
        ),
        'includes' => [
            card('target', 'საჭიროებების ანალიზი', 'Needs analysis', 'ვაზუსტებთ როლს, მოვალეობებსა და სამუშაო რეჟიმს.', 'We define the role, responsibilities and working schedule.'),
            card('user', 'სპეციალისტის შერჩევა', 'Specialist selection', 'ვარჩევთ თანამშრომელს, რომელიც თქვენს მოთხოვნებს შეესაბამება.', 'We select a specialist who matches your requirements.'),
            card('building', 'მუშაობა თქვენს ოფისში', 'Working in your office', 'თანამშრომელი თქვენს გუნდსა და პროცესებშია ჩართული.', 'The specialist is integrated into your team and processes.'),
            card('settings', 'ადმინისტრირება', 'Administration', 'ორგანიზაციულ და ადმინისტრაციულ საკითხებს Outsourcify მართავს.', 'Outsourcify manages the organisational and administrative side.'),
            card('shield', 'ხარისხის კონტროლი', 'Quality control', 'მუდმივი კომუნიკაცია და მხარდაჭერა ჩვენი გუნდისგან.', 'Ongoing communication and support from our team.'),
        ],
        'audience' => b(
            ['კომპანიები, რომლებსაც სპეციალისტი ადგილზე სჭირდებათ', 'ბიზნესები, რომლებსაც დაქირავებისა და ადმინისტრირების ტვირთის შემცირება სურთ', 'მზარდი კომპანიები, რომლებსაც მოქნილი რესურსი სჭირდებათ', 'ორგანიზაციები, რომლებიც ცალკეულ ფუნქციას აუთსორსინგზე გადაიტანენ'],
            ['Companies that need a specialist on site', 'Businesses that want to reduce the hiring and admin burden', 'Growing companies that need flexible resources', 'Organisations moving a specific function to an outsourcing model']
        ),
        'benefits' => [
            card('clock', 'დაზოგილი დრო', 'Time saved', 'შერჩევასა და ადმინისტრირებაზე ჩვენ ვზრუნავთ.', 'We handle selection and administration.'),
            card('layers', 'მოქნილობა', 'Flexibility', 'რესურსი იცვლება ბიზნესის საჭიროებებთან ერთად.', 'Resources adapt as your needs change.'),
            card('handshake', 'სანდო პარტნიორი', 'A reliable partner', 'ერთი კონტაქტი ყველა ორგანიზაციულ საკითხზე.', 'One point of contact for all organisational matters.'),
        ],
        'faq' => [
            ['q' => b('რით განსხვავდება BPO ჩვეულებრივი ბუღალტრული მომსახურებისგან?', 'How is BPO different from regular accounting services?'),
             'a' => b('ბუღალტრული მომსახურებისას აღრიცხვას ჩვენი გუნდი დისტანციურად აწარმოებს. BPO-ს დროს სპეციალისტი თქვენს ოფისში მუშაობს და თქვენს ყოველდღიურ პროცესებშია ჩართული.', 'With accounting services, our team keeps your books remotely. With BPO, a specialist works in your office and is part of your daily processes.')],
            ['q' => b('რომელი პროცესების აუთსორსინგია შესაძლებელი?', 'Which processes can be outsourced?'),
             'a' => b('მოგვიყევით თქვენს საჭიროებაზე კონსულტაციაზე — ერთად შევაფასებთ, რომელი ფუნქციის გადაცემაა მიზანშეწონილი და როგორ ავაწყოთ თანამშრომლობა.', 'Tell us about your needs in the consultation — together we will assess which function makes sense to outsource and how to set it up.')],
        ],
        'seo_title' => b('ბიზნეს-პროცესების აუთსორსინგი (BPO) საქართველოში', 'Business Process Outsourcing (BPO) in Georgia | Outsourcify'),
        'seo_desc'  => b('BPO მომსახურება: კვალიფიციური თანამშრომელი თქვენს ოფისში, შერჩევისა და ადმინისტრირების საზრუნავის გარეშე. გაიგეთ, როგორ მუშაობს ეს მოდელი.',
                         'BPO services in Georgia: a qualified specialist working in your office, without the hassle of recruitment and administration. See how it works.'),
        'keywords' => b('ბიზნეს-პროცესების აუთსორსინგი; BPO საქართველოში, აუთსორსინგი, აუთსტაფინგი', 'business process outsourcing Georgia; BPO Tbilisi, outsourcing company Georgia, staff outsourcing'),
    ],
    [
        'id' => 'financial-consulting', 'icon' => 'pie', 'hidden' => false,
        'slug' => b('finansuri-konsultatsia', 'financial-consulting'),
        'title' => b('ფინანსური კონსულტაცია', 'Financial Consulting'),
        'image' => img('accountant-working-calculator-laptop'),
        'image_alt' => b('ფინანსური კონსულტანტი მუშაობს კალკულატორითა და ლეპტოპით', 'Financial consultant working with a calculator and laptop'),
        'short' => b('ფინანსური ანალიზი და რჩევა, რომელიც ხარჯების კონტროლსა და მომგებიანობის ზრდაში გეხმარებათ.',
                     'Financial analysis and advice that help you control costs and grow profitability.'),
        'intro' => b('ციფრები მხოლოდ ანგარიშგებისთვის არ არსებობს — ისინი ბიზნესის მართვის ინსტრუმენტია. გეხმარებით, ფინანსური ინფორმაცია გადაწყვეტილებებად აქციოთ.',
                     'Numbers are not just for reporting — they are a management tool. We help you turn financial information into decisions.'),
        'body' => b(
            "ბევრ კომპანიას აქვს ბუღალტრული აღრიცხვა, მაგრამ არ იყენებს მას ბიზნესის მართვისთვის. ფინანსური კონსულტაციით ვაანალიზებთ თქვენს შემოსავლებს, ხარჯებსა და ფულად ნაკადებს და გაძლევთ კონკრეტულ რეკომენდაციებს.\n\nჩვენი მიზანია, ფინანსები ეფექტურად მართოთ, დაიცვათ რეგულაციები და გაზარდოთ მომგებიანობა.",
            "Many companies keep books but don’t use them to run the business. Through financial consulting we analyse your revenue, costs and cash flow and give you concrete recommendations.\n\nOur aim is to help you manage your finances efficiently, stay compliant and increase profitability."
        ),
        'includes' => [
            card('chart', 'ფინანსური ანალიზი', 'Financial analysis', 'შემოსავლების, ხარჯებისა და მომგებიანობის ანალიზი.', 'Analysis of revenue, costs and profitability.'),
            card('bars', 'მმართველობითი ანგარიშგება', 'Management reporting', 'ანგარიშები, რომლებიც ბიზნესის მართვისთვის გამოგადგებათ.', 'Reports designed to help you run the business.'),
            card('calendar', 'ბიუჯეტირება და დაგეგმვა', 'Budgeting & planning', 'ფინანსური გეგმა და მისი შესრულების კონტროლი.', 'A financial plan and tracking against it.'),
            card('pie', 'ხარჯების ოპტიმიზაცია', 'Cost review', 'ვპოულობთ ხარჯებს, რომელთა შემცირებაც შესაძლებელია.', 'We identify costs that can be reduced.'),
        ],
        'audience' => b(
            ['კომპანიები, რომლებსაც ზრდის დაგეგმვა სურთ', 'მეწარმეები, რომლებსაც ფინანსური სურათის უკეთ გაგება სჭირდებათ', 'ბიზნესები, რომლებიც ინვესტიციას ან სესხს განიხილავენ', 'კომპანიები, რომელთა ხარჯებიც შემოსავლებზე სწრაფად იზრდება'],
            ['Companies planning growth', 'Owners who want a clearer view of their finances', 'Businesses considering investment or a loan', 'Companies whose costs are growing faster than revenue']
        ),
        'benefits' => [
            card('target', 'მკაფიო ფინანსური სურათი', 'A clear financial picture', 'იცით, სად შოულობთ და სად კარგავთ.', 'You know where you earn and where you lose.'),
            card('chart', 'მომგებიანობის ზრდა', 'Higher profitability', 'რეკომენდაციები, რომლებიც შედეგზეა ორიენტირებული.', 'Recommendations focused on results.'),
            card('lightbulb', 'უკეთესი გადაწყვეტილებები', 'Better decisions', 'გადაწყვეტილებები ციფრებზე დაყრდნობით.', 'Decisions backed by numbers.'),
        ],
        'faq' => [
            ['q' => b('რით განსხვავდება ფინანსური კონსულტაცია ბუღალტრული მომსახურებისგან?', 'How is financial consulting different from accounting?'),
             'a' => b('ბუღალტერია აღრიცხავს იმას, რაც მოხდა. ფინანსური კონსულტაცია ამ ინფორმაციას აანალიზებს და გეხმარებათ, დაგეგმოთ ის, რაც უნდა მოხდეს.', 'Accounting records what happened. Financial consulting analyses that information and helps you plan what should happen next.')],
        ],
        'seo_title' => b('ფინანსური კონსულტაცია კომპანიებისთვის | Outsourcify', 'Financial Consulting for Businesses | Outsourcify'),
        'seo_desc'  => b('ფინანსური ანალიზი, მმართველობითი ანგარიშგება და ბიუჯეტირება. Outsourcify გეხმარებათ ხარჯების კონტროლში, მომგებიანობის ზრდასა და სწორ გადაწყვეტილებებში.',
                         'Financial analysis, management reporting and budgeting. Outsourcify helps businesses in Georgia control costs and increase profitability.'),
        'keywords' => b('ფინანსური კონსულტაცია; ფინანსური ანალიზი, ბიუჯეტირება, მმართველობითი ანგარიშგება', 'financial consulting Georgia; financial analysis, budgeting, management reporting'),
    ],
];

/* ================================================================== FAQS */
$faqs = [
    qa('რას საქმიანობს Outsourcify?', 'What does Outsourcify do?',
       'Outsourcify ბუღალტრული და ბიზნეს-პროცესების აუთსორსინგის კომპანიაა. გთავაზობთ ბუღალტრულ მომსახურებას, საგადასახადო კონსულტაციას, დეკლარაციების მომზადებასა და წარდგენას, ისტორიული აღრიცხვის აღდგენას, ფინანსურ კონსულტაციასა და BPO-ს — თანამშრომელს, რომელიც თქვენს ოფისში მუშაობს.',
       'Outsourcify is an accounting and business process outsourcing company. We offer accounting and bookkeeping, tax consulting, tax return preparation and filing, correction of historical records, financial consulting and BPO — a specialist who works in your own office.'),
    qa('რა ზომის ბიზნესებთან მუშაობთ?', 'What size of businesses do you work with?',
       'ყველა ზომის ბიზნესთან — ახალი კომპანიებიდან და ინდმეწარმეებიდან დაწყებული, მსხვილი კომპანიებით დამთავრებული. მომსახურების ფორმატს თითოეული კლიენტის საჭიროებაზე ვარგებთ.',
       'Businesses of every size — from new companies and individual entrepreneurs to larger organisations. We tailor the service format to each client’s needs.'),
    qa('რატომ ჯობია ბუღალტერიის აუთსორსინგი შიდა ბუღალტრის აყვანას?', 'Why outsource accounting instead of hiring in-house?',
       'აუთსორსინგით იღებთ სერტიფიცირებული ბუღალტრების გუნდის ცოდნას, არ გიწევთ დაქირავებაზე, სწავლებასა და ჩანაცვლებაზე ზრუნვა, ხოლო აღრიცხვა არ ჩერდება შვებულების ან თანამშრომლის წასვლის დროს.',
       'You get the knowledge of a team of certified accountants, you don’t have to deal with hiring, training or cover, and your accounting doesn’t stop when someone goes on holiday or leaves.'),
    qa('შემიძლია მხოლოდ ერთი სერვისით ვისარგებლო?', 'Can I use just one service?',
       'მომსახურებას თქვენს საჭიროებებზე ვარგებთ — შესაძლებელია როგორც კომპლექსური თანამშრომლობა, ისე ცალკეული სერვისი, მაგალითად, დეკლარაციების მომზადება ან აღრიცხვის აღდგენა.',
       'We tailor our services to your needs — you can work with us across the board or choose a single service, such as tax return preparation or records correction.', 'services'),
    qa('რა მოხდება, თუ წინა წლების აღრიცხვა არეულია?', 'What if our books from previous years are a mess?',
       'სწორედ ამისთვის გვაქვს ისტორიული აღრიცხვის აღდგენისა და გასწორების სერვისი: ვამოწმებთ წარსულ პერიოდებს, ვპოულობთ შეცდომებს და აღრიცხვას წესრიგში მოგვყავს.',
       'That is exactly what our records correction service is for: we review past periods, find the errors and bring your books back in order.', 'services'),
    qa('რა არის BPO და როდის არის ის საჭირო?', 'What is BPO and when do I need it?',
       'BPO (ბიზნეს-პროცესების აუთსორსინგი) ნიშნავს, რომ კვალიფიციური თანამშრომელი თქვენს ოფისში მუშაობს, ხოლო მის ადმინისტრირებაზე Outsourcify ზრუნავს. ეს მოსახერხებელია, როცა სპეციალისტი ადგილზე გჭირდებათ.',
       'BPO (business process outsourcing) means a qualified specialist works in your office while Outsourcify handles the administration. It is ideal when you need someone on site.', 'services'),
    qa('როგორ ხდება დოკუმენტების გაცვლა?', 'How do we exchange documents?',
       'დოკუმენტების მიწოდების ფორმატს ჩართვის ეტაპზე ერთად ვთანხმდებით — ისე, რომ თქვენთვის მოსახერხებელი იყოს.',
       'We agree on how documents will be shared during onboarding — in whatever way is most convenient for you.', 'process'),
    qa('როგორ არის დაცული ჩემი ფინანსური ინფორმაცია?', 'How is my financial information protected?',
       'ფინანსური ინფორმაციის კონფიდენციალურობა ჩვენი მუშაობის საფუძველია. კონფიდენციალურობის პირობებს თანამშრომლობის დაწყებისას ერთად შევათანხმებთ.',
       'Confidentiality of financial information is fundamental to our work. We agree on confidentiality terms together when we start working with you.', 'process'),
    qa('რა ღირს თქვენი მომსახურება?', 'How much do your services cost?',
       'ღირებულება დამოკიდებულია ოპერაციების მოცულობაზე, საქმიანობის ტიპსა და საჭირო სერვისებზე. ზუსტ შეთავაზებას კონსულტაციის შემდეგ მოგიმზადებთ.',
       'The price depends on transaction volume, type of business and the services you need. We prepare an exact proposal after the consultation.', 'process'),
    qa('რა ხდება კონსულტაციაზე?', 'What happens in the consultation?',
       'გავეცნობით თქვენს ბიზნესს, აღრიცხვის ამჟამინდელ მდგომარეობასა და საჭიროებებს, ვუპასუხებთ თქვენს კითხვებს და შემდეგ შემოგთავაზებთ შესაფერის მომსახურების ფორმატს.',
       'We get to know your business, the current state of your accounting and your needs, answer your questions and then propose a suitable service format.', 'booking'),
    qa('როგორ დავჯავშნო კონსულტაცია?', 'How do I book a consultation?',
       'გამოიყენეთ ონლაინ დაჯავშნა: უპასუხეთ რამდენიმე მოკლე კითხვას და აირჩიეთ მოსახერხებელი დღე და საათი. ასევე შეგიძლიათ დაგვირეკოთ ან მოგვწეროთ ელფოსტაზე.',
       'Use our online booking: answer a few short questions and choose a convenient day and time. You can also call us or send an email.', 'booking'),
];

/* ============================================================ INDUSTRIES */
$industries = [
    card('rocket', 'სტარტაპები და ახალი კომპანიები', 'Startups & new companies', 'აღრიცხვას თავიდანვე სწორად ვაწყობთ, რომ ზრდასთან ერთად პრობლემები არ დაგროვდეს.', 'We set up your accounting correctly from the start, so problems don’t pile up as you grow.'),
    card('store', 'მცირე და საშუალო ბიზნესი', 'Small & medium businesses', 'სრული ბუღალტრული ფუნქცია — შიდა განყოფილების შექმნის გარეშე.', 'A complete accounting function — without building an in-house department.'),
    card('building', 'მსხვილი კომპანიები', 'Larger companies', 'ცალკეული პროცესების აუთსორსინგი და სპეციალისტი თქვენს ოფისში BPO მოდელით.', 'Outsourcing of specific processes and on-site specialists through our BPO model.'),
    card('globe', 'უცხოური კომპანიები და ინვესტორები', 'International companies & investors', 'დახმარება ადგილობრივი ბუღალტრული და საგადასახადო მოთხოვნების გაგებასა და დაცვაში.', 'Help understanding and meeting local accounting and tax requirements.'),
    card('user', 'ინდმეწარმეები', 'Individual entrepreneurs', 'დეკლარაციები, ვალდებულებები და კონსულტაცია — მარტივად და გასაგებად.', 'Tax returns, obligations and advice — simple and clear.'),
    card('handshake', 'კომპანიები, რომლებიც ბუღალტერს ცვლიან', 'Companies switching accountants', 'აღრიცხვის გადმობარება, შემოწმება და უწყვეტი გაგრძელება.', 'Smooth handover, review and uninterrupted continuation of your accounting.'),
];
foreach ($industries as &$i) {
    $i['hidden'] = false;
}
unset($i);

/* ================================================================== PAGES */
$trust = ['type' => 'cards', 'variant' => 'strip', 'items' => [
    card('users', 'სერტიფიცირებული ბუღალტრები', 'Certified accountants', 'გამოცდილი გუნდი, რომელიც თქვენს ბიზნესს იცნობს.', 'An experienced team that knows your business.'),
    card('settings', 'ეფექტური პროგრამები', 'Effective software', 'აღრიცხვა თანამედროვე ბუღალტრულ პროგრამაში.', 'Your books kept in modern accounting software.'),
    card('target', 'მორგებული გადაწყვეტები', 'Tailored solutions', 'მომსახურება თქვენი ბიზნესის ზომისა და სპეციფიკის მიხედვით.', 'Services shaped around your size and industry.'),
    card('shield', 'შესაბამისობა', 'Compliance', 'ვადები და კანონმდებლობის მოთხოვნები კონტროლის ქვეშ.', 'Deadlines and regulatory requirements under control.'),
]];

$benefits = ['type' => 'cards', 'variant' => 'bento',
    'eyebrow' => b('აუთსორსინგის უპირატესობები', 'Benefits of outsourcing'),
    'title' => b('რატომ ირჩევენ კომპანიები <em>ბუღალტერიის აუთსორსინგს</em>', 'Why companies choose to <em>outsource accounting</em>'),
    'text' => b('აუთსორსინგი არ ნიშნავს კონტროლის დაკარგვას — პირიქით, იღებთ მეტ სიცხადეს ნაკლები დროისა და რესურსის ხარჯვით.', 'Outsourcing doesn’t mean losing control — it means more clarity for less time and effort.'),
    'items' => [
        card('pie', 'ხარჯების ოპტიმიზაცია', 'Cost efficiency', 'არ გჭირდებათ სრულ განაკვეთზე თანამშრომლის ხელფასი, სამუშაო ადგილი და ცალკე პროგრამა.', 'No full-time salary, workstation or separate software licence to cover.'),
        card('users', 'მთელი გუნდის ცოდნა', 'A whole team’s expertise', 'ერთი ადამიანის ნაცვლად — სერტიფიცირებული ბუღალტრების გამოცდილება.', 'The experience of certified accountants instead of a single person.'),
        card('clock', 'დრო მთავარისთვის', 'Time for what matters', 'ფინანსურ რუტინას ჩვენ ვმართავთ, თქვენ კი ბიზნესის განვითარებაზე ფიქრობთ.', 'We handle the financial routine while you focus on growing the business.'),
        card('history', 'უწყვეტობა', 'Continuity', 'აღრიცხვა არ ჩერდება შვებულების, ავადმყოფობის ან თანამშრომლის წასვლის გამო.', 'Your accounting doesn’t stop for holidays, sick leave or staff turnover.'),
        card('layers', 'მოქნილობა', 'Flexibility', 'მომსახურება ფართოვდება ან იცვლება თქვენი ბიზნესის ზრდასთან ერთად.', 'Services expand or adjust as your business grows.'),
        card('shield', 'ნაკლები რისკი', 'Lower risk', 'ვადებისა და მოთხოვნების კონტროლი ამცირებს შეცდომებისა და ჯარიმების ალბათობას.', 'Tracking deadlines and requirements reduces the chance of errors and penalties.'),
    ]];

$testi = ['type' => 'testimonials', 'eyebrow' => b('შეფასებები', 'Testimonials'), 'title' => b('რას ამბობენ ჩვენი კლიენტები', 'What our clients say')];

$pages = [
    [
        'id' => 'home', 'template' => 'home', 'system' => true,
        'slug' => b('', ''), 'title' => b('მთავარი', 'Home'),
        'seo' => seo('ბუღალტრული მომსახურება და აუთსორსინგი | Outsourcify',
                     'Outsourcify — ბუღალტრული მომსახურება, საგადასახადო კონსულტაცია, დეკლარაციები და BPO ყველა ზომის ბიზნესისთვის. დაჯავშნეთ კონსულტაცია ონლაინ.',
                     'Accounting & Business Outsourcing in Georgia | Outsourcify',
                     'Outsourcify provides accounting, tax consulting, tax return filing and BPO for businesses of every size in Georgia. Book a consultation online.',
                     'ბუღალტრული მომსახურება; ბუღალტრული აუთსორსინგი, საგადასახადო კონსულტაცია, BPO',
                     'accounting services Georgia; accounting outsourcing, tax consulting Georgia, BPO Georgia'),
        'blocks' => [
            ['type' => 'hero',
             'eyebrow' => b('ბუღალტერია და ბიზნეს-პროცესების აუთსორსინგი', 'Accounting & business process outsourcing'),
             'title' => b('ბუღალტერია წესრიგში — <em>თქვენ კი ბიზნესს მიხედეთ</em>', 'Your accounting in order — <em>so you can focus on growth</em>'),
             'text' => b('Outsourcify ბიზნესებს სთავაზობს ბუღალტრულ მომსახურებას, საგადასახადო კონსულტაციასა და ბიზნეს-პროცესების აუთსორსინგს. სერტიფიცირებული ბუღალტრები, ეფექტური პროგრამული უზრუნველყოფა და თქვენზე მორგებული გადაწყვეტები.',
                         'Outsourcify provides accounting, tax consulting and business process outsourcing for companies in Georgia. Certified accountants, effective software and solutions tailored to your business.'),
             'cta1_label' => b('კონსულტაციის დაჯავშნა', 'Book a consultation'), 'cta1_link' => 'page:book',
             'cta2_label' => b('სერვისების ნახვა', 'Explore services'), 'cta2_link' => 'page:services',
             'points' => b(['სერტიფიცირებული ბუღალტრები', 'ეფექტური პროგრამები', 'ინდივიდუალური მიდგომა'], ['Certified accountants', 'Effective software', 'A tailored approach']),
             'image' => img('accountant-reviewing-tax-documents'),
             'image_alt' => b('ბუღალტერი ამოწმებს საგადასახადო დოკუმენტებს', 'Accountant reviewing tax documents'),
             'card1' => b('ყოველთვიური ანგარიში მზადაა', 'Monthly report ready'),
             'card2' => b('ფინანსები ერთ ხედში', 'Finances at a glance'),
             'card3' => b('დეკლარაცია წარდგენილია', 'Tax return filed')],
            $trust,
            ['type' => 'services', 'layout' => 'grid', 'limit' => 0,
             'eyebrow' => b('სერვისები', 'Services'),
             'title' => b('ყველაფერი, რაც თქვენს <em>ფინანსებს</em> სჭირდება', 'Everything your <em>finances</em> need'),
             'text' => b('ყოველდღიური აღრიცხვიდან საგადასახადო საკითხებამდე — ერთი პარტნიორი, რომელიც თქვენი ბიზნესის სპეციფიკას იცნობს.', 'From day-to-day bookkeeping to tax matters — one partner who understands how your business works.'),
             'cta_label' => b('ყველა სერვისი', 'All services'), 'cta_link' => 'page:services'],
            ['type' => 'split',
             'eyebrow' => b('რატომ Outsourcify', 'Why Outsourcify'),
             'title' => b('პარტნიორი, რომელსაც <em>ციფრებს ანდობთ</em>', 'A partner you can <em>trust with your numbers</em>'),
             'text' => b('ჩვენთვის ბუღალტერია არ არის მხოლოდ დოკუმენტები და ვადები. ეს არის სიცხადე, რომელიც ბიზნესს სწორი გადაწყვეტილებების მიღებაში ეხმარება.', 'For us, accounting isn’t just paperwork and deadlines. It’s the clarity that helps a business make the right decisions.'),
             'points' => b(['სერტიფიცირებული ბუღალტრების გუნდი', 'კარგად ორგანიზებული აღრიცხვა და დოკუმენტაცია', 'ეფექტური ბუღალტრული პროგრამები', 'გადაწყვეტები, მორგებული თქვენს საჭიროებებზე'],
                           ['A team of certified accountants', 'Well-organised books and documentation', 'Effective accounting software', 'Solutions tailored to your needs']),
             'image' => img('team-collaborating-laptops-office'),
             'image_alt' => b('Outsourcify-ის გუნდი მუშაობს ოფისში', 'Team collaborating in an office'),
             'reverse' => true,
             'badge_title' => b('სერტიფიცირებული გუნდი', 'Certified team'), 'badge_text' => b('ბუღალტრები, რომლებიც თქვენს ბიზნესს იცნობენ', 'Accountants who know your business'),
             'cta_label' => b('გაიგეთ მეტი', 'Learn more'), 'cta_link' => 'page:why'],
            ['type' => 'steps', 'use_global' => true, 'items' => [],
             'eyebrow' => b('როგორ ვმუშაობთ', 'How it works'),
             'title' => b('ოთხი ნაბიჯი <em>მოწესრიგებულ ფინანსებამდე</em>', 'Four steps to <em>finances in order</em>'),
             'text' => b('მარტივი და გამჭვირვალე პროცესი — პირველი კონსულტაციიდან მუდმივ მხარდაჭერამდე.', 'A simple, transparent process — from the first consultation to ongoing support.'),
             'cta_label' => b('პროცესი დეტალურად', 'See the full process'), 'cta_link' => 'page:how'],
            $benefits,
            ['type' => 'industries',
             'eyebrow' => b('ვისთან ვმუშაობთ', 'Who we serve'),
             'title' => b('ყველა ზომის <em>ბიზნესისთვის</em>', 'For businesses <em>of every size</em>'),
             'text' => b('სტარტაპიდან მსხვილ კომპანიამდე — მომსახურებას თითოეული კლიენტის საჭიროებაზე ვარგებთ.', 'From startups to larger companies — we tailor our service to every client.'),
             'cta_label' => b('დეტალურად', 'Learn more'), 'cta_link' => 'page:industries'],
            $testi,
            ['type' => 'faq', 'category' => '', 'limit' => 5,
             'eyebrow' => b('FAQ', 'FAQ'),
             'title' => b('ხშირად დასმული <em>კითხვები</em>', 'Frequently asked <em>questions</em>'),
             'text' => b('ვერ იპოვეთ პასუხი? მოგვწერეთ ან დაჯავშნეთ კონსულტაცია.', 'Can’t find an answer? Write to us or book a consultation.'),
             'cta_label' => b('ყველა კითხვა', 'All questions'), 'cta_link' => 'page:faq'],
            ['type' => 'cta'] + $site['cta'],
        ],
    ],
    [
        'id' => 'about', 'template' => 'page', 'system' => true,
        'slug' => b('chven-shesakheb', 'about-us'), 'title' => b('ჩვენ შესახებ', 'About us'),
        'seo' => seo('ჩვენ შესახებ — ბუღალტრული აუთსორსინგი | Outsourcify',
                     'Outsourcify — ბუღალტრული და ბიზნეს-პროცესების აუთსორსინგის კომპანია. სერტიფიცირებული ბუღალტრები და ინდივიდუალური გადაწყვეტები ყველა ზომის ბიზნესისთვის.',
                     'About Outsourcify — Accounting Outsourcing Company',
                     'Outsourcify is an accounting and business process outsourcing company with certified accountants and tailored solutions for businesses of every size.',
                     'ბუღალტრული კომპანია; აუთსორსინგის კომპანია, ბუღალტრები თბილისში', 'accounting company Georgia; outsourcing company, accountants Tbilisi'),
        'blocks' => [
            ['type' => 'page_hero',
             'eyebrow' => b('ჩვენ შესახებ', 'About us'),
             'title' => b('ბუღალტრული და ბიზნეს-პროცესების <em>აუთსორსინგის</em> კომპანია', 'An accounting and business process <em>outsourcing</em> company'),
             'text' => b('Outsourcify ბიზნესებს სთავაზობს ფინანსურ მომსახურებას — ბუღალტრულ აღრიცხვას, საგადასახადო საკითხებსა და ფინანსურ კონსულტაციას. ვეხმარებით ყველა ზომის კომპანიას ფინანსების ეფექტურად მართვაში.',
                         'Outsourcify provides financial services to businesses — bookkeeping, tax matters and financial consulting. We help companies of every size manage their finances efficiently.'),
             'image' => img('calculator-balance-sheet-figures'),
             'image_alt' => b('კალკულატორი და ფინანსური ციფრები', 'Calculator and financial figures')] + $BOOK,
            ['type' => 'split',
             'eyebrow' => b('ჩვენი მისია', 'Our mission'),
             'title' => b('ვეხმარებით ბიზნესს, <em>ფინანსები ეფექტურად მართოს</em>', 'Helping businesses <em>manage finances efficiently</em>'),
             'text' => b('ჩვენი მიზანია, კლიენტებმა ფინანსები ეფექტურად მართონ, დაიცვან რეგულაციები და გაზარდონ მომგებიანობა. გამოცდილი ბუღალტრების გუნდი თითოეულ კლიენტს სთავაზობს მის საჭიროებებზე მორგებულ გადაწყვეტას.',
                         'Our goal is to help clients manage their finances efficiently, stay compliant with regulations and increase profitability. Our team of experienced accountants offers each client a solution tailored to their specific needs.'),
             'points' => b(['ბუღალტრული აღრიცხვა და ანგარიშგება', 'საგადასახადო კონსულტაცია და დეკლარაციები', 'ისტორიული აღრიცხვის აღდგენა', 'თანამშრომელი თქვენს ოფისში (BPO)'],
                           ['Bookkeeping and reporting', 'Tax consulting and tax returns', 'Correction of historical records', 'A specialist in your office (BPO)']),
             'image' => img('bookkeeper-calculating-invoices'),
             'image_alt' => b('ბუღალტერი ითვლის ინვოისებს', 'Bookkeeper calculating invoices'),
             'reverse' => false, 'badge_title' => b('', ''), 'badge_text' => b('', '')],
            ['type' => 'cards', 'variant' => 'grid',
             'eyebrow' => b('ღირებულებები', 'Our values'),
             'title' => b('რას ვეყრდნობით <em>ყოველდღიურ მუშაობაში</em>', 'What guides <em>our everyday work</em>'),
             'items' => [
                 card('target', 'სიზუსტე', 'Precision', 'ყოველი ციფრი და ყოველი ვადა მნიშვნელოვანია.', 'Every figure and every deadline matters.'),
                 card('shield', 'სანდოობა', 'Reliability', 'სტაბილური პარტნიორი, რომელსაც ფინანსებს ანდობთ.', 'A steady partner you can trust with your finances.'),
                 card('search', 'გამჭვირვალობა', 'Transparency', 'გასაგები პროცესი და ღია კომუნიკაცია.', 'A clear process and open communication.'),
                 card('handshake', 'ინდივიდუალური მიდგომა', 'A personal approach', 'გადაწყვეტები, რომლებიც თქვენს ბიზნესზეა მორგებული.', 'Solutions shaped around your business.'),
             ]],
            ['type' => 'services', 'layout' => 'list', 'limit' => 0,
             'eyebrow' => b('რას ვაკეთებთ', 'What we do'),
             'title' => b('ჩვენი <em>სერვისები</em>', 'Our <em>services</em>')],
            ['type' => 'steps', 'use_global' => true, 'items' => [],
             'eyebrow' => b('პროცესი', 'Process'), 'title' => b('როგორ ვიწყებთ თანამშრომლობას', 'How we start working together')],
            ['type' => 'cta'] + $site['cta'],
        ],
    ],
    [
        'id' => 'services', 'template' => 'page', 'system' => true,
        'slug' => b('servisebi', 'services'), 'title' => b('სერვისები', 'Services'),
        'seo' => seo('ბუღალტრული, საგადასახადო და BPO სერვისები | Outsourcify',
                     'ბუღალტრული მომსახურება, საგადასახადო კონსულტაცია, დეკლარაციები, აღრიცხვის აღდგენა, ფინანსური კონსულტაცია და BPO — ერთ პარტნიორთან, ყველა ზომის ბიზნესისთვის.',
                     'Accounting, Tax & BPO Services in Georgia | Outsourcify',
                     'Accounting and bookkeeping, tax consulting, tax returns, records correction, financial consulting and BPO — all with one partner in Georgia.',
                     'ბუღალტრული სერვისები; საგადასახადო მომსახურება, აუთსორსინგის სერვისები', 'accounting services; tax services Georgia, outsourcing services'),
        'blocks' => [
            ['type' => 'page_hero',
             'eyebrow' => b('სერვისები', 'Services'),
             'title' => b('ფინანსური მომსახურება, <em>მორგებული თქვენს ბიზნესზე</em>', 'Financial services <em>tailored to your business</em>'),
             'text' => b('აირჩიეთ ის, რაც გჭირდებათ: სრული ბუღალტრული მომსახურება, ცალკეული საგადასახადო სერვისი ან სპეციალისტი თქვენს ოფისში.', 'Choose what you need: full accounting support, a specific tax service or a specialist in your office.')] + $BOOK,
            ['type' => 'services', 'layout' => 'grid', 'limit' => 0,
             'eyebrow' => b('ყველა სერვისი', 'All services'),
             'title' => b('რით შეგვიძლია <em>დაგეხმაროთ</em>', 'How we can <em>help</em>')],
            ['type' => 'cards', 'variant' => 'strip',
             'title' => b('ყველა სერვისში', 'In every service'),
             'items' => $trust['items']],
            $benefits,
            ['type' => 'faq', 'category' => 'services', 'limit' => 0,
             'eyebrow' => b('FAQ', 'FAQ'), 'title' => b('კითხვები <em>სერვისებზე</em>', 'Questions about <em>our services</em>')],
            ['type' => 'cta'] + $site['cta'],
        ],
    ],
    [
        'id' => 'how', 'template' => 'page', 'system' => true,
        'slug' => b('rogor-vmushaobt', 'how-it-works'), 'title' => b('როგორ ვმუშაობთ', 'How it works'),
        'seo' => seo('როგორ ვმუშაობთ — თანამშრომლობის პროცესი | Outsourcify',
                     'გაიგეთ, როგორ იწყება თანამშრომლობა Outsourcify-თან: კონსულტაცია, ანალიზი, ჩართვა და მუდმივი ბუღალტრული მხარდაჭერა. მარტივი და გამჭვირვალე პროცესი.',
                     'How It Works — Our Onboarding Process | Outsourcify',
                     'See how working with Outsourcify starts: consultation, review, onboarding and ongoing accounting support. A simple, transparent process.',
                     'ბუღალტერიის აუთსორსინგი როგორ მუშაობს; ბუღალტრის შეცვლა', 'how accounting outsourcing works; switching accountants'),
        'blocks' => [
            ['type' => 'page_hero',
             'eyebrow' => b('როგორ ვმუშაობთ', 'How it works'),
             'title' => b('მარტივი პროცესი — <em>პირველი ზარიდან მუდმივ მხარდაჭერამდე</em>', 'A simple process — <em>from first call to ongoing support</em>'),
             'text' => b('თანამშრომლობის დაწყება არ მოითხოვს რთულ პროცედურებს. ყოველ ეტაპზე იცით, რა ხდება და ვინ არის პასუხისმგებელი.', 'Getting started doesn’t involve complicated procedures. At every stage you know what is happening and who is responsible.')] + $BOOK,
            ['type' => 'steps', 'use_global' => false,
             'eyebrow' => b('ეტაპები', 'Stages'),
             'title' => b('ხუთი ეტაპი <em>თანამშრომლობამდე</em>', 'Five stages <em>to getting started</em>'),
             'items' => [
                 ['title' => b('დაჯავშნა', 'Book'), 'text' => b('დაჯავშნეთ კონსულტაცია ონლაინ, დაგვირეკეთ ან მოგვწერეთ.', 'Book a consultation online, call us or send an email.')],
                 ['title' => b('გაცნობითი შეხვედრა', 'Intro meeting'), 'text' => b('ვეცნობით თქვენს ბიზნესს, აღრიცხვის მდგომარეობასა და მიზნებს.', 'We learn about your business, your books and your goals.')],
                 ['title' => b('შეთავაზება', 'Proposal'), 'text' => b('გთავაზობთ მომსახურების ფორმატს, მოცულობასა და პირობებს.', 'We propose the service format, scope and terms.')],
                 ['title' => b('ჩართვა', 'Onboarding'), 'text' => b('ვიღებთ დოკუმენტაციას, ვამოწმებთ და ვაწყობთ აღრიცხვას პროგრამაში.', 'We take over your documents, check them and set up your books.')],
                 ['title' => b('მუდმივი მუშაობა', 'Ongoing work'), 'text' => b('ვაწარმოებთ აღრიცხვას, ვამზადებთ ანგარიშებსა და დეკლარაციებს.', 'We keep your books and prepare reports and tax returns.')],
             ]],
            ['type' => 'split',
             'eyebrow' => b('პირველი კონსულტაცია', 'The first consultation'),
             'title' => b('რას უნდა <em>ელოდოთ</em> პირველ შეხვედრაზე', 'What to <em>expect</em> in the first meeting'),
             'text' => b('პირველი შეხვედრის მიზანია, ერთმანეთი გავიცნოთ და გავიგოთ, როგორ შეგვიძლია დაგეხმაროთ.', 'The goal of the first meeting is to get to know each other and understand how we can help.'),
             'points' => b(['მოკლედ მოგვიყვებით თქვენს ბიზნესზე', 'განვიხილავთ აღრიცხვის ამჟამინდელ მდგომარეობას', 'გიპასუხებთ კითხვებზე', 'შემდეგ მოგიმზადებთ შეთავაზებას'],
                           ['You tell us briefly about your business', 'We discuss the current state of your accounting', 'We answer your questions', 'Then we prepare a proposal for you']),
             'image' => img('accountant-working-calculator-laptop'),
             'image_alt' => b('ბუღალტერი მუშაობს ლეპტოპითა და კალკულატორით', 'Accountant working with a laptop and calculator'),
             'reverse' => true, 'badge_title' => b('', ''), 'badge_text' => b('', '')] + $BOOK,
            ['type' => 'faq', 'category' => 'process', 'limit' => 0,
             'eyebrow' => b('FAQ', 'FAQ'), 'title' => b('კითხვები <em>თანამშრომლობაზე</em>', 'Questions about <em>working together</em>')],
            ['type' => 'cta'] + $site['cta'],
        ],
    ],
    [
        'id' => 'why', 'template' => 'page', 'system' => true,
        'slug' => b('ratom-outsourcify', 'why-outsourcify'), 'title' => b('რატომ Outsourcify', 'Why Outsourcify'),
        'seo' => seo('რატომ Outsourcify — აუთსორსინგის უპირატესობები',
                     'რატომ ირჩევენ კომპანიები Outsourcify-ს: სერტიფიცირებული ბუღალტრები, ეფექტური პროგრამები და მორგებული გადაწყვეტები. შეადარეთ შიდა ბუღალტერს.',
                     'Why Outsourcify — Benefits of Accounting Outsourcing',
                     'Why companies choose Outsourcify: certified accountants, effective software and tailored solutions. Compare outsourcing with an in-house accountant.',
                     'ბუღალტერიის აუთსორსინგის უპირატესობები; შიდა ბუღალტერი თუ აუთსორსინგი', 'benefits of accounting outsourcing; in-house vs outsourced accountant'),
        'blocks' => [
            ['type' => 'page_hero',
             'eyebrow' => b('რატომ Outsourcify', 'Why Outsourcify'),
             'title' => b('მეტი სიცხადე, <em>ნაკლები საზრუნავი</em>', 'More clarity, <em>less to worry about</em>'),
             'text' => b('ფინანსური საკითხები ისეთ პარტნიორს უნდა ანდოთ, რომელიც თქვენს ბიზნესს იცნობს და პასუხისმგებლობას იღებს.', 'You should trust your finances to a partner who understands your business and takes responsibility.'),
             'image' => img('team-collaborating-laptops-office'),
             'image_alt' => b('გუნდი განიხილავს ფინანსურ ანგარიშებს', 'Team reviewing financial reports')] + $BOOK,
            ['type' => 'cards', 'variant' => 'numbered',
             'eyebrow' => b('ჩვენი უპირატესობები', 'What sets us apart'),
             'title' => b('რას იღებთ <em>Outsourcify-თან</em>', 'What you get <em>with Outsourcify</em>'),
             'items' => [
                 card('', 'სერტიფიცირებული ბუღალტრები', 'Certified accountants', 'თქვენს აღრიცხვაზე გამოცდილი, სერტიფიცირებული სპეციალისტები მუშაობენ.', 'Experienced, certified specialists work on your books.'),
                 card('', 'კარგად ორგანიზებული აღრიცხვა', 'Well-organised accounting', 'სისტემური მიდგომა დოკუმენტაციისა და ანგარიშგებისადმი.', 'A systematic approach to documentation and reporting.'),
                 card('', 'ეფექტური პროგრამები', 'Effective software', 'აღრიცხვა თანამედროვე ბუღალტრულ პროგრამულ უზრუნველყოფაში.', 'Books kept in modern accounting software.'),
                 card('', 'სერვისების სრული სპექტრი', 'A full range of services', 'აღრიცხვა, გადასახადები, დეკლარაციები, აღდგენა, კონსულტაცია და BPO ერთ სივრცეში.', 'Bookkeeping, tax, returns, corrections, consulting and BPO in one place.'),
                 card('', 'მორგებული გადაწყვეტები', 'Tailored solutions', 'მომსახურება თქვენი ბიზნესის ზომისა და საჭიროებების მიხედვით.', 'Services shaped around your size and needs.'),
                 card('', 'ფოკუსი შედეგზე', 'Focus on results', 'ვეხმარებით, ფინანსები ეფექტურად მართოთ და მომგებიანობა გაზარდოთ.', 'We help you manage finances efficiently and grow profitability.'),
             ]],
            ['type' => 'compare',
             'eyebrow' => b('შედარება', 'Comparison'),
             'title' => b('შიდა ბუღალტერი თუ <em>აუთსორსინგი?</em>', 'In-house accountant or <em>outsourcing?</em>'),
             'text' => b('შეადარეთ ორი მოდელი და აირჩიეთ ის, რომელიც თქვენს ბიზნესს უკეთ მოერგება.', 'Compare the two models and choose the one that fits your business best.'),
             'col_a' => b('შიდა ბუღალტერი', 'In-house accountant'), 'col_b' => b('Outsourcify', 'Outsourcify'),
             'rows' => [
                 ['criterion' => b('ხარჯები', 'Costs'), 'a' => b('ხელფასი, გადასახადები, სამუშაო ადგილი, პროგრამა', 'Salary, taxes, workstation, software'), 'b' => b('მომსახურება, მორგებული თქვენს მოცულობაზე', 'A service sized to your volume')],
                 ['criterion' => b('ცოდნა და გამოცდილება', 'Expertise'), 'a' => b('ერთი ადამიანის გამოცდილება', 'One person’s experience'), 'b' => b('სერტიფიცირებული ბუღალტრების გუნდი', 'A team of certified accountants')],
                 ['criterion' => b('უწყვეტობა', 'Continuity'), 'a' => b('შვებულება ან წასვლა პროცესს აჩერებს', 'Holidays or turnover stop the work'), 'b' => b('პროცესი ერთ ადამიანზე არ არის დამოკიდებული', 'Work doesn’t depend on one person')],
                 ['criterion' => b('დაქირავება და სწავლება', 'Hiring & training'), 'a' => b('თქვენი დრო და რესურსი', 'Your time and resources'), 'b' => b('ჩვენი საზრუნავია', 'Handled by us')],
                 ['criterion' => b('პროგრამული უზრუნველყოფა', 'Software'), 'a' => b('შესაძენი და სამართავი', 'To buy and maintain'), 'b' => b('ვმუშაობთ ეფექტურ ბუღალტრულ პროგრამებში', 'We work in effective accounting software')],
                 ['criterion' => b('მასშტაბირება', 'Scaling'), 'a' => b('ახალი თანამშრომლის აყვანა', 'Hiring more staff'), 'b' => b('მომსახურება იზრდება თქვენთან ერთად', 'The service grows with you')],
             ]],
            ['type' => 'split',
             'eyebrow' => b('ინდივიდუალური მიდგომა', 'A personal approach'),
             'title' => b('ყოველი ბიზნესი <em>განსხვავებულია</em>', 'Every business is <em>different</em>'),
             'text' => b('არ გთავაზობთ შაბლონურ პაკეტებს. ჯერ ვიგებთ, როგორ მუშაობს თქვენი კომპანია, და მხოლოდ შემდეგ ვთავაზობთ გადაწყვეტას.', 'We don’t offer one-size-fits-all packages. First we understand how your company works — and only then propose a solution.'),
             'points' => b(['მომსახურების ფორმატი თქვენს მოცულობაზეა მორგებული', 'ერთი პარტნიორი ყველა ფინანსურ საკითხზე', 'გასაგები კომუნიკაცია — ზედმეტი ტერმინოლოგიის გარეშე'],
                           ['A service format sized to your volume', 'One partner for all financial matters', 'Clear communication — without unnecessary jargon']),
             'image' => img('financial-report-chart-analysis'),
             'image_alt' => b('ფინანსური ანგარიშის ანალიზი', 'Financial report analysis'),
             'reverse' => false, 'badge_title' => b('', ''), 'badge_text' => b('', '')],
            $testi,
            ['type' => 'cta'] + $site['cta'],
        ],
    ],
    [
        'id' => 'industries', 'template' => 'page', 'system' => true,
        'slug' => b('vistan-vmushaobt', 'industries'), 'title' => b('ვისთან ვმუშაობთ', 'Who we serve'),
        'seo' => seo('ვისთან ვმუშაობთ — ბუღალტერია ყველა ბიზნესისთვის',
                     'Outsourcify მუშაობს სტარტაპებთან, მცირე და საშუალო ბიზნესთან, მსხვილ და უცხოურ კომპანიებთან და ინდმეწარმეებთან. გაიგეთ, როგორ დაგეხმარებით.',
                     'Who We Serve — Accounting for Every Business | Outsourcify',
                     'Outsourcify works with startups, SMEs, larger and international companies and individual entrepreneurs in Georgia. See how we can help you.',
                     'ბუღალტერია მცირე ბიზნესისთვის; ბუღალტერია სტარტაპისთვის, ინდმეწარმის ბუღალტერია', 'accounting for small business Georgia; startup accounting, accounting for foreign companies in Georgia'),
        'blocks' => [
            ['type' => 'page_hero',
             'eyebrow' => b('ვისთან ვმუშაობთ', 'Who we serve'),
             'title' => b('ფინანსური მხარდაჭერა <em>ყველა ზომის ბიზნესისთვის</em>', 'Financial support <em>for businesses of every size</em>'),
             'text' => b('განსხვავებულ ბიზნესებს განსხვავებული საჭიროებები აქვთ. მომსახურებას თითოეული კლიენტის ზომასა და სპეციფიკაზე ვარგებთ.', 'Different businesses have different needs. We tailor our services to the size and nature of each client.')] + $BOOK,
            ['type' => 'industries',
             'eyebrow' => b('კლიენტები', 'Clients'),
             'title' => b('ვის <em>ვეხმარებით</em>', 'Who we <em>help</em>')],
            ['type' => 'split',
             'eyebrow' => b('თქვენი შემთხვევა', 'Your situation'),
             'title' => b('ვერ იპოვეთ თქვენი <em>ბიზნესის ტიპი?</em>', 'Don’t see your <em>type of business?</em>'),
             'text' => b('ჩამონათვალი სრული არ არის. მოგვიყევით თქვენს საქმიანობაზე — ერთად განვსაზღვრავთ, როგორ შეგვიძლია დაგეხმაროთ.', 'This list isn’t exhaustive. Tell us about your business — together we’ll work out how we can help.'),
             'points' => b([], []),
             'image' => img('calculator-balance-sheet-figures'),
             'image_alt' => b('ფინანსური ციფრები და კალკულატორი', 'Financial figures and a calculator'),
             'reverse' => true, 'badge_title' => b('', ''), 'badge_text' => b('', ''),
             'cta_label' => b('მოგვწერეთ', 'Contact us'), 'cta_link' => 'page:contact'],
            ['type' => 'services', 'layout' => 'list', 'limit' => 0,
             'eyebrow' => b('სერვისები', 'Services'), 'title' => b('რას <em>გთავაზობთ</em>', 'What we <em>offer</em>')],
            ['type' => 'cta'] + $site['cta'],
        ],
    ],
    [
        'id' => 'faq', 'template' => 'page', 'system' => true,
        'slug' => b('khshirad-dasmuli-kitkhvebi', 'faq'), 'title' => b('ხშირად დასმული კითხვები', 'FAQ'),
        'seo' => seo('ხშირად დასმული კითხვები — ბუღალტერია | Outsourcify',
                     'პასუხები ხშირ კითხვებზე: ბუღალტრული მომსახურება, საგადასახადო კონსულტაცია, BPO, ფასები, თანამშრომლობის დაწყება და კონსულტაციის დაჯავშნა.',
                     'FAQ — Accounting & Outsourcing Questions | Outsourcify',
                     'Answers to common questions about accounting services, tax consulting, BPO, pricing, getting started and booking a consultation with Outsourcify.',
                     'ბუღალტრული მომსახურება კითხვები; ბუღალტერიის აუთსორსინგი ფასი', 'accounting outsourcing FAQ; accounting services cost Georgia'),
        'blocks' => [
            ['type' => 'page_hero',
             'eyebrow' => b('FAQ', 'FAQ'),
             'title' => b('ხშირად დასმული <em>კითხვები</em>', 'Frequently asked <em>questions</em>'),
             'text' => b('აქ შეკრიბეთ პასუხები ყველაზე გავრცელებულ კითხვებზე. თუ თქვენს კითხვას ვერ იპოვით — მოგვწერეთ.', 'Answers to the questions we hear most often. Can’t find yours? Just ask us.')],
            ['type' => 'faq', 'category' => 'general', 'limit' => 0, 'eyebrow' => b('ზოგადი', 'General'), 'title' => b('ზოგადი კითხვები', 'General questions')],
            ['type' => 'faq', 'category' => 'services', 'limit' => 0, 'eyebrow' => b('სერვისები', 'Services'), 'title' => b('სერვისები', 'Services')],
            ['type' => 'faq', 'category' => 'process', 'limit' => 0, 'eyebrow' => b('თანამშრომლობა', 'Working together'), 'title' => b('თანამშრომლობა და ფასები', 'Working together & pricing')],
            ['type' => 'faq', 'category' => 'booking', 'limit' => 0, 'eyebrow' => b('კონსულტაცია', 'Consultation'), 'title' => b('კონსულტაციის დაჯავშნა', 'Booking a consultation')],
            ['type' => 'cta'] + $site['cta'],
        ],
    ],
    [
        'id' => 'contact', 'template' => 'page', 'system' => true,
        'slug' => b('kontakti', 'contact'), 'title' => b('კონტაქტი', 'Contact'),
        'seo' => seo('კონტაქტი — დაუკავშირდით Outsourcify-ს | ბუღალტერია',
                     'დაუკავშირდით Outsourcify-ს: +995 591 171 888, info@outsourcify.ge. მოგვწერეთ ფორმით ან დაჯავშნეთ კონსულტაცია ბუღალტრულ საკითხებზე ონლაინ.',
                     'Contact Outsourcify — Accounting Services in Georgia',
                     'Contact Outsourcify: +995 591 171 888, info@outsourcify.ge. Send us a message or book an online consultation about accounting, tax or BPO services.',
                     'Outsourcify კონტაქტი; ბუღალტერი თბილისში', 'Outsourcify contact; accountant Tbilisi'),
        'blocks' => [
            ['type' => 'page_hero',
             'eyebrow' => b('კონტაქტი', 'Contact'),
             'title' => b('მოდით, <em>ვისაუბროთ</em>', 'Let’s <em>talk</em>'),
             'text' => b('გაქვთ კითხვა ან გსურთ თანამშრომლობის დაწყება? მოგვწერეთ, დაგვირეკეთ ან დაჯავშნეთ კონსულტაცია.', 'Have a question or ready to get started? Write to us, call us or book a consultation.')] + $BOOK,
            ['type' => 'contact', 'show_map' => true,
             'eyebrow' => b('საკონტაქტო ინფორმაცია', 'Contact details'),
             'title' => b('ჩვენ მზად ვართ <em>დაგეხმაროთ</em>', 'We’re ready to <em>help</em>'),
             'text' => b('შეავსეთ ფორმა და ჩვენი გუნდი მალე დაგიკავშირდებათ.', 'Fill in the form and our team will get back to you shortly.'),
             'form_title' => b('მოგვწერეთ', 'Send us a message')],
            ['type' => 'cta',
             'eyebrow' => b('გირჩევნიათ შეხვედრა?', 'Prefer a meeting?'),
             'title' => b('დაჯავშნეთ კონსულტაცია <em>2 წუთში</em>', 'Book a consultation <em>in 2 minutes</em>'),
             'text' => b('უპასუხეთ რამდენიმე კითხვას და აირჩიეთ თქვენთვის მოსახერხებელი დრო.', 'Answer a few questions and choose a time that suits you.'),
             'cta1_label' => b('კონსულტაციის დაჯავშნა', 'Book a consultation'), 'cta1_link' => 'page:book', 'cta2_label' => b('', ''), 'cta2_link' => ''],
        ],
    ],
    [
        'id' => 'book', 'template' => 'page', 'system' => true,
        'slug' => b('konsultatsiis-dajavshna', 'book-a-consultation'), 'title' => b('კონსულტაციის დაჯავშნა', 'Book a consultation'),
        'seo' => seo('კონსულტაციის დაჯავშნა ონლაინ — ბუღალტერია | Outsourcify',
                     'დაჯავშნეთ კონსულტაცია Outsourcify-სთან 2 წუთში: აირჩიეთ სერვისი, მოგვიყევით თქვენს ბიზნესზე და შეარჩიეთ მოსახერხებელი დღე და საათი ონლაინ.',
                     'Book an Accounting Consultation Online | Outsourcify',
                     'Book a consultation with Outsourcify in 2 minutes: choose a service, tell us about your business and pick a convenient day and time — all online.',
                     'ბუღალტრული კონსულტაცია; კონსულტაციის დაჯავშნა, ბუღალტერთან შეხვედრა', 'book accounting consultation; accountant consultation Georgia'),
        'blocks' => [
            ['type' => 'page_hero',
             'eyebrow' => b('ონლაინ დაჯავშნა', 'Online booking'),
             'title' => b('დაჯავშნეთ <em>კონსულტაცია</em>', 'Book a <em>consultation</em>'),
             'text' => b('უპასუხეთ რამდენიმე მოკლე კითხვას — ეს დაახლოებით 2 წუთს დაიკავებს.', 'Answer a few short questions — it takes about 2 minutes.')],
            ['type' => 'booking',
             'eyebrow' => b('რას უნდა ელოდოთ', 'What to expect'),
             'title' => b('შეხვედრა, რომელიც <em>თქვენს საჭიროებებზეა</em> ორიენტირებული', 'A meeting focused <em>on your needs</em>'),
             'text' => b('კონსულტაციაზე განვიხილავთ თქვენს სიტუაციას და შემოგთავაზებთ შემდეგ ნაბიჯებს.', 'In the consultation we discuss your situation and suggest next steps.'),
             'points' => b(['გავეცნობით თქვენს ბიზნესსა და საჭიროებებს', 'განვიხილავთ აღრიცხვის ამჟამინდელ მდგომარეობას', 'შემოგთავაზებთ შესაფერის მომსახურების ფორმატს', 'დადასტურება მოგივათ ელფოსტაზე'],
                           ['We get to know your business and needs', 'We discuss the current state of your accounting', 'We suggest a suitable service format', 'You receive a confirmation by email'])],
            ['type' => 'faq', 'category' => 'booking', 'limit' => 0,
             'eyebrow' => b('FAQ', 'FAQ'), 'title' => b('კითხვები <em>კონსულტაციაზე</em>', 'Questions about <em>the consultation</em>')],
        ],
    ],
    [
        'id' => 'privacy', 'template' => 'page', 'system' => true,
        'slug' => b('konfidentsialurobis-politika', 'privacy-policy'), 'title' => b('კონფიდენციალურობის პოლიტიკა', 'Privacy Policy'),
        'seo' => seo('კონფიდენციალურობის პოლიტიკა — მონაცემთა დაცვა | Outsourcify',
                     'როგორ აგროვებს, იყენებს და იცავს Outsourcify საიტის მეშვეობით მიღებულ პერსონალურ მონაცემებს, რამდენ ხანს ინახება ისინი და რა უფლებები გაქვთ.',
                     'Privacy Policy — How We Protect Your Data | Outsourcify',
                     'How Outsourcify collects, uses and protects personal data submitted through this website, how long we keep it, and what rights you have over it.'),
        'blocks' => [
            ['type' => 'page_hero', 'eyebrow' => b('სამართლებრივი ინფორმაცია', 'Legal'), 'title' => b('კონფიდენციალურობის პოლიტიკა', 'Privacy Policy'),
             'text' => b('ბოლო განახლება: ' . date('d.m.Y'), 'Last updated: ' . date('d.m.Y'))],
            ['type' => 'richtext', 'toc' => true, 'eyebrow' => b('', ''), 'title' => b('', ''),
             'body' => b(
                "<p>ეს პოლიტიკა განმარტავს, როგორ აგროვებს, იყენებს და იცავს Outsourcify (შემდგომში „ჩვენ“) ამ ვებსაიტის მეშვეობით მიღებულ პერსონალურ მონაცემებს.</p>\n<h2>რა მონაცემებს ვაგროვებთ</h2>\n<p>ვაგროვებთ მხოლოდ იმ ინფორმაციას, რომელსაც თავად გვაწვდით საკონტაქტო ფორმის ან კონსულტაციის დაჯავშნის გამოყენებისას:</p>\n<ul><li>სახელი და გვარი;</li><li>ელფოსტა და ტელეფონის ნომერი;</li><li>კომპანიის დასახელება და ინფორმაცია თქვენი ბიზნესის შესახებ;</li><li>კონსულტაციის სასურველი დრო და თქვენი შეტყობინება.</li></ul>\n<p>უსაფრთხოების მიზნით ასევე ვინახავთ გაგზავნის დროსა და IP-მისამართს.</p>\n<h2>რისთვის ვიყენებთ მონაცემებს</h2>\n<ul><li>თქვენს მოთხოვნაზე პასუხისა და კონსულტაციის ორგანიზებისთვის;</li><li>ჯავშნის დადასტურებისა და შეხსენების გასაგზავნად;</li><li>სპამისა და ბოროტად გამოყენების თავიდან ასაცილებლად.</li></ul>\n<p>თქვენს მონაცემებს არ ვყიდით და მარკეტინგული მიზნით მესამე პირებს არ გადავცემთ.</p>\n<h2>შენახვის ვადა</h2>\n<p>მონაცემებს ვინახავთ იმ ვადით, რაც საჭიროა თქვენს მოთხოვნაზე რეაგირებისა და თანამშრომლობისთვის, ან რასაც კანონმდებლობა მოითხოვს.</p>\n<h2>ქუქი-ფაილები</h2>\n<p>საიტი იყენებს მხოლოდ ტექნიკურად აუცილებელ ქუქი-ფაილებს. თუ ჩართულია ვიზიტების ანალიტიკა, ის გამოიყენება მხოლოდ საიტის გასაუმჯობესებლად.</p>\n<h2>თქვენი უფლებები</h2>\n<p>გაქვთ უფლება, მოითხოვოთ ინფორმაცია თქვენს შესახებ დაცული მონაცემების თაობაზე, მათი გასწორება ან წაშლა. მოთხოვნისთვის მოგვწერეთ ელფოსტაზე info@outsourcify.ge.</p>\n<h2>კონტაქტი</h2>\n<p>კონფიდენციალურობასთან დაკავშირებული კითხვებისთვის დაგვიკავშირდით: info@outsourcify.ge, +995 591 171 888.</p>",
                "<p>This policy explains how Outsourcify (“we”) collects, uses and protects personal data received through this website.</p>\n<h2>What data we collect</h2>\n<p>We only collect the information you give us when you use the contact form or book a consultation:</p>\n<ul><li>your full name;</li><li>email address and phone number;</li><li>company name and information about your business;</li><li>your preferred consultation time and message.</li></ul>\n<p>For security purposes we also store the submission time and IP address.</p>\n<h2>How we use your data</h2>\n<ul><li>to respond to your request and organise the consultation;</li><li>to send booking confirmations and reminders;</li><li>to prevent spam and abuse.</li></ul>\n<p>We do not sell your data or share it with third parties for marketing purposes.</p>\n<h2>Retention</h2>\n<p>We keep your data for as long as needed to respond to your request and work with you, or as required by law.</p>\n<h2>Cookies</h2>\n<p>This website uses only technically necessary cookies. If visitor analytics is enabled, it is used solely to improve the website.</p>\n<h2>Your rights</h2>\n<p>You have the right to request information about the data we hold about you, and to have it corrected or deleted. To make a request, email us at info@outsourcify.ge.</p>\n<h2>Contact</h2>\n<p>For privacy questions, contact us at info@outsourcify.ge or +995 591 171 888.</p>"
             )],
        ],
    ],
    [
        'id' => 'terms', 'template' => 'page', 'system' => true,
        'slug' => b('tsesebi-da-pirobebi', 'terms-and-conditions'), 'title' => b('წესები და პირობები', 'Terms & Conditions'),
        'seo' => seo('წესები და პირობები — საიტის გამოყენება | Outsourcify',
                     'Outsourcify-ის ვებსაიტის გამოყენების წესები და პირობები: საიტზე განთავსებული ინფორმაცია, ონლაინ დაჯავშნა, ინტელექტუალური საკუთრება და პასუხისმგებლობა.',
                     'Terms & Conditions — Website Use | Outsourcify',
                     'Terms and conditions for using the Outsourcify website: information on the site, online booking, intellectual property and limitation of liability.'),
        'blocks' => [
            ['type' => 'page_hero', 'eyebrow' => b('სამართლებრივი ინფორმაცია', 'Legal'), 'title' => b('წესები და პირობები', 'Terms & Conditions'),
             'text' => b('ბოლო განახლება: ' . date('d.m.Y'), 'Last updated: ' . date('d.m.Y'))],
            ['type' => 'richtext', 'toc' => true, 'eyebrow' => b('', ''), 'title' => b('', ''),
             'body' => b(
                "<p>ამ ვებსაიტის გამოყენებით ეთანხმებით ქვემოთ მოცემულ პირობებს.</p>\n<h2>საიტზე განთავსებული ინფორმაცია</h2>\n<p>საიტზე განთავსებული ინფორმაცია ზოგადი ხასიათისაა და არ წარმოადგენს ინდივიდუალურ ბუღალტრულ, საგადასახადო ან სამართლებრივ რჩევას. კონკრეტული გადაწყვეტილების მიღებამდე მიმართეთ სპეციალისტს.</p>\n<h2>მომსახურება</h2>\n<p>მომსახურების მოცულობა, ვადები და ღირებულება განისაზღვრება მხარეებს შორის გაფორმებული ხელშეკრულებით.</p>\n<h2>ონლაინ დაჯავშნა</h2>\n<p>ონლაინ დაჯავშნა ადასტურებს კონსულტაციის სასურველ დროს. საჭიროების შემთხვევაში დაგიკავშირდებით დროის დასაზუსტებლად. თუ დრო შეგეცვალათ, გთხოვთ, წინასწარ შეგვატყობინოთ.</p>\n<h2>ინტელექტუალური საკუთრება</h2>\n<p>საიტის შინაარსი, დიზაინი და ლოგო Outsourcify-ის საკუთრებაა და მისი გამოყენება ნებართვის გარეშე დაუშვებელია.</p>\n<h2>პასუხისმგებლობის შეზღუდვა</h2>\n<p>ვცდილობთ, საიტზე განთავსებული ინფორმაცია იყოს ზუსტი და აქტუალური, თუმცა არ ვიღებთ პასუხისმგებლობას მისი გამოყენების შედეგად მიღებულ გადაწყვეტილებებზე.</p>\n<h2>ცვლილებები</h2>\n<p>ამ პირობების განახლება შესაძლებელია ნებისმიერ დროს. მოქმედი ვერსია ყოველთვის ამ გვერდზეა განთავსებული.</p>\n<h2>კონტაქტი</h2>\n<p>კითხვებისთვის დაგვიკავშირდით: info@outsourcify.ge, +995 591 171 888.</p>",
                "<p>By using this website, you agree to the following terms.</p>\n<h2>Website information</h2>\n<p>Information on this website is general in nature and does not constitute individual accounting, tax or legal advice. Please consult a specialist before making specific decisions.</p>\n<h2>Services</h2>\n<p>The scope, timing and cost of services are defined in a written agreement between the parties.</p>\n<h2>Online booking</h2>\n<p>An online booking confirms your preferred consultation time. If needed, we will contact you to confirm the time. If your plans change, please let us know in advance.</p>\n<h2>Intellectual property</h2>\n<p>The content, design and logo of this website belong to Outsourcify and may not be used without permission.</p>\n<h2>Limitation of liability</h2>\n<p>We strive to keep the information on this website accurate and up to date, but we accept no liability for decisions made on the basis of it.</p>\n<h2>Changes</h2>\n<p>These terms may be updated at any time. The current version is always available on this page.</p>\n<h2>Contact</h2>\n<p>For questions, contact us at info@outsourcify.ge or +995 591 171 888.</p>"
             )],
        ],
    ],
];

/* ============================================================== WRITE */
require_once dirname(__DIR__) . '/inc/schema.php';
// ბლოკები გადის იმავე გასუფთავებას, რასაც ადმინი — ფორმატი ერთნაირია
foreach ($pages as &$p) {
    $p['blocks'] = os_clean_blocks($p['blocks']);
    $p['og_image'] = '';
    $p['hidden'] = false;
    $p['noindex'] = false;
}
unset($p);
$services = array_map(static fn($s) => ['id' => $s['id']] + os_clean(record_defs()['service'], $s), $services);
$faqs = os_clean(['i' => f('repeater', '', ['fields' => record_defs()['faq']])], ['i' => $faqs])['i'];
$industries = os_clean(['i' => f('repeater', '', ['fields' => record_defs()['industry']])], ['i' => $industries])['i'];

$files = [
    'site' => $site,
    'pages' => ['pages' => $pages],
    'services' => ['services' => $services],
    'faqs' => ['items' => $faqs],
    'industries' => ['items' => $industries],
    'testimonials' => ['items' => []],
];
foreach ($files as $name => $data) {
    $path = OS_CONTENT . "/$name.json";
    if (is_file($path) && !$force) {
        echo "skip  content/$name.json (უკვე არსებობს; --force გადასაწერად)\n";
        continue;
    }
    os_write($name, json_decode(json_encode($data), true));
    echo "write content/$name.json\n";
}
