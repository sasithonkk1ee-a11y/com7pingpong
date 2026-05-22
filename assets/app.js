var API_URL = 'https://script.google.com/macros/s/AKfycbwYzQRnsl1atEA_SZTn1KKrWxvF0SEtXy1Y-NT_aEcq6bfsEKX0Xl9li29G01uY0yzB/exec';

// ─── STATE ────────────────────────────────────────────────────────────────────
var state = { players:[], matches:[], currentBracket:'mens', pendingPhoto:null };
var curFilter = 'all';
var curSearch = '';
var curGenderFilter = 'all';

// ─── PHOTO HANDLER ─────────────────────────────────────────────────────────────
function handlePhoto(e){
  var f = e.target.files[0];
  if(!f) return;
  var r = new FileReader();
  r.onload = function(ev){
    state.pendingPhoto = ev.target.result;
    var img = document.getElementById('photo-img');
    img.src = ev.target.result;
    img.style.display = 'block';
    document.getElementById('photo-ph').style.display = 'none';
  };
  r.readAsDataURL(f);
}

function resetPhotoUI(){
  state.pendingPhoto = null;
  var img = document.getElementById('photo-img');
  img.src = '';
  img.style.display = 'none';
  document.getElementById('photo-ph').style.display = '';
  document.getElementById('photo-inp').value = '';
}

// ─── DEFAULT DATA ──────────────────────────────────────────────────────────────
function getDefaultData(){
  return {
    players:[
      {id:1, name:'A. JAYDEN',   team:'ทีม/แผนก', gender:'M', played:12, wins:12, losses:1,  setsFor:20, setsAgainst:9,  points:37, pct:95, status:'WINNER',     photo:null},
      {id:2, name:'B. LISA',     team:'ทีม/แผนก', gender:'F', played:12, wins:8,  losses:2,  setsFor:20, setsAgainst:10, points:34, pct:93, status:'WINNER',     photo:null},
      {id:3, name:'C. JAYDEN',   team:'ทีม/แผนก', gender:'M', played:12, wins:8,  losses:3,  setsFor:20, setsAgainst:18, points:34, pct:99, status:'WINNER',     photo:null},
      {id:4, name:'D. MYRAL',    team:'ทีม/แผนก', gender:'M', played:12, wins:10, losses:4,  setsFor:20, setsAgainst:12, points:34, pct:98, status:'IN_PLAY',    photo:null},
      {id:5, name:'C. MYRAL',    team:'ทีม/แผนก', gender:'F', played:12, wins:10, losses:5,  setsFor:20, setsAgainst:13, points:30, pct:97, status:'IN_PLAY',    photo:null},
      {id:6, name:'B. LISA 2',   team:'ทีม/แผนก', gender:'F', played:12, wins:9,  losses:6,  setsFor:20, setsAgainst:12, points:29, pct:95, status:'IN_PLAY',    photo:null},
      {id:7, name:'G. JAYDEN',   team:'ทีม/แผนก', gender:'M', played:12, wins:7,  losses:7,  setsFor:20, setsAgainst:13, points:23, pct:95, status:'IN_PLAY',    photo:null},
      {id:8, name:'B. SOOKA',    team:'ทีม/แผนก', gender:'F', played:12, wins:6,  losses:8,  setsFor:20, setsAgainst:11, points:22, pct:84, status:'IN_PLAY',    photo:null},
      {id:9, name:'D. CATIIAR',  team:'ทีม/แผนก', gender:'M', played:12, wins:5,  losses:8,  setsFor:20, setsAgainst:16, points:19, pct:82, status:'IN_PLAY',    photo:null},
      {id:10,name:'A. JAYDEN 2', team:'ทีม/แผนก', gender:'M', played:12, wins:4,  losses:9,  setsFor:19, setsAgainst:17, points:15, pct:58, status:'IN_PLAY',    photo:null},
      {id:11,name:'A. JAYDEN 3', team:'ทีม/แผนก', gender:'M', played:12, wins:8,  losses:10, setsFor:19, setsAgainst:19, points:16, pct:58, status:'ELIMINATED', photo:null},
      {id:12,name:'A. JAYDEN 4', team:'ทีม/แผนก', gender:'F', played:12, wins:8,  losses:11, setsFor:19, setsAgainst:19, points:14, pct:58, status:'ELIMINATED', photo:null},
      {id:13,name:'B. LISA 3',   team:'ทีม/แผนก', gender:'F', played:12, wins:7,  losses:12, setsFor:18, setsAgainst:12, points:13, pct:48, status:'ELIMINATED', photo:null},
      {id:14,name:'C. BARDAN',   team:'ทีม/แผนก', gender:'M', played:12, wins:6,  losses:13, setsFor:16, setsAgainst:13, points:12, pct:39, status:'ELIMINATED', photo:null},
      {id:15,name:'B. NNYRAL',   team:'ทีม/แผนก', gender:'F', played:12, wins:4,  losses:14, setsFor:18, setsAgainst:18, points:11, pct:45, status:'ELIMINATED', photo:null},
      {id:16,name:'A. CARSAN',   team:'ทีม/แผนก', gender:'M', played:12, wins:3,  losses:15, setsFor:18, setsAgainst:18, points:10, pct:38, status:'ELIMINATED', photo:null},
      {id:17,name:'A. LISA',     team:'ทีม/แผนก', gender:'F', played:12, wins:5,  losses:16, setsFor:18, setsAgainst:19, points:10, pct:29, status:'ELIMINATED', photo:null},
      {id:18,name:'B. MYRAL',    team:'ทีม/แผนก', gender:'M', played:12, wins:4,  losses:17, setsFor:10, setsAgainst:19, points:9,  pct:28, status:'ELIMINATED', photo:null},
      {id:19,name:'A. JAYDEN 5', team:'ทีม/แผนก', gender:'M', played:12, wins:5,  losses:18, setsFor:10, setsAgainst:19, points:8,  pct:28, status:'ELIMINATED', photo:null},
      {id:20,name:'B. BARDAN',   team:'ทีม/แผนก', gender:'F', played:12, wins:6,  losses:19, setsFor:10, setsAgainst:19, points:8,  pct:19, status:'ELIMINATED', photo:null},
    ],
    matches:[
      {id:1, p1:'A. JAYDEN',  p2:'B. LIGK',   score1:2, score2:0, round:'Round of 32', gender:'M', status:'completed'},
      {id:2, p1:'A. JAYDEN',  p2:'B. LAROY',  score1:3, score2:0, round:'Semi Final',  gender:'M', status:'completed'},
      {id:3, p1:'A. LAYINY',  p2:'A. SASHA',  score1:1, score2:0, round:'Round of 32', gender:'M', status:'completed'},
      {id:4, p1:'B. BARMAN',  p2:'L. LOSER',  score1:3, score2:0, round:'Semi Final',  gender:'M', status:'completed'},
      {id:5, p1:'B. GOOYA',   p2:'B. BOGOSM', score1:1, score2:0, round:'Round of 32', gender:'M', status:'completed'},
      {id:6, p1:'A. JAYMEN',  p2:'B. LISA',   score1:3, score2:1, round:'Final',       gender:'M', status:'live'},
      {id:7, p1:'B. WINMR',   p2:'L. LOSER',  score1:0, score2:0, round:'Final',       gender:'F', status:'live'},
      {id:8, p1:'A. JAYNEN',  p2:'B. LISA',   score1:3, score2:2, round:'Semi Final',  gender:'F', status:'completed'},
      {id:9, p1:'A. RARDEN',  p2:'TBD',       score1:0, score2:0, round:'Semi Final',  gender:'F', status:'live'},
    ]
  };
}

// ─── PERSIST ───────────────────────────────────────────────────────────────────
function saveState(){
  // dedup matches before saving: same p1+p2 in same round+gender → keep latest
  var seen = {};
  state.matches = state.matches.slice().reverse().filter(function(m){
    var key = m.round+'|'+m.gender+'|'+[m.p1,m.p2].sort().join('|');
    if(seen[key]) return false;
    seen[key] = true;
    return true;
  }).reverse();

  var json = JSON.stringify(state);
  try{ localStorage.setItem('com7v3', json); }catch(e){}
}
function loadState(){
  try{
    var s = localStorage.getItem('com7v3');
    if(s){ state = JSON.parse(s); return; }
  }catch(e){}
  var d = getDefaultData();
  state.players = d.players;
  state.matches = d.matches;
  saveState();
}

// ─── CROSS-TAB SYNC ────────────────────────────────────────────────────────────
// When admin saves → index auto-refreshes, and vice versa
function applyFreshState(raw){
  try{
    var fresh = JSON.parse(raw);
    state.players = fresh.players || [];
    state.matches = fresh.matches || [];
    renderAll();
    if(el('all-matches-list') &&
       el('tab-matches') &&
       el('tab-matches').classList.contains('active')){
      renderAllMatches();
    }
    if(el('bracket-view') &&
       el('tab-bracket') &&
       el('tab-bracket').classList.contains('active')){
      renderBracketView();
    }
  }catch(err){}
}

window.addEventListener('storage', function(e){
  if(e.key === 'com7v3' && e.newValue) applyFreshState(e.newValue);
});

// Also reload when user switches back to this tab (e.g. after editing in admin)
document.addEventListener('visibilitychange', function(){
  if(document.visibilityState === 'visible'){
    try{
      var s = localStorage.getItem('com7v3');
      if(s) applyFreshState(s);
    }catch(e){}
  }
});

// ─── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg, err){
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (err ? ' error' : '');
  t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2500);
}

// ─── TABS ──────────────────────────────────────────────────────────────────────
function showTab(name, el){
  document.querySelectorAll('.section').forEach(function(s){ s.classList.remove('active'); });
  document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
  document.getElementById('tab-' + name).classList.add('active');
  el.classList.add('active');
  if(name === 'admin')   { populatePlayerSelects(); renderPlayerMgmt(); }
  if(name === 'bracket') renderBracketView();
  if(name === 'matches') renderAllMatches();
}

