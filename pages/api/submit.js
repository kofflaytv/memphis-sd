import { verifyToken } from '../../lib/discord';
import { isBlacklisted, addToBlacklist } from '../../lib/blacklist';
import { containsBadWords, findBadWord, findAllBadWords } from '../../lib/badwords';
import { checkSpam } from '../../lib/antispam';
import { kv } from '@vercel/kv';

const DEPARTMENTS = {
  'ib': {
    name: 'IB (Intelligence Branch)',
    webhook: process.env.WEBHOOK_REPORT_IB,
    emoji: '🕵️',
    roleId: '1398200840900055071',
    roleId2: '1520504887497064639'
  },
  'cid': {
    name: 'CID (Criminal Investigation Department)',
    webhook: process.env.WEBHOOK_REPORT_CID,
    emoji: '🔍',
    roleId: '1398200760843374652',
    roleId2: '1520680049655676948'
  },
  'fa': {
    name: 'FA (Free Agent)',
    webhook: process.env.WEBHOOK_REPORT_FA,
    emoji: '🆓',
    roleId: '1398200891353468928',
    roleId2: '1520680052176715876'
  },
  'hrt': {
    name: 'HRT (Hostage Rescue Team)',
    webhook: process.env.WEBHOOK_REPORT_HRT,
    emoji: '🛡️',
    roleId: '1398201557635567636',
    roleId2: '1520680047038435358'
  },
  'atf': {
    name: 'ATF (Anti Terrorism Force)',
    webhook: process.env.WEBHOOK_REPORT_ATF,
    emoji: '💥',
    roleId: '1520680054731051159',
    roleId2: '1398201048598057041'
  },
  'af': {
    name: 'AF (Air Force)',
    webhook: process.env.WEBHOOK_REPORT_AF,
    emoji: '✈️',
    roleId: '1398200952602755103',
    roleId2: '1532529633088635041'
  },
  'ocu': {
    name: 'OCU (Organized Crime Unit)',
    webhook: process.env.WEBHOOK_REPORT_OCU,
    emoji: '⚖️',
    roleId: '1520680060808331294',
    roleId2: '1418771091291115631'
  },
  'dea': {
    name: 'DEA (Drug Enforcement Administration)',
    webhook: process.env.WEBHOOK_REPORT_DEA,
    emoji: '💊',
    roleId: '1398201115379761283',
    roleId2: '1274110499356934209'
  },
  'fna': {
    name: 'FNA (Federal National Academy)',
    webhook: process.env.WEBHOOK_REPORT_FNA,
    emoji: '📚',
    roleId: '1520680066445742232',
    roleId2: '1385530645186613311'
  },
  'nsb': {
    name: 'NSB (National Security Branch)',
    webhook: process.env.WEBHOOK_REPORT_NSB,
    emoji: '🏛️',
    roleId: '1520680069415174275',
    roleId2: '1398201167154122752'
  },
  'trainee': {
    name: 'Trainee (Стажёр)',
    webhook: process.env.WEBHOOK_REPORT_TRAINEE,
    emoji: '📖',
    roleId: '1385530645186613311',
    roleId2: '1520680066445742232'
  }
};

const TRANSFER_WEBHOOKS = {
  'cid': process.env.WEBHOOK_TRANSFER_CID,
  'fa': process.env.WEBHOOK_TRANSFER_FA,
  'hrt': process.env.WEBHOOK_TRANSFER_HRT,
  'atf': process.env.WEBHOOK_TRANSFER_ATF,
  'af': process.env.WEBHOOK_TRANSFER_AF,
  'ocu': process.env.WEBHOOK_TRANSFER_OCU,
  'dea': process.env.WEBHOOK_TRANSFER_DEA,
  'fna': process.env.WEBHOOK_TRANSFER_FNA,
  'nsb': process.env.WEBHOOK_TRANSFER_NSB
};

const webhooks = {
  promotion: process.env.WEBHOOK_PROMOTION,
  highrank: process.env.WEBHOOK_HIGH_RANK_REPORT,
  resignation: process.env.WEBHOOK_RESIGNATION,
  reinstatement: process.env.WEBHOOK_REINSTATEMENT,
  'transfer-to-fib': process.env.WEBHOOK_TRANSFER_TO_FIB,
  hiring: process.env.WEBHOOK_HIRING,
  'weapon-request': process.env.WEBHOOK_WEAPON_REQUEST,
  leave: process.env.WEBHOOK_LEAVE
};

