/**
 * Catalog of 30 Plan Templates
 * Каталог шаблонов планов
 */

import { PlanTemplate } from './types';

export const ALL_PLAN_TEMPLATES: PlanTemplate[] = [
    // ============================================
    // A. РЕЗЕРВ И "ПОДУШКА"
    // ============================================
    {
        id: 'reserve_first_10k',
        title: 'Первый резерв 10k за 30 дней',
        description: 'Накопить первые 10 000 ₽ за месяц, убрав импульсные траты.',
        category: 'reserve',
        horizons: ['month'],
        intensity: '10 мин/день',
        targetAudience: 'У кого нет накоплений',
        requirements: ['день_зарплаты', 'свободные_деньги'],
        requiredParams: ['salaryDay', 'freeMoney'], // mapped to internal keys
        defaultParams: { targetReserve: 10000 },
        exampleTasks: ['Ежедневный перевод', 'Чистка подписок', 'Лимит на маркетплейсы'],
        tasksBlueprint: [
            {
                title: 'Ежедневный перевод в резерв',
                description: 'Откладывать ~1% от свободных денег каждый день на запас (микросэйвинг)',
                schedule: 'daily',
                priority: 2,
                repeat: 'ежедневно',
                tag: 'резерв',
                estimatedEffect: 200
            },
            {
                title: 'Чистка подписок',
                description: 'Просмотреть платные подписки и отменить минимум 1 ненужную',
                schedule: 'day 3',
                priority: 3,
                repeat: null,
                tag: 'подписки',
                estimatedEffect: 300
            },
            {
                title: 'Лимит на маркетплейсы',
                description: 'Установить лимит трат на Ozon/WB - не более 0 ₽ на 72 часа',
                schedule: 'immediate',
                priority: 1,
                repeat: null,
                tag: 'импульс',
                estimatedEffect: 500
            },
            {
                title: 'Еженедельный пересчет остатка',
                description: 'Каждую пятницу проверять остаток свободных денег и переводить 5% в резерв',
                schedule: 'weekly',
                priority: 2,
                repeat: 'еженедельно',
                tag: 'резерв',
                estimatedEffect: 500
            }
        ],
        rulesBlueprint: [
            {
                trigger: 'balance_negative',
                action: 'panic_mode',
                description: 'Если баланс падает ниже 0, активировать аварийный протокол',
                triggerParams: { threshold: 0 }
            },
            {
                trigger: 'impulse_buy',
                action: 'wait_72h',
                description: 'При желании купить незапланированное - добавить в список и ждать 72 часа',
                triggerParams: { wait: '72h' }
            }
        ]
    },
    {
        id: 'reserve_1_percent',
        title: 'Резерв 1% в день',
        description: 'Мягкий старт: откладывайте всего 1% от свободных денег ежедневно.',
        category: 'reserve',
        horizons: ['month'],
        intensity: 'easy',
        targetAudience: 'При низких доходах',
        requirements: ['Ежедневный доступ к банку'],
        exampleTasks: ['Перевести 1% на накопительный', 'Пересчет суммы в пятницу'],
    },
    {
        id: 'reserve_3_envelopes',
        title: 'Правило 3 конвертов',
        description: 'Классика: Обязательные / Еда / Развлечения.',
        category: 'reserve',
        horizons: ['month'],
        intensity: 'medium',
        targetAudience: 'Кто путается в тратах',
        requirements: ['Знать сумму расходов'],
        exampleTasks: ['Разложить лимиты по категориям', 'Проверить остаток "Еда"'],
    },
    {
        id: 'reserve_no_shopping_72h',
        title: '72 часа без покупок',
        description: 'Анти-импульс: запрет на любые не обязательные траты на 3 дня.',
        category: 'reserve',
        horizons: ['week'],
        intensity: 'hard',
        targetAudience: 'Шопоголики',
        requirements: [],
        exampleTasks: ['Добавить "хотелку" в вишлист', 'Не заходить на WB/Ozon'],
    },
    {
        id: 'reserve_season_spb',
        title: 'План "Зима СПб"',
        description: 'Готовимся к сезону: одежда, реагенты, транспорт.',
        category: 'reserve',
        horizons: ['year'],
        intensity: 'medium',
        targetAudience: 'Жители Петербурга',
        requirements: [],
        exampleTasks: ['Фонд на зимнюю обувь', 'Чек-лист защиты от соли'],
    },
    {
        id: 'reserve_communal_crash',
        title: 'Резерв "Старый фонд"',
        description: 'Фонд на случай внезапной аварии или перерасчёта ЖКХ.',
        category: 'reserve',
        horizons: ['month'],
        intensity: 'easy',
        targetAudience: 'Владельцы старого жилья',
        requirements: [],
        exampleTasks: ['Пополнить аварийный фонд', 'Проверить трубы/счетчики'],
    },
    {
        id: 'reserve_kids',
        title: 'Резерв "Дети/Школа"',
        description: 'Подготовка к школьным поборам и кружкам.',
        category: 'reserve',
        horizons: ['month'],
        intensity: 'medium',
        targetAudience: 'Родители',
        requirements: [],
        exampleTasks: ['Список закупок к школе', 'Отложить на кружки'],
    },
    {
        id: 'reserve_rounding',
        title: 'Накопление округлением',
        description: 'Округляйте траты до сотен, разницу — в копилку.',
        category: 'reserve',
        horizons: ['week'],
        intensity: 'easy',
        targetAudience: 'Все',
        requirements: [],
        exampleTasks: ['Округлить остаток дня', 'Перевести хвостик на счет'],
    },

    // ============================================
    // B. ДОЛГИ
    // ============================================
    {
        id: 'debt_stop_mfo',
        title: 'Стоп-МФО: 14 дней без новых займов',
        description: 'Протокол на 2 недели: не брать новых микрозаймов и закрыть кассовый разрыв.',
        category: 'debt',
        horizons: ['week', 'month'],
        intensity: '15 мин/день (аварийный режим)',
        targetAudience: 'В долговой яме',
        requirements: ['список_долгов'],
        requiredParams: ['debtsList'],
        defaultParams: {},
        exampleTasks: ['Инвентаризация долгов', 'План минимальных платежей', 'Аварийное сокращение расходов'],
        tasksBlueprint: [
            {
                title: 'Инвентаризация долгов',
                description: 'Добавить все текущие долги/кредиты в приложение',
                schedule: 'day 1',
                priority: 1,
                repeat: null,
                tag: 'долги',
                estimatedEffect: null
            },
            {
                title: 'План минимальных платежей',
                description: 'Рассчитать минимальные платежи на 14 дней, избежать просрочек',
                schedule: 'day 1',
                priority: 1,
                repeat: null,
                tag: 'долги',
                estimatedEffect: 500 // штрафы предотвращены
            },
            {
                title: 'Аварийное сокращение расходов',
                description: 'Оставить только еду и транспорт на 2 недели, остальное заморозить',
                schedule: 'day 1',
                priority: 2,
                repeat: null,
                tag: 'экономия',
                estimatedEffect: 1000
            },
            {
                title: 'Поиск доп. дохода (разово)',
                description: 'Найти способ получить небольшой доп. доход (продать вещь, подработка)',
                schedule: 'week 1',
                priority: 3,
                repeat: null,
                tag: 'доход',
                estimatedEffect: 2000
            },
            {
                title: 'Чек-ин через 7 дней',
                description: 'Ревью: получилось ли не взять новых займов?',
                schedule: 'day 7',
                priority: 1,
                repeat: null,
                tag: 'ревью',
                estimatedEffect: null
            }
        ],
        rulesBlueprint: [
            {
                trigger: 'income_received',
                action: 'notify_distribution',
                description: 'При поступлении дохода напомнить сперва закрыть долги'
            },
            {
                trigger: 'new_loan_request',
                action: 'warning_stop',
                description: 'Если рассматриваете новый заем – стоп! Посмотрите альтернативы.'
            }
        ]
    },
    {
        id: 'debt_calendar',
        title: 'Календарь долгов',
        description: 'Соберите все долги в один наглядный список.',
        category: 'debt',
        horizons: ['month'],
        intensity: 'medium',
        targetAudience: 'Много кредиторов',
        requirements: ['Список всех долгов'],
        exampleTasks: ['Выписать даты платежей', 'Сверить суммы в ЛК'],
    },
    {
        id: 'debt_discipline',
        title: 'Долговая дисциплина',
        description: 'Главная цель: ни одного штрафа за месяц.',
        category: 'debt',
        horizons: ['month'],
        intensity: 'hard',
        targetAudience: 'Кто часто забывает',
        requirements: [],
        exampleTasks: ['Напоминание за 24ч', 'Напоминание за 2ч'],
    },
    {
        id: 'debt_snowball',
        title: 'Снежинка (Мелкие сначала)',
        description: 'Закрывайте самые маленькие долги для мотивации.',
        category: 'debt',
        horizons: ['month'],
        intensity: 'medium',
        targetAudience: 'Кому нужна победа',
        requirements: [],
        exampleTasks: ['Погасить самый мелкий долг', 'Выбрать следующую цель'],
    },
    {
        id: 'debt_avalanche',
        title: 'Лавина (Дорогие сначала)',
        description: 'Закрывайте долги с самым высоким процентом.',
        category: 'debt',
        horizons: ['month'],
        intensity: 'hard',
        targetAudience: 'Прагматики',
        requirements: [],
        exampleTasks: ['Найти самый высокий %', 'Внести досрочный платеж'],
    },
    {
        id: 'debt_restruct',
        title: 'Навигатор реструктуризации',
        description: 'Как легально снизить платеж через банк.',
        category: 'debt',
        horizons: ['week'],
        intensity: 'medium',
        targetAudience: 'Сложная ситуация',
        requirements: [],
        exampleTasks: ['Скачать шаблон заявления', 'Отправить запрос в чат'],
    },
    {
        id: 'debt_antifine',
        title: 'Анти-Штрафы',
        description: 'Контроль штрафов ГИБДД, пени, комиссий.',
        category: 'debt',
        horizons: ['week'],
        intensity: 'easy',
        targetAudience: 'Водители',
        requirements: [],
        exampleTasks: ['Проверить Госуслуги', 'Настроить автоплатеж без комиссии'],
    },
    {
        id: 'debt_panic_mode',
        title: 'Кассовый разрыв (Panic)',
        description: 'Что делать, если платить нечем прямо сейчас.',
        category: 'debt',
        horizons: ['day'],
        intensity: 'hard',
        targetAudience: 'SOS ситуация',
        requirements: [],
        exampleTasks: ['Выбрать, что НЕ платить', 'Звонок другу'],
    },

    // ============================================
    // C. ОПТИМИЗАЦИЯ И УТЕЧКИ
    // ============================================
    {
        id: 'opt_subscriptions',
        title: 'Чистка подписок за 30 минут',
        description: 'Быстро сократить регулярные траты: убрать лишние подписки и комиссии.',
        category: 'optimization',
        horizons: ['day', 'week'],
        intensity: '30 минут в целом',
        targetAudience: 'У кого много сервисов',
        requirements: ['список_подписок'],
        requiredParams: ['subscriptionsList'],
        defaultParams: {},
        exampleTasks: ['Составить список подписок', 'Отменить ненужные', 'Проверить комиссии'],
        tasksBlueprint: [
            {
                title: 'Составить список подписок',
                description: 'Перечислить все платные подписки и регулярные платежи',
                schedule: 'day 1',
                priority: 1,
                repeat: null,
                tag: 'подписки',
                estimatedEffect: null
            },
            {
                title: 'Отменить ненужные подписки',
                description: 'Выбрать 2-3 сервиса и отменить их',
                schedule: 'day 1',
                priority: 1,
                repeat: null,
                tag: 'подписки',
                estimatedEffect: 500
            },
            {
                title: 'Проверить банковские комиссии',
                description: 'Просмотреть выписки за месяц на наличие комиссий банка',
                schedule: 'day 2',
                priority: 2,
                repeat: null,
                tag: 'комиссии',
                estimatedEffect: 200
            },
            {
                title: 'Зафиксировать экономию',
                description: 'Подсчитать сумму экономии и перенаправить в резерв',
                schedule: 'day 3',
                priority: 2,
                repeat: null,
                tag: 'экономия',
                estimatedEffect: null
            }
        ],
        rulesBlueprint: [
            {
                trigger: 'new_subscription',
                action: 'warning',
                description: 'При новой подписке напомнить проверить дубликаты'
            },
            {
                trigger: 'month_end',
                action: 'check_subs',
                description: 'Ежемесячная ревизия подписок'
            }
        ]
    },
    {
        id: 'opt_marketplace_limit',
        title: 'Маркетплейс-детокс',
        description: 'Ограничение покупок на WB/Ozon.',
        category: 'optimization',
        horizons: ['week'],
        intensity: 'medium',
        targetAudience: 'Активные покупатели',
        requirements: [],
        exampleTasks: ['Удалить привязанную карту', 'Оставить корзину на 48 часов'],
    },
    {
        id: 'opt_no_coffee',
        title: '3 дня без кофе/еды',
        description: 'Челлендж: готовьте дома, носите с собой.',
        category: 'optimization',
        horizons: ['week'],
        intensity: 'medium',
        targetAudience: 'Офисные работники',
        requirements: [],
        exampleTasks: ['Взять еду из дома', 'Найти бесплатную воду'],
    },
    {
        id: 'opt_commissions',
        title: 'Комиссии и тарифы',
        description: 'Уберите скрытые платежи банков.',
        category: 'optimization',
        horizons: ['day'],
        intensity: 'easy',
        targetAudience: 'Все',
        requirements: [],
        exampleTasks: ['Проверить тариф связи', 'Отключить смс-информирование'],
    },
    {
        id: 'opt_transport_spb',
        title: 'Транспорт СПб',
        description: 'Оптимизация поездок (Подорожник, такси).',
        category: 'optimization',
        horizons: ['week'],
        intensity: 'medium',
        targetAudience: 'Петербуржцы',
        requirements: [],
        exampleTasks: ['Пополнить Подорожник (выгоднее)', 'Сравнить такси и каршеринг'],
    },
    {
        id: 'opt_communal_check',
        title: 'Контроль ЖКХ',
        description: 'Сверка счетчиков и поиск ошибок в квитанциях.',
        category: 'optimization',
        horizons: ['month'],
        intensity: 'medium',
        targetAudience: 'Плательщики КУ',
        requirements: [],
        exampleTasks: ['Передать показания вовремя', 'Сравнить с прошлым месяцем'],
    },
    {
        id: 'opt_season_clothes',
        title: 'Одежда без переплат',
        description: 'Покупка сезонных вещей заранее.',
        category: 'optimization',
        horizons: ['year'],
        intensity: 'medium',
        targetAudience: 'Модники',
        requirements: [],
        exampleTasks: ['Составить список базы', 'Купить на распродаже'],
    },
    {
        id: 'opt_anti_impulse',
        title: 'Неделя Anti-Impulse',
        description: 'Фиксация триггеров спонтанных покупок.',
        category: 'optimization',
        horizons: ['week'],
        intensity: 'hard',
        targetAudience: 'Азартные покупатели',
        requirements: [],
        exampleTasks: ['Дневник эмоций перед покупкой', 'Пауза 10 минут'],
    },

    // ============================================
    // D. СТАБИЛЬНОСТЬ
    // ============================================
    {
        id: 'stab_irregular_income',
        title: 'Стабилизация дохода',
        description: 'Для фрилансеров и сменных работников.',
        category: 'stability',
        horizons: ['month'],
        intensity: 'medium',
        targetAudience: 'Самозанятые',
        requirements: [],
        exampleTasks: ['Определить минимум на день', 'Отложить 10% с поступления'],
    },
    {
        id: 'stab_micro_income',
        title: '2 источника дохода (микрошаги)',
        description: 'Шаги для запуска дополнительного дохода без золотых гор.',
        category: 'stability',
        horizons: ['month', 'quarter'],
        intensity: '2-3 задачи в неделю',
        targetAudience: 'Ищущие работу',
        requirements: ['навыки/увлечения'],
        requiredParams: ['skills'],
        defaultParams: {},
        exampleTasks: ['Брейншторм идей', 'Выложить резюме', 'Трек заявок'],
        tasksBlueprint: [
            {
                title: 'Брейншторм идей дохода',
                description: 'Записать 5 идей доп. заработка (фриланс, хобби)',
                schedule: 'week 1, day 1',
                priority: 2,
                repeat: null,
                tag: 'доход',
                estimatedEffect: null
            },
            {
                title: 'Простое резюме/объявление',
                description: 'Составить и выложить объявление для одной идеи',
                schedule: 'week 1, day 3',
                priority: 2,
                repeat: null,
                tag: 'доход',
                estimatedEffect: null
            },
            {
                title: 'Обратиться к знакомым',
                description: 'Узнать у 3 знакомых, не нужны ли им услуги',
                schedule: 'week 2, day 1',
                priority: 3,
                repeat: null,
                tag: 'нетворкинг',
                estimatedEffect: null
            },
            {
                title: 'Трек заявок',
                description: 'Вести список откликов и обновлять еженедельно',
                schedule: 'weekly',
                priority: 3,
                repeat: 'еженедельно',
                tag: 'трекер',
                estimatedEffect: null
            },
            {
                title: 'Анализ месяца',
                description: 'Оценить заработок и сработавшие действия',
                schedule: 'month_end',
                priority: 1,
                repeat: null,
                tag: 'ревью',
                estimatedEffect: null
            }
        ],
        rulesBlueprint: [
            {
                trigger: 'extra_income',
                action: 'propose_distribution',
                description: 'При доп. доходе рекомендовать отложить %'
            },
            {
                trigger: 'no_progress_2_weeks',
                action: 'motivation',
                description: 'Если 2 недели нет прогресса - мотивационное напоминание'
            }
        ]
    },
    {
        id: 'stab_salary_control',
        title: 'Контроль Аванса',
        description: 'Дожить от аванса до зарплаты.',
        category: 'stability',
        horizons: ['month'],
        intensity: 'medium',
        targetAudience: 'Работники по найму',
        requirements: [],
        exampleTasks: ['Распределить обязательные', 'Лимит на неделю'],
    },
    {
        id: 'stab_big_purchase',
        title: 'Большая покупка',
        description: 'Накопить на цель без кредита.',
        category: 'stability',
        horizons: ['year'],
        intensity: 'medium',
        targetAudience: 'Мечтатели',
        requirements: [],
        exampleTasks: ['Открыть целевой счет', 'Автопополнение'],
    },
    {
        id: 'stab_no_delays_30',
        title: 'Без просрочек 30 дней',
        description: 'Дисциплина платежей: не допустить ни одной просрочки за месяц.',
        category: 'stability',
        horizons: ['month'],
        intensity: '5-10 мин/день',
        targetAudience: 'Исправляющие КИ',
        requirements: ['список_платежей'],
        requiredParams: ['obligationsList'],
        defaultParams: {},
        exampleTasks: ['Сбор платежей', 'Настройка напоминаний', 'Резерв на платежи'],
        tasksBlueprint: [
            {
                title: 'Сбор платежей',
                description: 'Добавить все обязательные платежи и счета с датами',
                schedule: 'day 1',
                priority: 1,
                repeat: null,
                tag: 'обязательные',
                estimatedEffect: null
            },
            {
                title: 'Настройка напоминаний',
                description: 'Включить напоминания за 3 дня и за 1 день до каждого платежа',
                schedule: 'day 1',
                priority: 1,
                repeat: null,
                tag: 'напоминания',
                estimatedEffect: null
            },
            {
                title: 'Еженедельный контроль',
                description: 'Два раза в неделю проверять календарь платежей',
                schedule: 'twice weekly',
                priority: 2,
                repeat: 'еженедельно',
                tag: 'ревью',
                estimatedEffect: null
            },
            {
                title: 'Резерв на платежи',
                description: 'Отложить 5% дохода в резерв для непредвиденных счетов',
                schedule: 'week 1',
                priority: 2,
                repeat: null,
                tag: 'резерв',
                estimatedEffect: 1000
            },
            {
                title: 'Анализ результатов',
                description: 'В конце месяца отметить просрочки (или их отсутствие)',
                schedule: 'month_end',
                priority: 1,
                repeat: null,
                tag: 'итог',
                estimatedEffect: null
            }
        ],
        rulesBlueprint: [
            {
                trigger: 'day_before_payment',
                action: 'push_reminder',
                description: 'За 24 часа до платежа проверка готовности'
            },
            {
                trigger: 'payment_overdue',
                action: 'mark_overdue',
                description: 'Если платеж просрочен - повысить риск'
            }
        ]
    },
    {
        id: 'stab_calendar_spb',
        title: 'Фин. календарь СПб',
        description: 'Подготовка к праздникам и сезонам города.',
        category: 'stability',
        horizons: ['year'],
        intensity: 'easy',
        targetAudience: 'Жители города',
        requirements: [],
        exampleTasks: ['Фонд "Алые Паруса"', 'Резерв на отпуск'],
    },
];

export const TEMPLATES_DISCLAIMER = 'Шаблоны носят рекомендательный характер. Используйте на свой риск.';

export function getTemplatesByCategory(category: string) {
    return ALL_PLAN_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string) {
    return ALL_PLAN_TEMPLATES.find(t => t.id === id);
}

export function getTemplateCategories() {
    return Array.from(new Set(ALL_PLAN_TEMPLATES.map(t => t.category)));
}