// ─── AVATAR HELPERS ────────────────────────────────────────────────────────────
function ava(p, sz){
  sz = sz || 38;
  if(p && p.photo) return '<div class="player-row-avatar" style="width:'+sz+'px;height:'+sz+'px"><img src="'+p.photo+'"/></div>';
  var e = (p && p.gender === 'F') ? '👩' : '👨';
  return '<div class="player-row-avatar" style="width:'+sz+'px;height:'+sz+'px;font-size:'+Math.round(sz*0.45)+'px">'+e+'</div>';
}
function podiumAva(p){
  if(p && p.photo) return '<div class="player-avatar"><img src="'+p.photo+'"/></div>';
  return '<div class="player-avatar">'+(p && p.gender === 'F' ? '👩' : '👨')+'</div>';
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
function renderTopPlayers(){
  var men   = state.players.filter(function(p){ return p.gender==='M'; }).sort(rankComparator).slice(0,3);
  var women = state.players.filter(function(p){ return p.gender==='F'; }).sort(rankComparator).slice(0,3);

  function card(p, rank){
    if(!p) return '<div class="podium-card" style="opacity:0.25;flex:1;max-width:110px"><div style="padding:20px;font-size:28px;text-align:center">?</div></div>';
    return '<div class="podium-card rank-'+rank+'"><div class="rank-badge">'+rank+'</div>'+podiumAva(p)+'<div class="podium-name">'+p.name+'</div><div class="podium-pts">'+p.points+' pts</div></div>';
  }

  var mOrder = [men[1], men[0], men[2]];
  var fOrder = [women[1], women[0], women[2]];
  var mRanks = [2,1,3];

  document.getElementById('men-podium').innerHTML   = mOrder.map(function(p,i){ return card(p, mRanks[i]); }).join('');
  document.getElementById('women-podium').innerHTML = fOrder.map(function(p,i){ return card(p, mRanks[i]); }).join('');
}

function renderOverviewStats(){
  document.getElementById('stat-players').textContent = state.players.length;
  document.getElementById('stat-matches').textContent = state.matches.filter(function(m){ return m.status==='completed'; }).length;
  document.getElementById('stat-live').textContent    = state.matches.filter(function(m){ return m.status==='live'; }).length;

  var upcoming = state.matches.filter(function(m){ return m.status==='upcoming' && m.date; })
    .sort(function(a,b){ return a.date.localeCompare(b.date) || (a.time||'').localeCompare(b.time||''); });
  var el = document.getElementById('stat-next-date');
  if(upcoming.length){
    var nx = upcoming[0];
    var d = new Date(nx.date);
    var dayNames=['อา','จ','อ','พ','พฤ','ศ','ส'];
    var monthNames=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    var line1 = dayNames[d.getDay()]+' '+d.getDate()+' '+monthNames[d.getMonth()];
    el.innerHTML = line1 + (nx.time ? '<br><span style="font-size:13px;color:var(--gold)">'+nx.time+' น.</span>' : '');
  } else {
    el.textContent = '—';
  }
}

// ─── MATCH CARD (Overview recent list) ────────────────────────────────────────
function matchCard(m){
  var isLive = m.status === 'live';
  var isDone = m.status === 'completed';
  var w1 = isDone && m.score1 > m.score2;
  var w2 = isDone && m.score2 > m.score1;
  var gC = m.gender === 'M' ? 'gender-m' : 'gender-f';
  var gL = m.gender === 'M' ? "MEN'S" : "WOMEN'S";
  var dateStr = '';
  if(m.date){
    var d = new Date(m.date);
    var dayNames=['อา','จ','อ','พ','พฤ','ศ','ส'];
    var monthNames=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    dateStr = dayNames[d.getDay()]+' '+d.getDate()+' '+monthNames[d.getMonth()]+(m.time?' · '+m.time+' น.':'');
  }
  return '<div class="match-card'+(isLive?' live-card':'')+'">'+
    '<div style="display:flex;align-items:center;justify-content:center;gap:10px;flex:1;min-width:0;">'+
      '<div style="flex:1;text-align:right;min-width:0;">'+
        '<div class="fix-player-name'+(w1?' winner-name':w2?' loser-name':'')+'" style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right;">'+
          (w1?'🏆 ':'')+m.p1+
        '</div>'+
      '</div>'+
      '<div class="fix-score-box'+(isLive?' box-live':isDone?' box-done':'')+'" style="min-width:64px;height:38px;flex-shrink:0;">'+
        '<span class="fix-score-num'+(isDone?(w1?' s-win':' s-lose'):' s-neutral')+'" style="font-size:17px;padding:0 8px;">'+m.score1+'</span>'+
        '<span class="fix-score-sep" style="font-size:14px;">:</span>'+
        '<span class="fix-score-num'+(isDone?(w2?' s-win':' s-lose'):' s-neutral')+'" style="font-size:17px;padding:0 8px;">'+m.score2+'</span>'+
      '</div>'+
      '<div style="flex:1;text-align:left;min-width:0;">'+
        '<div class="fix-player-name'+(w2?' winner-name':w1?' loser-name':'')+'" style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;">'+
          m.p2+(w2?' 🏆':'')+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;min-width:72px;padding-left:8px;border-left:1px solid var(--border2);">'+
      (isLive?'<span class="live-badge"><span class="live-dot"></span>LIVE</span>':'')+
      '<span class="match-round">'+m.round+'</span>'+
      '<span class="match-gender '+gC+'">'+gL+'</span>'+
      (isDone?'<span style="font-size:9px;color:var(--win)">✓ จบแล้ว</span>':'')+
      (m.status==='upcoming'?'<span style="font-size:9px;color:var(--muted)">⏳ รอแข่ง</span>':'')+
      (dateStr?'<span style="font-size:9px;color:var(--muted)">📅 '+dateStr+'</span>':'')+
    '</div>'+
  '</div>';
}

function renderRecentMatches(){
  var r = state.matches.slice().reverse().slice(0,5);
  document.getElementById('recent-matches-list').innerHTML = r.length
    ? r.map(matchCard).join('')
    : '<div style="text-align:center;color:var(--muted);padding:20px">ยังไม่มีข้อมูลการแข่งขัน</div>';
}

// ─── FIXTURE ROW ──────────────────────────────────────────────────────────────
var curMatchFilter = 'all';
var curMatchGender = 'all';

function updateMatchBadges(){
  var src = curMatchGender === 'all' ? state.matches
    : state.matches.filter(function(m){ return m.gender === curMatchGender; });
  var counts = {all:src.length, live:0, completed:0, upcoming:0};
  src.forEach(function(m){
    if(m.status==='live') counts.live++;
    else if(m.status==='completed') counts.completed++;
    else if(m.status==='upcoming') counts.upcoming++;
  });
  var map = {all:'badge-all', live:'badge-live', completed:'badge-completed', upcoming:'badge-upcoming'};
  Object.keys(map).forEach(function(k){
    var el = document.getElementById(map[k]);
    if(el) el.textContent = counts[k] > 0 ? counts[k] : '';
  });
}

function setMatchFilter(f, btn){
  curMatchFilter = f;
  if(btn && btn.parentElement){
    btn.parentElement.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('is-active'); });
    btn.classList.add('is-active');
  }
  renderAllMatches();
}

function setMatchGender(g, btn){
  curMatchGender = g;
  if(btn && btn.parentElement){
    btn.parentElement.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('is-active'); });
    btn.classList.add('is-active');
  }
  renderAllMatches();
}

function fixtureRow(m, idx){
  var isLive = m.status === 'live';
  var isDone = m.status === 'completed';
  var w1 = isDone && m.score1 > m.score2;
  var w2 = isDone && m.score2 > m.score1;
  var gTag = m.gender==='M'
    ? '<span class="fix-gender-tag fix-gender-m">MEN\'S</span>'
    : '<span class="fix-gender-tag fix-gender-f">WOMEN\'S</span>';

  var dateLabel, dateInfo;
  if(m.date){
    var d = new Date(m.date);
    var dayNames = ['อา','จ','อ','พ','พฤ','ศ','ส'];
    var monthNames = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    dateLabel = dayNames[d.getDay()]+' '+d.getDate()+' '+monthNames[d.getMonth()];
    dateInfo  = m.time ? m.time+' น.' : m.round;
  } else {
    dateLabel = 'แมตช์ที่ '+(idx+1);
    dateInfo  = m.round;
  }

  var boxCls = isDone ? 'box-done' : isLive ? 'box-live' : '';
  var s1Cls  = isDone ? (w1?'s-win':'s-lose') : 's-neutral';
  var s2Cls  = isDone ? (w2?'s-win':'s-lose') : 's-neutral';

  var statusHtml = isLive
    ? '<span class="fix-status-badge badge-live"><span class="live-dot"></span>LIVE</span>'
    : isDone
      ? '<span class="fix-status-badge badge-done">✓ จบแล้ว</span>'
      : '<span class="fix-status-badge badge-upcoming">⏳ รอแข่ง</span>';

  var genderClass = m.gender === 'F' ? ' fix-women' : '';

  return '<div class="fix-row fix-live-check'+(isLive?' fix-live':'')+genderClass+'" id="fix-row-'+m.id+'">'+
    '<div class="fix-date">'+
      '<div class="fix-date-day">'+dateLabel+'</div>'+
      '<div class="fix-date-info">'+dateInfo+'</div>'+
      gTag+
    '</div>'+
    '<div class="fix-player-a">'+
      '<div class="fix-player-name'+(w1?' winner-name':w2?' loser-name':'')+'">'+
        (w1?'🏆 ':'')+m.p1+
      '</div>'+
    '</div>'+
    '<div class="fix-score-box '+boxCls+'">'+
      '<span class="fix-score-num '+s1Cls+'">'+m.score1+'</span>'+
      '<span class="fix-score-sep">:</span>'+
      '<span class="fix-score-num '+s2Cls+'">'+m.score2+'</span>'+
    '</div>'+
    '<div class="fix-player-b">'+
      '<div class="fix-player-name'+(w2?' winner-name':w1?' loser-name':'')+'">'+
        m.p2+(w2?' 🏆':'')+
      '</div>'+
    '</div>'+
    '<div class="fix-status">'+statusHtml+'</div>'+
  '</div>';
}

var ROUND_ORDER = ['Round of 32','Round of 16','Quarter Final','Semi Final','Final'];
var ROUND_ICONS = {'Round of 32':'🎮','Round of 16':'⚡','Quarter Final':'🔥','Semi Final':'🏅','Final':'🏆'};

function renderAllMatches(){
  updateMatchBadges();
  var filtered = state.matches.filter(function(m){
    if(curMatchFilter !== 'all' && m.status !== curMatchFilter) return false;
    if(curMatchGender !== 'all' && m.gender !== curMatchGender) return false;
    return true;
  });

  if(!filtered.length){
    document.getElementById('all-matches-list').innerHTML =
      '<div style="text-align:center;color:var(--muted);padding:40px">ไม่พบการแข่งขัน</div>';
    return;
  }

  var groups = {};
  filtered.forEach(function(m){ if(!groups[m.round]) groups[m.round]=[]; groups[m.round].push(m); });

  var html = '';
  var rounds = ROUND_ORDER.filter(function(r){ return groups[r]; });
  Object.keys(groups).forEach(function(r){ if(rounds.indexOf(r)===-1) rounds.push(r); });

  rounds.forEach(function(round){
    var list = groups[round];
    var icon = ROUND_ICONS[round] || '🏓';
    var liveInGroup = list.filter(function(m){ return m.status==='live'; }).length;

    html += '<div class="fix-group">'+
      '<div class="fix-round-header">'+
        '<div class="fix-round-icon">'+icon+'</div>'+
        '<div class="fix-round-name">'+round+'</div>'+
        (liveInGroup ? '<span class="live-badge" style="margin-left:8px"><span class="live-dot"></span>'+liveInGroup+' LIVE</span>' : '')+
        '<div class="fix-round-count">'+list.length+' แมตช์</div>'+
      '</div>';

    list.forEach(function(m, i){ html += fixtureRow(m, i); });
    html += '</div>';
  });

  document.getElementById('all-matches-list').innerHTML = html;
}