async function sendToDiscord(webhookUrl, data, retries = 3) {
  let lastError = null;
  
  const url = data.thread_id ? `${webhookUrl}?thread_id=${data.thread_id}` : webhookUrl;
  const { thread_id, ...payload } = data;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) return { success: true, status: response.status };
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After')) || 5;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      const errorText = await response.text();
      return { success: false, status: response.status, error: errorText };
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  return { success: false, error: lastError?.message || 'Неизвестная ошибка' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🔒 Глобальный лимит запросов
  const GLOBAL_KEY = 'fib:global:requests';
  const GLOBAL_LOCK_KEY = 'fib:global:locked';
  
  const isLocked = await kv.get(GLOBAL_LOCK_KEY);
  if (isLocked) {
    const ttl = await kv.ttl(GLOBAL_LOCK_KEY);
    const minutes = Math.ceil((ttl || 3600) / 60);
    return res.status(429).json({ 
      error: `🚫 Сайт временно недоступен. Слишком много запросов. Подождите ${minutes} минут.` 
    });
  }
  
  const globalCount = await kv.get(GLOBAL_KEY);
  const newGlobalCount = globalCount ? parseInt(globalCount) + 1 : 1;
  
  if (newGlobalCount > 5) {
    await kv.set(GLOBAL_LOCK_KEY, '1', { ex: 3600 });
    await kv.del(GLOBAL_KEY);
    return res.status(429).json({ 
      error: '🚫 Сайт временно заблокирован на 1 час из-за большого количества запросов.' 
    });
  }
  
  await kv.set(GLOBAL_KEY, newGlobalCount, { ex: 20 });

  const token = req.cookies.token;
  const user = verifyToken(token);
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const ip = req.headers['x-vercel-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';

  if (await isBlacklisted(user.id, ip)) {
    return res.status(403).json({ 
      error: '⛔ Ваш доступ к системе заявок заблокирован. Обратитесь к администрации.' 
    });
  }

  const spamCheck = await checkSpam(user.id, ip);

  if (spamCheck.isSpam) {
    if (spamCheck.ban) {
      await addToBlacklist(user.id, user.username, spamCheck.reason, ip);
    }
    return res.status(429).json({ error: spamCheck.message });
  }

const { type, leaveType, ...formData } = req.body;
const department = formData.department;
const targetDepartment = formData.targetDepartment;

  const allText = Object.values(formData).filter(val => typeof val === 'string').join(' ');
  
  if (containsBadWords(allText)) {
    const foundWords = findAllBadWords(allText);
    const foundWord = findBadWord(allText);
    
    await sendBanWordAlert(user, foundWord || foundWords.join(', '), allText, type, req);
    await addToBlacklist(user.id, user.username, `Банворд: ${foundWord || foundWords.join(', ')}`, ip);
    
    return res.status(403).json({ 
      error: `⛔ Ваша заявка содержит запрещённое слово. Доступ к системе заблокирован.` 
    });
  }

  let webhookUrl;
  let roleMentions = '';
  let threadId = null;

  if (type === 'report') {
    const dept = DEPARTMENTS[department];
    if (!dept) return res.status(400).json({ error: 'Выберите корректный отдел для отчёта' });
    webhookUrl = dept.webhook;
    if (!webhookUrl) return res.status(500).json({ error: `Вебхук для отдела "${dept.name}" не настроен` });
    if (dept.roleId) roleMentions += `<@&${dept.roleId}> `;
    if (dept.roleId2) roleMentions += `<@&${dept.roleId2}>`;
  } else if (type === 'transfer') {
    const deptKey = targetDepartment;
    if (!deptKey || !TRANSFER_WEBHOOKS[deptKey]) return res.status(400).json({ error: 'Некорректный отдел для перевода' });
    webhookUrl = TRANSFER_WEBHOOKS[deptKey];
    if (!webhookUrl) return res.status(500).json({ error: `Вебхук для перевода в отдел "${targetDepartment}" не настроен` });
    const deptInfo = DEPARTMENTS[targetDepartment];
    if (deptInfo?.roleId) roleMentions += `<@&${deptInfo.roleId}> `;
    if (deptInfo?.roleId2) roleMentions += `<@&${deptInfo.roleId2}>`;
  } else if (type === 'highrank') {
    webhookUrl = webhooks.highrank;
    if (!webhookUrl) return res.status(500).json({ error: 'Вебхук для Хай Рангов не настроен' });
    roleMentions = '<@&1289343511354671125>';
  } else if (type === 'resignation') {
    webhookUrl = webhooks.resignation;
    if (!webhookUrl) return res.status(500).json({ error: 'Вебхук для увольнений не настроен' });
    roleMentions = '<@&1274110499356934211>';
  } else if (type === 'reinstatement') {
    webhookUrl = webhooks.reinstatement;
    if (!webhookUrl) return res.status(500).json({ error: 'Вебхук для восстановления не настроен' });
    roleMentions = '<@&1274110499377778755> <@&1289343511354671125>';
  } else if (type === 'transfer-to-fib') {
    webhookUrl = webhooks['transfer-to-fib'];
    if (!webhookUrl) return res.status(500).json({ error: 'Вебхук для перевода в FIB не настроен' });
    roleMentions = '<@&1274110499377778755> <@&1289343511354671125>';
  } else if (type === 'hiring') {
    webhookUrl = webhooks.hiring;
    if (!webhookUrl) return res.status(500).json({ error: 'Вебхук для трудоустройства не настроен' });
    roleMentions = '<@&1274110499377778755>';
  } else if (type === 'weapon-request') {
    webhookUrl = webhooks['weapon-request'];
    if (!webhookUrl) return res.status(500).json({ error: 'Вебхук для запроса вооружения не настроен' });
    roleMentions = '<@&1274110499356934211>';
  } else if (type === 'leave') {
    webhookUrl = webhooks.leave;
    if (!webhookUrl) return res.status(500).json({ error: 'Вебхук для отпусков не настроен' });
    const deptInfo = DEPARTMENTS[formData.department];
    if (deptInfo?.roleId) roleMentions += `<@&${deptInfo.roleId}> `;
    if (deptInfo?.roleId2) roleMentions += `<@&${deptInfo.roleId2}>`;
    threadId = leaveType === 'ooc' ? '1479656377994580060' : '1479695882302787624';
  } else {
    webhookUrl = webhooks.promotion;
    if (!webhookUrl) return res.status(400).json({ error: 'Invalid form type' });
    roleMentions = '<@&1274110499356934211>';
  }

  // 🔒 Финальная проверка IP перед отправкой
  const ipKey = `fib:spam:ip:${ip}`;
  const ipCount = await kv.get(ipKey);
  if (ipCount && parseInt(ipCount) >= 5) {
    return res.status(429).json({ error: '🚫 С вашего IP слишком много заявок. Отправка заблокирована.' });
  }

  const embed = {
    title: getFormTitle(type, department, targetDepartment, leaveType),
    color: getFormColor(type),
    author: {
      name: user.username,
      icon_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    },
    fields: buildFields(type, department, targetDepartment, formData, leaveType, user.id, user.username),
    footer: { text: 'Majestic FIB Forms • ' + new Date().toLocaleDateString('ru-RU') },
    timestamp: new Date().toISOString()
  };

  const content = roleMentions.trim() || undefined;

  const result = await sendToDiscord(webhookUrl, {
    content,
    embeds: [embed],
    username: 'Majestic FIB Forms',
    avatar_url: 'https://i.imgur.com/AfFp7pu.png',
    ...(threadId ? { thread_id: threadId } : {})
  });

  if (result.success) {
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ error: `Не удалось отправить заявку: ${result.error}` });
  }
}

