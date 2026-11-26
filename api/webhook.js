import * as line from '@line/bot-sdk';
import admin from 'firebase-admin';

export const config = {
  api: {
    bodyParser: false,
  },
};

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const channelSecret = process.env.LINE_CHANNEL_SECRET;
const channelAccessToken = process.env.LINE_ACCESS_TOKEN;
const client = new line.messagingApi.MessagingApiClient({ channelAccessToken });

// 25 隻動態首領完整設定表
const BOSS_CONFIGS = [
  { name: '野豬', aliases: ['野豬', '尼', 'P'], offset: 0, normal: 240, half: 120 },
  { name: '夫人', aliases: ['夫人', '夫', 'M'], offset: 0, normal: 240, half: 120 },
  { name: '飛龍3', aliases: ['飛龍3', '3'], offset: 40, normal: 240, half: 120 },
  { name: '飛龍4', aliases: ['飛龍4', '4'], offset: 40, normal: 240, half: 120 },
  { name: '卡王', aliases: ['卡王', '卡', 'K'], offset: 60, normal: 240, half: 120 },
  { name: '大腳', aliases: ['大腳', '大', 'F'], offset: 90, normal: 240, half: 120 },
  { name: '黑虎', aliases: ['黑虎', '黑', 'T'], offset: 120, normal: 240, half: 120 },
  { name: '海賊', aliases: ['海賊', '海', 'S'], offset: 130, normal: 240, half: 120 },
  { name: '茉莉', aliases: ['茉莉', '茉', '腿'], offset: 150, normal: 240, half: 120 },
  { name: '奧杜亞', aliases: ['奧杜亞', '奧', 'O'], offset: 150, normal: 240, half: 120 },
  { name: '飛龍1', aliases: ['飛龍1', '1'], offset: 160, normal: 240, half: 120 },
  { name: '飛龍2', aliases: ['飛龍2', '2'], offset: 160, normal: 240, half: 120 },
  { name: '殺戮者', aliases: ['殺戮者', '殺', '胖'], offset: 190, normal: 240, half: 120 },
  { name: '麥肯', aliases: ['麥肯', '麥', '12'], offset: 210, normal: 240, half: 120 },
  { name: '蜥蜴', aliases: ['蜥蜴', '西', 'C'], offset: 220, normal: 240, half: 120 },
  { name: '巨人', aliases: ['巨人', '巨', '22'], offset: 270, normal: 720, half: 360 },
  { name: '奈克', aliases: ['奈克', '奈', 'N'], offset: 270, normal: 480, half: 240 },
  { name: '烏勒', aliases: ['烏勒', '烏', '56'], offset: 270, normal: 480, half: 240 },
  { name: '库約', aliases: ['库約', '庫約', '庫'], offset: 280, normal: 240, half: 120 },
  { name: '蛇女', aliases: ['蛇女', '蛇', '123'], offset: 300, normal: 480, half: 240 },
  { name: '狼王', aliases: ['狼王', '狼', 'W'], offset: 310, normal: 480, half: 240 },
  { name: '四色', aliases: ['四色', '四', '4P'], offset: 330, normal: 720, half: 720 },
  { name: '頭目', aliases: ['頭目', '頭', 'B'], offset: 340, normal: 480, half: 240 },
  { name: '克洛林', aliases: ['克洛林', '克', '6'], offset: 360, normal: 480, half: 480 },
  { name: '鱷魚', aliases: ['鱷魚', '惡', 'L'], offset: 370, normal: 480, half: 240 },
];