// ─── STANDINGS ─────────────────────────────────────────────────────────────────

// Head-to-Head: คืน 1 ถ้า a ชนะ b, -1 ถ้า b ชนะ a, 0 ถ้าไม่มีข้อมูล
function h2hResult(a, b){
  var matches = state.matches.filter(function(m){
    return m.status === 'completed' && (
      (m.p1 === a.name && m.p2 === b.name) ||
      (m.p1 === b.name && m.p2 === a.name)
    );
  });
  if(!matches.length) return 0;
  var aWins = 0, bWins = 0;
  matches.forEach(function(m){
    if(m.p1 === a.name && m.score1 > m.score2) aWins++;
    else if(m.p2 === a.name && m.score2 > m.score1) aWins++;
    else if(m.p1 === b.name && m.score1 > m.score2) bWins++;
    else if(m.p2 === b.name && m.score2 > m.score1) bWins++;
  });
  if(aWins > bWins) return 1;
  if(bWins > aWins) return -1;
  return 0;
}

// Ranking comparator: set diff → win% → points → H2H
function rankComparator(a, b){
  // ขั้น 1: ผลต่างเซต (เซตได้ - เซตเสีย) — ใครมากกว่าอยู่สูงกว่า
  var aDiff = (a.setsFor || 0) - (a.setsAgainst || 0);
  var bDiff = (b.setsFor || 0) - (b.setsAgainst || 0);
  if(bDiff !== aDiff) return bDiff - aDiff;
  // ขั้น 2: % ชนะ (win rate) — ตัวตัดสินรอง
  var aWR = a.played ? (a.wins / a.played) : 0;
  var bWR = b.played ? (b.wins / b.played) : 0;
  if(bWR !== aWR) return bWR - aWR;
  // ขั้น 3: แต้มรวม (ชนะ +2, แพ้ +1)
  if(b.points !== a.points) return b.points - a.points;
  // ขั้น 4: Head-to-Head — ใครเคยชนะกันโดยตรง
  return -h2hResult(a, b);
}

function renderStandings(){
  var search = curSearch.toLowerCase();

  // แยกชาย/หญิง แล้วเรียงด้วย 3 สเต็ป
  var allMen   = state.players.filter(function(p){ return p.gender === 'M'; }).sort(rankComparator);
  var allWomen = state.players.filter(function(p){ return p.gender === 'F'; }).sort(rankComparator);

  // กรองตาม gender filter
  var men   = curGenderFilter === 'F' ? [] : allMen;
  var women = curGenderFilter === 'M' ? [] : allWomen;
  var allSorted = men.concat(women);  var rows = '';

  function buildSection(list, genderLabel, genderColor){
    if(!list.length) return '';
    var html = '<tr class="standings-section-divider"><td colspan="11">'+
      '<span class="standings-section-label" style="color:'+genderColor+'">'+genderLabel+'</span>'+
    '</td></tr>';
    var displayRank = 0;
    list.forEach(function(p){
      if(curFilter !== 'all' && p.status !== curFilter) return;
      if(search && p.name.toLowerCase().indexOf(search) === -1) return;
      displayRank++;
      var rankIcon = displayRank===1?'🥇': displayRank===2?'🥈': displayRank===3?'🥉':
        '<span style="font-family:\'Orbitron\',monospace;font-size:12px;color:rgba(255,255,255,0.3);">'+displayRank+'</span>';
      var rowCls = displayRank===1?'row-r1': displayRank===2?'row-r2': displayRank===3?'row-r3':'';
      var scClass = p.status==='WINNER'?'status-winner': p.status==='IN_PLAY'?'status-inplay':'status-eliminated';
      var setDiff = (p.setsFor - p.setsAgainst);
      var setDiffStr = (setDiff > 0 ? '+' : '') + setDiff;
      var setDiffColor = setDiff > 0 ? 'var(--win)' : setDiff < 0 ? 'var(--lose)' : 'rgba(255,255,255,0.3)';
      var winPct = p.played ? Math.round((p.wins/p.played)*100) : 0;
      var gPill = p.gender==='M'
        ? '<span class="gender-pill-m">♂ M</span>'
        : '<span class="gender-pill-f">♀ W</span>';
      html += '<tr class="'+rowCls+'">'+
        '<td style="text-align:center;width:44px;"><div class="rank-cell">'+rankIcon+'</div></td>'+
        '<td>'+ava(p,36)+'</td>'+
        '<td>'+
          '<div class="player-name-cell">'+p.name+'</div>'+
          '<div style="margin-top:3px;">'+gPill+'</div>'+
        '</td>'+
        '<td style="font-size:12px;color:rgba(255,255,255,0.4)">'+p.team+'</td>'+
        '<td style="text-align:center;font-family:\'Orbitron\',monospace;font-size:13px;">'+p.played+'</td>'+
        '<td style="text-align:center;font-family:\'Orbitron\',monospace;font-size:13px;color:var(--win);font-weight:700;">'+p.wins+'</td>'+
        '<td style="text-align:center;font-family:\'Orbitron\',monospace;font-size:13px;color:rgba(248,81,73,0.8);">'+p.losses+'</td>'+
        '<td style="font-size:12px;white-space:nowrap;color:rgba(255,255,255,0.5);">'+
          p.setsFor+'/'+p.setsAgainst+
          ' <span style="color:'+setDiffColor+';font-size:11px;">('+setDiffStr+')</span>'+
        '</td>'+
        '<td style="font-family:\'Orbitron\',monospace;font-size:14px;font-weight:900;color:#d29922;text-align:center;">'+p.points+'</td>'+
        '<td style="min-width:120px;">'+
          '<div class="wpct-wrap">'+
            '<div class="wpct-bar-track"><div class="wpct-bar-fill" style="width:'+winPct+'%"></div></div>'+
            '<span class="wpct-num">'+winPct+'%</span>'+
          '</div>'+
        '</td>'+
        '<td><span class="status-badge '+scClass+'">'+p.status+'</span></td>'+
      '</tr>';
    });
    return html;
  }

  // กรณี filter/search ให้แสดงรวม ไม่แบ่ง section
  if(curFilter !== 'all' || search){
    var filtered = allSorted.filter(function(p){
      if(curFilter !== 'all' && p.status !== curFilter) return false;
      if(search && p.name.toLowerCase().indexOf(search) === -1) return false;
      return true;
    });
    var displayRank = 0;
    filtered.forEach(function(p){
      displayRank++;
      var rc = displayRank===1?'r1': displayRank===2?'r2': displayRank===3?'r3':'rn';
      var rowCls = displayRank===1?'row-r1': displayRank===2?'row-r2': displayRank===3?'row-r3':'';
      var scClass = p.status==='WINNER'?'status-winner': p.status==='IN_PLAY'?'status-inplay':'status-eliminated';
      var setDiff = p.setsFor - p.setsAgainst;
      var setDiffStr = (setDiff > 0 ? '+' : '') + setDiff;
      var setDiffColor = setDiff > 0 ? 'var(--win)' : setDiff < 0 ? 'var(--lose)' : 'var(--muted)';
      rows += '<tr class="'+rowCls+'">'+
        '<td><span class="rank-num '+rc+'">'+displayRank+'</span></td>'+
        '<td>'+ava(p,38)+'</td>'+
        '<td><div class="player-name-cell">'+p.name+'</div></td>'+
        '<td style="font-size:11px;color:var(--muted)">'+p.team+'</td>'+
        '<td>'+p.played+'</td>'+
        '<td class="stat-win">'+p.wins+'</td>'+
        '<td class="stat-lose">'+p.losses+'</td>'+
        '<td style="font-size:10px;white-space:nowrap">'+p.setsFor+'/'+p.setsAgainst+
          '<span style="font-size:9px;color:'+setDiffColor+';margin-left:3px">('+setDiffStr+')</span>'+
        '</td>'+
        '<td style="font-weight:900;color:var(--gold);font-family:\'Orbitron\',monospace;font-size:13px">'+p.points+'</td>'+
        '<td><div class="pct-bar"><div class="pct-track"><div class="pct-fill" style="width:'+p.pct+'%"></div></div><span style="font-size:9px;color:var(--muted);min-width:30px">'+p.pct+'%</span></div></td>'+
        '<td><span class="status-badge '+scClass+'">'+p.status+'</span></td>'+
      '</tr>';
    });
  } else {
    rows = buildSection(men, "♂ MEN'S — ประเภทชายเดี่ยว", 'var(--cyan)') +
           buildSection(women, "♀ WOMEN'S — ประเภทหญิงเดี่ยว", '#ff80ab');
  }

  document.getElementById('standings-body').innerHTML = rows ||
    '<tr><td colspan="11" style="text-align:center;color:var(--muted);padding:20px">ไม่พบผู้เล่น</td></tr>';
}

function filterStandings(){
  curSearch = document.getElementById('search-input').value;
  renderStandings();
}

function filterByStatus(s, btn){
  curFilter = s;
  if(btn && btn.parentElement){
    btn.parentElement.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('is-active'); });
    btn.classList.add('is-active');
  }
  renderStandings();
}

function filterByGender(g, btn){
  curGenderFilter = g;
  if(btn && btn.parentElement){
    btn.parentElement.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('is-active'); });
    btn.classList.add('is-active');
  }
  renderStandings();
}

// ─── VISUAL BRACKET TREE ──────────────────────────────────────────────────────
var BRACKET_ROUNDS = ['Round of 32','Round of 16','Quarter Final','Semi Final','Final'];

function getBracketWinner(m){
  if(!m || m.status !== 'completed') return null;
  return m.score1 > m.score2 ? m.p1 : m.p2;
}

