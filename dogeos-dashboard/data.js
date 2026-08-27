/**
 * DogeosData — Live chain data fetcher for DogeOS Dashboard
 * Works as both inline <script> and ES module (import/export).
 * No external dependencies — pure vanilla JS.
 */
class DogeosData {
  constructor() {
    this.cache = new Map();
    this.listeners = new Set();
    this.refreshTimer = null;
    this.seedData = null;

    // API base URLs
    this.BLOCKSCOUT_REST = 'https://blockscout.testnet.dogeos.com/api/v2';
    this.RPC = 'https://rpc.testnet.dogeos.com';
    this.BLOCKSCOUT_RPC_PROXY = 'https://blockscout.testnet.dogeos.com/api/eth-rpc';

    // Cache TTLs (ms)
    this.TTL = {
      stats:   30_000,    // 30s
      blocks:  15_000,    // 15s
      txns:    15_000,    // 15s
      tokens:  300_000,   // 5min
      contracts: 300_000, // 5min
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Internal helpers                                                   */
  /* ------------------------------------------------------------------ */

  _cacheKey(endpoint) { return endpoint; }

  _fromCache(endpoint) {
    const entry = this.cache.get(endpoint);
    if (!entry) return null;
    if (Date.now() - entry.ts > entry.ttl) {
      this.cache.delete(endpoint);
      return null;
    }
    return entry.data;
  }

  _toCache(endpoint, data, ttl) {
    this.cache.set(endpoint, { data, ttl, ts: Date.now() });
  }

  /**
   * Fetch with CORS-safe fallback chain:
   * 1. Blockscout REST  → (browser-friendly, no CORS issues)
   * 2. Blockscout /api/eth-rpc proxy  → (JSON-RPC over REST, bypasses CORS)
   * 3. Direct RPC (try-only, errors ignored)
   * 4. Seed data fallback
   */
  async _fetchChain(url, opts = {}) {
    // Try 1: Blockscout REST
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(10_000), ...opts });
      if (r.ok) return await r.json();
    } catch (_) {}

