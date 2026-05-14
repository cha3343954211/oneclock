/**
 * wisdomPool.ts
 * 无 API 时的本地语句池。按主题 × 时段分类，每槽 3 条，随机取一。
 * 格式与 AI 输出保持一致：英文\n中文
 */

type TimePeriod = 'latenight' | 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

function getTimePeriod(hour: number): TimePeriod {
  if (hour < 5)  return 'latenight';
  if (hour < 7)  return 'dawn';
  if (hour < 11) return 'morning';
  if (hour < 14) return 'noon';
  if (hour < 18) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── 主题语句池 ─────────────────────────────────────────────────────────────

const POOL: Record<string, Record<TimePeriod, string[]>> = {

  // ── Midnight Void：极简、存在主义、哲学感 ──
  'Midnight Void': {
    latenight: [
      "In the hollow of midnight, thought becomes its purest form.\n午夜的寂静里，思想回归最纯粹的形态。",
      "The clock ticks alone; the world has closed its eyes.\n时钟独自滴答，世界已合上双眼。",
      "Three AM knows the secrets daylight refuses to hold.\n凌晨三点，承载着白昼不肯容纳的秘密。",
    ],
    dawn: [
      "Before the first light, everything is still possible.\n第一缕光到来之前，万物皆有可能。",
      "Dawn arrives without apology, erasing the night.\n黎明无声而至，抹去了整夜的黑暗。",
      "The horizon holds its breath before the sun breaks through.\n地平线屏住呼吸，等待旭日破晓。",
    ],
    morning: [
      "A new day rises without asking permission.\n新的一天，无需许可便已到来。",
      "Morning: the universe resets its counter, again.\n清晨，宇宙再一次归零，重新计数。",
      "Light fills the void; even emptiness has a beginning.\n光充满虚空，即便空无也有起点。",
    ],
    noon: [
      "The sun reaches its peak, indifferent to our urgency.\n烈日登顶，对我们的急切漠然置之。",
      "Noon halts the day; everything pauses to take stock.\n正午悬停，万物短暂驻足以审视自身。",
      "At the apex of light, shadows become their shortest.\n光芒最盛时，影子也缩至最短。",
    ],
    afternoon: [
      "The afternoon unfolds with neither hurry nor hesitation.\n午后徐徐展开，不急也不迟疑。",
      "Time slows in the afternoon, generous with its hours.\n午后时光放慢脚步，慷慨给予每一刻。",
      "Gold light angles through — a reminder all days end.\n斜金光穿过，提醒每一天终将落幕。",
    ],
    evening: [
      "Day dissolves at the edges, fading into what comes next.\n白昼从边缘消融，渐渐归于下一章。",
      "Dusk is the universe exhaling after a long shift.\n黄昏是宇宙在漫长一天后的缓缓吐息。",
      "The evening asks nothing; it only offers quiet.\n黄昏不求什么，只是给予安静。",
    ],
    night: [
      "Darkness is not absence — it is presence without form.\n黑暗并非缺席，而是无形的存在。",
      "The night enfolds everything with indifferent grace.\n夜以淡然的优雅将万物收入怀抱。",
      "Before sleep, the mind visits everywhere it dared not go.\n入睡之前，心灵走遍了白天不敢去的地方。",
    ],
  },

  // ── Paper White：文学感、书写、诗意 ──
  'Paper White': {
    latenight: [
      "Past midnight, words come easier than they should.\n过了午夜，文字反而比白天更容易流淌。",
      "The white page waits; silence is its own language.\n白页静候，寂静本身就是一种语言。",
      "Night keeps only the thoughts worth keeping.\n夜晚只留下值得留存的思绪。",
    ],
    dawn: [
      "Before the world wakes, silence writes its finest verse.\n世界未醒，寂静写下最美的诗行。",
      "Dawn is a draft; the day will revise everything.\n黎明是草稿，白天将逐字修改。",
      "First light, first thought — both arrive uninvited.\n第一缕光，第一个念头，皆不期而至。",
    ],
    morning: [
      "Morning pages, morning light — both ask for honesty.\n晨间书页，晨间光影，皆寻求真诚。",
      "A fresh cup, a fresh start — even the ordinary is enough.\n新鲜的一杯，崭新的开始，平凡已然足够。",
      "Write down the day before it writes over you.\n书写这一天，否则它将书写你。",
    ],
    noon: [
      "Midday light exposes the margins we left blank.\n正午的光照出我们留白的边距。",
      "Noon is an inventory: what remains after the morning?\n正午是清点，经过清晨，还剩下什么？",
      "The afternoon belongs to those who notice small things.\n午后属于那些留心细微之处的人。",
    ],
    afternoon: [
      "Slow hours, good ink — afternoon is made for refinement.\n慢慢流淌的时光，上好的墨水，午后是精炼之时。",
      "Every afternoon holds a sentence worth repeating.\n每个午后都藏着一句值得反复吟诵的话。",
      "Let the light read your page before evening closes it.\n让光线读过你的书页，再让黄昏将它合上。",
    ],
    evening: [
      "Evening turns the ordinary into something worth remembering.\n黄昏将平凡化为值得铭记的时光。",
      "At dusk, the unfinished gains a kind of beauty.\n黄昏时，未竟之事也染上了一种美。",
      "The last light edits everything into its best version.\n最后的光将一切修订为最好的版本。",
    ],
    night: [
      "Night is a blank page; dreams do the writing.\n夜是白页，梦为笔墨。",
      "Close the book on today; tomorrow opens a new chapter.\n合上今日之书，明日翻开新的篇章。",
      "The night collects what the day scattered.\n夜晚收拢白天散落的一切。",
    ],
  },

  // ── Cyberpunk Neon：科技感、未来主义、代码隐喻 ──
  'Cyberpunk Neon': {
    latenight: [
      "3 AM: the hour when networks breathe and algorithms dream.\n凌晨三点，网络喘息，算法入梦。",
      "The neon never sleeps; neither does the code beneath it.\n霓虹永不熄灭，其下运行的代码亦然。",
      "Midnight packets carry the weight of every unanswered query.\n午夜的数据包承载着每一个未得回应的请求。",
    ],
    dawn: [
      "Boot sequence initializes at dawn; a new build begins.\n黎明触发启动序列，新一次构建开始。",
      "First light in the city — even darkness has a startup time.\n都市中的第一道光，黑暗也有启动时间。",
      "The grid awakens before the people who built it.\n数据网格先于建造它的人醒来。",
    ],
    morning: [
      "System boot complete. Another simulation begins.\n系统启动完毕，又一次模拟开始。",
      "Morning login: identify yourself to the day ahead.\n晨间登录，向即将展开的这一天验证你的身份。",
      "Update your variables; yesterday's values are deprecated.\n更新你的变量，昨天的值已被弃用。",
    ],
    noon: [
      "Peak load — even machines need a moment to think.\n峰值时刻，连机器也需片刻思考。",
      "Noon throughput: measure what actually matters today.\n正午吞吐量，衡量今天真正重要的事。",
      "Memory leak detected in the afternoon; flush old loops.\n午后检测到内存溢出，清除旧的循环。",
    ],
    afternoon: [
      "Deep work mode: disable notifications, enable focus.\n深度工作模式：关闭通知，开启专注。",
      "Signal-to-noise ratio drops in the afternoon. Filter well.\n午后信噪比下降，请善加过滤。",
      "Version 14:00 of yourself — what upgrades did you ship?\n14:00 版本的你，升级了什么？",
    ],
    evening: [
      "Neon fades slower than sunsets; both end eventually.\n霓虹比落日消散得慢，但终究会熄灭。",
      "Evening commit: push your progress before the day closes.\n黄昏提交，在这一天关闭前推送你的进度。",
      "The city's light show begins — spectacle instead of stars.\n都市灯光秀开幕，以奇景代替了星辰。",
    ],
    night: [
      "The grid never sleeps. Neither should your ambition.\n数据网格永不停息，你的野心亦然。",
      "Night mode: high contrast, low distraction, pure signal.\n夜间模式：高对比，低干扰，纯信号。",
      "Debug your day before sleep compiles tomorrow's branch.\n在睡眠编译明日分支之前，调试你的这一天。",
    ],
  },

  // ── Misty Forest：自然、禅意、平静 ──
  'Misty Forest': {
    latenight: [
      "The forest breathes in the dark; so do things unseen.\n森林在黑暗中呼吸，那些看不见的也是。",
      "Silence past midnight holds the patience of old trees.\n午夜后的寂静，藏着老树般的耐心。",
      "Even the deepest roots rest when the stars are out.\n繁星高悬时，连最深的根也在歇息。",
    ],
    dawn: [
      "Fog lifts slowly; patience is the forest's first lesson.\n雾气缓缓升起，耐心是森林的第一课。",
      "Dawn in the forest: every branch holds its cold dew.\n林中拂晓，每根枝桠都托着清冷的露珠。",
      "The first birdsong doesn't ask if anyone is listening.\n第一声鸟鸣，不问是否有人在聆听。",
    ],
    morning: [
      "Birdsong needs no composer; nature writes its own score.\n鸟鸣无需作曲，自然谱写自己的乐章。",
      "Morning mist thins; the path that was hidden is now clear.\n晨雾渐散，曾经隐匿的小路重新清晰。",
      "Each leaf is its own clock, opening with the morning light.\n每片叶子都是自己的时钟，随晨光展开。",
    ],
    noon: [
      "At noon, the forest holds still in warm and heavy light.\n正午，森林在浓重的暖光中静静悬停。",
      "Midday sun through the canopy — everything dappled, nothing certain.\n正午阳光穿透树冠，斑驳一切，确定无物。",
      "The river doesn't stop at noon; neither should you.\n河流不在正午停歇，你也不必。",
    ],
    afternoon: [
      "Slow afternoons teach trees a thing about rooted stillness.\n漫长午后，大树教人几分扎根的静定。",
      "The forest doesn't hurry autumn; leaves fall when ready.\n森林不催秋天，叶子成熟时自会落下。",
      "Wind stirs the canopy; everything listened, nothing moved.\n风摇树冠，一切聆听，无物妄动。",
    ],
    evening: [
      "Dusk in the woods: where endings become quiet beginnings.\n林中黄昏，终结化为静默的开始。",
      "The evening mist returns; the forest pulls its blanket close.\n暮霭再次弥漫，森林拉紧自己的毯子。",
      "Fireflies emerge when the light decides it has done enough.\n萤火虫在光决定告退时悄然出现。",
    ],
    night: [
      "Under the canopy, the moon finds its own reflection.\n树冠之下，月亮寻见自己的倒影。",
      "The forest at night: loud with creatures, quiet with meaning.\n夜晚的森林，充满生灵的声音，又沉默着意义。",
      "Even the oldest tree was once a seed that trusted the dark.\n即便最古老的树，也曾是颗信任黑暗的种子。",
    ],
  },

  // ── Retro Terminal：黑客文化、复古终端、代码哲学 ──
  'Retro Terminal': {
    latenight: [
      "PROC_ID 0000 / UPTIME 23:xx — the daemon runs through night.\nPROC 守护进程通宵运行，从不请假。",
      "Kernel still awake past midnight; discipline has no cron job.\n内核午夜未眠，纪律没有定时任务。",
      "> WHO IS LOGGED IN AT 2AM? Only those who truly mean it.\n> 凌晨2点谁还在线？只有认真的人。",
    ],
    dawn: [
      "> BOOTING... a new day compiles fresh from source code.\n> 启动中……新的一天从源码重新编译而来。",
      "Cold start at dawn; warm up before the peak load hits.\n黎明冷启动，在峰值到来前充分预热。",
      "The terminal glows green as the sky fades from black.\n终端绿光闪烁，天色从漆黑渐渐褪去。",
    ],
    morning: [
      "Coffee.init() — the most reliable function known to engineers.\nCoffee.init() — 工程师已知最可靠的函数。",
      "STDIN: read the morning. STDOUT: make it count.\nSTDIN: 读取清晨。STDOUT: 让它有意义。",
      "> ./morning.sh — execute the routine, then break from it.\n> ./morning.sh — 执行例程，然后突破它。",
    ],
    noon: [
      "Checkpoint 12:00 reached. Evaluate. Recalibrate. Continue.\n检查点 12:00 到达，评估，重新校准，继续。",
      "Midday: garbage collect the morning's wasted cycles.\n正午：对清晨浪费的时钟周期执行垃圾回收。",
      "> PING YOURSELF — are you still responding as intended?\n> PING 自身，你仍在按预期响应吗？",
    ],
    afternoon: [
      "Focus mode: pipe output through grep for what truly matters.\n专注模式：用 grep 过滤，提取真正重要的内容。",
      "Refactor in the afternoon; hindsight's compiler runs clear.\n午后重构，后见之明的编译器格外清晰。",
      "Don't patch the symptom; trace the error to its origin.\n不要修补症状，将错误追溯至根源。",
    ],
    evening: [
      "18:00: git commit — your work lives beyond your memory now.\n18:00: git commit — 你的工作已超越你的记忆而存在。",
      "> DAILY REVIEW: what shipped, what stalled, what was learned?\n> 每日回顾：交付了什么，卡住了什么，学到了什么？",
      "Save your progress; the universe doesn't autosave for you.\n保存进度，宇宙不会为你自动保存。",
    ],
    night: [
      "The terminal glows green in the dark — still running, still true.\n终端在黑暗中泛着绿光，仍在运行，仍是真实。",
      "Night shift: the code that runs in silence moves the world.\n夜班：在寂静中运行的代码推动着世界。",
      "> SHUTDOWN? [y/n] — tomorrow's branch is already waiting.\n> 关机？[y/n] — 明天的分支已在等待。",
    ],
  },
};

// ─── 通用兜底池（无主题命中时使用）───────────────────────────────────────────

const GENERAL_POOL: Record<TimePeriod, string[]> = {
  latenight: [
    "The quiet hours belong to those who seek them.\n寂静时分，属于寻找它的人。",
    "Past midnight, only what matters stays awake.\n过了午夜，只有重要的事还醒着。",
    "Night keeps its own counsel; morning will translate.\n夜晚自有主张，清晨将为之翻译。",
  ],
  dawn: [
    "Dawn asks only that you notice it.\n黎明只要求你注意到它的到来。",
    "Every beginning is indifferent to what came before.\n每一个开始，对之前发生的事漠然以对。",
    "The horizon brightens before the sun appears.\n地平线在旭日升起前已先行明亮。",
  ],
  morning: [
    "Time flows like a river, endless and serene.\n时光如川，静水流深。",
    "Morning arrives with the same generosity as always.\n清晨以一贯的慷慨到来。",
    "Begin before you are ready; readiness is overrated.\n在准备好之前就开始，准备这件事被高估了。",
  ],
  noon: [
    "The present moment, unrepeatable, passes quietly.\n这一刻，不可复得，悄然而逝。",
    "Still time to choose how today continues.\n仍有时间选择今天如何继续。",
    "Noon is neither beginning nor end — only now.\n正午既非开始也非结束，只有当下。",
  ],
  afternoon: [
    "An ordinary afternoon; that is already enough.\n寻常午后，已然足够。",
    "Hours do not hurry; we are the ones who rush.\n时光不曾匆忙，是我们自己在赶。",
    "What you do with slow time defines the fast.\n你如何对待慢时光，决定了快时光的质地。",
  ],
  evening: [
    "Evening settles everything it cannot explain.\n黄昏将一切无法言说的事都安放妥当。",
    "Day ends not because it must, but because it can.\n白昼落幕，不因必须，而因它可以。",
    "The light fades gently, as if teaching us to let go.\n光线温柔地消退，仿佛在教我们如何放手。",
  ],
  night: [
    "Moments fade; memories remain.\n瞬间消逝，记忆永存。",
    "The present moment is all we truly have.\n活在当下，别无其他。",
    "Rest is not idleness; it is preparation for tomorrow.\n休息不是懒散，而是为明天做准备。",
  ],
};

// ─── 公开接口 ────────────────────────────────────────────────────────────────

/**
 * 根据小时和主题标签，从本地语句池中随机取一条。
 * @param hour        0-23 整数
 * @param themeLabel  主题名称，如 'Misty Forest'
 */
export function getLocalWisdom(hour: number, themeLabel: string): string {
  const period = getTimePeriod(hour);
  const themePool = POOL[themeLabel];
  const bucket = themePool?.[period];
  if (bucket && bucket.length > 0) return pick(bucket);
  // 主题未命中，回退至通用池
  return pick(GENERAL_POOL[period] ?? GENERAL_POOL.morning);
}