function bracketMatchCard(m, roundName){
  if(!m){
    return '<div class="bracket-match">'+
      '<div class="bm-player"><span class="bm-name bm-tbd">TBD</span><span class="bm-score sc-tbd">-</span></div>'+
      '<div class="bm-player"><span class="bm-name bm-tbd">TBD</span><span class="bm-score sc-tbd">-</span></div>'+
      '<div class="bm-status-bar sb-up">⏳ รอจับคู่</div>'+
    '</div>';
  }
  var isLive = m.status==='live';
  var isDone = m.status==='completed';
  var isFinal = roundName==='Final';
  var w1 = isDone && m.score1 > m.score2;
  var w2 = isDone && m.score2 > m.score1;
  var cls = 'bracket-match'+(isLive?' bm-live':isFinal?' bm-final':'');
  var statusBar = isLive
    ? '<div class="bm-status-bar sb-live"><span class="live-dot" style="width:5px;height:5px;margin-right:3px;"></span>LIVE</div>'
    : isDone
      ? '<div class="bm-status-bar sb-done">✓ '+m.score1+' - '+m.score2+'</div>'
      : '<div class="bm-status-bar sb-up">⏳ รอแข่ง</div>';
  return '<div class="'+cls+'">'+
    '<div class="bm-player">'+
      '<span class="bm-name'+(w1?' bm-winner':w2?' bm-loser':'')+'">'+m.p1+'</span>'+
      '<span class="bm-score'+(isDone?(w1?' sc-win':' sc-lose'):'')+'">'+
        (isDone||isLive ? m.score1 : '')+
      '</span>'+
    '</div>'+
    '<div class="bm-player">'+
      '<span class="bm-name'+(w2?' bm-winner':w1?' bm-loser':'')+'">'+m.p2+'</span>'+
      '<span class="bm-score'+(isDone?(w2?' sc-win':' sc-lose'):'')+'">'+
        (isDone||isLive ? m.score2 : '')+
      '</span>'+
    '</div>'+
    statusBar+
  '</div>';
}

function renderVisualBracket(gender, containerId){
  var container = document.getElementById(containerId);
  if(!container) return;
  var gm = state.matches.filter(function(m){ return m.gender===gender; });

  // group + dedup
  var groups = {};
  BRACKET_ROUNDS.forEach(function(r){ groups[r]=[]; });
  gm.forEach(function(m){
    if(groups[m.round]) groups[m.round].push(m);
    else groups[m.round]=[m];
  });
  BRACKET_ROUNDS.forEach(function(r){
    var seen={};
    groups[r]=groups[r].slice().reverse().filter(function(m){
      var k=[m.p1,m.p2].sort().join('|');
      if(seen[k]) return false; seen[k]=true; return true;
    }).reverse().sort(function(a,b){ return (a.slot||0)-(b.slot||0); });
  });

  var activeRounds = BRACKET_ROUNDS.filter(function(r){ return groups[r].length>0; });
  if(!activeRounds.length){
    container.innerHTML='<div style="text-align:center;color:var(--muted);padding:32px;">ยังไม่มีการจับคู่</div>';
    return;
  }

  var slotCounts = {'Round of 32':16,'Round of 16':8,'Quarter Final':4,'Semi Final':2,'Final':1};

  // base = first active round
  var baseRound  = activeRounds[0];
  var baseSlots  = slotCounts[baseRound] || Math.max(groups[baseRound].length, 2);

  // collect rounds from base onward
  var rounds = [];
  var startIdx = BRACKET_ROUNDS.indexOf(baseRound);
  for(var ri=startIdx; ri<BRACKET_ROUNDS.length; ri++) rounds.push(BRACKET_ROUNDS[ri]);

  // layout
  var CARD_H  = 52;
  var CARD_W  = 170;
  var V_GAP   = 8;
  var COL_GAP = 40;
  var LABEL_H = 22;
  var CHAMP_W = 100;

  var numCols = rounds.length;
  var totalW  = numCols*(CARD_W+COL_GAP) - COL_GAP + CHAMP_W + 16;
  var totalH  = LABEL_H + baseSlots*(CARD_H+V_GAP) - V_GAP;

  // helper: Y-center of slot i in column ci
  function midY(ci, i){
    var slots = Math.max(1, Math.ceil(baseSlots / Math.pow(2, ci)));
    var colH  = slots*(CARD_H+V_GAP) - V_GAP;
    var offY  = LABEL_H + (totalH - LABEL_H - colH)/2;
    return offY + i*(CARD_H+V_GAP) + CARD_H/2;
  }
  function cardY(ci, i){
    var slots = Math.max(1, Math.ceil(baseSlots / Math.pow(2, ci)));
    var colH  = slots*(CARD_H+V_GAP) - V_GAP;
    var offY  = LABEL_H + (totalH - LABEL_H - colH)/2;
    return offY + i*(CARD_H+V_GAP);
  }

  var cards = '';
  var lines = '';
  var icons = {'Round of 32':'🎮','Round of 16':'⚡','Quarter Final':'🔥','Semi Final':'🏅','Final':'🏆'};

  rounds.forEach(function(round, ci){
    var slots   = Math.max(1, Math.ceil(baseSlots / Math.pow(2, ci)));
    var matches = groups[round] || [];
    var colX    = ci*(CARD_W+COL_GAP);

    // round label
    cards += '<div style="position:absolute;left:'+colX+'px;top:0;width:'+CARD_W+'px;text-align:center;'+
      'font-family:\'Orbitron\',monospace;font-size:8px;color:var(--muted);letter-spacing:1.2px;line-height:'+LABEL_H+'px;">'+
      (icons[round]||'🏓')+' '+round+'</div>';

    for(var i=0; i<slots; i++){
      var m = matches.find(function(x){ return (x.slot||0)===(i+1); }) || matches[i] || null;
      cards += bracketCard(m, colX, cardY(ci,i), CARD_W, CARD_H, round);

      // connector lines to next column
      if(ci < rounds.length-1){
        var x1  = colX + CARD_W;
        var xm  = colX + CARD_W + COL_GAP/2;
        var x2  = colX + CARD_W + COL_GAP;
        var my1 = midY(ci, i);
        var pairIdx = Math.floor(i/2);
        var ny  = midY(ci+1, pairIdx);

        lines += '<line x1="'+x1+'" y1="'+my1+'" x2="'+xm+'" y2="'+my1+'" stroke="rgba(0,229,255,0.2)" stroke-width="1.5"/>';
        if(i%2===0 && i+1<slots){
          var my2 = midY(ci, i+1);
          lines += '<line x1="'+xm+'" y1="'+my1+'" x2="'+xm+'" y2="'+my2+'" stroke="rgba(0,229,255,0.2)" stroke-width="1.5"/>';
        }
        lines += '<line x1="'+xm+'" y1="'+ny+'" x2="'+x2+'" y2="'+ny+'" stroke="rgba(0,229,255,0.2)" stroke-width="1.5"/>';
      }
    }

    // champion after Final
    if(round==='Final'){
      var fm = matches[0];
      var champ = fm && fm.status==='completed' ? getBracketWinner(fm) : null;
      var cx = colX + CARD_W + 10;
      var cy = midY(ci, 0) - 28;
      cards += '<div style="position:absolute;left:'+cx+'px;top:'+cy+'px;width:'+(CHAMP_W-10)+'px;">'+
        '<div style="font-size:18px;line-height:1.2;">🏆</div>'+
        '<div style="font-family:\'Orbitron\',monospace;font-size:7px;color:var(--gold);letter-spacing:2px;">CHAMPION</div>'+
        '<div style="font-family:\'Anuphan\',sans-serif;font-size:13px;font-weight:900;color:var(--win);margin-top:2px;">'+(champ||'—')+'</div>'+
      '</div>';
      var fmy = midY(ci, 0);
      lines += '<line x1="'+(colX+CARD_W)+'" y1="'+fmy+'" x2="'+(colX+CARD_W+8)+'" y2="'+fmy+'" stroke="rgba(255,215,0,0.35)" stroke-width="1.5" stroke-dasharray="4,3"/>';
    }
  });

  container.innerHTML =
    '<div style="overflow-x:auto;overflow-y:hidden;max-width:100%;padding-bottom:8px;">'+
    '<div style="position:relative;width:'+totalW+'px;height:'+totalH+'px;min-height:'+totalH+'px;">'+
    '<svg style="position:absolute;left:0;top:0;width:'+totalW+'px;height:'+totalH+'px;pointer-events:none;overflow:visible;" xmlns="http://www.w3.org/2000/svg">'+lines+'</svg>'+
    cards+
    '</div></div>';
}

function bracketCard(m, x, y, w, h, round){
  var isFinal = round==='Final';
  var border  = isFinal ? 'rgba(255,215,0,0.4)' : 'rgba(0,229,255,0.15)';
  var bg      = isFinal ? 'rgba(20,14,0,0.75)'  : 'rgba(0,16,38,0.82)';

  // empty slot
  if(!m){
    return '<div style="position:absolute;left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px;'+
      'background:rgba(0,12,28,0.5);border:1px dashed rgba(0,229,255,0.1);border-radius:7px;overflow:hidden;">'+
      '<div style="height:50%;border-bottom:1px solid rgba(0,229,255,0.06);display:flex;align-items:center;padding:0 10px;">'+
        '<div style="flex:1;height:1px;background:rgba(0,229,255,0.1);"></div>'+
      '</div>'+
      '<div style="height:50%;display:flex;align-items:center;padding:0 10px;">'+
        '<div style="flex:1;height:1px;background:rgba(0,229,255,0.1);"></div>'+
      '</div>'+
    '</div>';
  }

  var isLive = m.status==='live';
  var isDone = m.status==='completed';
  var w1 = isDone && m.score1 > m.score2;
  var w2 = isDone && m.score2 > m.score1;
  if(isLive){ border='rgba(255,51,85,0.5)'; bg='rgba(32,0,8,0.88)'; }
  if(isFinal && isDone){ border='rgba(255,215,0,0.55)'; }

  function row(name, score, win, lose, top){
    return '<div style="height:50%;display:flex;align-items:center;justify-content:space-between;padding:0 8px;'+
      (top?'border-bottom:1px solid rgba(0,229,255,0.07);':'')+
      (win?'background:rgba(0,229,160,0.07);':'')+'>'+
      '<span style="font-family:\'Anuphan\',sans-serif;font-size:12px;font-weight:700;'+
        'color:'+(win?'var(--win)':lose?'#253a50':'var(--text)')+';'+
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:'+(w-46)+'px;">'+
        (win?'▶ ':'')+name+'</span>'+
      '<span style="font-family:\'Orbitron\',monospace;font-size:13px;font-weight:900;flex-shrink:0;margin-left:4px;'+
        'color:'+(win?'var(--win)':lose?'#253a50':'var(--muted)')+';min-width:16px;text-align:right;">'+
        (isDone||isLive?score:'')+'</span>'+
    '</div>';
  }

  var liveBar = isLive ? '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:var(--live);animation:shimmer 1.5s ease-in-out infinite;"></div>' : '';

  return '<div style="position:absolute;left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px;'+
    'background:'+bg+';border:1px solid '+border+';border-radius:7px;overflow:hidden;'+
    (isLive?'box-shadow:0 0 10px rgba(255,51,85,0.2);':'')+
    (isFinal&&isDone?'box-shadow:0 0 14px rgba(255,215,0,0.18);':'')+'>'+
    liveBar+row(m.p1,m.score1,w1,w2,true)+row(m.p2,m.score2,w2,w1,false)+
  '</div>';
}

