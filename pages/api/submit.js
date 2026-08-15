import { verifyToken } from '../../lib/discord';
import { isBlacklisted, addToBlacklist } from '../../lib/blacklist';
import { containsBadWords, findBadWord, findAllBadWords } from '../../lib/badwords';
import { checkSpam } from '../../lib/antispam';
import { kv } from '@vercel/kv';

const WHITELIST = ['200102286473691139'];

const DEPARTMENTS = {
  'db': { name: 'DB', emoji: '🕵️', roleId: '1514608350837346334', roleId2: '1514689884437090505', webhook: process.env.WEBHOOK_REPORT_DB },
  'spd': { name: 'SPD', emoji: '🚔', roleId: '1514608350820827275', roleId2: '1514689954733887591', webhook: process.env.WEBHOOK_REPORT_SPD },
  'sai': { name: 'SAI', emoji: '🔍', roleId: '1514608350820827274', roleId2: '1514689909317697556', webhook: process.env.WEBHOOK_REPORT_SAI },
  'sa': { name: 'SA', emoji: '🎓', roleId: '1514608350820827274', roleId2: '1514689909317697556', webhook: process.env.WEBHOOK_REPORT_SA },
  'k9': { name: 'K9', emoji: '🐕', roleId: '1514967189910847658', roleId2: '1514967193924796638', webhook: process.env.WEBHOOK_REPORT_K9 },
  'seb': { name: 'SEB', emoji: '💥', roleId: '1514608350820827276', roleId2: '1514689757207073009', webhook: process.env.WEBHOOK_REPORT_SEB },
  'iad': { name: 'IAD', emoji: '⚖️', roleId: '1514608350820827277', roleId2: '1514689763389477064', webhook: process.env.WEBHOOK_REPORT_IAD },
  'af': { name: 'AF', emoji: '✈️', roleId: '1514967162677231698', roleId2: '1514967157526630491', webhook: process.env.WEBHOOK_REPORT_AF },
  'ted': { name: 'TED', emoji: '🔫', roleId: '1515284457932980264', roleId2: '1515159465584754799', webhook: process.env.WEBHOOK_REPORT_TED },
  'dvd': { name: 'DVD', emoji: '🚗', roleId: '1515297818276008006', roleId2: '1515159813212999710', webhook: process.env.WEBHOOK_REPORT_DVD },
  'srt': { name: 'SRT', emoji: '🛡️', roleId: '1515159492914970744', roleId2: '1515284451293139045', webhook: process.env.WEBHOOK_REPORT_SRT },
  'nred': { name: 'NRED', emoji: '🚨', roleId: '1515284451989651506', roleId2: '1515159866639913160', webhook: process.env.WEBHOOK_REPORT_NRED },
  'med': { name: 'MED', emoji: '🏥', roleId: '1515284458360672256', roleId2: '1515159560577355848', webhook: process.env.WEBHOOK_REPORT_MED },
  'halt': { name: 'HALT', emoji: '🚁', roleId: '1515284438886514810', roleId2: '1515159846935203870', webhook: process.env.WEBHOOK_REPORT_HALT }
};

const TRANSFER_WEBHOOKS = {
  'db': process.env.WEBHOOK_TRANSFER_DB, 'spd': process.env.WEBHOOK_TRANSFER_SPD,
  'sai': process.env.WEBHOOK_TRANSFER_SAI, 'k9': process.env.WEBHOOK_TRANSFER_K9,
  'seb': process.env.WEBHOOK_TRANSFER_SEB, 'iad': process.env.WEBHOOK_TRANSFER_IAD,
  'af': process.env.WEBHOOK_TRANSFER_AF, 'ted': process.env.WEBHOOK_TRANSFER_TED,
  'dvd': process.env.WEBHOOK_TRANSFER_DVD, 'srt': process.env.WEBHOOK_TRANSFER_SRT,
  'nred': process.env.WEBHOOK_TRANSFER_NRED, 'med': process.env.WEBHOOK_TRANSFER_MED,
  'halt': process.env.WEBHOOK_TRANSFER_HALT
};