// 固定時間王設定表 (0=週日, 1=週一, ..., 6=週六)
const FIXED_SCHEDULE = {
  0: [
    { hour: 18, min: 0, names: ['克特', '阿勒尼亞'] },
    { hour: 18, min: 15, names: ['巫師', '變怪'] },
    { hour: 18, min: 30, names: ['卡爾圖蘭(大花草)'] },
  ],
  1: [
    { hour: 18, min: 0, names: ['克特', '阿勒尼亞'] },
    { hour: 18, min: 15, names: ['巫師', '變怪'] },
    { hour: 18, min: 30, names: ['死亡(炎魔五樓)', '巨蟻女王'] },
  ],
  2: [
    { hour: 18, min: 0, names: ['克特', '阿勒尼亞'] },
    { hour: 18, min: 15, names: ['巫師', '變怪'] },
    { hour: 18, min: 30, names: ['古拉(火焰五樓)', '巨蟻女王'] },
  ],
  3: [
    { hour: 18, min: 0, names: ['克特', '阿勒尼亞'] },
    { hour: 18, min: 15, names: ['巫師', '變怪'] },
    { hour: 18, min: 30, names: ['死亡(炎魔)', '巨蟻女王'] },
  ],
  4: [
    { hour: 18, min: 0, names: ['克特', '阿勒尼亞'] },
    { hour: 18, min: 15, names: ['巫師', '變怪'] },
    { hour: 18, min: 30, names: ['古拉(火焰五樓)', '巨蟻女王'] },
  ],
  5: [
    { hour: 18, min: 0, names: ['克特', '阿勒尼亞'] },
    { hour: 18, min: 15, names: ['巫師', '變怪'] },
    { hour: 18, min: 30, names: ['墮落(火焰八樓)', '巨蟻女王'] },
  ],
  6: [
    { hour: 18, min: 0, names: ['克特', '阿勒尼亞'] },
    { hour: 18, min: 15, names: ['巫師', '變怪'] },
    { hour: 18, min: 30, names: ['惡魔(炎魔八樓)', '巨蟻女王'] },
  ],
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('LINE Boss Timer Bot is active.');
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers['x-line-signature'];

  if (!signature || !line.validateSignature(rawBody, channelSecret, signature)) {
    return res.status(401).send('Invalid signature');
  }

  const body = JSON.parse(rawBody);
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const webUrl = `https://${host}`;

  await Promise.all(body.events.map((event) => handleEvent(event, webUrl)));
  return res.status(200).json({ status: 'ok' });
}