// ─── ADMIN BRACKET SETUP ──────────────────────────────────────────────────────
function renderBracketSetup(){
  var el = document.getElementById('bracket-setup-body');
  if(!el) return;
  var gender = document.getElementById('bracket-setup-gender') ? document.getElementById('bracket-setup-gender').value : 'M';
  var round  = document.getElementById('bracket-setup-round')  ? document.getElementById('bracket-setup-round').value  : 'Round of 32';

  var existing = state.matches.filter(function(m){ return m.gender===gender && m.round===round; })
    .sort(function(a,b){ return (a.slot||0)-(b.slot||0); });
  var players  = state.players.filter(function(p){ return p.gender===gender; });
  var menCount = state.players.filter(function(p){ return p.gender==='M'; }).length;
  var womenCount = state.players.filter(function(p){ return p.gender==='F'; }).length;

  var pOpts = '<option value="">— เลือกผู้เล่น —</option>'+players.map(function(p){
    return '<option value="'+p.name+'">'+p.name+'</option>';
  }).join('');

  // summary bar
  var readyCount = existing.filter(function(m){ return m.p1 && m.p2; }).length;
  var html = '<div class="bpair-summary">'+
    '<span>คู่ที่จับแล้ว <span class="bpair-summary-num">'+existing.length+' คู่</span></span>'+
    '<span>พร้อมแข่ง <span class="bpair-summary-ready">'+readyCount+' คู่</span></span>'+
    '<span class="bpair-summary-meta">♂ '+menCount+' คน · ♀ '+womenCount+' คน</span>'+
  '</div>';

  // existing pairs as cards
  if(existing.length){
    existing.forEach(function(m, i){
      var isReady = m.p1 && m.p2;
      html += '<div class="bpair-card'+(isReady?' ready':'')+'">'+
        '<span class="bpair-num">'+(i+1)+'</span>'+
        '<select id="bse-p1-'+m.id+'" class="bpair-select">'+pOpts+'</select>'+
        '<span class="bpair-vs">vs</span>'+
        '<select id="bse-p2-'+m.id+'" class="bpair-select">'+pOpts+'</select>'+
        (isReady
          ? '<span class="bpair-status-ready">✓ พร้อม</span>'
          : '<span class="bpair-status-pending">⏳ รอ</span>')+
        '<button onclick="removeBracketPair('+m.id+')" class="bpair-del">🗑️</button>'+
      '</div>';
    });
    // restore values
    existing.forEach(function(m){
      var s1 = document.getElementById('bse-p1-'+m.id);
      var s2 = document.getElementById('bse-p2-'+m.id);
      if(s1 && m.p1) s1.value = m.p1;
      if(s2 && m.p2) s2.value = m.p2;
    });
  }

  // add new pair row
  html += '<div class="bpair-card new-row">'+
    '<span class="bpair-num" style="color:rgba(0,229,255,0.4);">+</span>'+
    '<select id="bsnew-p1" class="bpair-select">'+pOpts+'</select>'+
    '<span class="bpair-vs">vs</span>'+
    '<select id="bsnew-p2" class="bpair-select">'+pOpts+'</select>'+
    '<span></span>'+
    '<button onclick="addBracketPair(\''+gender+'\',\''+round+'\')" class="bpair-add">+ เพิ่มคู่</button>'+
  '</div>';

  el.innerHTML = html;
}

function addBracketPair(gender, round){
  var p1El = document.getElementById('bsnew-p1');
  var p2El = document.getElementById('bsnew-p2');
  if(!p1El || !p2El) return;
  var p1 = p1El.value, p2 = p2El.value;
  if(!p1 || !p2){ showToast('กรุณาเลือกผู้เล่นทั้งสองฝั่ง', true); return; }
  if(p1===p2){ showToast('ต้องเลือกผู้เล่นคนละคน', true); return; }
  // check duplicate
  var dup = state.matches.find(function(m){
    return m.gender===gender && m.round===round &&
      ((m.p1===p1&&m.p2===p2)||(m.p1===p2&&m.p2===p1));
  });
  if(dup){ showToast('คู่นี้มีอยู่แล้ว', true); return; }
  var nextSlot = state.matches.filter(function(m){ return m.gender===gender&&m.round===round; }).length + 1;
  state.matches.push({
    id:Date.now(), p1:p1, p2:p2, score1:0, score2:0,
    round:round, gender:gender, status:'upcoming', slot:nextSlot, date:'', time:''
  });
  saveState(); renderAll(); renderBracketSetup();
  showToast('✅ เพิ่มคู่ '+p1+' vs '+p2+' แล้ว');
}

function removeBracketPair(id){
  var m = state.matches.find(function(x){ return x.id===id; });
  if(!m) return;
  if(!confirm('ลบคู่ "'+m.p1+' vs '+m.p2+'" ออก?')) return;
  state.matches = state.matches.filter(function(x){ return x.id!==id; });
  saveState(); renderAll(); renderBracketSetup();
  showToast('🗑️ ลบคู่แล้ว');
}

function saveBracketSlot(gender, round, slot){
  // now just stores in a pending buffer, not auto-saved
  // actual save happens via saveBracketSetup()
}

// pending bracket pairs buffer
var _bracketPending = {};

function saveBracketSetup(){
  var gender = document.getElementById('bracket-setup-gender') ? document.getElementById('bracket-setup-gender').value : 'M';
  var round  = document.getElementById('bracket-setup-round')  ? document.getElementById('bracket-setup-round').value  : 'Round of 32';
  var existing = state.matches.filter(function(m){ return m.gender===gender && m.round===round; });
  var saved = 0;
  existing.forEach(function(m){
    var s1 = document.getElementById('bse-p1-'+m.id);
    var s2 = document.getElementById('bse-p2-'+m.id);
    if(!s1||!s2) return;
    var p1 = s1.value, p2 = s2.value;
    if(!p1||!p2||p1===p2) return;
    m.p1 = p1; m.p2 = p2; saved++;
  });
  if(saved===0){ showToast('⚠️ ยังไม่มีคู่ที่เลือกครบ', true); return; }
  saveState(); renderAll(); renderBracketSetup();
  showToast('✅ บันทึกการจับคู่ '+saved+' คู่ สำเร็จ');
}

var BROUND_ORDER = ['Round of 32','Round of 16','Quarter Final','Semi Final','Final'];
var BROUND_ICONS = {
  'Round of 32':'🎮',
  'Round of 16':'⚡',
  'Quarter Final':'🔥',
  'Semi Final':'🏅',
  'Final':'🏆'
};

function bfixtureRow(m, isFinal){
  var isLive = m.status==='live';
  var isDone = m.status==='completed';
  var w1 = isDone && m.score1>m.score2;
  var w2 = isDone && m.score2>m.score1;

  var dateLabel, timeLabel;
  if(m.date){
    var d = new Date(m.date);
    var days=['อา','จ','อ','พ','พฤ','ศ','ส'];
    var months=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    dateLabel = days[d.getDay()]+' '+d.getDate()+' '+months[d.getMonth()];
    timeLabel  = m.time ? m.time : '';
  } else {
    dateLabel = isLive ? 'NOW' : isDone ? 'จบแล้ว' : 'TBC';
    timeLabel  = '';
  }

  var rowIcon = isFinal ? '🏆' : isLive ? '🔴' : isDone ? '🏓' : '⏳';
  var sbCls = isLive?'sb-live':isDone?'sb-done':'sb-tbd';
  var scoreHtml;
  if(isDone||isLive){
    scoreHtml =
      '<span class="bfix-sn '+(w1?'sw':w2?'sl':'sn')+'">'+m.score1+'</span>'+
      '<span class="bfix-sdiv">:</span>'+
      '<span class="bfix-sn '+(w2?'sw':w1?'sl':'sn')+'">'+m.score2+'</span>';
  } else {
    scoreHtml = '<span class="bfix-score-tbd">TBC</span>';
  }

  var badgeHtml = isLive
    ? '<span class="bfix-badge bfix-badge-live"><span class="live-dot"></span>LIVE</span>'
    : isDone
      ? (isFinal
          ? '<span class="bfix-badge bfix-badge-final">🏆 FINAL</span>'
          : '<span class="bfix-badge bfix-badge-done">✓ จบแล้ว</span>')
      : '<span class="bfix-badge bfix-badge-up">⏳ รอแข่ง</span>';

  return '<div class="bfix-row'+(isLive?' bfix-live':isFinal?' bfix-final':'')+'">'+
    '<div class="bfix-date">'+
      '<div class="bfix-date-icon">'+rowIcon+'</div>'+
      '<div class="bfix-date-day">'+dateLabel+'</div>'+
      (timeLabel?'<div class="bfix-date-time">'+timeLabel+'</div>':'')+
    '</div>'+
    '<div class="bfix-pa">'+
      '<div class="bfix-pname'+(w1?' bfix-win':w2?' bfix-lose':'')+'">'+
        (w1?'<span class="bfix-wbadge">W</span> ':'')+m.p1+
      '</div>'+
    '</div>'+
    '<div class="bfix-score">'+
      '<div class="bfix-score-box '+sbCls+'">'+scoreHtml+'</div>'+
    '</div>'+
    '<div class="bfix-pb">'+
      '<div class="bfix-pname'+(w2?' bfix-win':w1?' bfix-lose':'')+'">'+
        m.p2+(w2?' <span class="bfix-wbadge">W</span>':'')+
      '</div>'+
    '</div>'+
    '<div class="bfix-status">'+badgeHtml+'</div>'+
  '</div>';
}