const webhooks = {
  promotion: process.env.WEBHOOK_PROMOTION,
  highrank: process.env.WEBHOOK_HIGH_RANK_REPORT,
  resignation: process.env.WEBHOOK_RESIGNATION,
  reinstatement: process.env.WEBHOOK_REINSTATEMENT,
  'transfer-to-lscsd': process.env.WEBHOOK_TRANSFER_TO_LSCSD,
  hiring: process.env.WEBHOOK_HIRING,
  'weapon-request': process.env.WEBHOOK_WEAPON_REQUEST,
  leave: process.env.WEBHOOK_LEAVE
};

async function sendToDiscord(webhookUrl, data, retries = 3) {
  let lastError = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) return { success: true };
      if (res.status === 429) { await new Promise(r => setTimeout(r, (parseInt(res.headers.get('Retry-After')) || 5) * 1000)); continue; }
      return { success: false, error: await res.text() };
    } catch (e) { lastError = e; if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1))); }
  }
  return { success: false, error: lastError?.message };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req.cookies.token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const ip = req.headers['x-vercel-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const isWhitelisted = WHITELIST.includes(user.id);

  if (!isWhitelisted) {
    const isLocked = await kv.get('lscsd:global:locked');
    if (isLocked) { const ttl = await kv.ttl('lscsd:global:locked'); return res.status(429).json({ error: `🚫 Сайт заблокирован. Подождите ${Math.ceil((ttl||1800)/60)} мин.` }); }
    const gc = await kv.get('lscsd:global:requests');
    const ngc = gc ? parseInt(gc) + 1 : 1;
    if (ngc > 10) { await kv.set('lscsd:global:locked', '1', { ex: 1800 }); await kv.del('lscsd:global:requests'); return res.status(429).json({ error: '🚫 Сайт заблокирован на 30 минут.' }); }
    await kv.set('lscsd:global:requests', ngc, { ex: 20 });

    if (await isBlacklisted(user.id, ip)) return res.status(403).json({ error: '⛔ Вы заблокированы.' });

    const spamCheck = await checkSpam(user.id, ip);
    if (spamCheck.isSpam) { if (spamCheck.ban) await addToBlacklist(user.id, user.username, spamCheck.reason, ip); return res.status(429).json({ error: spamCheck.message }); }
  }

  const { type, leaveType, ...formData } = req.body;
  const department = formData.department;
  const targetDepartment = formData.targetDepartment;

  const allText = Object.values(formData).filter(v => typeof v === 'string').join(' ');

  // Банворды без бана + указание поля
  if (!isWhitelisted && containsBadWords(allText)) {
    const foundWord = findBadWord(allText);
    
    const fieldNames = {
      fullName: 'Имя Фамилия + Статик', age: 'Возраст', experience: 'Опыт работы',
      lawKnowledge: 'Знание законов', passport: 'Скриншот паспорта', militaryId: 'Военный билет',
      medical: 'Мед. справки', reason: 'Причина', rank: 'Ранг', weapon: 'Оружие',
      currentDepartment: 'Текущий отдел', targetDepartment: 'Желаемый отдел',
      startDate: 'Дата начала', endDate: 'Дата окончания', rankRange: 'Диапазон рангов',
      reportLink: 'Ссылка на отчет', workLink: 'Ссылка на работу', workLinks: 'Ссылки на работу',
      screenshot: 'Скриншот', rankProof: 'Доказательство ранга', approvalProof: 'Одобрение',
      stateFractionsProof: 'Скрин одобрения', rankAtDismissal: 'Ранг при увольнении',
      dbWhatIs: 'Что такое DB', dbExperience: 'Опыт в DB', dbExamples: 'Примеры работ',
      dbServers: 'Серверы с DB', dbKnowledge: 'Знания DB', dbLawKnowledge: 'Знания законки'
    };

    let fieldName = 'заявке';
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string' && value.toLowerCase().includes(foundWord.toLowerCase())) {
        fieldName = fieldNames[key] || key;
        break;
      }
    }

    await sendBanWordAlert(user, foundWord, allText, type, req);
    return res.status(400).json({ 
      error: `❌ В поле "${fieldName}" найдено запрещённое слово: "${foundWord}". Форма не отправлена.` 
    });
  }

  let webhookUrl, roleMentions = '';

  if (type === 'report') {
    const dept = DEPARTMENTS[department];
    if (!dept) return res.status(400).json({ error: 'Выберите отдел' });
    webhookUrl = dept.webhook; if (!webhookUrl) return res.status(500).json({ error: 'Вебхук не настроен' });
    if (dept.roleId) roleMentions += `<@&${dept.roleId}> `; if (dept.roleId2) roleMentions += `<@&${dept.roleId2}>`;
  } else if (type === 'transfer') {
    webhookUrl = TRANSFER_WEBHOOKS[targetDepartment]; if (!webhookUrl) return res.status(500).json({ error: 'Вебхук не настроен' });
    const di = DEPARTMENTS[targetDepartment];
    if (di?.roleId) roleMentions += `<@&${di.roleId}> `;
    if (di?.roleId2) roleMentions += `<@&${di.roleId2}>`;
  } else if (type === 'highrank') { webhookUrl = webhooks.highrank; roleMentions = '<@&1525425998370177074> <@&1514608350837346338>'; }
  else if (type === 'resignation') { webhookUrl = webhooks.resignation; roleMentions = '<@&1514608350820827273>'; }
  else if (type === 'reinstatement') { webhookUrl = webhooks.reinstatement; roleMentions = '<@&1514608350820827273>'; }
  else if (type === 'transfer-to-lscsd') { webhookUrl = webhooks['transfer-to-lscsd']; roleMentions = '<@&1525425998370177074> <@&1514608350837346338>'; }
  else if (type === 'hiring') { webhookUrl = webhooks.hiring; roleMentions = '<@&1514608350820827274> <@&1514689909317697556>'; }
  else if (type === 'weapon-request') { webhookUrl = webhooks['weapon-request']; roleMentions = '<@&1525425998370177074> <@&1514733249409060876>'; }
  else if (type === 'leave') {
    webhookUrl = webhooks.leave;
    const di = DEPARTMENTS[department];
    if (di?.roleId) roleMentions += `<@&${di.roleId}> `; if (di?.roleId2) roleMentions += `<@&${di.roleId2}>`;
  } else { webhookUrl = webhooks.promotion; roleMentions = '<@&1514608350820827273>'; }
  if (!webhookUrl) return res.status(500).json({ error: 'Вебхук не настроен' });

  if (!isWhitelisted) {
    const ipCount = await kv.get(`lscsd:spam:ip:${ip}`);
    if (ipCount && parseInt(ipCount) >= 5) return res.status(429).json({ error: '🚫 Слишком много с IP.' });
  }

  const embed = {
    title: getFormTitle(type, department, targetDepartment, leaveType),
    color: getFormColor(type),
    author: { name: user.username, icon_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` },
    fields: buildFields(type, department, targetDepartment, formData, leaveType, user.id),
    footer: { text: 'LSCSD Forms • ' + new Date().toLocaleDateString('ru-RU') },
    timestamp: new Date().toISOString()
  };

  const result = await sendToDiscord(webhookUrl, { content: roleMentions.trim() || undefined, embeds: [embed], username: 'LSCSD Forms', avatar_url: 'https://i.imgur.com/AfFp7pu.png' });

  if (result.success) {
    const today = new Date().toISOString().split('T')[0];
    await kv.incr('lscsd:stats:total');
    await kv.incr(`lscsd:stats:${today}`);
    await kv.lpush(`lscsd:history:${user.id}`, JSON.stringify({ type, title: embed.title, date: new Date().toISOString(), id: Date.now().toString(36) }));
    await kv.ltrim(`lscsd:history:${user.id}`, 0, 49);
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ error: `Не удалось отправить: ${result.error}` });
  }
}

function getFormTitle(type, department, targetDepartment, leaveType) {
  if (type === 'report') { const d = DEPARTMENTS[department]; return `📋 Отчёт о повышении • ${d ? d.emoji + ' ' + d.name : 'Отдел'}`; }
  if (type === 'transfer') { const n = { db:'DB',spd:'SPD',sai:'SAI',k9:'K9',seb:'SEB',iad:'IAD',af:'AF',ted:'TED',dvd:'DVD',srt:'SRT',nred:'NRED',med:'MED',halt:'HALT' }; return `🔄 Запрос на перевод в ${n[targetDepartment]||'Отдел'}`; }
  if (type === 'highrank') return '🌟 Отчёт на повышение (Хай Ранги)';
  if (type === 'resignation') return '🚪 Заявление на увольнение';
  if (type === 'reinstatement') return '🔄 Восстановление в LSCSD';
  if (type === 'transfer-to-lscsd') return '🏛️ Перевод в LSCSD';
  if (type === 'hiring') return '📝 Трудоустройство в LSCSD';
  if (type === 'weapon-request') return '🔫 Запрос на спец вооружение';
  if (type === 'leave') return `🏖️ ${leaveType === 'ooc' ? 'OOC' : 'IC'} Отпуск`;
  return '📈 Запрос на повышение';
}

function getFormColor(type) {
  const c = { promotion:0x4CAF50, transfer:0x2196F3, report:0xFF9800, highrank:0xFF69B4, resignation:0xDC3545, reinstatement:0x9C27B0, 'transfer-to-lscsd':0x00BCD4, hiring:0x4CAF50, 'weapon-request':0xFF5722, leave:0x00BCD4 };
  return c[type] || 0x5865F2;
}

function buildFields(type, department, targetDepartment, data, leaveType, userId) {
  const base = [
    { name: '👤 Отправитель', value: `<@${userId}>`, inline: true },
    { name: '🆔 Discord ID', value: userId, inline: true }
  ];

  if (type === 'leave') {
    const d = DEPARTMENTS[department];
    return [
      { name: '📋 Тип отпуска', value: leaveType === 'ooc' ? '🌍 OOC' : '🎮 IC', inline: false },
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '🏢 Отдел', value: d ? d.emoji + ' ' + d.name : (department || 'Не указан'), inline: false },
      { name: '📝 Причина отпуска', value: data.reason || 'Не указано', inline: false },
      { name: '📅 Дата начала', value: data.startDate || 'Не указано', inline: true },
      { name: '📅 Дата окончания', value: data.endDate || 'Не указано', inline: true },
      ...base
    ];
  }

  if (type === 'report') {
    const d = DEPARTMENTS[department];
    return [
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '🏢 Отдел', value: d ? d.emoji + ' ' + d.name : 'Не указан', inline: false },
      { name: '📌 Текущий ранг', value: data.currentRank || 'Не указан', inline: false },
      { name: '🎯 Целевой ранг', value: data.targetRank || 'Не указан', inline: false },
      { name: '👨‍🏫 Инструктор', value: data.isInstructor === 'yes' ? '✅ Да' : '❌ Нет', inline: false },
      { name: '🔗 Ссылки на работу', value: data.workLinks || 'Не указаны', inline: false },
      ...base
    ];
  }

  if (type === 'promotion') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '📊 Диапазон рангов', value: data.rankRange || 'Не указано', inline: false },
    { name: '🔗 Ссылка на отчет', value: data.reportLink || 'Не указано', inline: false },
    ...base
  ];

  if (type === 'highrank') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '📊 Диапазон рангов', value: data.rankRange || 'Не указано', inline: false },
    { name: '🔗 Ссылка на работу', value: data.workLink || 'Не указано', inline: false },
    ...base
  ];

  if (type === 'resignation') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '📸 Скриншот планшета', value: data.screenshot || 'Не указано', inline: false },
    ...base
  ];

  if (type === 'reinstatement') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '📌 Ранг на момент увольнения', value: data.rankAtDismissal || 'Не указан', inline: false },
    { name: '📸 Доказательство ранга', value: data.rankProof || 'Не указано', inline: false },
    { name: '⚠️ Уволен после Ban/Warn', value: data.wasWarned === 'yes' ? '✅ Да' : '❌ Нет', inline: false },
    ...(data.wasWarned === 'yes' ? [{ name: '📄 Скрин одобрения State Fractions', value: data.stateFractionsProof || 'Не указано', inline: false }] : []),
    ...base
  ];

  if (type === 'transfer-to-lscsd') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '✅ Одобрение перевода от начальства', value: data.approvalProof || 'Не указано', inline: false },
    { name: '📸 Доказательство ранга', value: data.rankProof || 'Не указано', inline: false },
    ...base
  ];

  if (type === 'hiring') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '🎂 Возраст (RP)', value: data.age || 'Не указан', inline: false },
    { name: '💼 Опыт работы в гос. структурах', value: data.experience || 'Не указан', inline: false },
    { name: '📚 Знание законов RP', value: (data.lawKnowledge||'?') + '/10', inline: false },
    { name: '🪪 Скриншот паспорта', value: data.passport || 'Не указано', inline: false },
    { name: '🎖️ Скриншот военного билета', value: data.militaryId || 'Не указано', inline: false },
    { name: '🏥 Скриншот мед. справок', value: data.medical || 'Не указано', inline: false },
    ...base
  ];

  if (type === 'weapon-request') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '🏢 Отдел', value: data.department || 'Не указан', inline: false },
    { name: '📌 Ранг', value: data.rank || 'Не указан', inline: false },
    { name: '🔫 Запрашиваемое оружие', value: data.weapon || 'Не указано', inline: false },
    ...base
  ];

  if (type === 'transfer') {
    const f = [
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '📌 Ваш ранг', value: data.rank || 'Не указан', inline: false },
      { name: '🏢 Текущий отдел', value: data.currentDepartment || 'Не указано', inline: false },
      { name: '🎯 Желаемый отдел', value: targetDepartment || 'Не указано', inline: false },
      { name: '📝 Причина перевода', value: data.reason || 'Не указано', inline: false }
    ];
    if (targetDepartment === 'db') f.push(
      { name: '📋 Чем занимается DB?', value: data.dbWhatIs || 'Не указано', inline: false },
      { name: '📋 Опыт работы в DB?', value: data.dbExperience || 'Не указано', inline: false },
      { name: '📋 Примеры работ', value: data.dbExamples || 'Не указано', inline: false },
      { name: '📋 Серверы с DB', value: data.dbServers || 'Не указано', inline: false },
      { name: '📋 Знания по работе DB (1-10)', value: (data.dbKnowledge||'?') + '/10', inline: false },
      { name: '📋 Знания по законке (1-10)', value: (data.dbLawKnowledge||'?') + '/10', inline: false }
    );
    f.push(...base); return f;
  }

  return [...base, ...Object.entries(data).map(([k,v]) => ({ name: k, value: String(v) || 'Не указано', inline: false }))];
}

async function sendBanWordAlert(user, badWords, fullText, type, req) {
  const wh = process.env.WEBHOOK_BANWORDS || process.env.WEBHOOK_LOGS;
  if (!wh) return;
  const ip = req.headers['x-vercel-forwarded-for'] || req.headers['x-real-ip'] || '?';
  await sendToDiscord(wh, {
    content: '🚨 Банворд (без бана)!',
    embeds: [{
      title: '🚨 БАНВОРД', color: 0xFF0000,
      author: { name: user.username, icon_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` },
      fields: [
        { name: '👤', value: `<@${user.id}>`, inline: true }, { name: '🆔', value: user.id, inline: true },
        { name: '🌐 IP', value: ip, inline: true }, { name: '📋 Тип', value: type || '?', inline: true },
        { name: '🚫 Слово', value: `**${badWords}**`, inline: true },
        { name: '📝 Текст', value: `\`\`\`\n${fullText.slice(0,1000)}\n\`\`\``, inline: false },
        { name: '📌 Действие', value: 'Форма не отправлена. Бан не выдан.', inline: false }
      ],
      footer: { text: 'Модерация' }, timestamp: new Date().toISOString()
    }],
    username: 'LSCSD Модератор', avatar_url: 'https://i.imgur.com/AfFp7pu.png'
  });
}
