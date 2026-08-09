import { kv } from '@vercel/kv';

const HOURLY_LIMIT = 6;
const HOURLY_WINDOW = 7200;

const BURST_LIMIT = 10;
const BURST_WINDOW = 5;

const IP_LIMIT = 6;
const IP_WINDOW = 600;

export async function checkSpam(userId, ip) {
  const hourlyKey = `lscsd:spam:hourly:${userId}`;
  const burstKey = `lscsd:spam:burst:${userId}`;
  const ipKey = `lscsd:spam:ip:${ip || 'unknown'}`;
  
  try {
    if (ip && ip !== 'unknown') {
      const ipCount = await kv.get(ipKey);
      if (ipCount && parseInt(ipCount) >= IP_LIMIT) {
        return { isSpam: true, ban: true, reason: 'IP-бан', message: '🚫 С вашего IP слишком много заявок.' };
      }
    }

    const burstCount = await kv.get(burstKey);
    if (burstCount && parseInt(burstCount) >= BURST_LIMIT) {
      return { isSpam: true, ban: true, reason: 'Спам-атака', message: '🚫 Обнаружена спам-атака!' };
    }

    const hourlyCount = await kv.get(hourlyKey);
    if (hourlyCount && parseInt(hourlyCount) >= HOURLY_LIMIT) {
      const ttl = await kv.ttl(hourlyKey);
      const minutes = Math.ceil((ttl || HOURLY_WINDOW) / 60);
      return { isSpam: true, ban: false, reason: 'Лимит заявок', message: `⏳ Лимит ${HOURLY_LIMIT} заявок. Подождите ${minutes} мин.` };
    }

    const newHourly = hourlyCount ? parseInt(hourlyCount) + 1 : 1;
    const newBurst = burstCount ? parseInt(burstCount) + 1 : 1;
    const newIp = ip && ip !== 'unknown' ? (await kv.get(ipKey) ? parseInt(await kv.get(ipKey)) + 1 : 1) : 1;

    await kv.set(hourlyKey, newHourly, { ex: HOURLY_WINDOW });
    await kv.set(burstKey, newBurst, { ex: BURST_WINDOW });
    if (ip && ip !== 'unknown') await kv.set(ipKey, newIp, { ex: IP_WINDOW });

    return { isSpam: false };
  } catch (error) {
    return { isSpam: false };
  }
}

export async function resetSpam(userId, ip) {
  try {
    await kv.del(`lscsd:spam:hourly:${userId}`);
    await kv.del(`lscsd:spam:burst:${userId}`);
    if (ip) await kv.del(`lscsd:spam:ip:${ip}`);
  } catch (error) {
    console.error('Ошибка сброса:', error);
  }
}
