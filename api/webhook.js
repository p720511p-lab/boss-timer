// 建立淺色系 LINE Flex Message 美化王表卡片
function buildKbFlexMessage(timeline, isHalf, now, dashboardUrl) {
  const rows = timeline.map((item) => {
    const diffMin = Math.ceil((item.time - now) / 60000);
    const isSoon = diffMin <= 10;
    const remainStr =
      diffMin >= 60 ? `${Math.floor(diffMin / 60)}時${diffMin % 60}分` : `${diffMin}分`;

    // 淺色底色區分：固定王(暖杏黃 #FFFBEB)、10分內即將重生(粉紅警示 #FEF2F2)、動態王(冰藍底 #EFF6FF)
    let rowBg = '#EFF6FF';
    let timeColor = '#1D4ED8';
    if (item.isFixed) {
      rowBg = '#FFFBEB';
      timeColor = '#B45309';
    } else if (isSoon) {
      rowBg = '#FEF2F2';
      timeColor = '#DC2626';
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
          color: '#1F2937',
          size: 'xs',
          weight: 'bold',
          flex: 5,
        },
        {
          type: 'text',
          text: remainStr,
          color: isSoon ? '#DC2626' : '#4B5563',
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
    altText: isHalf ? '🔥 首領重生時間表 (時間減半中)' : '🛡️ 首領重生時間表 (正常重生)',
    contents: {
      type: 'bubble',
      size: 'giga',
      styles: {
        header: { backgroundColor: '#FFFFFF' },
        body: { backgroundColor: '#FFFFFF' },
        footer: { backgroundColor: '#FFFFFF' },
      },
      header: {
        type: 'box',
        layout: 'horizontal',
        paddingAll: '12px',
        paddingBottom: '6px',
        contents: [
          {
            type: 'text',
            text: isHalf ? '🔥 首領重生表 (減半中)' : '🛡️ 首領重生表 (正常)',
            color: isHalf ? '#C2410C' : '#111827',
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
            color: '#2563EB',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📊 開啟即時倒數網頁看板',
              uri: dashboardUrl,
            },
          },
        ],
      },
    },
  };
}