async function handleEvent(event, webUrl) {
  if (event.type !== 'message' || event.message.type !== 'text') return null;

  const text = event.message.text.trim();
  const upperText = text.toUpperCase();
  const groupId = event.source.groupId || event.source.roomId || event.source.userId;
  const docRef = db.collection('groups').doc(groupId);
  const now = Date.now();

  // 1. RE 重置指令 (支援 "RE" 或 "RE 0900")
  const reMatch = upperText.match(/^RE(?:\s+(\d{2}:?\d{2}))?$/);
  if (reMatch) {
    const baseTs = reMatch[1] ? parseHHMMToTimestamp(reMatch[1], now) : now;
    const docSnap = await docRef.get();
    const isHalf = docSnap.exists ? Boolean(docSnap.data().isHalfEvent) : false;

    const bosses = {};
    for (const cfg of BOSS_CONFIGS) {
      bosses[cfg.name] = {
        nextSpawn: baseTs + cfg.offset * 60 * 1000,
        lastKill: null,
        missCount: 0,
      };
    }

    const replyMsg = `🔄 已重置所有首領時間（基準：${formatTime(baseTs)}）\n已依疊加時間推算完成，未登記次數已全部歸零。`;
    await Promise.all([
      docRef.set({
        isHalfEvent: isHalf,
        updatedAt: now,
        bosses,
      }),
      replyText(event.replyToken, replyMsg),
    ]);
    return null;
  }

  // 2. 網頁看板連結
  if (text === '網頁' || text === '看板') {
    return replyText(event.replyToken, `📊 首領重生即時倒數看板：\n${webUrl}/?group=${groupId}`);
  }

  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    if (
      upperText === 'KB' ||
      text === '時間減半' ||
      text === '重生減半' ||
      text === '正常重生' ||
      /^Z\s*/i.test(text)
    ) {
      return replyText(event.replyToken, '⚠️ 尚未建立王表資料，請先輸入 RE 進行開機重置。');
    }
    return null;
  }

  const data = docSnap.data();
  const isHalf = Boolean(data.isHalfEvent);
  const bosses = data.bosses || {};

  // 3. 切換減半 / 正常模式
  if (text === '時間減半' || text === '重生減半') {
    await Promise.all([
      docRef.update({ isHalfEvent: true }),
      replyText(event.replyToken, '🔥 已切換為【時間減半模式】！\n之後登記擊殺與過期自動疊加將套用減半時間。'),
    ]);
    return null;
  }

  if (text === '正常重生') {
    await Promise.all([
      docRef.update({ isHalfEvent: false }),
      replyText(event.replyToken, '✅ 已切換回【正常重生模式】。'),
    ]);
    return null;
  }

  // 4. 登記擊殺：支援 "Z 尼" 或 "Z 尼 1850"（合併資料庫寫入並平行回覆 LINE）
  const zMatch = text.match(/^z\s*([^\s\d:]+|[0-9]{1,3})(?:\s+(\d{2}:?\d{2}))?$/i);
  if (zMatch) {
    const inputAlias = zMatch[1].trim().toUpperCase();
    const timeStr = zMatch[2];

    const matchedCfg = BOSS_CONFIGS.find((cfg) =>
      cfg.aliases.some((alias) => alias.toUpperCase() === inputAlias)
    );

    if (!matchedCfg) {
      return replyText(event.replyToken, `❓ 找不到首領「${zMatch[1]}」，請確認名稱或別名。`);
    }

    syncOverdueBosses(bosses, isHalf, now);

    const killTs = timeStr ? parseHHMMToTimestamp(timeStr, now) : now;
    const respawnMin = isHalf ? matchedCfg.half : matchedCfg.normal;
    const nextSpawn = killTs + respawnMin * 60 * 1000;

    bosses[matchedCfg.name] = {
      lastKill: killTs,
      nextSpawn,
      missCount: 0,
    };

    const modeTag = isHalf ? '🔥減半' : '正常';
    const replyMsg = `⚔️ 已登記【${matchedCfg.name}】(${modeTag})\n擊殺時間：${formatTime(killTs)}\n下次重生：${formatTime(nextSpawn)}`;

    await Promise.all([
      docRef.update({ bosses }),
      replyText(event.replyToken, replyMsg),
    ]);
    return null;
  }

  // 非 Z 指令時，若有過期首領才執行更新
  const hasOverdueUpdate = syncOverdueBosses(bosses, isHalf, now);
  if (hasOverdueUpdate) {
    await docRef.update({ bosses });
  }

  // 5. KB 查詢首領重生時間 (暗黑科技感卡片 + 自動純文字備援)
  if (upperText === 'KB') {
    const timeline = [];

    for (const cfg of BOSS_CONFIGS) {
      const info = bosses[cfg.name];
      if (!info || !info.nextSpawn) continue;
      timeline.push({
        time: info.nextSpawn,
        name: cfg.name,
        miss: info.missCount || 0,
        isFixed: false,
      });
    }

    const upcomingFixed = getUpcomingFixedBosses(now);
    for (const item of upcomingFixed) {
      timeline.push({
        time: item.time,
        name: item.name,
        miss: 0,
        isFixed: true,
      });
    }

    timeline.sort((a, b) => a.time - b.time);

    const dashboardUrl = `${webUrl}/?group=${groupId}`;
    const flexMessage = buildKbFlexMessage(timeline, isHalf, now, dashboardUrl);

    try {
      return await client.replyMessage({
        replyToken: event.replyToken,
        messages: [flexMessage],
      });
    } catch (err) {
      console.error('Flex error, fallback to text:', err);
      const modeHeader = isHalf ? '🔥【目前模式：時間減半】' : '🛡️【目前模式：正常重生】';
      const lines = timeline.map((item) => {
        const diffMin = Math.ceil((item.time - now) / 60000);
        const remainStr =
          diffMin >= 60 ? `剩 ${Math.floor(diffMin / 60)}時${diffMin % 60}分` : `剩 ${diffMin}分`;
        const tag = item.isFixed ? '[固定]' : item.miss > 0 ? `(${item.miss})` : '';
        return `${formatTime(item.time)} ${item.name}${tag} (${remainStr})`;
      });
      return replyText(event.replyToken, `${modeHeader}\n\n${lines.join('\n')}\n\n📊 看板：${dashboardUrl}`);
    }
  }

  return null;
}

