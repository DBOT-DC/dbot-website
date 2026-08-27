/**
 * DogeOS Dashboard — Component Renderers
 * 7 pure rendering functions + mountApp wiring
 *
 * Design tokens: CSS variables from tokens.css / style.css
 * Fonts: Space Grotesk (labels), JetBrains Mono (numbers/addresses)
 * Icons: Phosphor via class="ph ph-*"
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncateAddress(addr = '', preLen = 6, sufLen = 4) {
  if (!addr || addr.length < preLen + sufLen) return addr || '—';
  return `${addr.slice(0, preLen)}...${addr.slice(-sufLen)}`;
}

function truncateHash(hash = '', len = 10) {
  if (!hash || hash.length < len * 2) return hash || '—';
  return `${hash.slice(0, len)}...${hash.slice(-len)}`;
}

function formatNumber(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-US');
}

function formatAge(seconds) {
  if (!seconds && seconds !== 0) return '—';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function stageColor(stage) {
  const map = {
    live: 'var(--green)',
    confirmed: 'var(--green)',
    testnet: 'var(--yellow)',
    building: 'var(--cyan)',
    announced: 'var(--text-dim)',
    concept: 'var(--text-dim)',
  };
  return map[stage?.toLowerCase()] || 'var(--text-dim)';
}

function categoryIcon(cat) {
  const map = {
    dapp: 'ph-code',
    defi: 'ph-chart-line',
    nft: 'ph-image',
    game: 'ph-game-controller',
    ai: 'ph-robot',
    platform: 'ph-stack',
    tool: 'ph-wrench',
    sdk: 'ph-package',
    memecoin: 'ph-coins',
  };
  return map[cat?.toLowerCase()] || 'ph-circle';
}

function stageLabel(stage) {
  const map = {
    live: '⚡ Live',
    confirmed: '✓ Confirmed',
    testnet: '🔬 Testnet',
    building: '🔧 Building',
    announced: '📢 Announced',
    concept: '💭 Concept',
  };
  return map[stage?.toLowerCase()] || stage || '—';
}

// ─── Component 1: Stats Hero ──────────────────────────────────────────────────

export function renderStatsHero(stats) {
  if (!stats) {
    return `
      <div class="stats-hero" style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;">
        ${[1,2,3,4].map(() => `
          <div class="stat-tile" style="
            background:var(--bg-tertiary);border:1px solid var(--text-dim);
            border-radius:8px;padding:1.5rem;text-align:center;
          ">
            <div class="stat-label" style="font-family:var(--font-sans);font-size:0.7rem;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.5rem;">—</div>
            <div class="stat-value" style="font-family:var(--font-mono);font-size:2rem;color:var(--text-dim);">—</div>
            <div class="stat-sub" style="font-family:var(--font-mono);font-size:0.65rem;color:var(--red);margin-top:0.5rem;">Chain offline</div>
          </div>
        `).join('')}
      </div>`;
  }

  const tiles = [
    {
      label: 'Total Transactions',
      value: formatNumber(stats.total_transactions),
      delta: stats.tx_delta ? (stats.tx_delta > 0 ? '↑' : '↓') : '',
      sub: '',
    },
    {
      label: 'Active Wallets',
      value: formatNumber(stats.total_addresses),
      delta: stats.addr_delta ? (stats.addr_delta > 0 ? '↑' : '↓') : '',
      sub: '',
    },
    {
      label: 'Latest Block',
      value: formatNumber(stats.total_blocks),
      delta: '',
      sub: formatAge(stats.last_block_age),
    },
    {
      label: 'Avg Block Time',
      value: stats.average_block_time ? `${stats.average_block_time}s` : '—',
      delta: '',
      sub: '',
    },
  ];

  return `
    <div class="stats-hero" style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;" role="region" aria-label="Chain statistics">
      ${tiles.map(t => `
        <div class="stat-tile" style="
          background:var(--bg-tertiary);border:1px solid var(--text-dim);
          border-radius:8px;padding:1.5rem;text-align:center;
          transition:transform 0.2s ease,box-shadow 0.2s ease;
          cursor:default;
        " onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(139,92,246,0.2)'"
           onmouseout="this.style.transform='';this.style.boxShadow=''">
          <div class="stat-label" style="font-family:var(--font-sans);font-size:0.7rem;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.5rem;">
            ${t.label}
          </div>
          <div class="stat-value" style="font-family:var(--font-mono);font-size:2rem;color:var(--text-primary);">
            ${t.value} <span style="color:var(--green);font-size:1.2rem;">${t.delta}</span>
          </div>
          ${t.sub ? `<div class="stat-sub" style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);margin-top:0.5rem;">${t.sub}</div>` : ''}
        </div>
      `).join('')}
    </div>`;
}

// ─── Component 2: Block Ticker ────────────────────────────────────────────────

export function renderBlockTicker(blocks = []) {
  const visible = blocks.slice(0, 4);

  if (!visible.length) {
    return `
      <div class="block-ticker" style="
        background:var(--bg-tertiary);border:1px solid var(--text-dim);
        border-radius:8px;padding:1rem;overflow:hidden;
      ">
        <div style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-dim);text-align:center;">
          No blocks available
        </div>
      </div>`;
  }

  return `
    <div class="block-ticker" style="
      background:var(--bg-tertiary);border:1px solid var(--text-dim);
      border-radius:8px;padding:0.75rem 0;overflow:hidden;
      position:relative;
    " aria-label="Latest blocks" role="marquee">
      <div class="ticker-track" style="
        display:flex;gap:1rem;padding:0 1rem;
        animation: ticker-scroll 20s linear infinite;
        width:max-content;
      ">
        ${[...visible, ...visible].map((b, i) => `
          <div class="ticker-block" style="
            display:flex;align-items:center;gap:0.75rem;
            background:var(--bg-secondary);border:1px solid var(--purple-dim);
            border-radius:6px;padding:0.6rem 1rem;min-width:200px;
            flex-shrink:0;
          " aria-label="Block ${b.height}">
            <span class="block-height" style="font-family:var(--font-mono);font-size:0.9rem;color:var(--purple);font-weight:700;">
              #${formatNumber(b.height)}
            </span>
            <span class="block-age" style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);">
              ${formatAge(b.age_seconds)}
            </span>
            <span class="block-miner" style="font-family:var(--font-mono);font-size:0.65rem;color:var(--cyan);">
              ${truncateAddress(b.miner)}
            </span>
          </div>
        `).join('')}
      </div>
      <style>
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .block-ticker:hover .ticker-track { animation-play-state: paused; }
      </style>
    </div>`;
}

// ─── Component 3: Transaction Feed ────────────────────────────────────────────

export function renderTxnFeed(txns = []) {
  const visible = txns.slice(0, 6);

  if (!visible.length) {
    return `
      <div class="txn-feed" style="
        background:var(--bg-tertiary);border:1px solid var(--text-dim);
        border-radius:8px;padding:1rem;
      ">
        <div style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-dim);text-align:center;padding:1rem;">
          No transactions yet
        </div>
      </div>`;
  }

  return `
    <div class="txn-feed" style="
      background:var(--bg-tertiary);border:1px solid var(--text-dim);
      border-radius:8px;padding:1rem;
    " aria-label="Recent transactions">
      <div style="font-family:var(--font-sans);font-size:0.7rem;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.75rem;">
        Latest Transactions
      </div>
      ${visible.map((tx, i) => `
        <div class="txn-item" style="
          display:flex;flex-direction:column;gap:0.25rem;
          padding:0.75rem;background:var(--bg-secondary);
          border:1px solid transparent;border-radius:6px;
          margin-bottom:0.5rem;cursor:pointer;
          transition:all 0.2s ease;
        " role="listitem"
           onmouseover="this.style.borderColor='var(--purple-dim)';this.style.background='var(--bg-primary)'"
           onmouseout="this.style.borderColor='transparent';this.style.background='var(--bg-secondary)'"
           data-txn-hash="${tx.hash}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span class="txn-hash" style="font-family:var(--font-mono);font-size:0.75rem;color:var(--purple);">
              ${truncateHash(tx.hash)}
            </span>
            <span class="txn-age" style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);">
              ${formatAge(tx.age_seconds)}
            </span>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;font-family:var(--font-mono);font-size:0.7rem;">
            <span style="color:var(--text-muted);">${truncateAddress(tx.from)}</span>
            <i class="ph ph-arrow-right" style="color:var(--purple);font-size:0.8rem;"></i>
            <span style="color:var(--text-muted);">${truncateAddress(tx.to)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span class="txn-value" style="font-family:var(--font-mono);font-size:0.7rem;color:var(--cyan);">
              ${tx.value ? `${(Number(tx.value) / 1e18).toFixed(4)} tDOGE` : '—'}
            </span>
            <a class="txn-link" href="#" style="
              font-family:var(--font-mono);font-size:0.65rem;color:var(--purple);
              text-decoration:none;opacity:0;transition:opacity 0.2s;
            " onclick="event.stopPropagation();window.open('https://blockscout.com/dogecoin/dogechain/tx/${tx.hash}','_blank')">
              View on Blockscout ↗
            </a>
          </div>
        </div>
      `).join('')}
    </div>
    <style>
      .txn-item:hover .txn-link { opacity: 1 !important; }
    </style>`;
}

// ─── Component 4: Tokens Leaderboard ─────────────────────────────────────────

export function renderTokensLeaderboard(tokens = []) {
  const sorted = [...tokens]
    .sort((a, b) => (b.holders || 0) - (a.holders || 0))
    .slice(0, 10);

  if (!sorted.length) {
    return `
      <div class="tokens-leaderboard" style="
        background:var(--bg-tertiary);border:1px solid var(--text-dim);
        border-radius:8px;padding:1rem;
      ">
        <div style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-dim);text-align:center;padding:1rem;">
          No tokens found
        </div>
      </div>`;
  }

  return `
    <div class="tokens-leaderboard" style="
      background:var(--bg-tertiary);border:1px solid var(--text-dim);
      border-radius:8px;padding:1rem;
    " aria-label="Top 10 tokens by holders">
      <div style="font-family:var(--font-sans);font-size:0.7rem;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.75rem;">
        Top 10 Tokens by Holders
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-family:var(--font-mono);font-size:0.75rem;">
          <thead>
            <tr style="border-bottom:1px solid var(--text-dim);">
              <th style="text-align:left;padding:0.5rem;color:var(--text-dim);font-weight:400;">#</th>
              <th style="text-align:left;padding:0.5rem;color:var(--text-dim);font-weight:400;">Name</th>
              <th style="text-align:right;padding:0.5rem;color:var(--text-dim);font-weight:400;">Holders</th>
              <th style="text-align:right;padding:0.5rem;color:var(--text-dim);font-weight:400;">Transfers</th>
              <th style="text-align:left;padding:0.5rem;color:var(--text-dim);font-weight:400;">Contract</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map((token, i) => `
              <tr style="border-bottom:1px solid var(--bg-secondary);transition:background 0.2s;"
                  onmouseover="this.style.background='var(--bg-primary)'"
                  onmouseout="this.style.background=''">
                <td style="padding:0.6rem 0.5rem;color:var(--text-dim);">${i + 1}</td>
                <td style="padding:0.6rem 0.5rem;">
                  <span style="color:var(--text-primary);">${token.name || '—'}</span>
                  <span style="color:var(--text-dim);"> (${token.symbol || '—'})</span>
                </td>
                <td style="padding:0.6rem 0.5rem;text-align:right;color:var(--cyan);">
                  ${formatNumber(token.holders)}
                </td>
                <td style="padding:0.6rem 0.5rem;text-align:right;color:var(--text-muted);">
                  ${formatNumber(token.transfers_count)}
                </td>
                <td style="padding:0.6rem 0.5rem;color:var(--purple);">
                  <a href="#" onclick="window.open('https://blockscout.com/dogecoin/dogechain/address/${token.address}','_blank')" style="color:var(--purple);text-decoration:none;">
                    ${truncateAddress(token.address)}
                  </a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ─── Component 5: Contracts Table ─────────────────────────────────────────────

export function renderContractsTable(contracts = []) {
  const sorted = [...contracts]
    .sort((a, b) => (b.transactions_count || 0) - (a.transactions_count || 0))
    .slice(0, 10);

  if (!sorted.length) {
    return `
      <div class="contracts-table" style="
        background:var(--bg-tertiary);border:1px solid var(--text-dim);
        border-radius:8px;padding:1rem;
      ">
        <div style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-dim);text-align:center;padding:1rem;">
          No verified contracts found
        </div>
      </div>`;
  }

  return `
    <div class="contracts-table" style="
      background:var(--bg-tertiary);border:1px solid var(--text-dim);
      border-radius:8px;padding:1rem;
    " aria-label="Top 10 verified contracts">
      <div style="font-family:var(--font-sans);font-size:0.7rem;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.75rem;">
        Top 10 Verified Contracts
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-family:var(--font-mono);font-size:0.75rem;">
          <thead>
            <tr style="border-bottom:1px solid var(--text-dim);">
              <th style="text-align:left;padding:0.5rem;color:var(--text-dim);font-weight:400;">Address</th>
              <th style="text-align:left;padding:0.5rem;color:var(--text-dim);font-weight:400;">Type</th>
              <th style="text-align:right;padding:0.5rem;color:var(--text-dim);font-weight:400;">Txn Count</th>
              <th style="text-align:left;padding:0.5rem;color:var(--text-dim);font-weight:400;">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(contract => `
              <tr style="border-bottom:1px solid var(--bg-secondary);transition:background 0.2s;"
                  onmouseover="this.style.background='var(--bg-primary)'"
                  onmouseout="this.style.background=''">
                <td style="padding:0.6rem 0.5rem;">
                  <div style="display:flex;align-items:center;gap:0.5rem;">
                    <a href="#" onclick="window.open('https://blockscout.com/dogecoin/dogechain/address/${contract.address}','_blank')" style="color:var(--purple);text-decoration:none;" title="${contract.address}">
                      ${truncateAddress(contract.address, 8, 6)}
                    </a>
                    <span style="
                      display:inline-flex;align-items:center;gap:0.2rem;
                      background:rgba(34,197,94,0.15);border:1px solid var(--green);
                      color:var(--green);font-size:0.55rem;padding:0.1rem 0.4rem;
                      border-radius:3px;
                    " aria-label="Verified contract">
                      ✓ Verified
                    </span>
                  </div>
                </td>
                <td style="padding:0.6rem 0.5rem;color:var(--text-muted);">
                  ${contract.type || '—'}
                </td>
                <td style="padding:0.6rem 0.5rem;text-align:right;color:var(--cyan);">
                  ${formatNumber(contract.transactions_count)}
                </td>
                <td style="padding:0.6rem 0.5rem;color:var(--text-dim);">
                  ${formatAge(contract.last_seen)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ─── Component 6: Projects Grid ──────────────────────────────────────────────

export function renderProjectsGrid(projects = []) {
  if (!projects.length) {
    return `
      <div class="projects-grid" style="
        background:var(--bg-tertiary);border:1px solid var(--text-dim);
        border-radius:8px;padding:1rem;
      ">
        <div style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-dim);text-align:center;padding:1rem;">
          No projects found
        </div>
      </div>`;
  }

  return `
    <div class="projects-grid" style="
      display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
      gap:1rem;
    " aria-label="Ecosystem projects">
      ${projects.map(project => {
        const hasOnChain = Boolean(project.onchain_address);
        return `
          <div class="project-card" style="
            background:var(--bg-tertiary);border:1px solid var(--text-dim);
            border-radius:8px;padding:1rem;
            transition:transform 0.2s ease,box-shadow 0.2s ease;
            cursor:default;
          " onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(139,92,246,0.2)';this.style.borderColor='var(--purple-dim)'"
             onmouseout="this.style.transform='';this.style.boxShadow='';this.style.borderColor='var(--text-dim)'"
             role="article" aria-label="${project.name}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.75rem;">
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <i class="ph ${categoryIcon(project.category)}" style="font-size:1.2rem;color:${project.category ? 'var(--purple)' : 'var(--text-dim)'};"></i>
                <span style="font-family:var(--font-sans);font-size:0.95rem;font-weight:600;color:var(--text-primary);">
                  ${project.name}
                </span>
              </div>
              <span style="
                font-family:var(--font-mono);font-size:0.6rem;padding:0.2rem 0.5rem;
                border-radius:4px;border:1px solid ${stageColor(project.stage)};
                color:${stageColor(project.stage)};
              ">
                ${stageLabel(project.stage)}
              </span>
            </div>

            <div style="font-family:var(--font-sans);font-size:0.7rem;color:var(--text-muted);margin-bottom:0.5rem;">
              Builder: <span style="color:var(--cyan);">${project.builder || '—'}</span>
            </div>

            <div style="font-family:var(--font-sans);font-size:0.75rem;color:var(--text-dim);line-height:1.5;margin-bottom:0.75rem;">
              ${project.what || ''}
            </div>

            ${project.link ? `
              <a href="${project.link}" target="_blank" rel="noopener" style="
                display:inline-flex;align-items:center;gap:0.3rem;
                font-family:var(--font-mono);font-size:0.65rem;color:var(--purple);
                text-decoration:none;margin-bottom:0.5rem;
              " onclick="event.stopPropagation()">
                <i class="ph ph-link" style="font-size:0.8rem;"></i> Link
              </a>
            ` : ''}

            <div style="
              margin-top:0.75rem;padding-top:0.75rem;
              border-top:1px solid var(--bg-secondary);
              display:flex;align-items:center;justify-content:space-between;
            ">
              ${hasOnChain ? `
                <div class="onchain-indicator" style="
                  display:flex;align-items:center;gap:0.4rem;
                  font-family:var(--font-mono);font-size:0.65rem;color:var(--green);
                ">
                  <i class="ph ph-check-circle" style="font-size:0.9rem;"></i>
                  On-chain
                </div>
                <div class="project-stats" id="proj-stats-${project.onchain_address?.slice(2,10)}" style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-d);">
                  <!-- stats populated by data.projectStats(addr) if available -->
                </div>
              ` : `
                <div class="awaiting-deployment" style="
                  display:flex;align-items:center;gap:0.4rem;
                  font-family:var(--font-mono);font-size:0.65rem;color:var(--yellow);
                ">
                  <i class="ph ph-hourglass" style="font-size:0.9rem;"></i>
                  Awaiting deployment
                </div>
              `}
            </div>
          </div>
        `;
      }).join('')}
    </div>`;
}

// ─── Component 7: Chain Health ───────────────────────────────────────────────

export function renderChainHealth(health = {}) {
  const {
    blockHeight = 0,
    blockTime = 0,
    gasPrice = 0,
    networkUtil = 0,
    lastBlockAge = 0,
    peerCount,
  } = health;

  const isStale = lastBlockAge > 300; // > 5 minutes

  return `
    <div class="chain-health" style="
      background:var(--bg-tertiary);border:1px solid ${isStale ? 'var(--red)' : 'var(--text-dim)'};
      border-radius:8px;padding:1.25rem;
      transition:border-color 0.3s ease;
    " aria-label="Chain health status" role="status">
      ${isStale ? `
        <div style="
          display:flex;align-items:center;gap:0.5rem;
          background:rgba(239,68,68,0.15);border:1px solid var(--red);
          border-radius:6px;padding:0.5rem 0.75rem;margin-bottom:1rem;
          font-family:var(--font-mono);font-size:0.7rem;color:var(--red);
        " role="alert">
          <i class="ph ph-warning" style="font-size:1rem;"></i>
          Stale — last block ${formatAge(lastBlockAge)}
        </div>
      ` : ''}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
        <div class="health-block-height" style="grid-column:1/-1;text-align:center;">
          <div style="font-family:var(--font-sans);font-size:0.65rem;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.25rem;">
            Block Height
          </div>
          <div style="font-family:var(--font-mono);font-size:2.5rem;color:var(--purple);font-weight:700;line-height:1;">
            ${formatNumber(blockHeight)}
          </div>
        </div>

        <div class="health-block-time">
          <div style="font-family:var(--font-sans);font-size:0.65rem;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.25rem;">
            Block Time
          </div>
          <div style="font-family:var(--font-mono);font-size:1.2rem;color:var(--text-primary);">
            ${blockTime ? `${blockTime}s` : '—'}
          </div>
        </div>

        <div class="health-gas-price">
          <div style="font-family:var(--font-sans);font-size:0.65rem;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.25rem;">
            Gas Price
          </div>
          <div style="font-family:var(--font-mono);font-size:1.2rem;color:var(--text-primary);">
            ${gasPrice ? `${Number(gasPrice).toFixed(2)} Gwei` : '—'}
          </div>
        </div>
      </div>

      <div class="health-network-util" style="margin-bottom:0.75rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
          <span style="font-family:var(--font-sans);font-size:0.65rem;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
            Network Utilization
          </span>
          <span style="font-family:var(--font-mono);font-size:0.75rem;color:var(--cyan);">
            ${networkUtil ? `${networkUtil}%` : '—'}
          </span>
        </div>
        <div style="
          width:100%;height:8px;background:var(--bg-secondary);
          border-radius:4px;overflow:hidden;
        " role="progressbar" aria-valuenow="${networkUtil || 0}" aria-valuemin="0" aria-valuemax="100">
          <div style="
            width:${networkUtil || 0}%;height:100%;
            background:${networkUtil > 80 ? 'var(--yellow)' : networkUtil > 50 ? 'var(--cyan)' : 'var(--green)'};
            border-radius:4px;transition:width 0.5s ease;
          "></div>
        </div>
      </div>

      ${peerCount !== undefined ? `
        <div class="health-peer-count" style="
          display:flex;justify-content:space-between;align-items:center;
          font-family:var(--font-mono);font-size:0.7rem;color:var(--text-dim);
        ">
          <span>Peers</span>
          <span style="color:${peerCount > 0 ? 'var(--green)' : 'var(--red)'};">
            ${peerCount}
          </span>
        </div>
      ` : ''}

      <div style="
        margin-top:0.75rem;padding-top:0.75rem;
        border-top:1px solid var(--bg-secondary);
        font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);
        text-align:center;
      ">
        Last block: ${formatAge(lastBlockAge)}
      </div>
    </div>`;
}

// ─── Mount Function ────────────────────────────────────────────────────────────

/**
 * mountApp — wires all components to their slots when data arrives
 * @param {object} dataInstance - data manager with .cache.get(key) and .on(event, cb)
 */
export function mountApp(dataInstance) {
  const slots = {
    'slot-stats-hero':    { fn: renderStatsHero,         key: 'stats'      },
    'slot-block-ticker':  { fn: renderBlockTicker,       key: 'blocks'     },
    'slot-txn-feed':      { fn: renderTxnFeed,           key: 'txns'       },
    'slot-tokens':        { fn: renderTokensLeaderboard,  key: 'tokens'     },
    'slot-contracts':     { fn: renderContractsTable,     key: 'contracts'  },
    'slot-projects':      { fn: renderProjectsGrid,       key: 'projects'   },
    'slot-chain-health':  { fn: renderChainHealth,        key: 'chainHealth'},
  };

  function render(data = {}) {
    Object.entries(slots).forEach(([id, { fn, key }]) => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = fn(data[key]);
      }
    });
  }

  // Initial render
  render(dataInstance.cache?.get('all') || {});

  // Subscribe to updates
  if (dataInstance.on) {
    dataInstance.on('update', render);
  }
}