function renderBracket(){
  var g  = state.currentBracket==='mens' ? 'M' : 'F';
  var gm = state.matches.filter(function(m){ return m.gender===g; });

  var groups = {};
  gm.forEach(function(m){ if(!groups[m.round]) groups[m.round]=[]; groups[m.round].push(m); });

  var finalMatches = groups['Final']||[];
  var completedFinal = finalMatches.filter(function(m){ return m.status==='completed'; })[0]||null;
  var champ = completedFinal ? (completedFinal.score1>completedFinal.score2?completedFinal.p1:completedFinal.p2) : null;

  var banner = document.getElementById('champ-banner');
  var champNameEl = document.getElementById('champ-name');
  if(champ && banner){
    banner.style.display='block';
    if(champNameEl) champNameEl.textContent = '🎉 '+champ;
  } else if(banner){
    banner.style.display='none';
  }

  if(!gm.length){
    document.getElementById('bracket-display').innerHTML=
      '<div style="text-align:center;color:var(--muted);padding:40px">ยังไม่มีการแข่งขันในประเภทนี้</div>';
    return;
  }

  var rounds = BROUND_ORDER.filter(function(r){ return groups[r]; });
  Object.keys(groups).forEach(function(r){ if(rounds.indexOf(r)===-1) rounds.push(r); });

  var html = '<div style="background:linear-gradient(160deg,rgba(0,25,50,0.85),rgba(0,12,28,0.97));border:1px solid var(--border);border-radius:14px;overflow:hidden;">';

  rounds.forEach(function(round){
    var list = groups[round];
    var icon = BROUND_ICONS[round]||'🏓';
    var isFinalRound = round==='Final';
    var liveCount = list.filter(function(m){ return m.status==='live'; }).length;

    html += '<div class="bfix-round-header"'+(isFinalRound?' style="border-left-color:var(--gold);background:linear-gradient(90deg,rgba(60,45,0,0.5),rgba(0,20,40,0.3));"':'')+'>';
    html += '<span class="bfix-round-icon">'+icon+'</span>';
    html += '<span class="bfix-round-name"'+(isFinalRound?' style="color:var(--gold);"':'')+'>'+round+'</span>';
    html += '<div class="bfix-round-meta">';
    if(liveCount) html+='<span class="live-badge"><span class="live-dot"></span>'+liveCount+' LIVE</span>';
    html += '<span class="bfix-round-count">'+list.length+' แมตช์</span>';
    html += '</div></div>';

    list.forEach(function(m){ html += bfixtureRow(m, isFinalRound); });
  });

  html += '</div>';
  document.getElementById('bracket-display').innerHTML = html;
}

// ─── BRACKET ──────────────────────────────────────────────────────────────────
var _bracketGender = 'M';

function setBracketGender(g){
  _bracketGender = g;
  ['M','F'].forEach(function(k){
    var b = document.getElementById('btab-'+k);
    if(!b) return;
    if(k===g){ b.classList.add('is-active'); }
    else { b.classList.remove('is-active'); }
  });
  renderBracketView();
}

function renderBracketView(){
  var c = document.getElementById('bracket-view');
  if(!c) return;
  c.innerHTML = '';
  drawBracket(_bracketGender, c);
}

function drawBracket(gender, container){
  var gm = state.matches.filter(function(m){ return m.gender===gender; });

  var groups = {};
  BRACKET_ROUNDS.forEach(function(r){ groups[r]=[]; });
  gm.forEach(function(m){
    if(groups[m.round]) groups[m.round].push(m);
    else groups[m.round]=[m];
  });
  BRACKET_ROUNDS.forEach(function(r){
    var seen={};
    groups[r]=groups[r].slice().reverse().filter(function(m){
      var k=[m.p1,m.p2].sort().join('|');
      if(seen[k]) return false; seen[k]=true; return true;
    }).reverse().sort(function(a,b){ return (a.slot||0)-(b.slot||0); });
  });

  var activeRounds = BRACKET_ROUNDS.filter(function(r){ return groups[r].length>0; });
  if(!activeRounds.length){
    container.innerHTML='<div style="text-align:center;color:rgba(255,255,255,0.3);padding:48px;font-family:\'Anuphan\',sans-serif;font-size:15px;line-height:1.8;">ยังไม่มีการจับคู่<br><span style="font-size:13px;opacity:0.6;">Admin กรอกข้อมูลผู้แข่งขันก่อน แล้วจับคู่สายการแข่งขัน</span></div>';
    return;
  }

  var baseRound = activeRounds[0];
  var baseSlots = groups[baseRound].length;
  var rounds = [];
  for(var ri=BRACKET_ROUNDS.indexOf(baseRound); ri<BRACKET_ROUNDS.length; ri++) rounds.push(BRACKET_ROUNDS[ri]);

  var CW=200, CH=36, VGAP=20, HGAP=52, LH=32, MATCH_H=CH*2;

  function matchY(ci, i){
    var slots=Math.max(1,Math.ceil(baseSlots/Math.pow(2,ci)));
    var spacing=MATCH_H+VGAP;
    var baseH=baseSlots*(MATCH_H+VGAP)-VGAP;
    var colH=slots*spacing-VGAP;
    var offY=LH+(baseH-colH)/2;
    return offY+i*spacing;
  }

  var totalW=rounds.length*(CW+HGAP)-HGAP+110;
  var totalH=LH+baseSlots*(MATCH_H+VGAP)-VGAP+8;
  var cards='', lines='';
  var icons={'Round of 32':'🎮','Round of 16':'⚡','Quarter Final':'🔥','Semi Final':'🏅','Final':'🏆'};

  rounds.forEach(function(round, ci){
    var slots=Math.max(1,Math.ceil(baseSlots/Math.pow(2,ci)));
    var matches=groups[round]||[];
    var colX=ci*(CW+HGAP);
    var isFinalRound=round==='Final';

    cards+='<div style="position:absolute;left:'+colX+'px;top:0;width:'+CW+'px;text-align:center;'+
      'font-family:\'Orbitron\',monospace;font-size:9px;font-weight:700;'+
      'color:'+(isFinalRound?'rgba(255,215,0,0.7)':'rgba(255,255,255,0.3)')+';'+
      'letter-spacing:2px;line-height:'+LH+'px;text-transform:uppercase;">'+
      (icons[round]||'🏓')+' '+round+'</div>';

    for(var i=0; i<slots; i++){
      var m=matches[i]||null;
      var my=matchY(ci,i);
      var isDone=m&&m.status==='completed';
      var isLive=m&&m.status==='live';
      var w1=isDone&&m.score1>m.score2;
      var w2=isDone&&m.score2>m.score1;

      var cardBorder=isLive?'rgba(248,81,73,0.5)':isFinalRound?'rgba(255,215,0,0.3)':'rgba(255,255,255,0.1)';
      var cardBg=isLive?'rgba(248,81,73,0.06)':isFinalRound?'rgba(255,215,0,0.04)':'rgba(255,255,255,0.04)';
      var cardGlow=isLive?'box-shadow:0 0 12px rgba(248,81,73,0.2);':isFinalRound&&isDone?'box-shadow:0 0 16px rgba(255,215,0,0.15);':'';

      function pRow(name,score,win,lose,isTop){
        var nameFw=win?'700':'400';
        var nameCol=win?'#ffffff':name?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.15)';
        var scoreCol=win?'#ffffff':lose?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.4)';
        var rowBg=win?'rgba(255,255,255,0.05)':'transparent';
        var winDot=win?'<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#3fb950;margin-right:6px;box-shadow:0 0 6px #3fb950;flex-shrink:0;"></span>':'<span style="display:inline-block;width:5px;height:5px;margin-right:6px;flex-shrink:0;"></span>';
        return '<div style="display:flex;align-items:center;height:'+CH+'px;padding:0 10px;background:'+rowBg+';'+(isTop?'border-bottom:1px solid rgba(255,255,255,0.06);':'')+'>'+
          winDot+
          '<span style="flex:1;font-family:\'Anuphan\',sans-serif;font-size:13px;font-weight:'+nameFw+';color:'+nameCol+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+name+'</span>'+
          (score!==null?'<span style="font-family:\'Orbitron\',monospace;font-size:13px;font-weight:700;color:'+scoreCol+';margin-left:8px;flex-shrink:0;">'+score+'</span>':'')+
        '</div>';
      }

      var liveBar=isLive?'<div style="position:absolute;top:0;left:0;right:0;height:2px;background:rgba(248,81,73,0.8);border-radius:8px 8px 0 0;"></div>':'';

      cards+='<div style="position:absolute;left:'+colX+'px;top:'+my+'px;width:'+CW+'px;height:'+MATCH_H+'px;'+
        'background:'+cardBg+';border:1px solid '+cardBorder+';border-radius:8px;overflow:hidden;'+cardGlow+'">'+
        liveBar+
        pRow(m?m.p1:'',(isDone||isLive)&&m?m.score1:null,w1,w2,true)+
        pRow(m?m.p2:'',(isDone||isLive)&&m?m.score2:null,w2,w1,false)+
      '</div>';

      if(ci<rounds.length-1){
        var x1=colX+CW, xm=x1+HGAP/2, x2=x1+HGAP;
        var top1=my+CH/2, top2=my+CH+CH/2;
        var pairIdx=Math.floor(i/2);
        var ny=matchY(ci+1,pairIdx)+CH/2;
        var lc='rgba(255,255,255,0.18)', lw='1.5';
        lines+='<line x1="'+x1+'" y1="'+top1+'" x2="'+xm+'" y2="'+top1+'" stroke="'+lc+'" stroke-width="'+lw+'"/>';
        lines+='<line x1="'+x1+'" y1="'+top2+'" x2="'+xm+'" y2="'+top2+'" stroke="'+lc+'" stroke-width="'+lw+'"/>';
        lines+='<line x1="'+xm+'" y1="'+top1+'" x2="'+xm+'" y2="'+top2+'" stroke="'+lc+'" stroke-width="'+lw+'"/>';
        lines+='<line x1="'+xm+'" y1="'+ny+'" x2="'+x2+'" y2="'+ny+'" stroke="'+lc+'" stroke-width="'+lw+'"/>';
      }

      if(round==='Final'&&isDone){
        var champ=w1?m.p1:m.p2;
        var cx=colX+CW+10, cy=my+MATCH_H/2-30;
        cards+='<div style="position:absolute;left:'+cx+'px;top:'+cy+'px;width:96px;">'+
          '<div style="font-size:22px;line-height:1.3;">🏆</div>'+
          '<div style="font-family:\'Orbitron\',monospace;font-size:7px;color:rgba(255,215,0,0.7);letter-spacing:2px;margin-top:2px;">CHAMPION</div>'+
          '<div style="font-family:\'Anuphan\',sans-serif;font-size:14px;font-weight:700;color:#fff;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:96px;">'+champ+'</div>'+
        '</div>';
        lines+='<line x1="'+(colX+CW)+'" y1="'+(my+CH/2)+'" x2="'+(colX+CW+8)+'" y2="'+(my+CH/2)+'" stroke="rgba(255,215,0,0.4)" stroke-width="1.5" stroke-dasharray="4,3"/>';
      }
    }
  });

  container.innerHTML=
    '<div style="width:100%;overflow-x:auto;overflow-y:hidden;padding-bottom:8px;">'+
    '<div style="display:table;margin:0 auto;padding:0 40px;">'+
    '<div style="position:relative;width:'+totalW+'px;height:'+totalH+'px;min-height:'+totalH+'px;">'+
    '<svg style="position:absolute;left:0;top:0;width:'+totalW+'px;height:'+totalH+'px;pointer-events:none;overflow:visible;" xmlns="http://www.w3.org/2000/svg">'+lines+'</svg>'+
    cards+
    '</div></div></div>';
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
var _playerMgmtGender = null;

