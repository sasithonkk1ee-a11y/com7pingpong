// COM7 Ping Pong League 2026 - Supabase Version
// Real-time data with Supabase

// ─── STATE ────────────────────────────────────────────────────────────────────
var state = { players: [], matches: [], currentBracket: 'mens', pendingPhoto: null };
var curFilter = 'all';
var curSearch = '';
var curGenderFilter = 'all';
var realtimeSubscribed = false;
var _supabaseLoadDone = false;   // โหลดสำเร็จแล้ว ไม่ต้อง retry
var _supabaseLoading  = false;   // กำลังโหลดอยู่ ห้ามเรียกซ้อน

// ─── SUPABASE FUNCTIONS ──────────────────────────────────────────────────────

// Load initial data from Supabase
async function loadDataFromSupabase() {
  // ป้องกัน concurrent calls และ retry loop
  if (_supabaseLoading || _supabaseLoadDone) return;
  _supabaseLoading = true;
  try {
    if (!window.supabaseClient) throw new Error('Supabase client not initialized');

    // Load players
    const { data: playersData, error: playersError } = await supabaseClient
      .from('players')
      .select('*')
      .order('points', { ascending: false });

    if (playersError) throw playersError;

    state.players = (playersData || []).map(p => ({
      id: p.id,
      name: p.name,
      team: p.team || 'ทีม/แผนก',
      gender: p.gender === 'women' ? 'F' : 'M',
      played: (p.wins || 0) + (p.losses || 0),
      wins: p.wins || 0,
      losses: p.losses || 0,
      setsFor: p.sets_won || 0,
      setsAgainst: p.sets_lost || 0,
      points: p.points || 0,
      pct: (p.wins || 0) + (p.losses || 0) > 0 ? Math.round((p.wins || 0) / ((p.wins || 0) + (p.losses || 0)) * 100) : 0,
      status: p.status === 'winner' ? 'WINNER' : p.status === 'eliminated' ? 'ELIMINATED' : 'IN_PLAY',
      photo: p.photo_url,
      pointsFor: 0,
      pointsAgainst: 0
    }));

    // Load matches
    const { data: matchesData, error: matchesError } = await supabaseClient
      .from('matches')
      .select('*')
      .order('created_at', { ascending: true });

    if (matchesError) throw matchesError;

    state.matches = (matchesData || []).map(m => ({
      id: m.id,
      p1: m.player1_name || '',
      p2: m.player2_name || '',
      score1: m.score1 || 0,
      score2: m.score2 || 0,
      round: m.round || '��� A',
      gender: m.gender === 'women' ? 'F' : 'M',
      status: m.status === 'finished' ? 'completed' : m.status === 'live' ? 'live' : 'upcoming',
      date: m.scheduled_at ? m.scheduled_at.split('T')[0] : '',
      time: m.scheduled_at ? m.scheduled_at.split('T')[1] ? m.scheduled_at.split('T')[1].substring(0, 5) : '' : '',
      sets: m.sets
    }));

    // render ทันทีด้วยข้อมูลจาก Supabase
    _supabaseLoadDone = true;
    _supabaseLoading  = false;
    // คำนวณ pointsFor/pointsAgainst จาก sets ที่โหลดมา
    recalcStandingsOnly();
    renderAll();
    setupRealtimeSubscriptions();
  } catch (error) {
    _supabaseLoading = false;
    console.error('Error loading data from Supabase:', error);
    // Fallback: โหลดจาก localStorage หรือ default data
    _loadFromLocalStorage();
    showToast('⚠️ โหลดจาก Supabase ไม่ได้ ใช้ข้อมูลในเครื่องแทน', true);
  }
}

// โหลดจาก localStorage (fallback)
function _loadFromLocalStorage() {
  try {
    var s = localStorage.getItem('com7v3');
    if (s) {
      var saved = JSON.parse(s);
      state.players = saved.players || [];
      state.matches = saved.matches || [];
    } else {
      // ไม่มีข้อมูลเลย ใช้ default
      var d = _getDefaultData();
      state.players = d.players;
      state.matches = d.matches;
      // บันทึก default ลง localStorage
      _saveAndBroadcast()
    }
  } catch(e) {
    var d = _getDefaultData();
    state.players = d.players;
    state.matches = d.matches;
  }
  renderAll();
}

function _getDefaultData() {
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
    ],
    matches:[
      {id:1, p1:'A. JAYDEN', p2:'B. LIGK',  score1:2, score2:0, round:'��� A', gender:'M', status:'completed'},
      {id:2, p1:'A. JAYDEN', p2:'B. LAROY', score1:3, score2:0, round:'Semi Final',  gender:'M', status:'completed'},
    ]
  };
}

// Setup real-time subscriptions
function setupRealtimeSubscriptions() {
  if (realtimeSubscribed) return;
  // Realtime ไม่ทำงานกับ file:// protocol
  if (window.location.protocol === 'file:') return;
  realtimeSubscribed = true;

  try {
    supabaseClient
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => loadDataFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => loadDataFromSupabase())
      .subscribe();
  } catch(e) {
    console.warn('Realtime subscription unavailable:', e);
  }
}

// ─── ADMIN FUNCTIONS ──────────────────────────────────────────────────────────

// Add new player to Supabase
async function addPlayerToSupabase(playerData) {
  try {
    const { data, error } = await supabaseClient
      .from('players')
      .insert([{
        name: playerData.name,
        team: playerData.team,
        gender: playerData.gender === 'M' ? 'men' : 'women',
        photo_url: playerData.photo,
        wins: 0,
        losses: 0,
        sets_won: 0,
        sets_lost: 0,
        points: 0,
        status: playerData.status === 'WINNER' ? 'winner' : playerData.status === 'ELIMINATED' ? 'eliminated' : 'active'
      }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error adding player:', error);
    showToast('❌ ไม่สามารถเพิ่มผู้เล่นได้', true);
    return null;
  }
}

// Update player in Supabase
async function updatePlayerInSupabase(playerId, updates) {
  try {
    const { error } = await supabaseClient
      .from('players')
      .update({
        name: updates.name,
        team: updates.team,
        gender: updates.gender === 'M' ? 'men' : 'women',
        status: updates.status === 'WINNER' ? 'winner' : updates.status === 'ELIMINATED' ? 'eliminated' : 'active',
        points: updates.points,
        wins: updates.wins,
        losses: updates.losses,
        sets_won: updates.setsFor,
        sets_lost: updates.setsAgainst,
        ...(updates.photo ? { photo_url: updates.photo } : {})
      })
      .eq('id', playerId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating player:', error);
    showToast('❌ ไม่สามารถอัปเดตผู้เล่นได้', true);
    return false;
  }
}

// Recalc all player stats from matches then sync to Supabase
async function recalcAndSyncPlayersToSupabase() {
  // คำนวณ stats ใหม่จาก matches ทั้งหมดใน state
  recalcStandingsOnly();

  // sync ทุก player ไป Supabase พร้อมกัน
  const updates = state.players.map(function(p) {
    return supabaseClient.from('players').update({
      wins: p.wins,
      losses: p.losses,
      sets_won: p.setsFor,
      sets_lost: p.setsAgainst,
      points: p.points
    }).eq('id', p.id);
  });

  try {
    await Promise.all(updates);
    renderAll();
  } catch (error) {
    console.error('Error syncing player stats:', error);
    renderAll();
  }
}


// Delete player from Supabase
async function deletePlayerFromSupabase(playerId) {
  try {
    // ลบ matches ที่เกี่ยวข้องก่อน (foreign key constraint)
    const { error: matchErr } = await supabaseClient
      .from('matches')
      .delete()
      .or('player1_id.eq.' + playerId + ',player2_id.eq.' + playerId);

    if (matchErr) throw matchErr;

    // แล้วค่อยลบ player
    const { error } = await supabaseClient
      .from('players')
      .delete()
      .eq('id', playerId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting player:', error);
    showToast('❌ ไม่สามารถลบผู้เล่นได้', true);
    return false;
  }
}

// Add match to Supabase
async function addMatchToSupabase(matchData) {
  try {
    const player1 = state.players.find(p => p.name === matchData.p1);
    const player2 = state.players.find(p => p.name === matchData.p2);

    const { data, error } = await supabaseClient
      .from('matches')
      .insert([{
        player1_id: player1?.id,
        player2_id: player2?.id,
        player1_name: matchData.p1,
        player2_name: matchData.p2,
        score1: matchData.score1,
        score2: matchData.score2,
        gender: matchData.gender === 'M' ? 'men' : 'women',
        round: matchData.round,
        status: matchData.status === 'completed' ? 'finished' : matchData.status === 'live' ? 'live' : 'upcoming',
        scheduled_at: matchData.date && matchData.time ? `${matchData.date}T${matchData.time}:00` : null
      }])
      .select();

    if (error) throw error;

    // sync match ใหม่เข้า state แล้ว recalc stats
    if (matchData.status === 'completed') {
      state.matches.push({
        id: data[0].id, p1: matchData.p1, p2: matchData.p2,
        score1: matchData.score1, score2: matchData.score2,
        gender: matchData.gender, round: matchData.round, status: 'completed'
      });
      await recalcAndSyncPlayersToSupabase();
    }

    return data[0];
  } catch (error) {
    console.error('Error adding match:', error);
    showToast('❌ ไม่สามารถเพิ่มการแข่งขันได้', true);
    return null;
  }
}

// Update match in Supabase
async function updateMatchInSupabase(matchId, updates) {
  try {
    const player1 = state.players.find(p => p.name === updates.p1);
    const player2 = state.players.find(p => p.name === updates.p2);

    const { error } = await supabaseClient
      .from('matches')
      .update({
        player1_id: player1?.id,
        player2_id: player2?.id,
        player1_name: updates.p1,
        player2_name: updates.p2,
        score1: updates.score1,
        score2: updates.score2,
        gender: updates.gender === 'M' ? 'men' : 'women',
        round: updates.round,
        status: updates.status === 'completed' ? 'finished' : updates.status === 'live' ? 'live' : 'upcoming',
        scheduled_at: updates.date && updates.time ? `${updates.date}T${updates.time}:00` : null,
        finished_at: updates.status === 'completed' ? new Date().toISOString() : null,
        sets: updates.sets || null
      })
      .eq('id', matchId);

    if (error) throw error;

    // อัปเดต state แล้ว recalc stats
    var idx = state.matches.findIndex(m => m.id === matchId);
    if (idx >= 0) {
      state.matches[idx] = Object.assign(state.matches[idx], {
        p1: updates.p1, p2: updates.p2,
        score1: updates.score1, score2: updates.score2,
        gender: updates.gender, round: updates.round, status: updates.status,
        date: updates.date || '', time: updates.time || '',
        sets: updates.sets || []
      });
    }
    _saveAndBroadcast();
    await recalcAndSyncPlayersToSupabase();

    return true;
  } catch (error) {
    console.error('Error updating match:', error);
    showToast('❌ ไม่สามารถอัปเดตการแข่งขันได้', true);
    return false;
  }
}

// Delete match from Supabase
async function deleteMatchFromSupabase(matchId) {
  try {
    const { error } = await supabaseClient
      .from('matches')
      .delete()
      .eq('id', matchId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting match:', error);
    showToast('❌ ไม่สามารถลบการแข่งขันได้', true);
    return false;
  }
}

// Upload image to Supabase Storage
async function uploadImageToSupabase(file, fileName) {
  try {
    const fileExt = fileName.split('.').pop();
    const filePath = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabaseClient.storage
      .from('images')
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    showToast('❌ ไม่สามารถอัปโหลดรูปภาพได้', true);
    return null;
  }
}

// ─── AUTH FUNCTIONS ──────────────────────────────────────────────────────────

// Sign in with Supabase Auth
async function signInWithSupabase(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    return null;
  }
}

// Sign out with Supabase Auth
async function signOutFromSupabase() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    return false;
  }
}

// Check auth status
async function checkAuthStatus() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    return data.session !== null;
  } catch (error) {
    console.error('Error checking auth:', error);
    return false;
  }
}