function getFormTitle(type, department, targetDepartment, leaveType) {
  if (type === 'report') {
    const dept = DEPARTMENTS[department];
    return `📋 Отчёт о повышении • ${dept ? dept.emoji + ' ' + dept.name : 'Отдел'}`;
  }
  if (type === 'transfer') {
    const deptNames = { 'cid': 'CID', 'fa': 'FA', 'hrt': 'HRT', 'atf': 'ATF', 'af': 'AF', 'ocu': 'OCU', 'dea': 'DEA', 'fna': 'FNA', 'nsb': 'NSB' };
    return `🔄 Запрос на перевод в ${deptNames[targetDepartment] || 'Отдел'}`;
  }
  if (type === 'highrank') return '📈 Отчёт на повышение (Хай Ранги)';
  if (type === 'resignation') return '📋 Заявление на увольнение';
  if (type === 'reinstatement') return '🔄 Восстановление в FIB';
  if (type === 'transfer-to-fib') return '🏛️ Перевод в FIB';
  if (type === 'hiring') return '📝 Трудоустройство в FIB';
  if (type === 'weapon-request') return '🔫 Запрос на спец вооружение';
  if (type === 'leave') return `🏖️ ${leaveType === 'ooc' ? 'OOC' : 'IC'} Отпуск`;
  return '📈 Запрос на повышение';
}

