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
  { name: '庫約', aliases: ['庫約', '库約', '庫'], offset: 280, normal: 240, half: 120 },
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

  // 4. 登記擊殺：支援 "Z 尼" 或 "Z 尼 1850"
  const zMatch = text.match(/^z\s*([^\s\d:]+|[0-9]{1,3})(?:\s+(\d{2}:?\