function filterPlayerMgmt(g, btn){
  _playerMgmtGender = g;
  ['all','M','F'].forEach(function(k){
    var b = document.getElementById('pmgmt-btn-'+k);
    if(!b) return;
    if(k===g){
      b.style.background = k==='F'?'#ff80ab':k==='M'?'var(--cyan)':'var(--cyan)';
      b.style.borderColor = k==='F'?'#ff80ab':'var(--cyan)';
      b.style.color = '#000';
    } else {
      b.style.background = 'transparent';
      b.style.borderColor = k==='F'?'rgba(255,128,171,0.3)':'rgba(0,229,255,0.3)';
      b.style.color = 'var(--muted)';
    }
  });
  renderPlayerMgmt();
}
function populatePlayerSelects(){
  var selIds = ['match-p1','match-p2','edit-match-p1','edit-match-p2'];
  var o = '<option value="">— เลือกผู้เล่น —</option>'+state.players.map(function(p){ return '<option value="'+p.name+'">'+p.name+'</option>'; }).join('');
  selIds.forEach(function(id){
    var el = document.getElementById(id);
    if(el){ var cur=el.value; el.innerHTML=o; if(cur) el.value=cur; }
  });
}

// ─── MATCH MANAGEMENT ─────────────────────────────────────────────────────────
var adminMatchFilter = null;
var adminMatchGender = null;

function setAdminMatchFilter(f, btn){
  adminMatchFilter = f;
  var btnMap = {all:'mmgmt-btn-all', live:'mmgmt-btn-live', completed:'mmgmt-btn-completed', upcoming:'mmgmt-btn-upcoming'};
  var colorMap = {all:'var(--cyan)', live:'var(--live)', completed:'var(--win)', upcoming:'var(--muted)'};
  var borderMap = {all:'rgba(0,229,255,0.3)', live:'rgba(255,51,85,0.3)', completed:'rgba(0,229,160,0.3)', upcoming:'rgba(100,170,200,0.25)'};
  Object.keys(btnMap).forEach(function(k){
    var b = document.getElementById(btnMap[k]);
    if(!b) return;
    if(k===f){ b.style.background=colorMap[k]; b.style.borderColor=colorMap[k]; b.style.color='#000'; }
    else { b.style.background='transparent'; b.style.borderColor=borderMap[k]; b.style.color='var(--muted)'; }
  });
  renderMatchMgmt();
}

function setAdminMatchGender(g, btn){
  adminMatchGender = adminMatchGender === g ? null : g;
  ['M','F'].forEach(function(k){
    var b = document.getElementById('mmgmt-btn-'+k);
    if(!b) return;
    if(k===adminMatchGender){
      b.style.background = k==='F'?'rgba(255,128,171,0.2)':'rgba(0,229,255,0.15)';
      b.style.color = k==='F'?'#ff80ab':'var(--cyan)';
      b.style.fontWeight = '700';
    } else {
      b.style.background = 'transparent';
      b.style.color = 'var(--muted)';
      b.style.fontWeight = '600';
    }
  });
  renderMatchMgmt();
}

