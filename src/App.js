import React, { useState, useEffect } from 'react';
import { database, ref, onValue, set, push, remove } from './firebase';

// 生成唯一的使用者 ID
const getUserId = () => {
  let id = localStorage.getItem('travelUserId');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('travelUserId', id);
  }
  return id;
};

// 生成旅程 ID（用於分享）
const getTripId = () => {
  const urlParams = new URLSearchParams(window.location.search);
  let id = urlParams.get('trip');
  if (!id) {
    id = localStorage.getItem('currentTripId');
  }
  if (!id) {
    id = 'trip_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('currentTripId', id);
  }
  return id;
};

function App() {
  const [activeTab, setActiveTab] = useState('itinerary');
  const [tripId] = useState(getTripId());
  const [userId] = useState(getUserId());
  const [userName, setUserName] = useState(localStorage.getItem('travelUserName') || '');
  const [showNamePrompt, setShowNamePrompt] = useState(!localStorage.getItem('travelUserName'));
  
  const [trip, setTrip] = useState({
    name: '2026 大阪京都之旅',
    startDate: '2026/01/30',
    endDate: '2026/02/05',
    budget: 100000,
    currency: '¥'
  });
  
  const [places, setPlaces] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [members, setMembers] = useState({});
  
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newPlace, setNewPlace] = useState({ day: 1, time: '', name: '', type: 'spot', address: '', transport: '', duration: '' });
  const [newExpense, setNewExpense] = useState({ item: '', amount: '', payer: 'me', method: 'cash', category: 'food' });
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newWishItem, setNewWishItem] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);

  const typeConfig = {
    spot: { label: '景點', icon: '📍', color: '#D4A574' },
    food: { label: '美食', icon: '🍜', color: '#E87A5D' },
    shopping: { label: '購物', icon: '🛍️', color: '#7BA3A8' },
    hotel: { label: '住宿', icon: '🏨', color: '#9B7EBD' }
  };

  const categoryConfig = {
    food: { label: '餐飲', icon: '🍜' },
    transport: { label: '交通', icon: '🚃' },
    hotel: { label: '住宿', icon: '🏨' },
    shopping: { label: '購物', icon: '🛍️' },
    ticket: { label: '門票', icon: '🎫' },
    other: { label: '其他', icon: '📦' }
  };

  const totalDays = 7;
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  // 產生分享連結
  const shareLink = `${window.location.origin}${window.location.pathname}?trip=${tripId}`;

  // Firebase 即時同步
  useEffect(() => {
    if (!tripId) return;

    // 監聽旅程資料
    const tripRef = ref(database, `trips/${tripId}/info`);
    const unsubTrip = onValue(tripRef, (snapshot) => {
      if (snapshot.exists()) {
        setTrip(snapshot.val());
      }
    });

    // 監聽地點
    const placesRef = ref(database, `trips/${tripId}/places`);
    const unsubPlaces = onValue(placesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setPlaces(arr);
      } else {
        setPlaces([]);
      }
    });

    // 監聽支出
    const expensesRef = ref(database, `trips/${tripId}/expenses`);
    const unsubExpenses = onValue(expensesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setExpenses(arr);
      } else {
        setExpenses([]);
      }
    });

    // 監聽清單
    const checklistRef = ref(database, `trips/${tripId}/checklist`);
    const unsubChecklist = onValue(checklistRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setChecklist(arr);
      } else {
        setChecklist([]);
      }
    });

    // 監聽願望清單
    const wishlistRef = ref(database, `trips/${tripId}/wishlist`);
    const unsubWishlist = onValue(wishlistRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setWishlist(arr);
      } else {
        setWishlist([]);
      }
    });

    // 監聽成員
    const membersRef = ref(database, `trips/${tripId}/members`);
    const unsubMembers = onValue(membersRef, (snapshot) => {
      if (snapshot.exists()) {
        setMembers(snapshot.val());
      } else {
        setMembers({});
      }
    });

    return () => {
      unsubTrip();
      unsubPlaces();
      unsubExpenses();
      unsubChecklist();
      unsubWishlist();
      unsubMembers();
    };
  }, [tripId]);

  // 更新使用者在線狀態
  useEffect(() => {
    if (!tripId || !userId || !userName) return;

    const memberRef = ref(database, `trips/${tripId}/members/${userId}`);
    const avatars = ['😊', '🙂', '😎', '🤓', '🥳', '😄', '🤗', '😇'];
    const colors = ['#D4A574', '#7BA3A8', '#E87A5D', '#9B7EBD', '#5DAE8B', '#E8B4B8', '#A8D5E2', '#F5D76E'];
    
    set(memberRef, {
      name: userName,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      online: true,
      lastSeen: Date.now()
    });

    // 離開時更新狀態
    const handleUnload = () => {
      set(memberRef, {
        name: userName,
        online: false,
        lastSeen: Date.now()
      });
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [tripId, userId, userName]);

  // 儲存使用者名稱
  const saveUserName = (name) => {
    if (name.trim()) {
      localStorage.setItem('travelUserName', name.trim());
      setUserName(name.trim());
      setShowNamePrompt(false);
    }
  };

  // 更新旅程設定
  const updateTrip = (newTrip) => {
    setTrip(newTrip);
    set(ref(database, `trips/${tripId}/info`), newTrip);
  };

  // 新增地點
  const addPlace = () => {
    if (newPlace.name) {
      const placesRef = ref(database, `trips/${tripId}/places`);
      push(placesRef, { ...newPlace, addedBy: userName });
      setNewPlace({ day: 1, time: '', name: '', type: 'spot', address: '', transport: '', duration: '' });
      setShowAddPlace(false);
    }
  };

  // 刪除地點
  const deletePlace = (id) => {
    remove(ref(database, `trips/${tripId}/places/${id}`));
  };

  // 新增支出
  const addExpense = () => {
    if (newExpense.item && newExpense.amount) {
      const expensesRef = ref(database, `trips/${tripId}/expenses`);
      push(expensesRef, { ...newExpense, amount: Number(newExpense.amount), addedBy: userName });
      setNewExpense({ item: '', amount: '', payer: 'me', method: 'cash', category: 'food' });
      setShowAddExpense(false);
    }
  };

  // 刪除支出
  const deleteExpense = (id) => {
    remove(ref(database, `trips/${tripId}/expenses/${id}`));
  };

  // 切換清單項目
  const toggleCheck = (id, currentState) => {
    set(ref(database, `trips/${tripId}/checklist/${id}/checked`), !currentState);
  };

  const toggleWish = (id, currentState) => {
    set(ref(database, `trips/${tripId}/wishlist/${id}/checked`), !currentState);
  };

  // 新增清單項目
  const addCheckItem = () => {
    if (newCheckItem) {
      const checklistRef = ref(database, `trips/${tripId}/checklist`);
      push(checklistRef, { item: newCheckItem, checked: false, important: false });
      setNewCheckItem('');
    }
  };

  const addWishItem = () => {
    if (newWishItem) {
      const wishlistRef = ref(database, `trips/${tripId}/wishlist`);
      push(wishlistRef, { item: newWishItem, checked: false });
      setNewWishItem('');
    }
  };

  // 複製連結
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setShowShareLink(true);
      setTimeout(() => setShowShareLink(false), 2000);
    });
  };

  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const filteredPlaces = selectedDay === 0 ? places : places.filter(p => p.day === selectedDay);
  const onlineMembers = Object.values(members).filter(m => m.online);

  // 名稱輸入彈窗
  if (showNamePrompt) {
    return (
      <div style={styles.container}>
        <div style={styles.namePromptOverlay}>
          <div style={styles.namePromptModal}>
            <h2 style={styles.namePromptTitle}>👋 歡迎使用旅遊規劃</h2>
            <p style={styles.namePromptText}>請輸入你的暱稱，讓旅伴知道是誰在編輯</p>
            <input
              type="text"
              placeholder="輸入你的暱稱..."
              style={styles.namePromptInput}
              onKeyPress={(e) => e.key === 'Enter' && saveUserName(e.target.value)}
              autoFocus
            />
            <button 
              style={styles.namePromptBtn}
              onClick={(e) => saveUserName(e.target.previousSibling.value)}
            >
              開始規劃 ✈️
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 背景裝飾 */}
      <div style={styles.bgDecor1}></div>
      <div style={styles.bgDecor2}></div>
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerBg}>
          <img 
            src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80" 
            alt="Osaka" 
            style={styles.headerImg}
          />
          <div style={styles.headerOverlay}></div>
        </div>
        <div style={styles.headerContent}>
          <h1 style={styles.tripName}>{trip.name}</h1>
          <p style={styles.tripDate}>{trip.startDate} - {trip.endDate}</p>
        </div>
        <button style={styles.settingsBtn} onClick={() => setShowSettings(true)}>
          ⚙️
        </button>
        
        {/* 成員頭像列 */}
        <div style={styles.membersBar} onClick={() => setShowMembers(true)}>
          {Object.entries(members).slice(0, 4).map(([id, member], index) => (
            <div 
              key={id} 
              style={{
                ...styles.memberAvatar,
                backgroundColor: member.color || '#D4A574',
                marginLeft: index > 0 ? '-8px' : '0',
                zIndex: 4 - index,
                border: member.online ? '2px solid #4CAF50' : '2px solid #ccc'
              }}
              title={member.name}
            >
              {member.avatar || '👤'}
            </div>
          ))}
          <div style={styles.memberCount}>
            {onlineMembers.length}/{Object.keys(members).length || 1}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {activeTab === 'itinerary' && (
          <div style={styles.tabContent}>
            {/* Day Filter */}
            <div style={styles.dayFilter}>
              <button 
                style={{...styles.dayBtn, ...(selectedDay === 0 ? styles.dayBtnActive : {})}}
                onClick={() => setSelectedDay(0)}
              >
                全部
              </button>
              {days.map(day => (
                <button 
                  key={day}
                  style={{...styles.dayBtn, ...(selectedDay === day ? styles.dayBtnActive : {})}}
                  onClick={() => setSelectedDay(day)}
                >
                  Day {day}
                </button>
              ))}
            </div>

            {/* Places List */}
            <div style={styles.placesList}>
              {filteredPlaces.length === 0 ? (
                <div style={styles.emptyState}>
                  <span style={styles.emptyIcon}>📍</span>
                  <p>還沒有行程，點擊下方按鈕新增！</p>
                </div>
              ) : (
                filteredPlaces.sort((a, b) => {
                  if (a.day !== b.day) return a.day - b.day;
                  return (a.time || '').localeCompare(b.time || '');
                }).map((place, index) => {
                  const prevPlace = index > 0 ? filteredPlaces[index - 1] : null;
                  const showDayHeader = !prevPlace || prevPlace.day !== place.day;
                  
                  return (
                    <React.Fragment key={place.id}>
                      {showDayHeader && selectedDay === 0 && (
                        <div style={styles.dayHeader}>
                          <span style={styles.dayHeaderText}>Day {place.day}</span>
                        </div>
                      )}
                      
                      {place.transport && (
                        <div style={styles.transport}>
                          <div style={styles.transportIcon}>🚃</div>
                          <span style={styles.transportText}>{place.transport}</span>
                          <span style={styles.transportDuration}>約 {place.duration}</span>
                        </div>
                      )}
                      
                      <div style={styles.placeCard}>
                        <div style={styles.timeCol}>
                          <span style={styles.time}>{place.time || '--:--'}</span>
                          <div style={{...styles.timeDot, backgroundColor: typeConfig[place.type]?.color || '#D4A574'}}></div>
                        </div>
                        <div style={styles.placeInfo}>
                          <span style={{...styles.typeTag, backgroundColor: (typeConfig[place.type]?.color || '#D4A574') + '20', color: typeConfig[place.type]?.color || '#D4A574'}}>
                            {typeConfig[place.type]?.icon || '📍'} {typeConfig[place.type]?.label || '景點'}
                          </span>
                          <h3 style={styles.placeName}>{place.name}</h3>
                          {place.address && <p style={styles.placeAddress}>📍 {place.address}</p>}
                          {place.addedBy && <p style={styles.addedBy}>by {place.addedBy}</p>}
                        </div>
                        <button style={styles.deleteBtn} onClick={() => deletePlace(place.id)}>×</button>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            <button style={styles.addBtn} onClick={() => setShowAddPlace(true)}>
              <span style={styles.addIcon}>+</span>
              新增地點
            </button>
          </div>
        )}

        {activeTab === 'expense' && (
          <div style={styles.tabContent}>
            {/* Budget Overview */}
            <div style={styles.budgetOverview}>
              <div style={styles.budgetCard}>
                <span style={styles.budgetLabel}>總支出</span>
                <span style={styles.budgetAmount}>{trip.currency}{totalExpense.toLocaleString()}</span>
              </div>
              <div style={styles.budgetCardLight}>
                <span style={styles.budgetLabelDark}>剩餘預算</span>
                <span style={styles.budgetAmountGreen}>{trip.currency}{(trip.budget - totalExpense).toLocaleString()}</span>
              </div>
            </div>

            {/* Budget Progress */}
            <div style={styles.progressSection}>
              <div style={styles.progressHeader}>
                <span>預算使用</span>
                <span>{Math.round(totalExpense / trip.budget * 100)}%</span>
              </div>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: `${Math.min(totalExpense / trip.budget * 100, 100)}%`}}></div>
              </div>
            </div>

            {/* Expense List */}
            <div style={styles.expenseList}>
              <h3 style={styles.sectionTitle}>消費明細</h3>
              {expenses.length === 0 ? (
                <div style={styles.emptyState}>
                  <span style={styles.emptyIcon}>💰</span>
                  <p>還沒有消費紀錄</p>
                </div>
              ) : (
                expenses.map(expense => (
                  <div key={expense.id} style={styles.expenseItem}>
                    <div style={styles.expenseIcon}>{categoryConfig[expense.category]?.icon || '📦'}</div>
                    <div style={styles.expenseInfo}>
                      <span style={styles.expenseItemName}>{expense.item}</span>
                      <div style={styles.expenseTags}>
                        <span style={styles.expenseTag}>{expense.payer === 'me' ? '我付' : '他付'}</span>
                        <span style={styles.expenseTag}>{expense.method === 'cash' ? '現金' : '刷卡'}</span>
                        {expense.addedBy && <span style={styles.expenseTag}>{expense.addedBy}</span>}
                      </div>
                    </div>
                    <div style={styles.expenseRight}>
                      <span style={styles.expenseAmount}>{trip.currency}{expense.amount?.toLocaleString()}</span>
                      <button style={styles.deleteBtn} onClick={() => deleteExpense(expense.id)}>×</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button style={styles.addBtn} onClick={() => setShowAddExpense(true)}>
              <span style={styles.addIcon}>+</span>
              記下一筆
            </button>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div style={styles.tabContent}>
            {/* Preparation Checklist */}
            <div style={styles.checkSection}>
              <h3 style={styles.sectionTitle}>✈️ 出發準備</h3>
              <div style={styles.checkProgress}>
                <span>{checklist.filter(c => c.checked).length} / {checklist.length} 已完成</span>
              </div>
              <div style={styles.checkList}>
                {checklist.map(item => (
                  <div 
                    key={item.id} 
                    style={{...styles.checkItem, ...(item.checked ? styles.checkItemDone : {})}}
                    onClick={() => toggleCheck(item.id, item.checked)}
                  >
                    <div style={{...styles.checkbox, ...(item.checked ? styles.checkboxChecked : {})}}>
                      {item.checked && '✓'}
                    </div>
                    <span style={{...styles.checkText, ...(item.checked ? styles.checkTextDone : {})}}>
                      {item.item}
                    </span>
                    {item.important && <span style={styles.importantTag}>重要</span>}
                  </div>
                ))}
              </div>
              <div style={styles.addItemRow}>
                <input 
                  type="text"
                  placeholder="新增項目..."
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  style={styles.addItemInput}
                  onKeyPress={(e) => e.key === 'Enter' && addCheckItem()}
                />
                <button style={styles.addItemBtn} onClick={addCheckItem}>+</button>
              </div>
            </div>

            {/* Wishlist */}
            <div style={styles.checkSection}>
              <h3 style={styles.sectionTitle}>🛍️ 必買清單</h3>
              <div style={styles.checkList}>
                {wishlist.map(item => (
                  <div 
                    key={item.id} 
                    style={{...styles.checkItem, ...(item.checked ? styles.checkItemDone : {})}}
                    onClick={() => toggleWish(item.id, item.checked)}
                  >
                    <div style={{...styles.checkbox, ...(item.checked ? styles.checkboxChecked : {})}}>
                      {item.checked && '✓'}
                    </div>
                    <span style={{...styles.checkText, ...(item.checked ? styles.checkTextDone : {})}}>
                      {item.item}
                    </span>
                  </div>
                ))}
              </div>
              <div style={styles.addItemRow}>
                <input 
                  type="text"
                  placeholder="新增想買的東西..."
                  value={newWishItem}
                  onChange={(e) => setNewWishItem(e.target.value)}
                  style={styles.addItemInput}
                  onKeyPress={(e) => e.key === 'Enter' && addWishItem()}
                />
                <button style={styles.addItemBtn} onClick={addWishItem}>+</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div style={styles.tabContent}>
            <div style={styles.infoSection}>
              <h3 style={styles.sectionTitle}>📋 旅程資訊</h3>
              
              {/* 分享區塊 */}
              <div style={styles.shareCard}>
                <h4 style={styles.shareTitle}>🔗 邀請旅伴共同編輯</h4>
                <div style={styles.shareLinkBox}>
                  <span style={styles.shareLinkText}>{shareLink}</span>
                  <button style={styles.copyBtn} onClick={copyShareLink}>
                    {showShareLink ? '✓ 已複製' : '📋 複製'}
                  </button>
                </div>
                <p style={styles.shareHint}>分享此連結給朋友，即可一起編輯行程！</p>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoIcon}>✈️</div>
                <div style={styles.infoContent}>
                  <h4 style={styles.infoTitle}>航班資訊</h4>
                  <p style={styles.infoText}>去程：CI152 桃園 → 關西 08:25-12:05</p>
                  <p style={styles.infoText}>回程：CI153 關西 → 桃園 13:10-15:10</p>
                </div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoIcon}>🏨</div>
                <div style={styles.infoContent}>
                  <h4 style={styles.infoTitle}>住宿資訊</h4>
                  <p style={styles.infoText}>大阪難波光芒飯店</p>
                  <p style={styles.infoText}>Check-in: 15:00 / Check-out: 11:00</p>
                </div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoIcon}>📱</div>
                <div style={styles.infoContent}>
                  <h4 style={styles.infoTitle}>緊急聯絡</h4>
                  <p style={styles.infoText}>駐日代表處：+81-3-3280-7811</p>
                  <p style={styles.infoText}>日本緊急電話：110 / 119</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={styles.bottomNav}>
        <button 
          style={{...styles.navBtn, ...(activeTab === 'itinerary' ? styles.navBtnActive : {})}}
          onClick={() => setActiveTab('itinerary')}
        >
          <span style={styles.navIcon}>📍</span>
          <span style={styles.navLabel}>行程</span>
        </button>
        <button 
          style={{...styles.navBtn, ...(activeTab === 'expense' ? styles.navBtnActive : {})}}
          onClick={() => setActiveTab('expense')}
        >
          <span style={styles.navIcon}>💰</span>
          <span style={styles.navLabel}>記帳</span>
        </button>
        <button 
          style={{...styles.navBtn, ...(activeTab === 'checklist' ? styles.navBtnActive : {})}}
          onClick={() => setActiveTab('checklist')}
        >
          <span style={styles.navIcon}>✅</span>
          <span style={styles.navLabel}>清單</span>
        </button>
        <button 
          style={{...styles.navBtn, ...(activeTab === 'info' ? styles.navBtnActive : {})}}
          onClick={() => setActiveTab('info')}
        >
          <span style={styles.navIcon}>📖</span>
          <span style={styles.navLabel}>資訊</span>
        </button>
      </div>

      {/* Add Place Modal */}
      {showAddPlace && (
        <div style={styles.modalOverlay} onClick={() => setShowAddPlace(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>新增地點</h3>
              <button style={styles.modalClose} onClick={() => setShowAddPlace(false)}>×</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.typeSelector}>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <button
                    key={key}
                    style={{
                      ...styles.typeBtn,
                      ...(newPlace.type === key ? { backgroundColor: config.color, color: '#fff' } : {})
                    }}
                    onClick={() => setNewPlace({...newPlace, type: key})}
                  >
                    {config.icon} {config.label}
                  </button>
                ))}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Day</label>
                <select 
                  style={styles.select}
                  value={newPlace.day}
                  onChange={(e) => setNewPlace({...newPlace, day: Number(e.target.value)})}
                >
                  {days.map(d => <option key={d} value={d}>Day {d}</option>)}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>時間</label>
                <input 
                  type="time"
                  style={styles.input}
                  value={newPlace.time}
                  onChange={(e) => setNewPlace({...newPlace, time: e.target.value})}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>名稱</label>
                <input 
                  type="text"
                  style={styles.input}
                  placeholder="地點名稱"
                  value={newPlace.name}
                  onChange={(e) => setNewPlace({...newPlace, name: e.target.value})}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>地址</label>
                <input 
                  type="text"
                  style={styles.input}
                  placeholder="地址 / 連結"
                  value={newPlace.address}
                  onChange={(e) => setNewPlace({...newPlace, address: e.target.value})}
                />
              </div>

              <div style={styles.formRow}>
                <div style={{...styles.formGroup, flex: 1}}>
                  <label style={styles.label}>交通方式</label>
                  <input 
                    type="text"
                    style={styles.input}
                    placeholder="例：地鐵"
                    value={newPlace.transport}
                    onChange={(e) => setNewPlace({...newPlace, transport: e.target.value})}
                  />
                </div>
                <div style={{...styles.formGroup, flex: 1}}>
                  <label style={styles.label}>所需時間</label>
                  <input 
                    type="text"
                    style={styles.input}
                    placeholder="例：20分"
                    value={newPlace.duration}
                    onChange={(e) => setNewPlace({...newPlace, duration: e.target.value})}
                  />
                </div>
              </div>

              <button style={styles.submitBtn} onClick={addPlace}>
                + 新增地點
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div style={styles.modalOverlay} onClick={() => setShowAddExpense(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>記下一筆</h3>
              <button style={styles.modalClose} onClick={() => setShowAddExpense(false)}>×</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>項目</label>
                <input 
                  type="text"
                  style={styles.input}
                  placeholder="例：章魚燒"
                  value={newExpense.item}
                  onChange={(e) => setNewExpense({...newExpense, item: e.target.value})}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>金額</label>
                <div style={styles.amountInput}>
                  <span style={styles.currencyPrefix}>{trip.currency}</span>
                  <input 
                    type="number"
                    style={{...styles.input, paddingLeft: '32px'}}
                    placeholder="0"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>類別</label>
                <div style={styles.categorySelector}>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <button
                      key={key}
                      style={{
                        ...styles.categoryBtn,
                        ...(newExpense.category === key ? styles.categoryBtnActive : {})
                      }}
                      onClick={() => setNewExpense({...newExpense, category: key})}
                    >
                      {config.icon}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.toggleGroup}>
                  <button 
                    style={{...styles.toggleBtn, ...(newExpense.payer === 'me' ? styles.toggleBtnActive : {})}}
                    onClick={() => setNewExpense({...newExpense, payer: 'me'})}
                  >
                    我付
                  </button>
                  <button 
                    style={{...styles.toggleBtn, ...(newExpense.payer === 'other' ? styles.toggleBtnActive : {})}}
                    onClick={() => setNewExpense({...newExpense, payer: 'other'})}
                  >
                    他付
                  </button>
                </div>

                <div style={styles.toggleGroup}>
                  <button 
                    style={{...styles.toggleBtn, ...(newExpense.method === 'cash' ? styles.toggleBtnActive : {})}}
                    onClick={() => setNewExpense({...newExpense, method: 'cash'})}
                  >
                    現金
                  </button>
                  <button 
                    style={{...styles.toggleBtn, ...(newExpense.method === 'card' ? styles.toggleBtnActive : {})}}
                    onClick={() => setNewExpense({...newExpense, method: 'card'})}
                  >
                    刷卡
                  </button>
                </div>
              </div>

              <button style={styles.submitBtn} onClick={addExpense}>
                + 記下一筆
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={styles.modalOverlay} onClick={() => setShowSettings(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>旅程設定</h3>
              <button style={styles.modalClose} onClick={() => setShowSettings(false)}>×</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>旅程名稱</label>
                <input 
                  type="text"
                  style={styles.input}
                  value={trip.name}
                  onChange={(e) => setTrip({...trip, name: e.target.value})}
                />
              </div>

              <div style={styles.formRow}>
                <div style={{...styles.formGroup, flex: 1}}>
                  <label style={styles.label}>開始日期</label>
                  <input 
                    type="text"
                    style={styles.input}
                    value={trip.startDate}
                    onChange={(e) => setTrip({...trip, startDate: e.target.value})}
                  />
                </div>
                <div style={{...styles.formGroup, flex: 1}}>
                  <label style={styles.label}>結束日期</label>
                  <input 
                    type="text"
                    style={styles.input}
                    value={trip.endDate}
                    onChange={(e) => setTrip({...trip, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>總預算</label>
                <div style={styles.amountInput}>
                  <span style={styles.currencyPrefix}>{trip.currency}</span>
                  <input 
                    type="number"
                    style={{...styles.input, paddingLeft: '32px'}}
                    value={trip.budget}
                    onChange={(e) => setTrip({...trip, budget: Number(e.target.value)})}
                  />
                </div>
              </div>

              <button style={styles.submitBtn} onClick={() => { updateTrip(trip); setShowSettings(false); }}>
                儲存設定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembers && (
        <div style={styles.modalOverlay} onClick={() => setShowMembers(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>👥 共同編輯成員</h3>
              <button style={styles.modalClose} onClick={() => setShowMembers(false)}>×</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.shareSection}>
                <div style={styles.shareLinkBox}>
                  <span style={styles.shareLinkText}>{shareLink}</span>
                  <button style={styles.copyBtn} onClick={copyShareLink}>
                    {showShareLink ? '✓ 已複製' : '📋 複製'}
                  </button>
                </div>
                <p style={styles.shareHint}>分享此連結邀請朋友共同編輯行程</p>
              </div>

              <div style={styles.membersList}>
                <h4 style={styles.membersListTitle}>成員 ({Object.keys(members).length})</h4>
                {Object.entries(members).map(([id, member]) => (
                  <div key={id} style={styles.memberItem}>
                    <div style={{...styles.memberItemAvatar, backgroundColor: member.color || '#D4A574'}}>
                      {member.avatar || '👤'}
                    </div>
                    <div style={styles.memberItemInfo}>
                      <span style={styles.memberItemName}>
                        {member.name}
                        {id === userId && <span style={styles.ownerBadge}>我</span>}
                      </span>
                      <span style={{...styles.memberItemStatus, color: member.online ? '#4CAF50' : '#999'}}>
                        {member.online ? '● 在線上' : '○ 離線'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '430px',
    margin: '0 auto',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #FFF9F5 0%, #FFF5EE 50%, #FFEEE5 100%)',
    fontFamily: '"Noto Sans TC", "SF Pro Display", -apple-system, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: '80px',
  },
  bgDecor1: {
    position: 'absolute',
    top: '200px',
    right: '-100px',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(212, 165, 116, 0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgDecor2: {
    position: 'absolute',
    bottom: '100px',
    left: '-150px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(123, 163, 168, 0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  header: {
    position: 'relative',
    height: '200px',
    overflow: 'hidden',
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)',
  },
  headerContent: {
    position: 'absolute',
    bottom: '24px',
    left: '24px',
    color: '#fff',
  },
  tripName: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    textShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  tripDate: {
    fontSize: '14px',
    margin: 0,
    opacity: 0.9,
  },
  settingsBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '12px',
    padding: '10px',
    fontSize: '20px',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
  },
  membersBar: {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '20px',
    padding: '4px 12px 4px 4px',
    backdropFilter: 'blur(10px)',
  },
  memberAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  memberCount: {
    color: '#fff',
    fontSize: '12px',
    marginLeft: '8px',
    fontWeight: '500',
  },
  content: {
    padding: '0',
    position: 'relative',
    zIndex: 1,
  },
  tabContent: {
    padding: '20px',
  },
  dayFilter: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    padding: '4px 0 16px 0',
    scrollbarWidth: 'none',
  },
  dayBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    background: '#fff',
    color: '#666',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  dayBtnActive: {
    background: '#D4A574',
    color: '#fff',
  },
  placesList: {
    display: 'flex',
    flexDirection: 'column',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#999',
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '12px',
  },
  dayHeader: {
    margin: '20px 0 12px 0',
  },
  dayHeaderText: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#2D2D2D',
  },
  transport: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    marginLeft: '24px',
    color: '#888',
    fontSize: '13px',
  },
  transportIcon: {
    fontSize: '16px',
  },
  transportText: {
    color: '#666',
  },
  transportDuration: {
    marginLeft: 'auto',
    background: '#F5F0EB',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
  },
  placeCard: {
    display: 'flex',
    gap: '16px',
    background: '#fff',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    position: 'relative',
  },
  timeCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    minWidth: '50px',
  },
  time: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#D4A574',
  },
  timeDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  placeInfo: {
    flex: 1,
  },
  typeTag: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '500',
    marginBottom: '8px',
  },
  placeName: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 6px 0',
    color: '#2D2D2D',
  },
  placeAddress: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
  },
  addedBy: {
    fontSize: '11px',
    color: '#aaa',
    margin: '4px 0 0 0',
  },
  deleteBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#ccc',
    cursor: 'pointer',
  },
  addBtn: {
    width: '100%',
    padding: '16px',
    background: '#D4A574',
    border: 'none',
    borderRadius: '16px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '16px',
  },
  addIcon: {
    fontSize: '20px',
  },
  budgetOverview: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px',
  },
  budgetCard: {
    background: '#D4A574',
    borderRadius: '16px',
    padding: '20px',
    color: '#fff',
  },
  budgetCardLight: {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  budgetLabel: {
    fontSize: '13px',
    opacity: 0.9,
    display: 'block',
    marginBottom: '8px',
  },
  budgetLabelDark: {
    fontSize: '13px',
    color: '#888',
    display: 'block',
    marginBottom: '8px',
  },
  budgetAmount: {
    fontSize: '24px',
    fontWeight: '700',
  },
  budgetAmountGreen: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#4CAF50',
  },
  progressSection: {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '14px',
    color: '#666',
  },
  progressBar: {
    height: '8px',
    background: '#F0E6DC',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #D4A574 0%, #E8C4A0 100%)',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2D2D2D',
    margin: '0 0 16px 0',
  },
  expenseList: {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
  },
  expenseItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #F5F0EB',
  },
  expenseIcon: {
    width: '40px',
    height: '40px',
    background: '#FFF5EE',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseItemName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#2D2D2D',
    display: 'block',
    marginBottom: '4px',
  },
  expenseTags: {
    display: 'flex',
    gap: '6px',
  },
  expenseTag: {
    fontSize: '11px',
    color: '#888',
    background: '#F5F0EB',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  expenseRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  expenseAmount: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#2D2D2D',
  },
  checkSection: {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
  },
  checkProgress: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '16px',
  },
  checkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#FAFAFA',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  checkItemDone: {
    background: '#F5FFF5',
  },
  checkbox: {
    width: '24px',
    height: '24px',
    borderRadius: '8px',
    border: '2px solid #DDD',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: '#fff',
  },
  checkboxChecked: {
    background: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkText: {
    flex: 1,
    fontSize: '14px',
    color: '#2D2D2D',
  },
  checkTextDone: {
    textDecoration: 'line-through',
    color: '#999',
  },
  importantTag: {
    fontSize: '11px',
    color: '#E87A5D',
    background: '#FFEBE6',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  addItemRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  addItemInput: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #EEE',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
  },
  addItemBtn: {
    width: '44px',
    height: '44px',
    background: '#D4A574',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  shareCard: {
    background: 'linear-gradient(135deg, #D4A574 0%, #E8C4A0 100%)',
    borderRadius: '16px',
    padding: '20px',
    color: '#fff',
  },
  shareTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 12px 0',
  },
  infoCard: {
    display: 'flex',
    gap: '16px',
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
  },
  infoIcon: {
    width: '48px',
    height: '48px',
    background: '#FFF5EE',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#2D2D2D',
    margin: '0 0 8px 0',
  },
  infoText: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 4px 0',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '430px',
    display: 'flex',
    background: '#fff',
    padding: '12px 20px 24px 20px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
    borderRadius: '24px 24px 0 0',
    zIndex: 100,
  },
  navBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    color: '#999',
  },
  navBtnActive: {
    color: '#D4A574',
  },
  navIcon: {
    fontSize: '24px',
  },
  navLabel: {
    fontSize: '11px',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '24px 24px 0 0',
    width: '100%',
    maxWidth: '430px',
    maxHeight: '85vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #F0E6DC',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    color: '#999',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '24px',
  },
  typeSelector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '24px',
  },
  typeBtn: {
    padding: '12px 8px',
    border: '1px solid #EEE',
    borderRadius: '12px',
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#888',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #EEE',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #EEE',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    background: '#fff',
  },
  amountInput: {
    position: 'relative',
  },
  currencyPrefix: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#888',
  },
  categorySelector: {
    display: 'flex',
    gap: '8px',
  },
  categoryBtn: {
    width: '44px',
    height: '44px',
    border: '1px solid #EEE',
    borderRadius: '12px',
    background: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
  },
  categoryBtnActive: {
    background: '#FFF5EE',
    borderColor: '#D4A574',
  },
  toggleGroup: {
    display: 'flex',
    gap: '8px',
    flex: 1,
  },
  toggleBtn: {
    flex: 1,
    padding: '12px',
    border: '1px solid #EEE',
    borderRadius: '10px',
    background: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
  },
  toggleBtnActive: {
    background: '#D4A574',
    borderColor: '#D4A574',
    color: '#fff',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    background: '#D4A574',
    border: 'none',
    borderRadius: '14px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '24px',
  },
  shareSection: {
    background: '#F8F4F0',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  },
  shareLinkBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#fff',
    borderRadius: '8px',
    padding: '12px',
    border: '1px solid #E0D5C9',
  },
  shareLinkText: {
    flex: 1,
    fontSize: '12px',
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  copyBtn: {
    padding: '8px 12px',
    background: '#D4A574',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  shareHint: {
    fontSize: '12px',
    color: '#888',
    margin: '8px 0 0 0',
    textAlign: 'center',
  },
  membersList: {
    marginBottom: '20px',
  },
  membersListTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 12px 0',
  },
  memberItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#FAFAFA',
    borderRadius: '12px',
    marginBottom: '8px',
  },
  memberItemAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  memberItemInfo: {
    flex: 1,
  },
  memberItemName: {
    fontSize: '15px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  ownerBadge: {
    fontSize: '10px',
    background: '#D4A574',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  memberItemStatus: {
    fontSize: '12px',
    display: 'block',
    marginTop: '2px',
  },
  namePromptOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, #FFF9F5 0%, #FFEEE5 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  namePromptModal: {
    background: '#fff',
    borderRadius: '24px',
    padding: '32px',
    maxWidth: '320px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  },
  namePromptTitle: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 12px 0',
    color: '#2D2D2D',
  },
  namePromptText: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 24px 0',
  },
  namePromptInput: {
    width: '100%',
    padding: '16px',
    border: '2px solid #EEE',
    borderRadius: '12px',
    fontSize: '16px',
    textAlign: 'center',
    outline: 'none',
    marginBottom: '16px',
    boxSizing: 'border-box',
  },
  namePromptBtn: {
    width: '100%',
    padding: '16px',
    background: '#D4A574',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default App;