function getFormColor(type) {
  const colors = { 
    promotion: 0x4CAF50, 
    transfer: 0x2196F3, 
    report: 0xFF9800, 
    highrank: 0xFF69B4, 
    resignation: 0xDC3545, 
    reinstatement: 0x9C27B0, 
    'transfer-to-fib': 0x00BCD4,
    hiring: 0x4CAF50,
    'weapon-request': 0xFF5722,
    leave: 0x00BCD4
  };
  return colors[type] || 0x5865F2;
}

function buildFields(type, department, targetDepartment, data, leaveType, userId, username) {
  const baseFields = [
    { name: '👤 Отправитель', value: `<@${userId}>`, inline: true },
    { name: '🆔 Discord ID', value: userId, inline: true }
  ];

  if (type === 'report') {
    const dept = DEPARTMENTS[department];
    return [
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '🏢 Отдел', value: dept ? dept.emoji + ' ' + dept.name : 'Не указан', inline: false },
      { name: '📌 Текущий ранг', value: data.currentRank || 'Не указан', inline: false },
      { name: '🎯 Целевой ранг', value: data.targetRank || 'Не указан', inline: false },
      { name: '👨‍🏫 Инструктор', value: data.isInstructor === 'yes' ? '✅ Да' : '❌ Нет', inline: false },
      { name: '🔗 Ссылки на работу', value: data.workLinks || 'Не указаны', inline: false },
      ...baseFields
    ];
  }

  if (type === 'promotion') {
    return [
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '📊 Диапазон рангов', value: data.rankRange || 'Не указано', inline: false },
      { name: '🔗 Ссылка на отчет', value: data.reportLink || 'Не указано', inline: false },
      ...baseFields
    ];
  }

  if (type === 'highrank') {
    return [
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '📊 Диапазон рангов', value: data.rankRange || 'Не указано', inline: false },
      { name: '🔗 Ссылка на работу', value: data.workLink || 'Не указано', inline: false },
      ...baseFields
    ];
  }

  if (type === 'resignation') {
    return [
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '📸 Скриншот планшета', value: data.screenshot || 'Не указано', inline: false },
      ...baseFields
    ];
  }

  if (type === 'reinstatement') {
    return [
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '📌 Ранг на момент увольнения', value: data.rankAtDismissal || 'Не указан', inline: false },
      { name: '📸 Доказательство ранга', value: data.rankProof || 'Не указано', inline: false },
      { name: '⚠️ Уволен после Ban/Warn', value: data.wasWarned === 'yes' ? '✅ Да' : '❌ Нет', inline: false },
      ...(data.wasWarned === 'yes' ? [{ name: '📄 Скрин одобрения State Fractions', value: data.stateFractionsProof || 'Не указано', inline: false }] : []),
      ...baseFields
    ];
  }

  if (type === 'transfer-to-fib') {
    return [
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '✅ Одобрение от начальства', value: data.approvalProof || 'Не указано', inline: false },
      { name: '📸 Доказательство ранга', value: data.rankProof || 'Не указано', inline: false },
      ...baseFields
    ];
  }

  if (type === 'hiring') {
    return [
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '🎂 Возраст (RP)', value: data.age || 'Не указан', inline: false },
      { name: '💼 Опыт работы', value: data.experience || 'Не указан', inline: false },
      { name: '📚 Знание законов RP', value: (data.lawKnowledge || '?') + '/10', inline: false },
      { name: '🪪 Скриншот паспорта', value: data.passport || 'Не указано', inline: false },
      { name: '🎖️ Военный билет', value: data.militaryId || 'Не указано', inline: false },
      { name: '🏥 Мед. справки', value: data.medical || 'Не указано', inline: false },
      ...baseFields
    ];
  }

  if (type === 'weapon-request') {
    return [
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '🏢 Отдел', value: data.department || 'Не указан', inline: false },
      { name: '📌 Ранг', value: data.rank || 'Не указан', inline: false },
      { name: '🔫 Оружие', value: data.weapon || 'Не указано', inline: false },
      ...baseFields
    ];
  }

  if (type === 'leave') {
    return [
      { name: '📋 Тип отпуска', value: leaveType === 'ooc' ? '🌍 OOC' : '🎮 IC', inline: false },
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '🏢 Отдел', value: data.department || 'Не указан', inline: false },
      { name: '📝 Причина', value: data.reason || 'Не указано', inline: false },
      { name: '📅 Дата начала', value: data.startDate || 'Не указано', inline: true },
      { name: '📅 Дата окончания', value: data.endDate || 'Не указано', inline: true },
      ...baseFields
    ];
  }

  if (type === 'transfer') {
    const fields = [
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '📌 Ваш ранг', value: data.rank || 'Не указан', inline: false },
      { name: '🏢 Текущий отдел', value: data.currentDepartment || 'Не указано', inline: false },
      { name: '🎯 Желаемый отдел', value: targetDepartment || 'Не указано', inline: false },
      { name: '📝 Причина перевода', value: data.reason || 'Не указано', inline: false }
    ];

    if (targetDepartment === 'cid') {
      fields.push(
        { name: '📋 Чем занимается CID/DB?', value: data.cidWhatIs || 'Не указано', inline: false },
        { name: '📋 Опыт работы в CID/DB?', value: data.cidExperience || 'Не указано', inline: false },
        { name: '📋 Примеры работ', value: data.cidExamples || 'Не указано', inline: false },
        { name: '📋 Серверы с CID/DB', value: data.cidServers || 'Не указано', inline: false },
        { name: '📋 Знания по работе CID (1-10)', value: data.cidKnowledge || 'Не указано', inline: false },
        { name: '📋 Знания по законке (1-10)', value: data.cidLawKnowledge || 'Не указано', inline: false }
      );
    }

    if (targetDepartment === 'fa') {
      fields.push(
        { name: '📋 Знание правил ПОИП', value: data.faRules || 'Не указано', inline: false },
        { name: '📋 Был ли в FA раньше', value: data.faPrevious || 'Не указано', inline: false }
      );
    }

    fields.push(...baseFields);
    return fields;
  }

  return [...baseFields, ...Object.entries(data).map(([key, value]) => ({ name: key, value: String(value) || 'Не указано', inline: false }))];
}