function renderMatchMgmt(){
  var container = document.getElementById('match-mgmt-body');
  if(!container) return;

  if(adminMatchFilter === null && adminMatchGender === null){
    container.innerHTML = '<div class="mmgmt-empty">กรุณาเลือกสถานะหรือประเภทเพื่อดูรายการแข่งขัน</div>';
    return;
  }

  var list = state.matches.filter(function(m){
    if(adminMatchFilter && adminMatchFilter !== 'all' && m.status !== adminMatchFilter) return false;
    if(adminMatchGender && m.gender !== adminMatchGender) return false;
    return true;
  });

  if(!list.length){
    container.innerHTML = '<div class="mmgmt-empty">ไม่พบการแข่งขัน</div>';
    return;
  }

  var html = '';
  list.forEach(function(m){
    var isDone = m.status === 'completed';
    var isLive = m.status === 'live';
    var w1 = isDone && m.score1 > m.score2;
    var w2 = isDone && m.score2 > m.score1;
    var gTag = m.gender === 'M'
      ? '<span class="mmgmt-gtag mmgmt-gtag-m">♂ MEN</span>'
      : '<span class="mmgmt-gtag mmgmt-gtag-f">♀ WOMEN</span>';
    var statusTag = isLive
      ? '<span class="mmgmt-stag mmgmt-stag-live"><span class="live-dot"></span>LIVE</span>'
      : isDone
        ? '<span class="mmgmt-stag mmgmt-stag-done">✓ จบแล้ว</span>'
        : '<span class="mmgmt-stag mmgmt-stag-up">⏳ รอแข่ง</span>';

    html += '<div class="mmgmt-card'+(isLive?' mmgmt-card-live':isDone?' mmgmt-card-done':'')+'">'+
      '<div class="mmgmt-card-main">'+
        '<div class="mmgmt-player mmgmt-player-a'+(w1?' mmgmt-winner':w2?' mmgmt-loser':'')+'">'+
          (w1?'<span class="mmgmt-trophy">🏆</span> ':'')+m.p1+
        '</div>'+
        '<div class="mmgmt-score-wrap">'+
          (isDone||isLive
            ? '<span class="mmgmt-score'+(w1?' mmgmt-score-win':w2?' mmgmt-score-lose':'')+'">'+m.score1+'</span>'+
              '<span class="mmgmt-score-sep">:</span>'+
              '<span class="mmgmt-score'+(w2?' mmgmt-score-win':w1?' mmgmt-score-lose':'')+'">'+m.score2+'</span>'
            : '<span class="mmgmt-vs">VS</span>'
          )+
        '</div>'+
        '<div class="mmgmt-player mmgmt-player-b'+(w2?' mmgmt-winner':w1?' mmgmt-loser':'')+'">'+
          m.p2+(w2?' <span class="mmgmt-trophy">🏆</span>':'')+
        '</div>'+
      '</div>'+
      '<div class="mmgmt-card-footer">'+
        '<div class="mmgmt-card-meta">'+
          '<span class="mmgmt-round">'+m.round+'</span>'+
          gTag+statusTag+
        '</div>'+
        '<div class="mmgmt-card-actions">'+
          '<button class="mmgmt-btn-edit" onclick="openEditMatch('+m.id+')">✏️ แก้ไข</button>'+
          '<button class="mmgmt-btn-del" onclick="deleteMatch('+m.id+')">🗑️ ลบ</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  });

  container.innerHTML = html;
}

function openEditMatch(id){
  var m = state.matches.find(function(x){ return x.id === id; });
  if(!m) return;
  populatePlayerSelects();
  document.getElementById('edit-match-id').value     = m.id;
  document.getElementById('edit-match-p1').value     = m.p1;
  document.getElementById('edit-match-p2').value     = m.p2;
  document.getElementById('edit-match-score1').value = m.score1;
  document.getElementById('edit-match-score2').value = m.score2;
  document.getElementById('edit-match-round').value  = m.round;
  document.getElementById('edit-match-gender').value = m.gender;
  document.getElementById('edit-match-status').value = m.status;
  document.getElementById('edit-match-date').value   = m.date || '';
  document.getElementById('edit-match-time').value   = m.time || '';
  var modal = document.getElementById('edit-match-modal');
  modal.style.display = 'flex';
}

function closeEditMatchModal(){
  document.getElementById('edit-match-modal').style.display = 'none';
}

function saveEditMatch(){
  var id = parseInt(document.getElementById('edit-match-id').value);
  var idx = state.matches.findIndex(function(x){ return x.id === id; });
  if(idx < 0) return;
  var p1     = document.getElementById('edit-match-p1').value;
  var p2     = document.getElementById('edit-match-p2').value;
  if(!p1 || !p2){ showToast('กรุณาเลือกผู้เล่น', true); return; }
  if(p1 === p2){ showToast('ต้องเลือกผู้เล่นคนละคน', true); return; }
  state.matches[idx].p1     = p1;
  state.matches[idx].p2     = p2;
  state.matches[idx].score1 = parseInt(document.getElementById('edit-match-score1').value) || 0;
  state.matches[idx].score2 = parseInt(document.getElementById('edit-match-score2').value) || 0;
  state.matches[idx].round  = document.getElementById('edit-match-round').value;
  state.matches[idx].gender = document.getElementById('edit-match-gender').value;
  state.matches[idx].status = document.getElementById('edit-match-status').value;
  state.matches[idx].date   = document.getElementById('edit-match-date').value || '';
  state.matches[idx].time   = document.getElementById('edit-match-time').value || '';
  // recalc all standings from scratch
  recalcStandingsOnly();
  saveState();
  renderAll();
  renderMatchMgmt();
  closeEditMatchModal();
  showToast('✅ แก้ไขผลแมตช์สำเร็จ');
}

function deleteMatch(id){
  var m = state.matches.find(function(x){ return x.id === id; });
  if(!m) return;
  if(!confirm('ลบแมตช์ "'+m.p1+' vs '+m.p2+'" ออกจากระบบ?')) return;
  state.matches = state.matches.filter(function(x){ return x.id !== id; });
  recalcStandingsOnly();
  saveState();
  renderAll();
  renderMatchMgmt();
  showToast('🗑️ ลบแมตช์แล้ว');
}

function recalcStandingsOnly(){
  state.players.forEach(function(p){
    p.played=0; p.wins=0; p.losses=0; p.setsFor=0; p.setsAgainst=0; p.points=0; p.pct=0;
  });
  state.matches.filter(function(m){ return m.status==='completed'; }).forEach(function(m){
    updateStats(m.p1, m.p2, m.score1, m.score2);
  });
}

function renderPlayerMgmt(){
  var tbody = document.getElementById('player-mgmt-body');
  if(!tbody) return;

  // ยังไม่ได้เลือกประเภท — แสดง placeholder
  if(_playerMgmtGender === null){
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:28px;font-family:\'Anuphan\',sans-serif;font-size:15px;">กรุณาเลือกประเภทเพื่อดูรายชื่อผู้แข่งขัน</td></tr>';
    return;
  }

  if(!state.players.length){
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:16px">ยังไม่มีผู้เล่น</td></tr>';
    return;
  }
  var allMen   = state.players.filter(function(p){ return p.gender==='M'; }).sort(rankComparator);
  var allWomen = state.players.filter(function(p){ return p.gender==='F'; }).sort(rankComparator);
  var men   = _playerMgmtGender === 'F' ? [] : allMen;
  var women = _playerMgmtGender === 'M' ? [] : allWomen;

  function buildRows(list, gLabel, gColor){
    if(!list.length) return '';
    var html = '<tr><td colspan="7" style="padding:10px 18px 4px;background:rgba(0,0,0,0.2);">'+
      '<span style="font-family:\'Anuphan\',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;color:'+gColor+'">'+gLabel+'</span>'+
    '</td></tr>';
    list.forEach(function(p, i){
      var scClass = p.status==='WINNER'?'status-winner': p.status==='IN_PLAY'?'status-inplay':'status-eliminated';
      var genderLabel = p.gender==='M' ? '<span style="color:#00e5ff;font-size:10px">♂ MEN</span>' : '<span style="color:#ff80ab;font-size:10px">♀ WOMEN</span>';
      html += '<tr>'+
        '<td style="color:var(--muted)">'+(i+1)+'</td>'+
        '<td style="font-weight:700">'+p.name+'</td>'+
        '<td style="color:var(--muted);font-size:11px">'+p.team+'</td>'+
        '<td>'+genderLabel+'</td>'+
        '<td style="font-family:Orbitron,monospace;color:var(--gold);font-weight:900">'+p.points+'</td>'+
        '<td><span class="status-badge '+scClass+'">'+p.status+'</span></td>'+
        '<td style="white-space:nowrap">'+
          '<button class="btn-edit" onclick="openEditModal('+p.id+')">✏️ แก้ไข</button>'+
          '<button class="btn-del" onclick="deletePlayer('+p.id+')">🗑️ ลบ</button>'+
        '</td>'+
      '</tr>';
    });
    return html;
  }

  tbody.innerHTML = buildRows(men, "♂ MEN'S", '#00e5ff') + buildRows(women, "♀ WOMEN'S", '#ff80ab');
}

function openEditModal(id){
  var p = state.players.find(function(x){ return x.id === id; });
  if(!p) return;
  document.getElementById('edit-player-id').value      = p.id;
  document.getElementById('edit-player-name').value    = p.name;
  document.getElementById('edit-player-team').value    = p.team;
  document.getElementById('edit-player-gender').value  = p.gender;
  document.getElementById('edit-player-status').value  = p.status;
  document.getElementById('edit-player-points').value  = p.points;
  document.getElementById('edit-player-played').value  = p.played;
  document.getElementById('edit-player-wins').value    = p.wins;
  document.getElementById('edit-player-losses').value  = p.losses;
  document.getElementById('edit-modal').classList.add('open');
}

function closeEditModal(){
  document.getElementById('edit-modal').classList.remove('open');
}

function saveEditPlayer(){
  var id = parseInt(document.getElementById('edit-player-id').value);
  var p  = state.players.find(function(x){ return x.id === id; });
  if(!p) return;
  var newName = document.getElementById('edit-player-name').value.trim().toUpperCase();
  if(!newName){ showToast('กรุณากรอกชื่อ', true); return; }
  var oldName = p.name;
  p.name    = newName;
  p.team    = document.getElementById('edit-player-team').value.trim() || p.team;
  p.gender  = document.getElementById('edit-player-gender').value;
  p.status  = document.getElementById('edit-player-status').value;
  p.points  = parseInt(document.getElementById('edit-player-points').value) || 0;
  p.played  = parseInt(document.getElementById('edit-player-played').value) || 0;
  p.wins    = parseInt(document.getElementById('edit-player-wins').value) || 0;
  p.losses  = parseInt(document.getElementById('edit-player-losses').value) || 0;
  p.pct     = p.played ? Math.round((p.wins/p.played)*100) : 0;
  // update match references if name changed
  if(oldName !== newName){
    state.matches.forEach(function(m){
      if(m.p1 === oldName) m.p1 = newName;
      if(m.p2 === oldName) m.p2 = newName;
    });
  }
  saveState();
  renderAll();
  renderPlayerMgmt();
  populatePlayerSelects();
  closeEditModal();
  showToast('✅ แก้ไข '+newName+' สำเร็จ');
}

function deletePlayer(id){
  var p = state.players.find(function(x){ return x.id === id; });
  if(!p) return;
  if(!confirm('ลบผู้เล่น "'+p.name+'" ออกจากระบบ?')) return;
  state.players = state.players.filter(function(x){ return x.id !== id; });
  saveState();
  renderAll();
  renderPlayerMgmt();
  populatePlayerSelects();
  showToast('🗑️ ลบ '+p.name+' แล้ว');
}

function exportData(){
  var data = { exportedAt: new Date().toISOString(), players: state.players, matches: state.matches };
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  var ts   = new Date().toISOString().slice(0,10);
  a.href     = url;
  a.download = 'com7-pingpong-data-'+ts+'.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('💾 Export JSON สำเร็จ — บันทึกลงโฟลเดอร์ data/');
}

function addPlayer(){
  var name   = document.getElementById('new-player-name').value.trim().toUpperCase();
  var team   = document.getElementById('new-player-team').value.trim() || 'ทีม/แผนก';
  var gender = document.getElementById('new-player-gender').value;
  var status = document.getElementById('new-player-status').value;
  if(!name){ showToast('กรุณากรอกชื่อผู้เล่น', true); return; }
  if(state.players.some(function(p){ return p.name === name; })){ showToast('ชื่อนี้มีอยู่แล้ว', true); return; }
  state.players.push({
    id:Date.now(), name:name, team:team, gender:gender,
    played:0, wins:0, losses:0, setsFor:0, setsAgainst:0,
    points:0, pct:0, status:status, photo:state.pendingPhoto||null
  });
  resetPhotoUI();
  saveState();
  renderAll();
  populatePlayerSelects();
  document.getElementById('new-player-name').value = '';
  document.getElementById('new-player-team').value = '';
  showToast('✅ เพิ่ม '+name+' สำเร็จ');
}

function addMatch(){
  var p1     = document.getElementById('match-p1').value;
  var p2     = document.getElementById('match-p2').value;
  var s1     = parseInt(document.getElementById('match-score1').value) || 0;
  var s2     = parseInt(document.getElementById('match-score2').value) || 0;
  var round  = document.getElementById('match-round').value;
  var gender = document.getElementById('match-gender').value;
  var status = document.getElementById('match-status').value;
  var dateVal= document.getElementById('match-date').value || '';
  var timeVal= document.getElementById('match-time').value || '';
  if(!p1 || !p2){ showToast('กรุณาเลือกผู้เล่น', true); return; }
  if(p1 === p2){ showToast('ต้องเลือกผู้เล่นคนละคน', true); return; }

  // check duplicate: same p1+p2 (or p2+p1) in same round+gender
  var dup = state.matches.findIndex(function(m){
    return m.round === round && m.gender === gender &&
      ((m.p1===p1 && m.p2===p2) || (m.p1===p2 && m.p2===p1));
  });
  if(dup >= 0){
    // update existing instead of adding new
    state.matches[dup].score1 = s1;
    state.matches[dup].score2 = s2;
    state.matches[dup].status = status;
    state.matches[dup].date   = dateVal;
    state.matches[dup].time   = timeVal;
    recalcStandingsOnly();
    saveState();
    renderAll();
    if(document.getElementById('match-mgmt-body')) renderMatchMgmt();
    showToast('✅ อัปเดตผล '+p1+' vs '+p2+' แล้ว (แมตช์นี้มีอยู่แล้ว)');
    return;
  }

  state.matches.push({id:Date.now(), p1:p1, p2:p2, score1:s1, score2:s2, round:round, gender:gender, status:status, date:dateVal, time:timeVal});
  if(status === 'completed') recalcStandingsOnly();
  saveState();
  renderAll();
  if(document.getElementById('match-mgmt-body')) renderMatchMgmt();
  showToast('✅ บันทึกผล '+p1+' vs '+p2+' สำเร็จ');
}

function updateStats(p1n, p2n, s1, s2){
  var p1 = state.players.find(function(p){ return p.name === p1n; });
  var p2 = state.players.find(function(p){ return p.name === p2n; });
  if(!p1 || !p2) return;
  p1.played++; p2.played++;
  p1.setsFor += s1; p1.setsAgainst += s2;
  p2.setsFor += s2; p2.setsAgainst += s1;
  // กติกา: ชนะ +2 แต้ม, แพ้ +1 แต้ม
  if(s1 > s2){
    p1.wins++; p1.points += 2;
    p2.losses++; p2.points += 1;
  } else if(s2 > s1){
    p2.wins++; p2.points += 2;
    p1.losses++; p1.points += 1;
  } else {
    // เสมอ (กรณีพิเศษ) ให้แต่ละคน +1
    p1.wins++; p2.wins++; p1.points++; p2.points++;
  }
  p1.pct = p1.played ? Math.round((p1.wins / p1.played) * 100) : 0;
  p2.pct = p2.played ? Math.round((p2.wins / p2.played) * 100) : 0;
}

function recalcStandings(){
  recalcStandingsOnly();
  saveState();
  renderAll();
  populatePlayerSelects();
  showToast('✅ คำนวณคะแนนใหม่สำเร็จ');
}

function resetData(){
  if(!confirm('ยืนยันลบข้อมูลทั้งหมด? (ผู้เล่นและแมตช์ทั้งหมดจะถูกลบออก)')) return;
  state.players = [];
  state.matches = [];
  if(document.getElementById('photo-img')) resetPhotoUI();
  saveState();
  renderAll();
  if(document.getElementById('match-mgmt-body')) renderMatchMgmt();
  populatePlayerSelects();
  showToast('🗑️ ล้างข้อมูลทั้งหมดแล้ว');
}

// ─── RENDER ALL ───────────────────────────────────────────────────────────────
function el(id){ return document.getElementById(id); }
function renderAll(){
  if(el('men-podium'))          renderTopPlayers();
  if(el('stat-players'))        renderOverviewStats();
  if(el('recent-matches-list')) renderRecentMatches();
  if(el('standings-body'))      renderStandings();
  if(el('player-mgmt-body'))    renderPlayerMgmt();
  if(el('match-mgmt-body'))     renderMatchMgmt();
  if(el('bracket-view'))        renderBracketView();
  if(el('all-matches-list') && el('tab-matches') && el('tab-matches').classList.contains('active')) renderAllMatches();
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
loadState();
renderAll();
populatePlayerSelects();