// ─── MODIFIED ADMIN FUNCTIONS ────────────────────────────────────────────────

// Modified addPlayer function for Supabase
async function addPlayer() {
  var firstname = document.getElementById('new-player-firstname') ? document.getElementById('new-player-firstname').value.trim() : '';
  var nickname = document.getElementById('new-player-nickname') ? document.getElementById('new-player-nickname').value.trim() : '';
  var slot = document.getElementById('new-player-slot') ? document.getElementById('new-player-slot').value.trim().toUpperCase() : '';
  var team = document.getElementById('new-player-team').value.trim() || 'ทีม/แผนก';
  var gender = document.getElementById('new-player-gender').value;
  var status = document.getElementById('new-player-status').value;

  if (!firstname) {
    showToast('กรุณากรอกชื่อจริง', true);
    return;
  }

  // รวมชื่อ: "คุณ ชื่อจริง (คุณ ชื่อเล่น) สาย"
  var namePart = 'คุณ ' + firstname + (nickname ? ' (คุณ ' + nickname + ')' : '');
  var fullName = slot ? namePart + ' ' + slot : namePart;
  var name = fullName; // compat

  // Check if player already exists
  if (state.players.some(p => p.name === fullName)) {
    showToast('ชื่อนี้มีอยู่แล้ว', true);
    return;
  }

  // Upload photo if exists
  var photoUrl = null;
  if (state.pendingPhoto) {
    if (window.supabaseClient) {
      const blob = dataURLtoBlob(state.pendingPhoto);
      photoUrl = await uploadImageToSupabase(blob, `player-${name}.jpg`);
    }
    // ถ้า upload ไม่ได้ ใช้ data URL แทน (เก็บใน localStorage)
    if (!photoUrl) photoUrl = state.pendingPhoto;
  }

  const newPlayer = {
    name: fullName,
    team: team,
    gender: gender,
    status: status,
    photo: photoUrl
  };

  // ลอง Supabase ก่อน ถ้าไม่ได้ fallback ไป localStorage
  if (window.supabaseClient) {
    const addedPlayer = await addPlayerToSupabase(newPlayer);
    if (addedPlayer) {
      resetPhotoUI();
      document.getElementById('new-player-name').value = '';
      document.getElementById('new-player-team').value = '';
      if(document.getElementById('new-player-slot')) document.getElementById('new-player-slot').value = '';
      showToast('✅ เพิ่ม ' + fullName + ' สำเร็จ');
      return;
    }
  }

  // Fallback: บันทึกลง localStorage
  var newId = Date.now().toString();
  var playerObj = Object.assign({}, newPlayer, {
    id: newId,
    played: 0, wins: 0, losses: 0,
    setsFor: 0, setsAgainst: 0,
    points: 0, pct: 0
  });
  state.players.push(playerObj);
  _saveAndBroadcast()
  resetPhotoUI();
  document.getElementById('new-player-name').value = '';
  document.getElementById('new-player-team').value = '';
  renderAll();
  showToast('✅ เพิ่ม ' + name + ' สำเร็จ (บันทึกในเครื่อง)');
}

// Modified addMatch function for Supabase
async function addMatch() {
  var p1 = document.getElementById('match-p1').value;
  var p2 = document.getElementById('match-p2').value;
  var s1 = parseInt(document.getElementById('match-score1').value) || 0;
  var s2 = parseInt(document.getElementById('match-score2').value) || 0;
  var round = document.getElementById('match-round').value;
  var gender = document.getElementById('match-gender').value;
  var status = document.getElementById('match-status').value;
  var dateVal = document.getElementById('match-date').value || '';
  var timeVal = document.getElementById('match-time').value || '';

  if (!p1 || !p2) {
    showToast('กรุณาเลือกผู้เล่น', true);
    return;
  }
  if (p1 === p2) {
    showToast('ต้องเลือกผู้เล่นคนละคน', true);
    return;
  }

  const matchData = { p1, p2, score1: s1, score2: s2, round, gender, status, date: dateVal, time: timeVal };

  // ลอง Supabase ก่อน
  if (window.supabaseClient) {
    const addedMatch = await addMatchToSupabase(matchData);
    if (addedMatch) {
      showToast('✅ บันทึกผล ' + p1 + ' vs ' + p2 + ' สำเร็จ');
      return;
    }
  }

  // Fallback: บันทึกลง localStorage
  var newId = Date.now().toString();
  var matchObj = Object.assign({}, matchData, { id: newId });
  state.matches.push(matchObj);
  // recalc stats
  recalcStandingsOnly();
  _saveAndBroadcast()
  renderAll();
  showToast('✅ บันทึกผล ' + p1 + ' vs ' + p2 + ' สำเร็จ (บันทึกในเครื่อง)');
}

// Modified saveEditPlayer function for Supabase
async function saveEditPlayer() {
  var id = document.getElementById('edit-player-id').value;
  var p = state.players.find(x => x.id === id);
  
  if (!p) return;
  
  var newName = document.getElementById('edit-player-name').value.trim();
  var newNick = document.getElementById('edit-player-nickname') ? document.getElementById('edit-player-nickname').value.trim() : '';
  var newSlot = document.getElementById('edit-player-slot') ? document.getElementById('edit-player-slot').value.trim().toUpperCase() : '';
  var namePart = 'คุณ ' + newName + (newNick ? ' (คุณ ' + newNick + ')' : '');
  var fullName = newSlot ? namePart + ' ' + newSlot : namePart;
  if (!newName) {
    showToast('กรุณากรอกชื่อ', true);
    return;
  }

  var updates = {
    name: fullName,
    team: document.getElementById('edit-player-team').value.trim() || p.team,
    gender: document.getElementById('edit-player-gender').value,
    status: document.getElementById('edit-player-status').value,
    points: p.points,
    wins: p.wins,
    losses: p.losses,
    setsFor: p.setsFor,
    setsAgainst: p.setsAgainst
  };

  // อัปโหลดรูปใหม่ถ้ามี
  if (window._editPendingPhoto) {
    if (window.supabaseClient) {
      var blob = dataURLtoBlob(window._editPendingPhoto);
      var newPhotoUrl = await uploadImageToSupabase(blob, 'player-' + fullName + '.jpg');
      if (newPhotoUrl) updates.photo = newPhotoUrl;
    } else {
      updates.photo = window._editPendingPhoto;
    }
    window._editPendingPhoto = null;
  }

  var oldName = p.name;

  // ลอง Supabase ก่อน
  if (window.supabaseClient) {
    const success = await updatePlayerInSupabase(id, updates);
    if (success) {
      p.name = updates.name;
      p.team = updates.team;
      p.gender = updates.gender;
      p.status = updates.status;
      if(updates.photo) p.photo = updates.photo;
      if (oldName !== fullName) {
        state.matches.forEach(function(m) {
          if (m.p1 === oldName) m.p1 = fullName;
          if (m.p2 === oldName) m.p2 = fullName;
        });
      }
      closeEditModal();
      renderAll();
      showToast('✅ แก้ไข ' + fullName + ' สำเร็จ');
      return;
    }
  }

  // Fallback: บันทึกลง localStorage
  p.name = updates.name;
  p.team = updates.team;
  p.gender = updates.gender;
  p.status = updates.status;
  if(updates.photo) p.photo = updates.photo;
  if (oldName !== fullName) {
    state.matches.forEach(function(m) {
      if (m.p1 === oldName) m.p1 = fullName;
      if (m.p2 === oldName) m.p2 = fullName;
    });
  }
  _saveAndBroadcast()
  closeEditModal();
  renderAll();
  showToast('✅ แก้ไข ' + newName + ' สำเร็จ');
}