async function sendBanWordAlert(user, badWords, fullText, type, req) {
  const webhookUrl = process.env.WEBHOOK_BANWORDS || process.env.WEBHOOK_LOGS;
  if (!webhookUrl) return;

  const ip = req.headers['x-vercel-forwarded-for'] || req.headers['x-real-ip'] || 'неизвестен';

  const embed = {
    title: '🚨 ОБНАРУЖЕН БАНВОРД',
    color: 0xFF0000,
    author: { name: user.username, icon_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` },
    fields: [
      { name: '👤 Пользователь', value: `<@${user.id}>`, inline: true },
      { name: '🆔 Discord ID', value: user.id, inline: true },
      { name: '🌐 IP-адрес', value: ip, inline: true },
      { name: '📋 Тип заявки', value: type || 'неизвестен', inline: true },
      { name: '🚫 Запрещённое слово', value: `**${badWords}**`, inline: true },
      { name: '📝 Полный текст', value: `\`\`\`\n${fullText.slice(0, 1000)}\n\`\`\``, inline: false },
      { name: '📌 Действие', value: 'Пользователь автоматически добавлен в чёрный список', inline: false }
    ],
    footer: { text: 'Majestic FIB Forms • Система модерации' },
    timestamp: new Date().toISOString()
  };

  try {
    await sendToDiscord(webhookUrl, {
      content: '🚨 **Обнаружен банворд!**',
      embeds: [embed],
      username: 'FIB Модератор',
      avatar_url: 'https://i.imgur.com/AfFp7pu.png'
    });
  } catch (error) {
    console.error('Ошибка отправки уведомления о банворде:', error);
  }
}
