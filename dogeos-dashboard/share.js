// shareToTwitter — generates PNG snapshot of current stats, then opens X compose
async function shareToTwitter(stats) {
  // 1. Fetch og-card.svg as text
  const svgText = await fetch('./og-card.svg').then(r => r.text());
  
  // 2. Replace {{placeholders}} with actual stats
  const filled = svgText
    .replace(/\{\{blockHeight\}\}/g, stats.total_blocks.toLocaleString())
    .replace(/\{\{wallets\}\}/g, stats.total_addresses.toLocaleString())
    .replace(/\{\{txns\}\}/g, formatTxCount(stats.total_transactions))
    .replace(/\{\{timestamp\}\}/g, new Date().toISOString().slice(0, 19).replace('T', ' '));
  
  // 3. Convert SVG to PNG via canvas
  const blob = new Blob([filled], {type: 'image/svg+xml'});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 630;
  canvas.getContext('2d').drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  
  const pngBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  
  // 4. Download the PNG
  const dlUrl = URL.createObjectURL(pngBlob);
  const a = document.createElement('a');
  a.href = dlUrl; a.download = `dogeos-snapshot-${Date.now()}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(dlUrl), 1000);
  
  // 5. Open Twitter intent
  const text = `🐕 DogeOS is live.

📊 Snapshot:
• Block: ${stats.total_blocks.toLocaleString()}
• Wallets: ${stats.total_addresses.toLocaleString()}
• Txns: ${formatTxCount(stats.total_transactions)}
• Avg block: ${stats.average_block_time}s

The dashboard: https://www.dbot.dog/dogeos-dashboard

#DogeOS #Dogecoin #DBOT`;
  
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(tweetUrl, '_blank', 'width=600,height=400');
}

function formatTxCount(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}