// Modified saveEditMatch function for Supabase
async function saveEditMatch() {
  var id = document.getElementById('edit-match-id').value;
  var idx = state.matches.findIndex(x => x.id === id);
  
  if (idx < 0) return;
  
  var p1 = document.getElementById('edit-match-p1').value;
  var p2 = document.getElementById('edit-match-p2').value;
  
  if (!p1 || !p2) {
    showToast('กรุณาเลือกผู้เล่น', true);
    return;
  }
  
  if (p1 === p2) {
    showToast('ต้องเลือกผู้เล่นคนละคน', true);
    return;
  }
  
  var gender = document.getElementById('edit-match-gender').value;
  
  var player1 = state.players.find(p => p.name === p1);
  var player2 = state.players.find(p => p.name === p2);
  
  if (player1 && player1.gender !== gender) {
    showToast('ผู้เล่น ' + p1 + ' ไม่ตรงกับประเภทที่เลือก (' + (gender === 'M' ? "Men's" : "Women's") + ')', true);
    return;
  }
  
  if (player2 && player2.gender !== gender) {
    showToast('ผู้เล่น ' + p2 + ' ไม่ตรงกับประเภทที่เลือก (' + (gender === 'M' ? "Men's" : "Women's") + ')', true);
    return;
  }

  var updates = {
    p1: p1,
    p2: p2,
    score1: parseInt(document.getElementById('edit-match-score1').value) || 0,
    score2: parseInt(document.getElementById('edit-match-score2').value) || 0,
    round: document.getElementById('edit-match-round').value,
    gender: gender,
    status: document.getElementById('edit-match-status').value,
    date: document.getElementById('edit-match-date').value || '',
    time: document.getElementById('edit-match-time').value || '',
    sets: (function(){
      // อ่านค่าจาก DOM โดยตรง ไม่พึ่ง _editSets
      var result = [];
      var container = document.getElementById('set-scores-container');
      if(container){
        container.querySelectorAll('.set-row').forEach(function(row){
          var aEl = row.querySelector('.set-a');
          var bEl = row.querySelector('.set-b');
          result.push({
            a: aEl ? (parseInt(aEl.value) || 0) : 0,
            b: bEl ? (parseInt(bEl.value) || 0) : 0
          });
        });
      }
      return result;
    })()
  };
  if (window.supabaseClient) {
    const success = await updateMatchInSupabase(id, updates);
    if (success) {
      closeEditMatchModal();
      renderAll();
      showToast('✅ แก้ไขผลแมตช์สำเร็จ');
      return;
    }
  }

  // Fallback: บันทึกลง localStorage
  state.matches[idx] = Object.assign(state.matches[idx], updates);
  recalcStandingsOnly();
  _saveAndBroadcast()
  closeEditMatchModal();
  renderAll();
  showToast('✅ แก้ไขผลแมตช์สำเร็จ');
}

// Modified deletePlayer function for Supabase
async function deletePlayer(id) {
  var p = state.players.find(x => x.id === id);
  if (!p) return;
  
  var ok = await window.confirm('ลบผู้เล่น "' + p.name + '" ออกจากระบบ?\n(แมตช์ทั้งหมดของผู้เล่นนี้จะถูกลบด้วย)');
  if (!ok) return;
  if (window.supabaseClient) {
    const success = await deletePlayerFromSupabase(id);
    if (success) {
      showToast('🗑️ ลบ ' + p.name + ' แล้ว');
      return;
    }
  }

  // Fallback: ลบจาก localStorage
  state.players = state.players.filter(x => x.id !== id);
  state.matches = state.matches.filter(m => m.p1 !== p.name && m.p2 !== p.name);
  _saveAndBroadcast()
  renderAll();
  showToast('🗑️ ลบ ' + p.name + ' แล้ว');
}

// Modified deleteMatch function for Supabase
async function deleteMatch(id) {
  var m = state.matches.find(x => x.id === id);
  if (!m) return;
  
  var ok = await window.confirm('ลบแมตช์ "' + m.p1 + ' vs ' + m.p2 + '" ออกจากระบบ?');
  if (!ok) return;
  
  // ลอง Supabase ก่อน
  if (window.supabaseClient) {
    const success = await deleteMatchFromSupabase(id);
    if (success) {
      showToast('🗑️ ลบแมตช์แล้ว');
      return;
    }
  }

  // Fallback: ลบจาก localStorage
  state.matches = state.matches.filter(x => x.id !== id);
  recalcStandingsOnly();
  _saveAndBroadcast()
  renderAll();
  showToast('🗑️ ลบแมตช์แล้ว');
}

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

// Save state to localStorage และ broadcast ไปทุก tab
function _saveAndBroadcast() {
  try { localStorage.setItem('com7v3', JSON.stringify(state)); } catch(e) {}
}

// Convert data URL to blob
function dataURLtoBlob(dataURL) {
  var arr = dataURL.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// ─── KEEP EXISTING UI FUNCTIONS ──────────────────────────────────────────────
// All existing UI rendering functions remain the same
// (renderTopPlayers, renderOverviewStats, renderRecentMatches, etc.)
// They will work with the updated state from Supabase

// ─── INITIALIZATION ──────────────────────────────────────────────────────────

// Initialize the app
async function initApp() {
  // Safety timeout: ซ่อน loader ภายใน 5 วินาทีเสมอ
  var loaderTimeout = setTimeout(function() {
    var loader = document.getElementById('pp-loader');
    if (loader) loader.style.display = 'none';
  }, 5000);

  try {
    // Check if Supabase client is available
    if (!window.supabaseClient) {
      console.warn('Supabase client not available, falling back to localStorage');
      _loadFromLocalStorage();
    } else {
      // Load data from Supabase (มี fallback ใน function นั้นแล้ว)
      await loadDataFromSupabase();
    }
  } catch(e) {
    console.error('initApp error:', e);
    _loadFromLocalStorage();
  } finally {
    clearTimeout(loaderTimeout);
    // ซ่อน loader เสมอ ไม่ว่าจะเกิดอะไรขึ้น
    var loader = document.getElementById('pp-loader');
    if (loader) loader.style.display = 'none';
  }

  // ─── CROSS-TAB SYNC ──────────────────────────────────────────────────────
  // เมื่อ admin บันทึกข้อมูล → หน้าบ้านอัปเดตอัตโนมัติ
  window.addEventListener('storage', function(e) {
    if (e.key === 'com7v3' && e.newValue) {
      try {
        var fresh = JSON.parse(e.newValue);
        state.players = fresh.players || [];
        state.matches = fresh.matches || [];
        renderAll();
      } catch(err) {}
    }
  });

  // อัปเดตเมื่อ user กลับมาที่ tab นี้ (หลังจาก admin แก้ไข)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      if (window.supabaseClient && _supabaseLoadDone) {
        // reload จาก Supabase
        _supabaseLoadDone = false;
        loadDataFromSupabase();
      } else {
        // reload จาก localStorage
        try {
          var s = localStorage.getItem('com7v3');
          if (s) {
            var saved = JSON.parse(s);
            state.players = saved.players || [];
            state.matches = saved.matches || [];
            renderAll();
          }
        } catch(e) {}
      }
    }
  });
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}


// ─── UI RENDERING FUNCTIONS (from original app.js) ────────────────────────────

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
    var parsed = parseName(p.name);
    var displayName = parsed.firstName || ('คุณ ' + p.name);
    if(parsed.nickName) displayName += '<br><span style="font-size:11px;opacity:0.7;">('+parsed.nickName+')</span>';
    if(parsed.slot)     displayName += '<br><span style="font-family:\'Orbitron\',monospace;font-size:11px;color:var(--cyan);">'+parsed.slot+'</span>';
    var teamHtml = p.team ? '<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px;">'+p.team+'</div>' : '';
    return '<div class="podium-card rank-'+rank+'"><div class="rank-badge">'+rank+'</div>'+podiumAva(p)+'<div class="podium-name" style="text-align:center;line-height:1.4;">'+displayName+'</div>'+teamHtml+'<div class="podium-pts">'+((p.played||0))+' Match</div></div>';
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
  var timeStr = '';
  if(m.date){
    var d = new Date(m.date);
    var dayNames=['อา','จ','อ','พ','พฤ','ศ','ส'];
    var monthNames=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    dateStr = dayNames[d.getDay()]+' '+d.getDate()+' '+monthNames[d.getMonth()];
    timeStr = m.time ? m.time+' น.' : '';
  }

  var s1cls = isDone ? (w1?'s-win':'s-lose') : 's-neutral';
  var s2cls = isDone ? (w2?'s-win':'s-lose') : 's-neutral';
  var boxCls = isLive ? 'box-live' : isDone ? 'box-done' : '';

  return '<div class="match-card'+(isLive?' live-card':'')+'">'+

    /* ── left spacer (same width as info panel) ── */
    '<div></div>'+

    /* ── match-center: truly centered ── */
    '<div style="display:flex;justify-content:center;align-items:center;">'+

      '<span class="fix-player-name'+(w1?' winner-name':w2?' loser-name':'')+'" style="flex:1;text-align:right;padding-right:16px;font-size:14px;font-weight:700;font-family:\'Anuphan\',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;">'+
        (w1?'🏆 ':'')+fmtNameInline(m.p1)+
      '</span>'+

      '<div class="fix-score-box '+boxCls+'" style="width:70px;min-width:70px;height:38px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:8px;">'+
        '<span class="fix-score-num '+s1cls+'" style="font-size:17px;width:24px;text-align:center;font-family:Arial,sans-serif;font-weight:900;display:inline-block;">'+m.score1+'</span>'+
        '<span style="font-size:13px;color:rgba(255,255,255,0.3);width:10px;text-align:center;display:inline-block;">:</span>'+
        '<span class="fix-score-num '+s2cls+'" style="font-size:17px;width:24px;text-align:center;font-family:Arial,sans-serif;font-weight:900;display:inline-block;">'+m.score2+'</span>'+
      '</div>'+

      '<span class="fix-player-name'+(w2?' winner-name':w1?' loser-name':'')+'" style="flex:1;text-align:left;padding-left:16px;font-size:14px;font-weight:700;font-family:\'Anuphan\',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;">'+
        fmtNameInline(m.p2)+(w2?' 🏆':'')+
      '</span>'+

    '</div>'+

    /* ── match-info: right column ── */
    '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;padding:0 16px 0 12px;border-left:1px solid var(--border2);">'+
      (isLive?'<span class="live-badge"><span class="live-dot"></span>LIVE</span>':'')+
      '<span class="match-round" style="font-size:9px;font-family:\'Anuphan\',sans-serif;">'+m.round+'</span>'+
      '<span class="match-gender '+gC+'" style="font-size:9px;">'+gL+'</span>'+
      (isDone?'<span style="font-size:9px;color:var(--win);font-family:\'Anuphan\',sans-serif;">✓ จบแล้ว</span>':'')+
      (m.status==='upcoming'?'<span style="font-size:9px;color:var(--muted);font-family:\'Anuphan\',sans-serif;">⏳ รอแข่ง</span>':'')+
      (dateStr?'<span style="font-size:9px;color:var(--muted);font-family:\'Anuphan\',sans-serif;">'+dateStr+'</span>':'')+
    '</div>'+

  '</div>';
}

