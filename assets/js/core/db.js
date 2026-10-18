/* ============================================================
   RAZOR CLOUD — Database & State Store with LocalStorage
   ============================================================ */
(function() {
  const DB_KEY = 'rz_db_store';
  const USER_KEY = 'rz_user_store';

  window.TIMERS = [];
  window.every = (ms, fn) => {
    const t = setInterval(fn, ms);
    window.TIMERS.push(t);
    return t;
  };
  window.uid = () => 'rz_' + Math.random().toString(36).slice(2, 9);
  window.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  window.USERS = [
    { email: 'trader@razor.io', pass: 'demo123', name: 'Elena Voss', role: 'trader', tier: 'Professional', tierId: 'pro', av: 'EV', joined: '2025-09-14', instances: 2, instMax: 3 },
    { email: 'dev@razor.io', pass: 'demo123', name: 'Marcus Chen', role: 'developer', tier: 'Free Developer', tierId: 'dev', av: 'MC', joined: '2026-06-02', instances: 1, instMax: 1 },
    { email: 'admin@razor.io', pass: 'demo123', name: 'Aria Sterling', role: 'admin', tier: 'Razor Co. Staff', tierId: 'staff', av: 'AS', joined: '2024-01-10', instances: 0, instMax: 0 }
  ];

  window.FEATURES = [
    { id: 100, name: 'Live Trading', desc: 'Core live trading capability' },
    { id: 101, name: 'Backtesting', desc: 'Backtest execution' },
    { id: 102, name: 'Optimization', desc: 'GA optimisation' },
    { id: 103, name: 'Neural Networks', desc: 'INeuralNetworkModel support' },
    { id: 104, name: 'Hooks', desc: 'Hook system support' },
    { id: 105, name: 'Cronjobs', desc: 'Scheduled jobs' },
    { id: 106, name: 'Schedules', desc: 'One-off scheduled commands' },
    { id: 108, name: 'Self-Update', desc: 'Automatic binary update' },
    { id: 109, name: 'Log Streaming', desc: 'On-demand log transfer' },
    { id: 110, name: 'Telemetry Export', desc: 'Metrics export' },
    { id: 111, name: 'Behavior Logging', desc: 'Sparse behaviour recording' }
  ];

  window.CMDS = [
    { id: 1100, t: 'StartLive' }, { id: 1101, t: 'StopLive' }, { id: 1102, t: 'InjectGenes' }, { id: 1103, t: 'PauseLive' }, { id: 1104, t: 'ResumeLive' }, { id: 1106, t: 'SyncLive' },
    { id: 1200, t: 'RunBacktest' }, { id: 1201, t: 'CancelBacktest' },
    { id: 1300, t: 'StartOptimization' }, { id: 1301, t: 'CancelOptimization' }, { id: 1302, t: 'PauseOptimization' }, { id: 1303, t: 'ResumeOptimization' },
    { id: 1400, t: 'ReloadExtensions' }, { id: 1401, t: 'DeployExtension' }, { id: 1404, t: 'ActivateExtensions' },
    { id: 1500, t: 'GenerateReport' }, { id: 1603, t: 'SetLogLevel' }, { id: 1605, t: 'ExportMetrics' },
    { id: 1700, t: 'SetCronJob' }, { id: 1703, t: 'SetSchedule' },
    { id: 2000, t: 'KillSwitch' }, { id: 2001, t: 'EmergencyStop' }, { id: 2100, t: 'EnableBehaviorLogging' }
  ];

  const SEED_DB = {
    engines: [
      { id: 'eng-frankfurt-01', name: 'PROD-FRANKFURT-01', owner: 'trader@razor.io', version: '1.0.0 LTS', endpoint: 'primary', status: 'online', cpu: 34, mem: 52, tickAge: 118, uptime: '14d 06h', caps: [100, 101, 102, 103, 104, 105, 106, 108, 109, 110, 111], key: 'rzr_live_9f2kQ7xLp4mN', selfUpdate: true, region: 'eu-central' },
      { id: 'eng-helsinki-02', name: 'PROD-HELSINKI-02', owner: 'trader@razor.io', version: '1.0.0 LTS', endpoint: 'primary', status: 'online', cpu: 61, mem: 48, tickAge: 94, uptime: '9d 21h', caps: [100, 101, 102, 104, 105, 106, 108, 109, 110], key: 'rzr_live_Hd8vB2nTr5wK', selfUpdate: true, region: 'eu-north' },
      { id: 'eng-devlocal-01', name: 'DEV-LOCAL-01', owner: 'dev@razor.io', version: '1.0.0 LTS', endpoint: 'fallback', status: 'offline', cpu: 0, mem: 0, tickAge: null, uptime: '—', caps: [100, 101, 102, 103, 104, 109], key: 'rzr_dev_aP3cLm9Zq1', selfUpdate: false, region: 'local' }
    ],
    positions: [
      { id: 'p1', sym: 'EURUSD', type: 'BUY', vol: 0.5, open: 1.08420, cur: 1.08612, sl: 1.08100, tp: 1.09000, pnl: 96.0 },
      { id: 'p2', sym: 'BTCUSDT', type: 'SELL', vol: 0.08, open: 67420, cur: 67180, sl: 68000, tp: 66000, pnl: 19.2 },
      { id: 'p3', sym: 'XAUUSD', type: 'BUY', vol: 0.2, open: 2381.4, cur: 2388.9, sl: 2370, tp: 2410, pnl: 15.0 }
    ],
    orders: [
      { id: 'o1', sym: 'EURUSD', type: 'BUY LIMIT', vol: 0.3, price: 1.08150, sl: 1.07900, tp: 1.08700 },
      { id: 'o2', sym: 'GBPUSD', type: 'SELL STOP', vol: 0.4, price: 1.26800, sl: 1.27200, tp: 1.26100 }
    ],
    backtests: [
      { id: 'bt_7a', name: 'EURUSD M1 · Momentum v3', status: 'completed', date: Date.now() - 86400000 * 2, seed: 42, metrics: { net: 1842.3, ret: 18.42, dd: 6.8, sharpe: 2.14, sortino: 2.91, pf: 1.86, trades: 312, win: 58.3 }, series: null },
      { id: 'bt_3c', name: 'BTCUSDT Tick · Mean-rev', status: 'completed', date: Date.now() - 86400000 * 5, seed: 7, metrics: { net: -412.0, ret: -4.12, dd: 9.4, sharpe: -0.41, sortino: -0.5, pf: 0.74, trades: 88, win: 41.0 }, series: null },
      { id: 'bt_9f', name: 'Multi-asset · Trend-follow', status: 'completed', date: Date.now() - 86400000 * 9, seed: 123, metrics: { net: 5210.7, ret: 52.1, dd: 11.2, sharpe: 1.78, sortino: 2.4, pf: 2.1, trades: 540, win: 52.7 }, series: null }
    ],
    opts: [
      { id: 'op_2b', name: 'EURUSD GA · 50 gen', status: 'completed', date: Date.now() - 86400000 * 1, gen: 50, best: 2.41, hyper: true }
    ],
    crons: [
      { id: 'cj1', expr: '0 22 * * 5', cmd: 1300, enabled: true, next: 'Fri 22:00 UTC', desc: 'Weekly continuous optimisation' },
      { id: 'cj2', expr: '0 0 * * *', cmd: 1500, enabled: true, next: 'Daily 00:00 UTC', desc: 'Nightly performance report' },
      { id: 'cj3', expr: '30 23 * * 0', cmd: 1400, enabled: false, next: '—', desc: 'Sunday extension reload' }
    ],
    schedules: [
      { id: 'sc1', time: '2026-07-22 08:30 UTC', cmd: 1100, repeat: false, desc: 'Start London session live' },
      { id: 'sc2', time: '2026-07-25 16:00 UTC', cmd: 1101, repeat: false, desc: 'Stop before weekend' }
    ],
    extensions: [
      { id: 'e1', name: 'MetaTrader5Adapter', cat: 'Adapters', ver: '1.4.2', sdk: '1.0.0', signed: true, active: true, source: 'Marketplace', author: 'Razor Co.', desc: 'MT5 broker connectivity with execution & history.' },
      { id: 'e2', name: 'BinanceSpotAdapter', cat: 'Adapters', ver: '2.0.1', sdk: '1.0.0', signed: true, active: true, source: 'Marketplace', author: 'Razor Co.', desc: 'Binance Spot REST+WS adapter.' },
      { id: 'e3', name: 'MockAdapter', cat: 'Adapters', ver: '1.0.0', sdk: '1.0.0', signed: true, active: false, source: 'Bundled', author: 'Razor Co.', desc: 'Records orders without execution (dev tier).' },
      { id: 'e4', name: 'MomentumStrategy', cat: 'Strategies', ver: '3.1.0', sdk: '1.0.0', signed: true, active: true, source: 'Local', author: 'You', desc: 'Dual-EMA momentum with RSI filter.' },
      { id: 'e5', name: 'MeanReversionNN', cat: 'Strategies', ver: '1.2.0', sdk: '1.0.0', signed: true, active: false, source: 'Marketplace', author: 'QuantLab', desc: 'NN-driven mean reversion, requires NN slot.' },
      { id: 'e6', name: 'ATR / RSI / MACD pack', cat: 'Indicators', ver: '1.0.5', sdk: '1.0.0', signed: true, active: true, source: 'Bundled', author: 'Razor Co.', desc: 'Tick-native indicator set.' },
      { id: 'e7', name: 'RiskGuardPlugin', cat: 'Hook Plugins', ver: '1.1.0', sdk: '1.0.0', signed: true, active: true, source: 'Marketplace', author: 'You', desc: 'Order-validation filter hook (max drawdown gate).' },
      { id: 'e8', name: 'TelegramNotifyPlugin', cat: 'Hook Plugins', ver: '0.9.3', sdk: '1.0.0', signed: true, active: false, source: 'Marketplace', author: 'Community', desc: 'Action hooks → Telegram alerts.' },
      { id: 'e9', name: 'FeedForwardDQN', cat: 'NeuralNetworks', ver: '1.0.0', sdk: '1.0.0', signed: true, active: false, source: 'Marketplace', author: 'QuantLab', desc: 'RL-DQN model, 1280 params.' }
    ],
    reports: [
      { id: 'r1', name: 'EURUSD Momentum v3 — Full', fmt: 'PDF', size: '2.4 MB', date: Date.now() - 3600000 * 5, src: 'bt_7a' },
      { id: 'r2', name: 'Optimization op_2b — Population', fmt: 'Excel', size: '880 KB', date: Date.now() - 86400000, src: 'op_2b' },
      { id: 'r3', name: 'Weekly P&L summary', fmt: 'JSON', size: '42 KB', date: Date.now() - 86400000 * 3, src: 'bt_9f' }
    ],
    secrets: [
      { id: 's1', name: 'MT5 Production', broker: 'MetaTrader5', val: 'a8K2mPq9Lz4XnR7v', created: Date.now() - 86400000 * 30 },
      { id: 's2', name: 'Binance Main', broker: 'Binance', val: 'BN_x92kLm4pQr7Zt3wVc8', created: Date.now() - 86400000 * 12 }
    ],
    logs: [],
    notifs: [
      { id: 'n1', ic: 'zap', t: 'Optimization op_2b completed', d: 'Best fitness 2.41 after 50 generations. Inject genes to live?', tm: Date.now() - 1800000 },
      { id: 'n2', ic: 'radio', t: 'Engine PROD-HELSINKI-02 reconnected', d: 'Fallback → Primary endpoint restored.', tm: Date.now() - 5400000 },
      { id: 'n3', ic: 'shield', t: 'New Engine version 1.0.1 available', d: 'Self-update staged on 1 instance.', tm: Date.now() - 86400000 },
      { id: 'n4', ic: 'alert', t: 'Tick freshness warning', d: 'DEV-LOCAL-01 last tick 4.2s ago (offline).', tm: Date.now() - 86400000 * 2 }
    ],
    broadcasts: [
      { id: 'b1', text: 'Scheduled maintenance on cloud.razor-fallback.io — Sat 02:00–02:30 UTC. Primary endpoint unaffected.', style: 'info', date: Date.now() - 86400000 }
    ],
    users: [
      { id: 'u1', name: 'Elena Voss', email: 'trader@razor.io', tier: 'Professional', inst: 2, status: 'active', joined: '2025-09-14' },
      { id: 'u2', name: 'Marcus Chen', email: 'dev@razor.io', tier: 'Free Developer', inst: 1, status: 'active', joined: '2026-06-02' },
      { id: 'u3', name: 'Sofia Almeida', email: 'sofia@hedge.io', tier: 'Enterprise', inst: 6, status: 'active', joined: '2025-03-21' },
      { id: 'u4', name: 'Kenji Tanaka', email: 'kenji@prop.jp', tier: 'Professional', inst: 3, status: 'suspended', joined: '2025-11-08' },
      { id: 'u5', name: 'Liam O’Brien', email: 'liam@desk.ie', tier: 'Professional', inst: 2, status: 'active', joined: '2026-01-19' },
      { id: 'u6', name: 'Priya Nair', email: 'priya@quant.in', tier: 'Free Developer', inst: 1, status: 'active', joined: '2026-05-30' }
    ],
    licenses: [
      { id: 'l1', key: 'RZR-PRO-9F2K-Q7XL', user: 'trader@razor.io', tier: 'Professional', expires: '2026-11-21', feats: '100-111' },
      { id: 'l2', key: 'RZR-DEV-AP3C-LM9Z', user: 'dev@razor.io', tier: 'Free Developer', expires: '∞', feats: '100-104,109' },
      { id: 'l3', key: 'RZR-ENT-X4M2-P8QW', user: 'sofia@hedge.io', tier: 'Enterprise', expires: '2027-03-21', feats: '100-111' }
    ],
    listings: [
      { id: 'm1', name: 'BinanceSpotAdapter', type: 'Adapter', price: 'Free', dl: 18420, status: 'featured', author: 'Razor Co.', rating: 4.9, sdk: '1.0.0', desc: 'Native WebSocket + REST execution adapter for Binance Spot.' },
      { id: 'm2', name: 'MeanReversionNN', type: 'Strategy', price: '$49', dl: 3120, status: 'approved', author: 'QuantLab', rating: 4.7, sdk: '1.0.0', desc: 'Feed-forward neural network with automated RSI & Bollinger bands filtering.' },
      { id: 'm3', name: 'TelegramNotifyPlugin', type: 'Hook Plugin', price: '$9', dl: 9870, status: 'approved', author: 'Community', rating: 4.8, sdk: '1.0.0', desc: 'Synchronous action hook sending instant Telegram fill notifications.' },
      { id: 'm4', name: 'FeedForwardDQN', type: 'NN Model', price: '$129', dl: 640, status: 'approved', author: 'QuantLab', rating: 4.5, sdk: '1.0.0', desc: 'Reinforcement learning Q-network model, 1280 parameters compatible with GA.' },
      { id: 'm5', name: 'VolatilityRegimeFilter', type: 'Hook Plugin', price: '$19', dl: 210, status: 'pending', author: 'Elena Voss', rating: 5.0, sdk: '1.0.0', desc: 'GARCH(1,1) volatility filter hook plugin rejecting trades in high-spread regimes.' },
      { id: 'm6', name: 'InteractiveBrokersFixAdapter', type: 'Adapter', price: '$99', dl: 1420, status: 'approved', author: 'Razor Co.', rating: 4.9, sdk: '1.0.0', desc: 'Institutional FIX 4.4 adapter for Interactive Brokers TWS/Gateway.' }
    ],
    flowRuns: [
      {
        id: 'run-bt-01',
        name: 'EURUSD M1 Golden Hash Replay',
        kind: 'Backtest',
        status: 'Completed',
        parentRunId: null,
        relation: null,
        continuity: 'Contiguous',
        netProfit: 1842.30,
        totalReturn: 18.42,
        sharpe: 2.14,
        sortino: 2.91,
        pf: 1.86,
        maxDrawdown: 6.8,
        tradeCount: 312,
        winRate: 58.3,
        bestFitness: null,
        isPartial: false,
        headlineFiguresSuppressed: false,
        goldenHash: '9a7fbc2041d8e12a',
        createdAt: Date.now() - 86400000 * 2,
        interventions: [],
        gaps: []
      },
      {
        id: 'run-bt-02',
        name: 'EURUSD M1 Diverged @ Step 150',
        kind: 'Backtest',
        status: 'Completed',
        parentRunId: 'run-bt-01',
        relation: 'Branched',
        continuity: 'Contiguous',
        forkPointStep: 150,
        baseSeed: 42,
        netProfit: 2105.80,
        totalReturn: 21.05,
        sharpe: 2.38,
        sortino: 3.12,
        pf: 2.05,
        maxDrawdown: 5.4,
        tradeCount: 340,
        winRate: 61.2,
        isPartial: false,
        headlineFiguresSuppressed: false,
        goldenHash: '5e81d74c0b2f9131',
        createdAt: Date.now() - 86400000 * 1,
        interventions: [
          { id: 'iv1', step: 150, actor: 'Elena Voss', reason: 'Tuned StopLoss cushion from 1.0 to 1.5 pips', previousFingerprint: 'FP-SL-10', newFingerprint: 'FP-SL-15', modificationsSummary: 'StopLoss multiplier adjusted' }
        ],
        gaps: []
      },
      {
        id: 'run-live-01',
        name: 'London Session MT5 Live (Gapped)',
        kind: 'LiveTrading',
        status: 'Running',
        parentRunId: null,
        relation: null,
        continuity: 'Gapped',
        netProfit: 840.50,
        totalReturn: 8.41,
        sharpe: 1.82,
        sortino: 2.10,
        pf: 1.65,
        maxDrawdown: 4.1,
        tradeCount: 42,
        winRate: 64.0,
        isPartial: true,
        headlineFiguresSuppressed: true,
        divergenceFlag: 'Gapped: Reconnection drop 240s',
        goldenHash: '3b19f041de99c011',
        createdAt: Date.now() - 3600000 * 8,
        interventions: [
          { id: 'iv2', step: 84, actor: 'SystemOrchestrator', reason: 'Emergency flatten triggered on latency spike', previousFingerprint: 'FP-RISK-01', newFingerprint: 'FP-RISK-EMERGENCY' }
        ],
        gaps: [
          { id: 'gap1', startStep: 45, endStep: 52, reason: 'Broker WebSocket disconnect / feed timeout', missingTicks: 1420, replayed: false }
        ]
      },
      {
        id: 'run-wf-01',
        name: 'XAUUSD 5-Window Anchored WFA',
        kind: 'WalkForward',
        status: 'Completed',
        parentRunId: null,
        relation: null,
        continuity: 'Contiguous',
        netProfit: 4620.10,
        totalReturn: 46.20,
        sharpe: 1.95,
        sortino: 2.50,
        pf: 1.92,
        maxDrawdown: 8.2,
        tradeCount: 184,
        winRate: 55.4,
        wfe: 78.4,
        isPartial: false,
        headlineFiguresSuppressed: false,
        goldenHash: '7f9a12c8401e56b4',
        createdAt: Date.now() - 86400000 * 3,
        interventions: [],
        gaps: []
      },
      {
        id: 'run-opt-01',
        name: 'CfdSmtDivergence GA 50-Gen',
        kind: 'Optimization',
        status: 'Completed',
        parentRunId: null,
        relation: null,
        continuity: 'Contiguous',
        netProfit: 3140.00,
        totalReturn: 31.40,
        sharpe: 2.21,
        sortino: 2.85,
        pf: 1.98,
        maxDrawdown: 7.1,
        bestFitness: 2.41,
        tradeCount: 410,
        winRate: 59.8,
        isPartial: false,
        headlineFiguresSuppressed: false,
        goldenHash: '1c49e0b92a5431ff',
        createdAt: Date.now() - 86400000 * 4,
        interventions: [],
        gaps: []
      }
    ],
    walkForwardWindows: [
      { id: 'w1', runId: 'run-wf-01', windowIndex: 1, inSampleSharpe: 2.45, outOfSampleSharpe: 1.92, wfe: 78.3, inSampleReturn: 12.4, outOfSampleReturn: 9.1, trainPeriod: '2026-01-01 to 2026-03-01', testPeriod: '2026-03-01 to 2026-04-01', bestGenes: [2, 4, 0.00012, 1, 1, 1, 0, 1] },
      { id: 'w2', runId: 'run-wf-01', windowIndex: 2, inSampleSharpe: 2.31, outOfSampleSharpe: 1.85, wfe: 80.1, inSampleReturn: 14.1, outOfSampleReturn: 11.2, trainPeriod: '2026-02-01 to 2026-04-01', testPeriod: '2026-04-01 to 2026-05-01', bestGenes: [3, 5, 0.00014, 1, 1, 1, 1, 1] },
      { id: 'w3', runId: 'run-wf-01', windowIndex: 3, inSampleSharpe: 2.60, outOfSampleSharpe: 1.98, wfe: 76.2, inSampleReturn: 11.8, outOfSampleReturn: 8.8, trainPeriod: '2026-03-01 to 2026-05-01', testPeriod: '2026-05-01 to 2026-06-01', bestGenes: [2, 3, 0.00010, 1, 1, 0, 1, 1] },
      { id: 'w4', runId: 'run-wf-01', windowIndex: 4, inSampleSharpe: 2.15, outOfSampleSharpe: 1.70, wfe: 79.1, inSampleReturn: 13.5, outOfSampleReturn: 10.4, trainPeriod: '2026-04-01 to 2026-06-01', testPeriod: '2026-06-01 to 2026-07-01', bestGenes: [4, 6, 0.00016, 1, 0, 1, 1, 1] },
      { id: 'w5', runId: 'run-wf-01', windowIndex: 5, inSampleSharpe: 2.52, outOfSampleSharpe: 1.96, wfe: 77.8, inSampleReturn: 15.0, outOfSampleReturn: 11.5, trainPeriod: '2026-05-01 to 2026-07-01', testPeriod: '2026-07-01 to 2026-08-01', bestGenes: [3, 4, 0.00011, 1, 1, 1, 1, 0] }
    ],
    communityThreads: [
      {
        id: 'th-1',
        title: 'RFC: Zero-Copy MemoryMapped Tick Buffer for High-Frequency Optimization',
        category: 'Strategies',
        authorName: 'Elena Voss',
        authorBadge: 'Verified Dev',
        content: 'We have been benchmarking `MemoryMappedTickList` against unmanaged pointers in .NET 10. The L1/L2 cache locality when using `CustomizedRandom` xorshift128+ PRNG yields a 4.2x speedup over standard allocations.\n\nKey finding: keeping `.chrs` raw tick structs blittable prevents GC collections entirely during 50-generation sweeps.',
        upvotes: 42,
        repliesCount: 3,
        createdAt: Date.now() - 86400000 * 3
      },
      {
        id: 'th-2',
        title: 'Announcement: Razor Engine 1.0.0 LTS Architecture Released',
        category: 'Announcements',
        authorName: 'Razor Core Team',
        authorBadge: 'Core Team',
        content: 'Welcome to Razor 1.0.0 LTS! The engine is now completely headless with zero-trust WebSocket protocol, deterministic golden-hash reproduction, and multi-slot hot-reloading (Adapters, Strategies, Neural Networks, and Hook Plugins).\n\nDocumentation and technical specifications are available in the repository docs.',
        upvotes: 98,
        repliesCount: 6,
        createdAt: Date.now() - 86400000 * 7
      },
      {
        id: 'th-3',
        title: 'Best practices for SMT Divergence across correlated FX pairs',
        category: 'Strategies',
        authorName: 'Marcus Chen',
        authorBadge: 'Trader',
        content: 'When tracking EURUSD vs GBPUSD 5-minute bars, should the stop-loss cushion be scaled by Average True Range or fixed pip distance?\n\nIn our preliminary walk-forward runs, a 1.0 pip safety cushion reduced false stop-outs by 14% compared to tight pivot swings.',
        upvotes: 27,
        repliesCount: 2,
        createdAt: Date.now() - 86400000 * 1
      },
      {
        id: 'th-4',
        title: 'MT5 Adapter Socket Bridge configuration on Linux via Wine',
        category: 'Additives',
        authorName: 'Liam O’Brien',
        authorBadge: 'Community',
        content: 'Here is a quick setup guide for running the `Mql5BridgeEA` on Debian 12 with headless Wine and Podman. The loopback port 5555 communicates directly with Razor Engine without root privileges.',
        upvotes: 35,
        repliesCount: 4,
        createdAt: Date.now() - 86400000 * 5
      }
    ],
    communityReplies: [
      { id: 'rep-1', threadId: 'th-1', authorName: 'Marcus Chen', authorBadge: 'Trader', content: 'Can confirm! On our AMD EPYC workstation, mapping 2.1B ticks ran under 2.8ms per chromosome evaluation.', upvotes: 9, createdAt: Date.now() - 86400000 * 2 },
      { id: 'rep-2', threadId: 'th-1', authorName: 'Aria Sterling', authorBadge: 'Core Team', content: 'Make sure `DataActionPolicy.PersistentCache` is set so the adapter retains mapped chunks across multiple GA cycles.', upvotes: 14, createdAt: Date.now() - 86400000 * 2 + 3600000 },
      { id: 'rep-3', threadId: 'th-2', authorName: 'Elena Voss', authorBadge: 'Verified Dev', content: 'Congratulations on the LTS milestone! The new FastEndpoints contract architecture in Cloud is very clean.', upvotes: 18, createdAt: Date.now() - 86400000 * 6 }
    ],
    tickets: [
      {
        id: 'tk-01',
        authorName: 'Elena Voss',
        targetType: 'SystemManager',
        targetItemName: null,
        category: 'Incident',
        priority: 'High',
        status: 'Open',
        title: 'Fallback endpoint latency spike during Frankfurt market open',
        desc: 'Noticed tick latency jumped from 38ms to 320ms on PROD-FRANKFURT-01 at 08:00 UTC. Suspecting network routing failover on primary link.',
        createdAt: Date.now() - 3600000 * 2
      },
      {
        id: 'tk-02',
        authorName: 'Marcus Chen',
        targetType: 'AdditiveDeveloper',
        targetItemName: 'MetaTrader5Adapter',
        category: 'Bug',
        priority: 'Medium',
        status: 'InProgress',
        title: 'Socket buffer overflow on JPY pair pip value calculation',
        desc: 'When streaming USDJPY ticks with 3-digit quotes, pipValuePerLot calculation throws arithmetic clamp overflow if bid is zero.',
        createdAt: Date.now() - 86400000 * 1
      },
      {
        id: 'tk-03',
        authorName: 'Elena Voss',
        targetType: 'SystemManager',
        targetItemName: null,
        category: 'FeatureRequest',
        priority: 'Low',
        status: 'Resolved',
        title: 'Requesting F108 capability license activation for second instance',
        desc: 'Need self-update permissions enabled on PROD-HELSINKI-02 for automated continuous integration pipeline testing.',
        createdAt: Date.now() - 86400000 * 4
      }
    ],
    ticketMessages: [
      { id: 'tm-1', ticketId: 'tk-01', authorName: 'Elena Voss', isStaff: false, message: 'We noticed a 320ms latency jump on Frankfurt at 08:00 UTC. Is there a maintenance window?', createdAt: Date.now() - 3600000 * 2 },
      { id: 'tm-2', ticketId: 'tk-01', authorName: 'Aria Sterling (Staff)', isStaff: true, message: 'Investigating with the datacentre provider. Cloud failover automatically rerouted non-urgent telemetry.', createdAt: Date.now() - 3600000 * 1 },
      { id: 'tm-3', ticketId: 'tk-02', authorName: 'Marcus Chen', isStaff: false, message: 'Trace log shows exception in `Mt5MarketCalculator.CalculatePipValue` line 412.', createdAt: Date.now() - 86400000 * 1 },
      { id: 'tm-4', ticketId: 'tk-02', authorName: 'Razor Co. Developer', isStaff: true, message: 'Patched in v1.4.3 PR. Testing fix against JPY tick synthesis tests now.', createdAt: Date.now() - 3600000 * 12 },
      { id: 'tm-5', ticketId: 'tk-03', authorName: 'Aria Sterling (Staff)', isStaff: true, message: 'F108 enabled on licence RZR-PRO-9F2K. Please reload engine configuration.', createdAt: Date.now() - 86400000 * 3 }
    ],
    accounts: [
      { id: 'acc-mt5-pro', name: 'MetaTrader 5 - Raw Spread', broker: 'IC Markets (Bermuda)', server: 'ICMarketsSC-Live', accountNumber: '4820914', type: 'Hedge', currency: 'USD', balance: 25480.00, equity: 25624.50, margin: 1240.00, freeMargin: 24384.50, leverage: '1:500', status: 'Connected' },
      { id: 'acc-ibkr-inst', name: 'Interactive Brokers Institutional', broker: 'Interactive Brokers LLC', server: 'gw1.ibkr.cloud', accountNumber: 'U8193021', type: 'Portfolio Margin', currency: 'USD', balance: 100000.00, equity: 102410.00, margin: 8500.00, freeMargin: 93910.00, leverage: '1:30', status: 'Connected' },
      { id: 'acc-binance-inst', name: 'Binance Institutional Prime', broker: 'Binance Prime', server: 'fix.binance.com', accountNumber: 'PRIME-89104', type: 'Spot Margin', currency: 'USDT', balance: 45000.00, equity: 45180.20, margin: 2100.00, freeMargin: 43080.20, leverage: '1:10', status: 'Connected' }
    ],
    featureFlags: Object.fromEntries(window.FEATURES.map(f => [f.id, true])),
    audit: [
      { id: 'a1', who: 'admin@razor.io', act: 'Issued license RZR-PRO-9F2K', tm: Date.now() - 86400000 * 2, ip: '10.0.4.12' },
      { id: 'a2', who: 'admin@razor.io', act: 'Suspended user kenji@prop.jp', tm: Date.now() - 86400000 * 4, ip: '10.0.4.12' },
      { id: 'a3', who: 'admin@razor.io', act: 'Broadcast sent (info)', tm: Date.now() - 86400000, ip: '10.0.4.12' },
      { id: 'a4', who: 'admin@razor.io', act: 'Approved listing MeanReversionNN', tm: Date.now() - 86400000 * 6, ip: '10.0.4.12' },
      { id: 'a5', who: 'admin@razor.io', act: 'Resolved ticket tk-03 (F108 capability)', tm: Date.now() - 86400000 * 3, ip: '10.0.4.12' }
    ]
  };

  function loadDB() {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = Object.assign({}, SEED_DB, parsed);
        for (const k in SEED_DB) {
          if (!merged[k] || (Array.isArray(SEED_DB[k]) && !merged[k].length && SEED_DB[k].length)) {
            merged[k] = JSON.parse(JSON.stringify(SEED_DB[k]));
          }
        }
        return merged;
      }
    } catch (e) {
      console.warn('Failed to load DB from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(SEED_DB));
  }

  window.DB = loadDB();

  window.saveDB = function() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(window.DB));
    } catch (e) {
      console.warn('Failed to persist DB to localStorage:', e);
    }
  };

  // State
  function loadUser() {
    try {
      const u = localStorage.getItem(USER_KEY);
      if (u) return JSON.parse(u);
    } catch (e) {}
    // Default to trader if not logged in
    return window.USERS[0];
  }

  window.S = {
    user: loadUser(),
    role: loadUser() ? loadUser().role : 'trader',
    page: 'overview',
    live: {
      running: false,
      paused: false,
      bal: 10000,
      start: 10000,
      eq: 10000,
      series: [],
      ticks: [],
      tickAge: 80,
      adapter: 'MetaTrader5Adapter',
      symbol: 'EURUSD',
      magic: 123456,
      guard: 5,
      behavior: false,
      dd: 0,
      peak: 10000,
      margin: 0,
      positions: []
    },
    bt: { running: false, progress: 0, timer: null, current: null },
    opt: { running: false, paused: false, gen: 0, total: 50, pop: 100, best: -Infinity, fitness: [], timer: null, hyper: false, stagn: 0, lastBest: -Infinity },
    logStream: true,
    logFilter: '',
    palIdx: 0,
    palItems: []
  };

  window.saveUserSession = function(user) {
    window.S.user = user;
    window.S.role = user ? user.role : 'trader';
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };
})();