    // Try 2: Blockscout JSON-RPC proxy (when fetching from RPC endpoint)
    if (url.startsWith(this.RPC)) {
      try {
        const proxyUrl = this.BLOCKSCOUT_RPC_PROXY;
        const body = opts.body || JSON.stringify({});
        const r = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(10_000),
        });
        if (r.ok) return await r.json();
      } catch (_) {}
    }

    return null;
  }

  /**
   * Generic JSON-RPC call via Blockscout proxy → direct RPC.
   * method, params, ttl, key
   */
  async _rpc(method, params = [], ttl = 30_000, key = null) {
    key = key || method;
    const cached = this._fromCache(key);
    if (cached !== null) return cached;

    const payload = { jsonrpc: '2.0', id: 1, method, params };
    const body = JSON.stringify(payload);

    let data = await this._fetchChain(this.RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

    // Fallback through proxy if direct RPC failed
    if (!data) {
      try {
        const r = await fetch(this.BLOCKSCOUT_RPC_PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(10_000),
        });
        if (r.ok) data = await r.json();
      } catch (_) {}
    }

    if (!data) {
      // Seed data fallback
      if (this.seedData && this.seedData[key] !== undefined) {
        return this.seedData[key];
      }
      throw new Error(`All RPC fallbacks failed for: ${method}`);
    }

    this._toCache(key, data, ttl);
    return data;
  }

  /* ------------------------------------------------------------------ */
  /*  Public API — cached getters                                        */
  /* ------------------------------------------------------------------ */

  /**
   * GET /api/v2/stats
   * TTL: 30s
   * Fields: average_block_time, total_addresses, total_blocks,
   *         total_transactions, gas_prices, network_utilization_percentage
   */
  async stats() {
    const cached = this._fromCache('stats');
    if (cached !== null) return cached;

    let data = null;
    try {
      const r = await fetch(`${this.BLOCKSCOUT_REST}/stats`, { signal: AbortSignal.timeout(10_000) });
      if (r.ok) data = await r.json();
    } catch (_) {}

    if (!data && this.seedData?.stats) data = this.seedData.stats;

    if (!data) throw new Error('stats: all fallbacks exhausted');
    this._toCache('stats', data, this.TTL.stats);
    return data;
  }

  /**
   * GET /api/v2/main-page/blocks  — latest 4 blocks
   * TTL: 15s
   * Fields per block: height, miner, gas_used, age / timestamp
   */
  async latestBlocks() {
    const cached = this._fromCache('latestBlocks');
    if (cached !== null) return cached;

    let data = null;
    try {
      const r = await fetch(`${this.BLOCKSCOUT_REST}/main-page/blocks`, { signal: AbortSignal.timeout(10_000) });
      if (r.ok) {
        const json = await r.json();
        // Blockscout returns { items: [...] }
        data = json.items || json;
      }
    } catch (_) {}

    if (!data && this.seedData?.blocks) data = this.seedData.blocks;

    if (!data) throw new Error('latestBlocks: all fallbacks exhausted');
    this._toCache('latestBlocks', data, this.TTL.blocks);
    return data;
  }

  /**
   * GET /api/v2/main-page/transactions  — latest 6 txns
   * TTL: 15s
   * Fields: hash, from, to, value, age / timestamp
   */
  async latestTxns() {
    const cached = this._fromCache('latestTxns');
    if (cached !== null) return cached;

    let data = null;
    try {
      const r = await fetch(`${this.BLOCKSCOUT_REST}/main-page/transactions`, { signal: AbortSignal.timeout(10_000) });
      if (r.ok) {
        const json = await r.json();
        data = json.items || json;
      }
    } catch (_) {}

    if (!data && this.seedData?.transactions) data = this.seedData.transactions;

    if (!data) throw new Error('latestTxns: all fallbacks exhausted');
    this._toCache('latestTxns', data, this.TTL.txns);
    return data;
  }

  /**
   * GET /api/v2/tokens?type=ERC-20
   * TTL: 5min
   * Fields: name, symbol, decimals, total_supply, holders, transfers_count
   */
  async tokens() {
    const cached = this._fromCache('tokens');
    if (cached !== null) return cached;

    let data = null;
    try {
      const r = await fetch(`${this.BLOCKSCOUT_REST}/tokens?type=ERC-20`, { signal: AbortSignal.timeout(10_000) });
      if (r.ok) {
        const json = await r.json();
        data = json.items || json;
      }
    } catch (_) {}

    if (!data && this.seedData?.tokens) data = this.seedData.tokens;

    if (!data) throw new Error('tokens: all fallbacks exhausted');
    this._toCache('tokens', data, this.TTL.tokens);
    return data;
  }

  /**
   * GET /api/v2/smart-contracts?filter=solidity
   * TTL: 5min
   * Fields: address, name, compiler_version, etc.
   */
  async contracts() {
    const cached = this._fromCache('contracts');
    if (cached !== null) return cached;

    let data = null;
    try {
      // Try solidity first, fall back to vyper
      const r = await fetch(`${this.BLOCKSCOUT_REST}/smart-contracts?filter=solidity`, { signal: AbortSignal.timeout(10_000) });
      if (!r.ok) throw new Error('not ok');
      const json = await r.json();
      data = json.items || json;
    } catch (_) {
      try {
        const r = await fetch(`${this.BLOCKSCOUT_REST}/smart-contracts?filter=vyper`, { signal: AbortSignal.timeout(10_000) });
        if (r.ok) {
          const json = await r.json();
          data = json.items || json;
        }
      } catch (_) {}
    }

    if (!data && this.seedData?.contracts) data = this.seedData.contracts;

    if (!data) throw new Error('contracts: all fallbacks exhausted');
    this._toCache('contracts', data, this.TTL.contracts);
    return data;
  }

  /**
   * Per-address stats: tx count + last seen.
   * Uses Blockscout /addresses/{addr}
   * TTL: 30s per address
   */
  async projectStats(addr) {
    const key = `projectStats:${addr}`;
    const cached = this._fromCache(key);
    if (cached !== null) return cached;

    let data = null;
    try {
      const r = await fetch(`${this.BLOCKSCOUT_REST}/addresses/${addr}`, { signal: AbortSignal.timeout(10_000) });
      if (r.ok) {
        const json = await r.json();
        // Normalize Blockscout address response
        data = {
          address:            json.address || addr,
          tx_count:           json.transactions_count ?? json.tx_count ?? 0,
          last_seen:          json.last_transaction_timestamp || json.last_seen || null,
          total_balance:      json.balance || json.coin_balance || '0',
          token_balance:      json.token_balance || null,
          is_contract:        json.is_contract || false,
          is_verified:        json.is_verified || false,
          name:               json.name || null,
          // Blockscout-specific
          insertions_count:   json.insertions_count || 0,
          fetched_transactions_count: json.fetched_transactions_count || 0,
        };
      }
    } catch (_) {}

    if (!data && this.seedData?.addressStats?.[addr]) {
      data = this.seedData.addressStats[addr];
    }

    if (!data) throw new Error(`projectStats: all fallbacks exhausted for ${addr}`);
    this._toCache(key, data, this.TTL.stats);
    return data;
  }

  /* ------------------------------------------------------------------ */
  /*  Event system                                                        */
  /* ------------------------------------------------------------------ */

  on(event, callback) {
    this.listeners.add({ event, callback });
  }

  emit(event, data) {
    this.listeners.forEach(l => {
      if (l.event === event) {
        try { l.callback(data); } catch (e) { console.error('emit error:', e); }
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Auto-refresh                                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Start polling all endpoints.
   * @param {number} intervalMs  poll interval (default 60s)
   * Pauses when tab is hidden (visibilitychange), resumes on visible.
   */
  start(intervalMs = 60_000) {
    this.stop();

    const tick = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      this.emit('refresh', { ts: Date.now() });
      const keys = ['stats', 'latestBlocks', 'latestTxns', 'tokens', 'contracts'];
      for (const k of keys) {
        try {
          // Bypass cache by clearing it first for auto-refresh
          const methodName = k === 'latestBlocks' ? 'latestBlocks'
            : k === 'latestTxns' ? 'latestTxns'
            : k;
          const method = this[methodName];
          await method.call(this);
        } catch (e) {
          this.emit('error', { endpoint: k, err: e });
        }
      }
    };

    tick(); // immediate first tick
    this.refreshTimer = setInterval(tick, intervalMs);

    // Visibilitychange listener — pause when hidden
    if (typeof document !== 'undefined') {
      this._visibilityHandler = () => {
        if (document.hidden) {
          this.emit('paused', { ts: Date.now() });
        } else {
          this.emit('resumed', { ts: Date.now() });
          tick(); // immediate refresh when tab becomes visible
        }
      };
      document.addEventListener('visibilitychange', this._visibilityHandler);
    }
  }

  stop() {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (typeof document !== 'undefined' && this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Seed data                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Load fallback seed data for when the chain is offline.
   * @param {object} json  { stats?, blocks?, transactions?, tokens?, contracts?, addressStats? }
   */
  loadSeed(json) {
    this.seedData = json;
  }
}

// ── Module export (works as ES module and inline script) ────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DogeosData };
}
if (typeof window !== 'undefined') {
  window.DogeosData = DogeosData;
}