function renderRecentMatches(){
  // แสดงเฉพาะแมตช์ที่จบแล้วหรือกำลังแข่ง (ไม่แสดง upcoming ที่ยังไม่มีคะแนน)
  var r = state.matches.filter(function(m){
    return m.status === 'completed' || m.status === 'live';
  }).slice().reverse().slice(0,5);
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

  var dateLabel, dateInfo, timeStr;
  if(m.date){
    var d = new Date(m.date);
    var dayNames = ['อา','จ','อ','พ','พฤ','ศ','ส'];
    var monthNames = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    dateLabel = dayNames[d.getDay()]+' '+d.getDate()+' '+monthNames[d.getMonth()];
    timeStr   = m.time ? m.time+' น.' : '';
    dateInfo  = timeStr || m.round;
  } else {
    dateLabel = 'แมตช์ที่ '+(idx+1);
    dateInfo  = m.round;
    timeStr   = '';
  }

  var boxCls = isDone ? 'box-done' : isLive ? 'box-live' : '';
  var s1Cls  = isDone ? (w1?'s-win':'s-lose') : 's-neutral';
  var s2Cls  = isDone ? (w2?'s-win':'s-lose') : 's-neutral';
  var genderClass = m.gender === 'F' ? ' fix-women' : '';

  // Status badge — กระชับ ไม่ซ้ำซ้อน
  var statusHtml = isLive
    ? '<span class="fix-status-badge badge-live"><span class="live-dot"></span>LIVE</span>'
    : isDone
      ? '<span class="fix-status-badge badge-done">✓ จบแล้ว</span>'
      : '<span class="fix-status-badge badge-upcoming">⏳ รอแข่ง</span>';

  return '<div class="fix-row'+(isLive?' fix-live':'')+genderClass+'" id="fix-row-'+m.id+'">'+

    // ── Date column ──
    '<div class="fix-date">'+
      '<div class="fix-date-day">'+dateLabel+'</div>'+
      (timeStr ? '<div class="fix-date-info">'+timeStr+'</div>' : '<div class="fix-date-info">'+m.round+'</div>')+
      gTag+
    '</div>'+

    // ── Player A ──
    '<div class="fix-player-a">'+
      '<div class="fix-player-name'+(w1?' winner-name':w2?' loser-name':'')+'" >'+
        (w1?'🏆 ':'')+fmtNameInline(m.p1)+
      '</div>'+
    '</div>'+

    // ── Score ──
    '<div class="fix-score-box '+boxCls+'">'+
      '<span class="fix-score-num '+s1Cls+'">'+m.score1+'</span>'+
      '<span class="fix-score-sep">:</span>'+
      '<span class="fix-score-num '+s2Cls+'">'+m.score2+'</span>'+
    '</div>'+

    // ── Player B ──
    '<div class="fix-player-b">'+
      '<div class="fix-player-name'+(w2?' winner-name':w1?' loser-name':'')+'">'+
        fmtNameInline(m.p2)+(w2?' 🏆':'')+
      '</div>'+
    '</div>'+

    // ── Status column — badge เดียว จบ ──
    '<div class="fix-status">'+
      statusHtml+
    '</div>'+

  '</div>';
}

var ROUND_ORDER = ['สาย A','สาย B','สาย C','สาย D','Semi Final','Final'];
var ROUND_ICONS = {'สาย A':'🅰️','สาย B':'🅱️','สาย C':'🇨','สาย D':'🇩','Semi Final':'🏅','Final':'🏆'};

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

  // เรียงทุกแมตช์ตามวันที่และเวลา ไม่แบ่ง round
  filtered.sort(function(a, b){
    var aKey = (a.date || '9999-12-31') + 'T' + (a.time || '23:59');
    var bKey = (b.date || '9999-12-31') + 'T' + (b.time || '23:59');
    return aKey.localeCompare(bKey);
  });

  var html = filtered.map(function(m, i){ return fixtureRow(m, i); }).join('');
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