// 建立暗黑科技感 LINE Flex Message 美化王表卡片
function buildKbFlexMessage(timeline, isHalf, now, dashboardUrl) {
  const rows = timeline.map((item) => {
    const diffMin = Math.ceil((item.time - now) / 60000);
    const isSoon = diffMin <= 10;
    const remainStr =
      diffMin >= 60 ? `${Math.floor(diffMin / 60)}時${diffMin % 60}分` : `${diffMin}分`;

    // 暗黑科技感配色：固定王(賽博琥珀金 #241B0D)、10分內即將重生(雷射紅警報 #2B1117)、動態王(深海電光藍 #0F1B2E)
    let rowBg = '#0F1B2E';
    let borderCol = '#1E3A5F';
    let timeColor = '#00E5FF';
    if (item.isFixed) {
      rowBg = '#241B0D';
      borderCol = '#5C4318';
      timeColor = '#FFAB00';
    } else if (isSoon) {
      rowBg = '#2B1117';
      borderCol = '#7A1C2E';
      timeColor = '#FF3D57';
    }

    const labelText = item.isFixed
      ? `${item.name} [固定]`
      : item.miss > 0
      ? `${item.name} (未登${item.miss})`
      : item.name;

    return {
      type: 'box',
      layout: 'horizontal',
      backgroundColor: rowBg,
      borderColor: borderCol,
      borderWidth: '1px',
      cornerRadius: '6px',
      paddingAll: '7px',
      contents: [
        {
          type: 'text',
          text: formatTime(item.time),
          color: timeColor,
          size: 'xs',
          weight: 'bold',
          flex: 2,
        },
        {
          type: 'text',
          text: labelText,
          color: '#E2E8F0',
          size: 'xs',
          weight: 'bold',
          flex: 5,
        },
        {
          type: 'text',
          text: remainStr,
          color: isSoon ? '#FF6B81' : '#7DD3FC',
          size: 'xs',
          weight: isSoon ? 'bold' : 'regular',
          align: 'end',
          flex: 3,
        },
      ],
    };
  });

  return {
    type: 'flex',
    altText: isHalf ? '🔥 首領重生時間表 (時間減半中)' : '⚡ 首領重生時間表 (正常重生)',
    contents: {
      type: 'bubble',
      size: 'giga',
      styles: {
        header: { backgroundColor: '#090D16' },
        body: { backgroundColor: '#090D16' },
        footer: { backgroundColor: '#090D16' },
      },
      header: {
        type: 'box',
        layout: 'horizontal',
        paddingAll: '12px',
        paddingBottom: '6px',
        contents: [
          {
            type: 'text',
            text: isHalf ? '🔥 BOSS RADAR // 減半中' : '⚡ BOSS RADAR // 正常重生',
            color: isHalf ? '#FF7043' : '#38BDF8',
            weight: 'bold',
            size: 'sm',
            flex: 1,
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'xs',
        paddingAll: '10px',
        paddingTop: '4px',
        contents: rows,
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '10px',
        paddingTop: '4px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#0284C7',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📡 開啟即時監控網頁看板',
              uri: dashboardUrl,
            },
          },
        ],
      },
    },
  };
}

// 過期自動依當前週期向後疊加，並累加未登記次數
function syncOverdueBosses(bosses, isHalf, now) {
  let updated = false;
  for (const cfg of BOSS_CONFIGS) {
    const info = bosses[cfg.name];
    if (!info || !info.nextSpawn) continue;

    if (info.nextSpawn <= now) {
      const intervalMin = isHalf ? cfg.half : cfg.normal;
      const intervalMs = intervalMin * 60 * 1000;
      const missedCycles = Math.floor((now - info.nextSpawn) / intervalMs) + 1;

      info.nextSpawn += missedCycles * intervalMs;
      info.missCount = (info.missCount || 0) + missedCycles;
      updated = true;
    }
  }
  return updated;
}

// 取得未來 24 小時內的固定時間王 (台灣時間 UTC+8)
function getUpcomingFixedBosses(now) {
  const results = [];
  const twOffset = 8 * 3600 * 1000;
  const twNow = new Date(now + twOffset);

  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    const targetDate = new Date(
      Date.UTC(twNow.getUTCFullYear(), twNow.getUTCMonth(), twNow.getUTCDate() + dayOffset)
    );
    const dayOfWeek = targetDate.getUTCDay();
    const daySchedule = FIXED_SCHEDULE[dayOfWeek] || [];

    for (const slot of daySchedule) {
      const spawnTs =
        Date.UTC(
          targetDate.getUTCFullYear(),
          targetDate.getUTCMonth(),
          targetDate.getUTCDate(),
          slot.hour,
          slot.min,
          0
        ) - twOffset;

      if (spawnTs > now && spawnTs <= now + 24 * 3600 * 1000) {
        for (const name of slot.names) {
          results.push({ time: spawnTs, name });
        }
      }
    }
  }
  return results;
}

function replyText(replyToken, text) {
  return client.replyMessage({
    replyToken,
    messages: [{ type: 'text', text }],
  });
}

function formatTime(ts) {
  const date = new Date(ts + 8 * 3600 * 1000);
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function parseHHMMToTimestamp(hhmmStr, now) {
  const clean = hhmmStr.replace(':', '');
  const hh = parseInt(clean.slice(0, 2), 10);
  const mm = parseInt(clean.slice(2, 4), 10);
  const twOffset = 8 * 3600 * 1000;
  const twNow = new Date(now + twOffset);

  let targetTs =
    Date.UTC(twNow.getUTCFullYear(), twNow.getUTCMonth(), twNow.getUTCDate(), hh, mm, 0) - twOffset;

  // 若輸入時間比現在晚超過 10 分鐘，判定為前一天跨夜補登
  if (targetTs > now + 10 * 60 * 1000) {
    targetTs -= 24 * 3600 * 1000;
  }
  return targetTs;
}