// Ranking comparator: pointsFor → win% → set diff → point diff → name
function rankComparator(a, b){
  // ขั้น 1: แต้มรวม (pointsFor) — มากกว่าอยู่บน
  var aPts = a.pointsFor || 0;
  var bPts = b.pointsFor || 0;
  if(bPts !== aPts) return bPts - aPts;

  // ขั้น 2: % ชนะ (win rate)
  var aWR = a.played ? (a.wins / a.played) : 0;
  var bWR = b.played ? (b.wins / b.played) : 0;
  if(bWR !== aWR) return bWR - aWR;

  // ขั้น 3: ผลต่างเซต (setsFor - setsAgainst)
  var aSetDiff = (a.setsFor || 0) - (a.setsAgainst || 0);
  var bSetDiff = (b.setsFor || 0) - (b.setsAgainst || 0);
  if(bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;

  // ขั้น 4: ผลต่างแต้ม (pointsFor - pointsAgainst)
  var aPtDiff = (a.pointsFor || 0) - (a.pointsAgainst || 0);
  var bPtDiff = (b.pointsFor || 0) - (b.pointsAgainst || 0);
  if(bPtDiff !== aPtDiff) return bPtDiff - aPtDiff;

  // ขั้น 5: เรียงตามชื่อ (tiebreaker)
  return (a.name || '').localeCompare(b.name || '');
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
      var ptsFor = p.pointsFor || 0;
      var ptsAgainst = p.pointsAgainst || 0;
      var winPct = p.played ? Math.round((p.wins/p.played)*100) : 0;
      var gPill = p.gender==='M'
        ? '<span class="gender-pill-m">♂ M</span>'
        : '<span class="gender-pill-f">♀ W</span>';
      html += '<tr class="'+rowCls+'">'+
        '<td style="text-align:center;width:44px;"><div class="rank-cell">'+rankIcon+'</div></td>'+
        '<td>'+ava(p,36)+'</td>'+
        '<td>'+(function(name){
          var gPill = p.gender==='M'
            ? '<span class="gender-pill-m">♂ M</span>'
            : '<span class="gender-pill-f">♀ W</span>';
          return fmtNameBlock(name, p.team, gPill);
        })(p.name)+
        '</td>'+
        '<td style="text-align:center;font-family:\'Orbitron\',monospace;">'+(function(name){
          var m = name.match(/([A-D])(\d+)\s*$/i);
          if(!m) return '<span style="color:var(--muted)">-</span>';
          return '<span style="font-size:13px;font-weight:700;color:var(--cyan);">'+m[1]+m[2]+'</span>';
        })(p.name)+'</td>'+
        '<td style="text-align:center;font-family:\'Orbitron\',monospace;font-size:13px;">'+p.played+'</td>'+
        '<td style="text-align:center;font-family:\'Orbitron\',monospace;font-size:13px;color:var(--win);font-weight:700;">'+p.wins+'</td>'+
        '<td style="text-align:center;font-family:\'Orbitron\',monospace;font-size:13px;color:rgba(248,81,73,0.8);">'+p.losses+'</td>'+
        '<td style="font-size:12px;white-space:nowrap;color:rgba(255,255,255,0.5);">'+
          p.setsFor+'/'+p.setsAgainst+
          ' <span style="color:'+setDiffColor+';font-size:11px;">('+setDiffStr+')</span>'+
        '</td>'+
        '<td style="font-family:\'Orbitron\',monospace;font-size:14px;font-weight:900;color:#d29922;text-align:center;">'+ptsFor+'</td>'+
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
      var ptsFor2 = p.pointsFor || 0;
      var ptsAgainst2 = p.pointsAgainst || 0;
      rows += '<tr class="'+rowCls+'">'+
        '<td><span class="rank-num '+rc+'">'+displayRank+'</span></td>'+
        '<td>'+ava(p,38)+'</td>'+
        '<td colspan="2">'+
          fmtNameBlock(p.name, p.team, null)+
        '</td>'+
        '<td>'+p.played+'</td>'+
        '<td class="stat-win">'+p.wins+'</td>'+
        '<td class="stat-lose">'+p.losses+'</td>'+
        '<td style="font-size:10px;white-space:nowrap">'+p.setsFor+'/'+p.setsAgainst+
          '<span style="font-size:9px;color:'+setDiffColor+';margin-left:3px">('+setDiffStr+')</span>'+
        '</td>'+
        '<td style="font-weight:900;color:var(--gold);font-family:\'Orbitron\',monospace;font-size:13px">'+ptsFor2+'</td>'+
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

// ─── RENDER ALL ───────────────────────────────────────────────────────────────
function el(id){ return document.getElementById(id); }

// ─── NAME PARSER HELPER ───────────────────────────────────────────────────────
// แยกชื่อเต็มออกเป็น { firstName, nickName, slot }
// เช่น "คุณ ภูเบธ (คุณ โตส) A2" → { firstName:"คุณ ภูเบธ", nickName:"คุณ โตส", slot:"A2" }
function parseName(name){
  if(!name) return { firstName:'', nickName:'', slot:'' };
  var slotM = name.match(/\s([A-D]\d+)\s*$/i);
  var slot = slotM ? slotM[1].toUpperCase() : '';
  var noSlot = slotM ? name.replace(/\s([A-D]\d+)\s*$/i,'').trim() : name;
  var noPre = noSlot.replace(/^คุณ\s+/i,'').trim();
  var nickM = noPre.match(/^(.+?)\s*\((.+?)\)\s*$/);
  var rawFirst = nickM ? nickM[1].trim() : noPre;
  var rawNick  = nickM ? nickM[2].trim() : '';
  var firstName = rawFirst ? 'คุณ ' + rawFirst.replace(/^คุณ\s+/i,'') : '';
  var nickName  = rawNick  ? (/^คุณ\s/i.test(rawNick) ? rawNick : 'คุณ ' + rawNick) : '';
  return { firstName: firstName, nickName: nickName, slot: slot };
}

// สร้าง HTML ชื่อผู้เล่นแบบ inline (ใช้ใน match card / podium)
// เช่น "คุณ ภูเบธ (คุณ โตส) A2"
function fmtNameInline(name){
  if(!name) return '';
  var p = parseName(name);
  var out = p.firstName || ('คุณ ' + name);
  if(p.nickName) out += ' (' + p.nickName + ')';
  if(p.slot)     out += ' ' + p.slot;
  return out;
}

// สร้าง HTML ชื่อผู้เล่นแบบ block (ใช้ใน standings / podium card)
// บรรทัด 1: ชื่อ + ชื่อเล่น  บรรทัด 2: แผนก  บรรทัด 3: สาย
function fmtNameBlock(name, team, gPill){
  var p = parseName(name);
  var fn = p.firstName || ('คุณ ' + name);
  var nn = p.nickName ? '<span style="font-size:12px;color:rgba(255,255,255,0.5);margin-left:4px;">('+p.nickName+')</span>' : '';
  var slotHtml = p.slot
    ? '<div style="margin-top:2px;font-family:\'Orbitron\',monospace;font-size:11px;font-weight:700;color:var(--cyan);">'+p.slot+'</div>'
    : '';
  var teamHtml = team
    ? '<div style="margin-top:1px;font-size:11px;color:rgba(255,255,255,0.4);font-family:\'Anuphan\',sans-serif;">'+team+'</div>'
    : '';
  var pillHtml = gPill ? '<div style="margin-top:3px;">'+gPill+'</div>' : '';
  return '<div class="player-name-cell">'+fn+nn+'</div>'+slotHtml+teamHtml+pillHtml;
}

// Helper เดิม (compat)
function displayPlayerName(name){
  if(!name) return fmtNameInline(name);
  return fmtNameInline(name);
}
function renderAll(){
  if(el('men-podium'))          renderTopPlayers();
  if(el('stat-players'))        renderOverviewStats();
  if(el('recent-matches-list')) renderRecentMatches();
  if(el('standings-body'))      renderStandings();
  if(el('player-mgmt-body'))    renderPlayerMgmt();
  if(el('match-mgmt-body'))     renderMatchMgmt();
  if(el('match-p1'))            populatePlayerSelects();
  if(el('bracket-setup-body'))  renderBracketSetup();
  if(el('bracket-view'))        renderBracketView();
  if(el('all-matches-list') && el('tab-matches') && el('tab-matches').classList.contains('active')) renderAllMatches();
}

// ─── ADMIN UI FUNCTIONS ──────────────────────────────────────────────────────

function populatePlayerSelects(gender){
  var selIds = ['match-p1','match-p2','edit-match-p1','edit-match-p2'];
  
  // Filter players by gender if specified
  var filteredPlayers = state.players;
  if (gender === 'M' || gender === 'F') {
    filteredPlayers = state.players.filter(function(p) { return p.gender === gender; });
  }
  
  var o = '<option value="">— เลือกผู้เล่น —</option>' + filteredPlayers.map(function(p){ 
    return '<option value="'+p.name+'">'+p.name+'</option>'; 
  }).join('');
  
  selIds.forEach(function(id){
    var el = document.getElementById(id);
    if(el){ 
      var cur = el.value; 
      el.innerHTML = o; 
      if (cur) el.value = cur; 
    }
  });
}

var _playerMgmtGender = null;

function filterPlayerMgmt(g, btn){
  _playerMgmtGender = g;
  ['all','M','F'].forEach(function(k){
    var b = document.getElementById('pmgmt-btn-'+k);
    if(!b) return;
    if(k===g){
      b.classList.add('is-active');
    } else {
      b.classList.remove('is-active');
    }
  });
  renderPlayerMgmt();
}

function renderPlayerMgmt(){
  var tbody = document.getElementById('player-mgmt-body');
  if(!tbody) return;

  // ยังไม่ได้เลือกประเภท — แสดง placeholder
  if(_playerMgmtGender === null){
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:28px;font-family:\'Anuphan\',sans-serif;font-size:15px;">กรุณาเลือกประเภทเพื่อดูรายชื่อผู้แข่งขัน</td></tr>';
    return;
  }

  if(!state.players.length){
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:16px">ยังไม่มีผู้เล่น</td></tr>';
    return;
  }
  var allMen   = state.players.filter(function(p){ return p.gender==='M'; }).sort(rankComparator);
  var allWomen = state.players.filter(function(p){ return p.gender==='F'; }).sort(rankComparator);
  var men   = _playerMgmtGender === 'F' ? [] : allMen;
  var women = _playerMgmtGender === 'M' ? [] : allWomen;

  function buildRows(list, gLabel, gColor){
    if(!list.length) return '';
    var html = '<tr><td colspan="9" style="padding:10px 18px 4px;background:rgba(0,0,0,0.2);">'+
      '<span style="font-family:\'Anuphan\',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;color:'+gColor+'">'+gLabel+'</span>'+
    '</td></tr>';
    list.forEach(function(p, i){
      var scClass = p.status==='WINNER'?'status-winner': p.status==='IN_PLAY'?'status-inplay':'status-eliminated';
      var genderLabel = p.gender==='M' ? '<span style="color:#00e5ff;font-size:10px">♂ MEN</span>' : '<span style="color:#ff80ab;font-size:10px">♀ WOMEN</span>';
      var slotMatch = p.name.match(/\s([A-D]\d+)\s*$/i);
      var slot = slotMatch ? slotMatch[1].toUpperCase() : '-';
      var nameNoSlot = slotMatch ? p.name.replace(/\s([A-D]\d+)\s*$/i, '').trim() : p.name;
      var nameNoPre = nameNoSlot.replace(/^คุณ\s+/i, '').trim();
      var nickMatch = nameNoPre.match(/^(.+?)\s*\((.+?)\)\s*$/);
      var rawFirst = nickMatch ? nickMatch[1].trim() : '';
      var rawNick  = nickMatch ? nickMatch[2].trim() : '';
      // เพิ่ม "คุณ " นำหน้าชื่อเล่นถ้ายังไม่มี
      var nickDisplay = rawNick ? (/^คุณ\s/i.test(rawNick) ? rawNick : 'คุณ ' + rawNick) : '';
      // ถ้าไม่มีชื่อจริง (เช่น ชื่อเต็มเป็น "คุณ (โตส)") ให้ใช้ชื่อเล่นเป็นชื่อจริงแทน
      var firstName = rawFirst
        ? 'คุณ ' + rawFirst
        : (nickDisplay ? nickDisplay : 'คุณ ' + nameNoPre.replace(/^\(|\)$/g, '').trim());
      var nickName = nickDisplay || '-';
      html += '<tr>'+
        '<td style="color:var(--muted)">'+(i+1)+'</td>'+
        '<td style="font-weight:700">'+firstName+'</td>'+
        '<td style="color:var(--muted);font-size:13px;">'+(nickName!=='-'?'('+nickName+')':'-')+'</td>'+
        '<td style="color:var(--muted);font-size:11px">'+p.team+'</td>'+
        '<td style="font-family:Orbitron,monospace;font-size:12px;color:var(--cyan);font-weight:700;">'+slot+'</td>'+
        '<td>'+genderLabel+'</td>'+
        '<td style="font-family:Orbitron,monospace;color:var(--gold);font-weight:900">'+(p.pointsFor||0)+'</td>'+
        '<td><span class="status-badge '+scClass+'">'+p.status+'</span></td>'+
        '<td style="white-space:nowrap">'+
          '<button class="btn-edit" onclick="openEditModal(\''+p.id+'\')">✏️ แก้ไข</button>'+
          '<button class="btn-del" onclick="deletePlayer(\''+p.id+'\')">🗑️ ลบ</button>'+
        '</td>'+
      '</tr>';
    });
    return html;
  }

  tbody.innerHTML = buildRows(men, "♂ MEN'S", '#00e5ff') + buildRows(women, "♀ WOMEN'S", '#ff80ab');
}

function openEditModal(id){
  var p = state.players.find(x => x.id === id);
  if(!p) return;

  // โหลดรูปภาพปัจจุบัน
  var photoImg = document.getElementById('edit-photo-img');
  var photoPh = document.getElementById('edit-photo-ph');
  window._editPendingPhoto = null;
  if(p.photo && photoImg){
    photoImg.src = p.photo;
    photoImg.style.display = 'block';
    if(photoPh) photoPh.style.display = 'none';
  } else {
    if(photoImg){ photoImg.src=''; photoImg.style.display='none'; }
    if(photoPh) photoPh.style.display = '';
  }
  var editPhotoInp = document.getElementById('edit-photo-inp');
  if(editPhotoInp) editPhotoInp.value = '';
  // แยกสายออกจากชื่อ เช่น "คุณ ภูเบธ (คุณ โตส) A2" → firstname="ภูเบธ", nickname="คุณ โตส", slot="A2"
  var slotMatch = p.name.match(/\s([A-D]\d+)\s*$/i);
  var nameNoSlot = slotMatch ? p.name.replace(/\s([A-D]\d+)\s*$/i, '').trim() : p.name;
  var slot = slotMatch ? slotMatch[1].toUpperCase() : '';
  // ลบ "คุณ " นำหน้า
  var nameNoPre = nameNoSlot.replace(/^คุณ\s+/i, '').trim();
  // แยกชื่อเล่นในวงเล็บ
  var nickMatch = nameNoPre.match(/^(.+?)\s*\((.+?)\)\s*$/);
  var baseName = nickMatch ? nickMatch[1].trim() : nameNoPre;
  // คง "คุณ " นำหน้าชื่อเล่น ถ้ายังไม่มีให้เพิ่ม
  var rawNick = nickMatch ? nickMatch[2].trim() : '';
  var nickname = rawNick ? (/^คุณ\s/i.test(rawNick) ? rawNick : 'คุณ ' + rawNick) : '';

  document.getElementById('edit-player-id').value      = p.id;
  document.getElementById('edit-player-name').value    = baseName;
  var nickEl = document.getElementById('edit-player-nickname');
  if(nickEl) nickEl.value = nickname;
  var slotEl = document.getElementById('edit-player-slot');
  if(slotEl) slotEl.value = slot;
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

function openEditMatch(id){
  var m = state.matches.find(x => x.id === id);
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
  // โหลดคะแนนแต่ละเซต
  window._editSets = (m.sets && Array.isArray(m.sets)) ? JSON.parse(JSON.stringify(m.sets)) : [];
  renderSetScores();
  var modal = document.getElementById('edit-match-modal');
  modal.style.display = 'flex';
}

function closeEditMatchModal(){
  document.getElementById('edit-match-modal').style.display = 'none';
  window._editSets = [];
}

// ─── SET SCORE FUNCTIONS ──────────────────────────────────────────────────────
function renderSetScores(){
  var container = document.getElementById('set-scores-container');
  if(!container) return;
  // อ่านค่าปัจจุบันจาก DOM ก่อน re-render
  var inputs = container.querySelectorAll('.set-row');
  inputs.forEach(function(row, i){
    var aEl = row.querySelector('.set-a');
    var bEl = row.querySelector('.set-b');
    if(aEl && window._editSets[i]) window._editSets[i].a = parseInt(aEl.value) || 0;
    if(bEl && window._editSets[i]) window._editSets[i].b = parseInt(bEl.value) || 0;
  });

  var sets = window._editSets || [];
  container.innerHTML = sets.map(function(s, i){
    return '<div class="set-row" style="display:flex;align-items:center;gap:8px;">' +
      '<span style="font-size:13px;color:var(--muted);min-width:48px;">เซต '+(i+1)+'</span>' +
      '<input type="number" min="0" max="30" value="'+(s.a||0)+'" class="form-input set-a" style="width:70px;padding:6px 10px;font-size:14px;text-align:center;"/>'+
      '<span style="color:var(--muted);">-</span>'+
      '<input type="number" min="0" max="30" value="'+(s.b||0)+'" class="form-input set-b" style="width:70px;padding:6px 10px;font-size:14px;text-align:center;"/>'+
      '<button onclick="removeSetRow('+i+')" style="background:rgba(255,68,102,0.12);border:1px solid rgba(255,68,102,0.3);color:#f85149;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:13px;">✕</button>'+
    '</div>';
  }).join('');
}

function addSetRow(){
  if(!window._editSets) window._editSets = [];
  // อ่านค่าปัจจุบันก่อนเพิ่ม
  var container = document.getElementById('set-scores-container');
  if(container){
    container.querySelectorAll('.set-row').forEach(function(row, i){
      var aEl = row.querySelector('.set-a');
      var bEl = row.querySelector('.set-b');
      if(aEl && window._editSets[i]) window._editSets[i].a = parseInt(aEl.value) || 0;
      if(bEl && window._editSets[i]) window._editSets[i].b = parseInt(bEl.value) || 0;
    });
  }
  window._editSets.push({a:0, b:0});
  renderSetScores();
}

function removeSetRow(idx){
  // อ่านค่าปัจจุบันก่อนลบ
  var container = document.getElementById('set-scores-container');
  if(container){
    container.querySelectorAll('.set-row').forEach(function(row, i){
      var aEl = row.querySelector('.set-a');
      var bEl = row.querySelector('.set-b');
      if(aEl && window._editSets[i]) window._editSets[i].a = parseInt(aEl.value) || 0;
      if(bEl && window._editSets[i]) window._editSets[i].b = parseInt(bEl.value) || 0;
    });
  }
  if(window._editSets) window._editSets.splice(idx, 1);
  renderSetScores();
}

// ─── MATCH MANAGEMENT ─────────────────────────────────────────────────────────
var adminMatchFilter = null;
var adminMatchGender = null;

function setAdminMatchFilter(f, btn){
  adminMatchFilter = f;
  var btnMap = {all:'mmgmt-btn-all', live:'mmgmt-btn-live', completed:'mmgmt-btn-completed', upcoming:'mmgmt-btn-upcoming'};
  Object.keys(btnMap).forEach(function(k){
    var b = document.getElementById(btnMap[k]);
    if(!b) return;
    if(k===f){ b.classList.add('is-active'); }
    else { b.classList.remove('is-active'); }
  });
  renderMatchMgmt();
}

function setAdminMatchGender(g, btn){
  adminMatchGender = adminMatchGender === g ? null : g;
  ['M','F'].forEach(function(k){
    var b = document.getElementById('mmgmt-btn-'+k);
    if(!b) return;
    if(k===adminMatchGender){
      b.classList.add('is-active');
    } else {
      b.classList.remove('is-active');
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
          (w1?'<span class="mmgmt-trophy">🏆</span> ':'')+fmtNameInline(m.p1)+
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
          fmtNameInline(m.p2)+(w2?' <span class="mmgmt-trophy">🏆</span>':'')+
        '</div>'+
      '</div>'+
      '<div class="mmgmt-card-footer">'+
        '<div class="mmgmt-card-meta">'+
          '<span class="mmgmt-round">'+m.round+'</span>'+
          gTag+statusTag+
        '</div>'+
        '<div class="mmgmt-card-actions">'+
          '<button class="mmgmt-btn-edit" onclick="openEditMatch(\''+m.id+'\')">✏️ แก้ไข</button>'+
          '<button class="mmgmt-btn-del" onclick="deleteMatch(\''+m.id+'\')">🗑️ ลบ</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  });

  container.innerHTML = html;
}

// ─── BRACKET FUNCTIONS ───────────────────────────────────────────────────────
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
  var ALL_ROUNDS = ['สาย A','สาย B','สาย C','สาย D','Semi Final','Final'];

  // ── group + dedup + sort ──────────────────────────────────────────────────
  var groups = {};
  ALL_ROUNDS.forEach(function(r){ groups[r]=[]; });
  state.matches.filter(function(m){ return m.gender===gender; }).forEach(function(m){
    var r=(m.round||'').trim();
    if(groups[r]) groups[r].push(m);
  });
  ALL_ROUNDS.forEach(function(r){
    var seen={};
    groups[r]=groups[r].slice().reverse().filter(function(m){
      var k=[m.p1,m.p2].sort().join('|');
      if(seen[k]) return false; seen[k]=true; return true;
    }).reverse().sort(function(a,b){ return (a.slot||0)-(b.slot||0); });
  });

  // หา base round
  var baseRoundIdx = 0;
  for(var ri=0; ri<ALL_ROUNDS.length; ri++){
    if(groups[ALL_ROUNDS[ri]].length>0){ baseRoundIdx=ri; break; }
  }
  if(groups[ALL_ROUNDS[baseRoundIdx]].length===0){
    container.innerHTML='<div style="text-align:center;color:rgba(255,255,255,0.3);padding:48px;font-family:\'Anuphan\',sans-serif;font-size:15px;line-height:1.8;">ยังไม่มีการจับคู่<br><span style="font-size:13px;opacity:0.6;">Admin กรอกข้อมูลผู้แข่งขันก่อน แล้วจับคู่สายการแข่งขัน</span></div>';
    return;
  }

  var rounds    = ALL_ROUNDS.slice(baseRoundIdx);
  var numCols   = rounds.length;
  var rawCount  = groups[rounds[0]].length;
  // ปัดขึ้นเป็น power-of-2 เพื่อให้ bracket แสดง slot ว่างครบทุกรอบ
  var baseCount = 1;
  while(baseCount < rawCount) baseCount *= 2;

  // ── layout ────────────────────────────────────────────────────────────────
  var CW=200, CH=36, VGAP=14, HGAP=56, LH=32, MATCH_H=CH*2, UNIT=MATCH_H+VGAP;

  function cY(ci,i){
    if(ci===0) return LH + i*UNIT + MATCH_H/2;
    return (cY(ci-1, i*2) + cY(ci-1, i*2+1)) / 2;
  }

  var totalW = numCols*(CW+HGAP) - HGAP + 120;
  var totalH = LH + baseCount*UNIT - VGAP + 16;

  // ── build slots ───────────────────────────────────────────────────────────
  var slots = [];
  for(var ci=0; ci<numCols; ci++){
    var n = Math.max(1, Math.ceil(baseCount/Math.pow(2,ci)));
    slots[ci] = [];
    for(var si=0; si<n; si++){
      var m = groups[rounds[ci]][si] || null;
      var w = null;
      if(m && m.status==='completed'){
        w = m.score1>m.score2 ? m.p1 : m.score2>m.score1 ? m.p2 : null;
      }
      slots[ci][si] = {
        p1: m?(m.p1||''):'', p2: m?(m.p2||''):'',
        score1: m?m.score1:null, score2: m?m.score2:null,
        status: m?m.status:'empty', winner: w
      };
    }
  }

  // ── propagate winners ─────────────────────────────────────────────────────
  var changed = true, guard = numCols*3;
  while(changed && guard-->0){
    changed = false;
    for(var ci=0; ci<numCols-1; ci++){
      for(var si=0; si<slots[ci].length; si++){
        var s=slots[ci][si];
        if(!s.winner) continue;
        var ni=Math.floor(si/2);
        if(!slots[ci+1]||!slots[ci+1][ni]) continue;
        var ns=slots[ci+1][ni];
        if(si%2===0){ if(!ns.p1){ns.p1=s.winner;changed=true;} }
        else         { if(!ns.p2){ns.p2=s.winner;changed=true;} }
        if(!ns.winner&&ns.status==='completed'&&ns.score1!==null){
          var nw=ns.score1>ns.score2?ns.p1:ns.score2>ns.score1?ns.p2:null;
          if(nw){ns.winner=nw;changed=true;}
        }
      }
    }
  }

  // ── pre-compute which slots have data (all passes done first) ─────────────
  var hasData = [];
  for(var ci=0; ci<numCols; ci++){
    hasData[ci] = [];
    for(var si=0; si<slots[ci].length; si++){
      hasData[ci][si] = !!(slots[ci][si].p1 || slots[ci][si].p2);
    }
  }

  // ── render cards ──────────────────────────────────────────────────────────
  var cards='';
  var icons={'สาย A':'🅰️','สาย B':'🅱️','สาย C':'🇨','สาย D':'🇩','Semi Final':'🏅','Final':'🏆'};

  for(var ci=0; ci<numCols; ci++){
    var colX    = ci*(CW+HGAP);
    var isFinal = rounds[ci]==='Final';

    // แสดง round header ทุกรอบเสมอ (ไม่ซ่อนแม้ยังไม่มีข้อมูล)
    cards+='<div style="position:absolute;left:'+colX+'px;top:0;width:'+CW+'px;text-align:center;'+
      'font-family:\'Orbitron\',monospace;font-size:9px;font-weight:700;letter-spacing:2px;'+
      'color:'+(isFinal?'rgba(255,215,0,0.8)':'rgba(255,255,255,0.35)')+';line-height:'+LH+'px;text-transform:uppercase;">'+
      (icons[rounds[ci]]||'🏓')+' '+rounds[ci]+'</div>';

    for(var si=0; si<slots[ci].length; si++){
      // แสดงทุก slot เสมอ (รวม slot ว่าง)
      var s    = slots[ci][si];
      var my   = cY(ci,si) - MATCH_H/2;
      var done = s.status==='completed';
      var live = s.status==='live';
      var w1   = done && s.score1>s.score2;
      var w2   = done && s.score2>s.score1;

      var isEmpty = s.status==='empty';
      var border = live?'rgba(248,81,73,0.6)':isFinal?'rgba(255,215,0,0.5)':isEmpty?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.18)';
      var bg     = live?'rgba(248,81,73,0.08)':isFinal?'rgba(255,215,0,0.06)':isEmpty?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.06)';
      var glow   = live?'box-shadow:0 0 12px rgba(248,81,73,0.25);':isFinal&&done?'box-shadow:0 0 18px rgba(255,215,0,0.2);':'';

      function row(name,score,win,lose,top){
        var fw=win?'700':'400';
        var nc=win?'#fff':name?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.2)';
        var sc=win?'#fff':lose?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.5)';
        var rb=win?'rgba(255,255,255,0.06)':'transparent';
        var dot=win
          ?'<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#3fb950;margin-right:6px;box-shadow:0 0 6px #3fb950;flex-shrink:0;"></span>'
          :'<span style="display:inline-block;width:5px;height:5px;margin-right:6px;flex-shrink:0;"></span>';
        return '<div style="display:flex;align-items:center;height:'+CH+'px;padding:0 10px;background:'+rb+';'+(top?'border-bottom:1px solid rgba(255,255,255,0.07);':'')+'>'+
          dot+
          '<span style="flex:1;font-family:\'Anuphan\',sans-serif;font-size:13px;font-weight:'+fw+';color:'+nc+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(name||'')+'</span>'+
          (score!==null&&score!==undefined?'<span style="font-family:\'Orbitron\',monospace;font-size:13px;font-weight:700;color:'+sc+';margin-left:8px;flex-shrink:0;">'+score+'</span>':'')+
        '</div>';
      }

      var liveBar=live?'<div style="position:absolute;top:0;left:0;right:0;height:2px;background:rgba(248,81,73,0.9);border-radius:8px 8px 0 0;"></div>':'';

      cards+='<div style="position:absolute;left:'+colX+'px;top:'+my+'px;width:'+CW+'px;height:'+MATCH_H+'px;'+
        'background:'+bg+';border:1px solid '+border+';border-radius:8px;overflow:hidden;'+glow+'">'+
        liveBar+
        row(s.p1,(done||live)?s.score1:null,w1,w2,true)+
        row(s.p2,(done||live)?s.score2:null,w2,w1,false)+
      '</div>';

      // champion badge
      if(isFinal&&done&&s.winner){
        var cx=colX+CW+10, champY=my+MATCH_H/2-30;
        cards+='<div style="position:absolute;left:'+cx+'px;top:'+champY+'px;width:96px;">'+
          '<div style="font-size:22px;line-height:1.3;">🏆</div>'+
          '<div style="font-family:\'Orbitron\',monospace;font-size:7px;color:rgba(255,215,0,0.8);letter-spacing:2px;margin-top:2px;">CHAMPION</div>'+
          '<div style="font-family:\'Anuphan\',sans-serif;font-size:14px;font-weight:700;color:#fff;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:96px;">'+s.winner+'</div>'+
        '</div>';
      }
    }
  }

  // ── render SVG lines (separate pass — draw lines for all slots including empty) ─────
  var lines='';
  var lc='rgba(255,255,255,0.25)', lw='1.5';

  for(var ci=0; ci<numCols-1; ci++){
    var colX = ci*(CW+HGAP);
    for(var si=0; si<slots[ci].length; si++){
      var ni      = Math.floor(si/2);
      var pairSi  = si%2===0 ? si+1 : si-1;

      var x1  = colX + CW;
      var xm  = x1 + HGAP/2;
      var x2  = x1 + HGAP;
      var cy0 = cY(ci, si);
      var cyn = cY(ci+1, ni);

      if(si%2===0){
        // Even slot: draw horizontal out, vertical connecting pair, horizontal to next
        var cy1  = cY(ci, pairSi);
        var vTop = Math.min(cy0, cy1);
        var vBot = Math.max(cy0, cy1);
        lines+='<line x1="'+x1+'" y1="'+cy0+'" x2="'+xm+'" y2="'+cy0+'" stroke="'+lc+'" stroke-width="'+lw+'"/>';
        lines+='<line x1="'+xm+'" y1="'+vTop+'" x2="'+xm+'" y2="'+vBot+'" stroke="'+lc+'" stroke-width="'+lw+'"/>';
        lines+='<line x1="'+xm+'" y1="'+cyn+'" x2="'+x2+'" y2="'+cyn+'" stroke="'+lc+'" stroke-width="'+lw+'"/>';
      } else {
        // Odd slot: horizontal line only (vertical was drawn by even partner)
        lines+='<line x1="'+x1+'" y1="'+cy0+'" x2="'+xm+'" y2="'+cy0+'" stroke="'+lc+'" stroke-width="'+lw+'"/>';
      }
    }
  }

  container.innerHTML=
    '<div style="width:100%;overflow-x:auto;overflow-y:hidden;padding-bottom:8px;">'+
    '<div style="display:table;margin:0 auto;padding:0 40px;">'+
    '<div style="position:relative;width:'+totalW+'px;height:'+totalH+'px;min-height:'+totalH+'px;">'+
    '<svg style="position:absolute;left:0;top:0;width:'+totalW+'px;height:'+totalH+'px;pointer-events:none;overflow:visible;" xmlns="http://www.w3.org/2000/svg">'+lines+'</svg>'+
    cards+
    '</div></div></div>';
}

// ─── EXPORT FUNCTIONS ─────────────────────────────────────────────────────────
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

function resetData(){
  // แสดง custom confirm modal แทน browser confirm
  var modal = document.getElementById('confirm-reset-modal');
  if(modal) {
    modal.style.display = 'flex';
  } else {
    // fallback ถ้าไม่มี modal
    if(!confirm('ยืนยันลบข้อมูลทั้งหมด?')) return;
    _doResetData();
  }
}

async function _doResetData(){
  // ล้าง state และ localStorage ทันที
  state.players = [];
  state.matches = [];
  try { localStorage.setItem('com7v3', JSON.stringify({players:[], matches:[]})); } catch(e) {}
  renderAll();
  showToast('🗑️ ล้างข้อมูลในเครื่องแล้ว...');

  // ถ้ามี Supabase ลบจาก database ด้วย
  if (window.supabaseClient) {
    try {
      await supabaseClient.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseClient.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      showToast('🗑️ ล้างข้อมูลทั้งหมดเสร็จสิ้น');
    } catch(e) {
      console.error('Error deleting from Supabase:', e);
      showToast('⚠️ ลบจาก Supabase ไม่สำเร็จ กรุณาลบใน Dashboard', true);
    }
  } else {
    showToast('🗑️ ล้างข้อมูลทั้งหมดเสร็จสิ้น');
  }
}

// ─── PHOTO HANDLER ─────────────────────────────────────────────────────────────
function handlePhoto(e){
  var f = e.target.files[0];
  if(!f) return;  var r = new FileReader();
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

// ─── EDIT PHOTO HANDLER ────────────────────────────────────────────────────────
function handleEditPhoto(e){
  var f = e.target.files[0];
  if(!f) return;
  var r = new FileReader();
  r.onload = function(ev){
    window._editPendingPhoto = ev.target.result;
    var img = document.getElementById('edit-photo-img');
    var ph = document.getElementById('edit-photo-ph');
    if(img){ img.src = ev.target.result; img.style.display = 'block'; }
    if(ph) ph.style.display = 'none';
  };
  r.readAsDataURL(f);
}
// ─── BRACKET SETUP FUNCTIONS ─────────────────────────────────────────────────

function renderBracketSetup() {
  var el = document.getElementById('bracket-setup-body');
  if (!el) return;
  var gender = document.getElementById('bracket-setup-gender') ? document.getElementById('bracket-setup-gender').value : 'M';
  var round = (document.getElementById('bracket-setup-round') ? document.getElementById('bracket-setup-round').value : '��� A').trim();

  var existing = state.matches.filter(function(m) { 
    return m.gender === gender && m.round.trim() === round; 
  }).sort(function(a, b) { return (a.slot || 0) - (b.slot || 0); });

  var players = state.players.filter(function(p) { return p.gender === gender; });
  var menCount = state.players.filter(function(p) { return p.gender === 'M'; }).length;
  var womenCount = state.players.filter(function(p) { return p.gender === 'F'; }).length;

  var pOpts = '<option value="">— เลือกผู้เล่น —</option>' + players.map(function(p) {
    return '<option value="' + p.name + '">' + p.name + '</option>';
  }).join('');

  var readyCount = existing.filter(function(m) { return m.p1 && m.p2; }).length;
  var html = '<div class="bpair-summary">' +
    '<span>คู่ที่จับแล้ว <span class="bpair-summary-num">' + existing.length + ' คู่</span></span>' +
    '<span>พร้อมแข่ง <span class="bpair-summary-ready">' + readyCount + ' คู่</span></span>' +
    '<span class="bpair-summary-meta">♂ ' + menCount + ' คน · ♀ ' + womenCount + ' คน</span>' +
  '</div>';

  // Existing pairs
  existing.forEach(function(m, i) {
    var isReady = m.p1 && m.p2;
    html += '<div class="bpair-card' + (isReady ? ' ready' : '') + '" data-id="' + m.id + '" style="display:grid;grid-template-columns:24px 1fr 28px 1fr 150px 110px 36px;align-items:center;gap:8px;">' +
      '<span class="bpair-num">' + (i + 1) + '</span>' +
      '<select id="bse-p1-' + m.id + '" class="bpair-select" style="width:100%;min-width:0;">' + pOpts + '</select>' +
      '<span class="bpair-vs" style="text-align:center;">vs</span>' +
      '<select id="bse-p2-' + m.id + '" class="bpair-select" style="width:100%;min-width:0;">' + pOpts + '</select>' +
      '<input type="date" id="bse-date-' + m.id + '" class="form-input" style="width:100%;padding:6px 8px;font-size:12px;" value="' + (m.date||'') + '"/>' +
      '<input type="time" id="bse-time-' + m.id + '" class="form-input" style="width:100%;padding:6px 8px;font-size:12px;" value="' + (m.time||'') + '"/>' +
      '<button onclick="removeBracketPair(\'' + m.id + '\')" class="bpair-del">🗑️</button>' +
    '</div>';
  });

  // New rows (pending — not yet saved)
  var pendingRows = window._pendingBracketRows || [];
  pendingRows.forEach(function(row, i) {
    html += '<div class="bpair-card new-row" id="bspending-' + i + '" style="display:grid;grid-template-columns:24px 1fr 28px 1fr 150px 110px 36px;align-items:center;gap:8px;">' +
      '<span class="bpair-num" style="color:rgba(0,229,255,0.4);">' + (existing.length + i + 1) + '</span>' +
      '<select id="bspending-p1-' + i + '" class="bpair-select" style="width:100%;min-width:0;">' + pOpts + '</select>' +
      '<span class="bpair-vs" style="text-align:center;">vs</span>' +
      '<select id="bspending-p2-' + i + '" class="bpair-select" style="width:100%;min-width:0;">' + pOpts + '</select>' +
      '<input type="date" id="bspending-date-' + i + '" class="form-input" style="width:100%;padding:6px 8px;font-size:12px;" value="' + (row.date||'') + '"/>' +
      '<input type="time" id="bspending-time-' + i + '" class="form-input" style="width:100%;padding:6px 8px;font-size:12px;" value="' + (row.time||'') + '"/>' +
      '<button onclick="removePendingRow(' + i + ')" class="bpair-del">🗑️</button>' +
    '</div>';
  });

  el.innerHTML = html;

  // Restore existing values
  existing.forEach(function(m) {
    var s1 = document.getElementById('bse-p1-' + m.id);
    var s2 = document.getElementById('bse-p2-' + m.id);
    if (s1 && m.p1) s1.value = m.p1;
    if (s2 && m.p2) s2.value = m.p2;
  });
}

// เพิ่มแถวว่างให้กรอก (ไม่ save)
function addBracketPair(gender, round) {
  if (!window._pendingBracketRows) window._pendingBracketRows = [];
  window._pendingBracketRows.push({ p1:'', p2:'', date:'', time:'' });
  renderBracketSetup();
}

// ลบแถว pending
function removePendingRow(idx) {
  if (window._pendingBracketRows) window._pendingBracketRows.splice(idx, 1);
  renderBracketSetup();
}

async function removeBracketPair(id) {
  var m = state.matches.find(function(x) { return x.id === id; });
  if (!m) return;

  var ok = await window.confirm('ลบคู่ "' + m.p1 + ' vs ' + m.p2 + '" ออก?');
  if (!ok) return;
  
  // ลอง Supabase ก่อน
  if (window.supabaseClient) {
    const success = await deleteMatchFromSupabase(id);
    if (success) {
      showToast('🗑️ ลบคู่แล้ว');
      return;
    }
  }

  // Fallback: ลบจาก localStorage
  state.matches = state.matches.filter(function(x) { return x.id !== id; });
  _saveAndBroadcast()
  renderBracketSetup();
  showToast('🗑️ ลบคู่แล้ว');
}

async function saveBracketSetup() {
  var gender = document.getElementById('bracket-setup-gender') ? document.getElementById('bracket-setup-gender').value : 'M';
  var round = (document.getElementById('bracket-setup-round') ? document.getElementById('bracket-setup-round').value : '��� A').trim();
  
  var existing = state.matches.filter(function(m) { 
    return m.gender === gender && m.round.trim() === round; 
  });
  
  var saved = 0;
  
  // ── Update existing matches ──────────────────────────────
  for (var i = 0; i < existing.length; i++) {
    var m = existing[i];
    var s1 = document.getElementById('bse-p1-' + m.id);
    var s2 = document.getElementById('bse-p2-' + m.id);
    var dEl = document.getElementById('bse-date-' + m.id);
    var tEl = document.getElementById('bse-time-' + m.id);
    if (!s1 || !s2) continue;
    var p1 = s1.value;
    var p2 = s2.value;
    if (!p1 || !p2 || p1 === p2) continue;
    var updates = {
      p1: p1, p2: p2,
      score1: m.score1, score2: m.score2,
      round: m.round, gender: m.gender, status: m.status,
      date: dEl ? dEl.value : (m.date||''),
      time: tEl ? tEl.value : (m.time||'')
    };
    var updated = false;
    if (window.supabaseClient) {
      const success = await updateMatchInSupabase(m.id, updates);
      if (success) updated = true;
    }
    if (!updated) {
      var idx = state.matches.findIndex(function(x) { return x.id === m.id; });
      if (idx >= 0) state.matches[idx] = Object.assign(state.matches[idx], updates);
      _saveAndBroadcast();
      updated = true;
    }
    if (updated) saved++;
  }

  // ── Insert pending rows ──────────────────────────────────
  var pending = window._pendingBracketRows || [];
  for (var j = 0; j < pending.length; j++) {
    var p1El = document.getElementById('bspending-p1-' + j);
    var p2El = document.getElementById('bspending-p2-' + j);
    var dEl2 = document.getElementById('bspending-date-' + j);
    var tEl2 = document.getElementById('bspending-time-' + j);
    if (!p1El || !p2El) continue;
    var np1 = p1El.value;
    var np2 = p2El.value;
    if (!np1 || !np2 || np1 === np2) continue;
    var matchData = {
      p1: np1, p2: np2,
      score1: 0, score2: 0,
      round: round, gender: gender, status: 'upcoming',
      date: dEl2 ? dEl2.value : '',  
      time: tEl2 ? tEl2.value : ''
    };
    var inserted = false;b  
    if (window.supabaseClient) {
      const added = await addMatchToSupabase(matchData);
      if (added) inserted = true;
    }
    if (!inserted) {
      state.matches.push(Object.assign({}, matchData, { id: Date.now().toString() + j }));
      _saveAndBroadcast();
      inserted = true;
    }
    if (inserted) saved++;
  }

  // ล้าง pending rows
  window._pendingBracketRows = [];

  if (saved === 0) {
    showToast('⚠️ ยังไม่มีคู่ที่เลือกครบ', true);
    return;
  }
  renderBracketSetup();
  showToast('✅ บันทึกการจับคู่ ' + saved + ' คู่ สำเร็จ');
}
// Update player dropdowns when gender changes
function updatePlayerDropdownsByGender() {
  var gender = document.getElementById('match-gender').value;
  populatePlayerSelects(gender);
}
// Update edit player dropdowns when gender changes
function updateEditPlayerDropdownsByGender() {
  var gender = document.getElementById('edit-match-gender').value;
  // We need to update only the edit dropdowns
  var selIds = ['edit-match-p1', 'edit-match-p2'];
  
  // Filter players by gender
  var filteredPlayers = state.players;
  if (gender === 'M' || gender === 'F') {
    filteredPlayers = state.players.filter(function(p) { return p.gender === gender; });
  }
  
  var o = '<option value="">— เลือกผู้เล่น —</option>' + filteredPlayers.map(function(p){ 
    return '<option value="'+p.name+'">'+p.name+'</option>'; 
  }).join('');
  
  selIds.forEach(function(id){
    var el = document.getElementById(id);
    if(el){ 
      var cur = el.value; 
      el.innerHTML = o; 
      if (cur) el.value = cur; 
    }
  });
}

// ─── STATS RECALC (Local fallback for admin UI) ───────────────────────────────
function updateStats(p1n, p2n, s1, s2, sets){
  var p1 = state.players.find(function(p){ return p.name === p1n; });
  var p2 = state.players.find(function(p){ return p.name === p2n; });
  if(!p1 || !p2) return;
  p1.played++; p2.played++;

  // setsFor/setsAgainst = จำนวนเซตที่ชนะ/แพ้ (score1 vs score2)
  p1.setsFor += s1; p1.setsAgainst += s2;
  p2.setsFor += s2; p2.setsAgainst += s1;

  // pointsFor/pointsAgainst = คะแนนรวมจากทุกเซต
  if(!p1.pointsFor) p1.pointsFor = 0;
  if(!p1.pointsAgainst) p1.pointsAgainst = 0;
  if(!p2.pointsFor) p2.pointsFor = 0;
  if(!p2.pointsAgainst) p2.pointsAgainst = 0;

  if(sets && sets.length > 0){
    var totalA = 0, totalB = 0;
    sets.forEach(function(set){
      totalA += (set.a || 0);
      totalB += (set.b || 0);
    });
    p1.pointsFor += totalA; p1.pointsAgainst += totalB;
    p2.pointsFor += totalB; p2.pointsAgainst += totalA;
  }

  // นับชนะ/แพ้
  if(s1 > s2){
    p1.wins++; p2.losses++;
  } else if(s2 > s1){
    p2.wins++; p1.losses++;
  } else {
    p1.wins++; p2.wins++;
  }
  p1.pct = p1.played ? Math.round((p1.wins / p1.played) * 100) : 0;
  p2.pct = p2.played ? Math.round((p2.wins / p2.played) * 100) : 0;
}

function recalcStandingsOnly(){
  state.players.forEach(function(p){
    p.played=0; p.wins=0; p.losses=0;
    p.setsFor=0; p.setsAgainst=0;
    p.pointsFor=0; p.pointsAgainst=0;
    p.points=0; p.pct=0;
  });
  state.matches.filter(function(m){ return m.status==='completed'; }).forEach(function(m){
    updateStats(m.p1, m.p2, m.score1, m.score2, m.sets);
  });
}

function recalcStandings(){
  recalcStandingsOnly();
  // sync ไป Supabase ถ้ามี ไม่งั้น save localStorage
  if (window.supabaseClient) {
    recalcAndSyncPlayersToSupabase();
  } else {
    _saveAndBroadcast()
  }
  renderAll();
  if(typeof populatePlayerSelects === 'function') populatePlayerSelects();
  showToast('✅ อัปเดตข้อมูลทั้งหมดเสร็จสิ้น');
}
