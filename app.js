/**
 * Google Pay Mobile Interface - Interactive Logic
 * Modern FinTech Prototype for Hackathon Demo
 */

document.addEventListener('DOMContentLoaded', () => {
  // ================= 1. SOUND SYNTHESIZER (WEB AUDIO API) =================
  let soundEnabled = localStorage.getItem('gpay_sound') !== 'false';
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const now = audioCtx.currentTime;
      if (type === 'tap') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'success') {
        // Iconic Google Pay / UPI success chime: 4 upbeat ascending major tones
        const playTone = (freq, start, duration) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.18, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(start);
          osc.stop(start + duration);
        };
        playTone(523.25, now, 0.12);        // C5
        playTone(659.25, now + 0.12, 0.12); // E5
        playTone(783.99, now + 0.24, 0.15); // G5
        playTone(1046.50, now + 0.38, 0.38);// C6
      } else if (type === 'pin') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1050, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'qr_scan') {
        // Crisp camera scan lock-on beep
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(1600, now + 0.06);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
      }
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // ================= 2. THEME & DARK MODE SYSTEM =================
  const themeToggleSwitch = document.getElementById('themeToggleSwitch');
  const themeStatusText = document.getElementById('themeStatusText');
  const soundToggleSwitch = document.getElementById('soundToggleSwitch');

  function initTheme() {
    const savedTheme = localStorage.getItem('gpay_theme') || 'dark';
    applyTheme(savedTheme, false);
    if (soundToggleSwitch) {
      soundToggleSwitch.checked = soundEnabled;
    }
  }

  function applyTheme(theme, showFeedback = true) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gpay_theme', theme);
    if (themeToggleSwitch) {
      themeToggleSwitch.checked = (theme === 'dark');
    }
    if (themeStatusText) {
      themeStatusText.textContent = (theme === 'dark') ? 'Dark fintech mode enabled' : 'Light fintech mode enabled';
    }
    if (showFeedback) {
      playSound('tap');
      showToast(`Switched to ${theme === 'dark' ? 'Dark' : 'Light'} theme`);
    }
  }

  if (themeToggleSwitch) {
    themeToggleSwitch.addEventListener('change', () => {
      const nextTheme = themeToggleSwitch.checked ? 'dark' : 'light';
      applyTheme(nextTheme, true);
    });
  }

  if (soundToggleSwitch) {
    soundToggleSwitch.addEventListener('change', () => {
      soundEnabled = soundToggleSwitch.checked;
      localStorage.setItem('gpay_sound', soundEnabled);
      playSound('tap');
      showToast(soundEnabled ? 'App sounds enabled' : 'App sounds muted');
    });
  }

  initTheme();

  // ================= 3. LIVE CLOCKS & STATUS BARS =================
  const statusClock = document.getElementById('statusClock');
  const chatStatusClockEl = document.getElementById('chatStatusClock');
  const successStatusClock = document.getElementById('successStatusClock');
  const txDetailStatusClock = document.getElementById('txDetailStatusClock');

  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    if (statusClock) statusClock.textContent = timeStr;
    if (chatStatusClockEl) chatStatusClockEl.textContent = timeStr;
    if (successStatusClock) successStatusClock.textContent = timeStr;
    if (txDetailStatusClock) txDetailStatusClock.textContent = timeStr;
  }
  updateClock();
  setInterval(updateClock, 30000);

  // ================= 4. TOAST NOTIFICATIONS =================
  const toast = document.getElementById('gpayToast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('active');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('active');
    }, 2800);
  }

  // ================= 5. MODAL BACKDROP CONTROLS =================
  document.querySelectorAll('.interactive-modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        // Prevent accidental closing of PIN or Processing modals during active transaction
        if (backdrop.id === 'processingBackdrop') return;
        backdrop.classList.remove('active');
      }
    });
  });

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.interactive-modal-backdrop');
      if (modal) modal.classList.remove('active');
      playSound('tap');
    });
  });

  // Settings Modal Openers
  const settingsModalBackdrop = document.getElementById('settingsModalBackdrop');
  const topProfileAvatarBtn = document.getElementById('topProfileAvatarBtn');
  const navYouTab = document.getElementById('navYouTab');
  const resetDemoDataBtn = document.getElementById('resetDemoDataBtn');

  function openSettings() {
    if (settingsModalBackdrop) {
      settingsModalBackdrop.classList.add('active');
      playSound('tap');
    }
  }

  if (topProfileAvatarBtn) topProfileAvatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openSettings();
  });

  // ================= 6. DYNAMIC BALANCE & TRANSACTION STORE =================
  const INITIAL_BALANCE = 10000.00;
  let currentBalance = parseFloat(localStorage.getItem('gpay_balance'));
  if (isNaN(currentBalance)) {
    currentBalance = INITIAL_BALANCE;
    localStorage.setItem('gpay_balance', currentBalance);
  }

  const balanceBigAmount = document.getElementById('balanceBigAmount');
  const balanceUpdatedTime = document.getElementById('balanceUpdatedTime');

  function updateBalanceDisplay() {
    const formatted = `₹${currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (balanceBigAmount) {
      balanceBigAmount.textContent = formatted;
    }
    if (balanceUpdatedTime) {
      balanceUpdatedTime.textContent = 'Updated just now';
    }
  }
  updateBalanceDisplay();

  // DEFAULT TRANSACTIONS LIST
  const DEFAULT_TRANSACTIONS = [
    {
      id: 'tx_428819204812',
      name: 'Federal Bank ••••8299 to UPI Lite',
      upiId: 'upilite@federal',
      amount: 10,
      type: 'sent',
      date: '27 Sep 2026',
      time: '11:42 am',
      status: 'Completed',
      category: 'UPI Lite',
      color: '#ea580c',
      initial: 'F'
    },
    {
      id: 'tx_428819204811',
      name: 'Nithin Mathew',
      upiId: 'nithin.mathew@okaxis',
      amount: 2000,
      type: 'received',
      date: '27 Sep 2026',
      time: '10:15 am',
      status: 'Completed',
      category: 'Transfer',
      color: '#374151',
      initial: 'N'
    },
    {
      id: 'tx_428819204810',
      name: 'Nithin Mathew',
      upiId: 'nithin.mathew@okaxis',
      amount: 2000,
      type: 'sent',
      date: '27 Sep 2026',
      time: '9:40 am',
      status: 'Completed',
      category: 'Transfer',
      color: '#374151',
      initial: 'N'
    },
    {
      id: 'tx_428819204809',
      name: 'GO GRILL',
      upiId: 'gogrill.restaurant@okhdfc',
      amount: 310,
      type: 'sent',
      date: '26 Sep 2026',
      time: '8:25 pm',
      status: 'Completed',
      category: 'Food',
      color: '#4f46e5',
      initial: 'G'
    },
    {
      id: 'tx_428819204808',
      name: 'Cupcake Siblings',
      upiId: 'cupcakes@okicici',
      amount: 20,
      type: 'sent',
      date: '26 Sep 2026',
      time: '5:12 pm',
      status: 'Completed',
      category: 'Food',
      color: '#388e3c',
      initial: 'C'
    },
    {
      id: 'tx_428819204807',
      name: 'Google Pay Cashback',
      upiId: 'cashback@gpay',
      amount: 45,
      type: 'cashback',
      date: '26 Sep 2026',
      time: '2:30 pm',
      status: 'Completed',
      category: 'Cashback',
      color: '#16a34a',
      initial: '₹'
    },
    {
      id: 'tx_428819204806',
      name: 'Cupcake Siblings',
      upiId: 'cupcakes@okicici',
      amount: 70,
      type: 'sent',
      date: '25 Sep 2026',
      time: '4:15 pm',
      status: 'Completed',
      category: 'Food',
      color: '#388e3c',
      initial: 'C'
    },
    {
      id: 'tx_428819204805',
      name: 'CAFETERIA',
      upiId: 'cafeteria.store@okaxis',
      amount: 20,
      type: 'sent',
      date: '18 Sep 2026',
      time: '12:57 pm',
      status: 'Completed',
      category: 'Food',
      color: '#c2185b',
      initial: 'C'
    },
    {
      id: 'tx_428819204804',
      name: 'CAFETERIA',
      upiId: 'cafeteria.store@okaxis',
      amount: 60,
      type: 'sent',
      date: '18 Sep 2026',
      time: '12:53 pm',
      status: 'Completed',
      category: 'Food',
      color: '#c2185b',
      initial: 'C'
    },
    {
      id: 'tx_428819204803',
      name: 'Alwin',
      upiId: 'alwin.joseph@okhdfcbank',
      amount: 250,
      type: 'sent',
      date: '15 Sep 2026',
      time: '3:45 pm',
      status: 'Completed',
      category: 'Transfer',
      color: '#d97706',
      initial: 'A'
    },
    {
      id: 'tx_428819204802',
      name: 'Adarshuv',
      upiId: 'adarshuv@okicici',
      amount: 400,
      type: 'sent',
      date: '16 Sep 2026',
      time: '6:50 pm',
      status: 'Completed',
      category: 'Transfer',
      color: '#4338ca',
      initial: 'A'
    }
  ];

  let transactions = [];
  try {
    const raw = localStorage.getItem('gpay_transactions');
    if (raw) {
      transactions = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading saved transactions', e);
  }
  if (!transactions || transactions.length === 0) {
    transactions = [...DEFAULT_TRANSACTIONS];
    localStorage.setItem('gpay_transactions', JSON.stringify(transactions));
  }

  // ================= 7. RENDER TRANSACTIONS & SEARCH / FILTERS =================
  const histTxList = document.getElementById('histTxList');
  const histEmptyState = document.getElementById('histEmptyState');
  const histSearchInput = document.getElementById('histSearchInput');
  const histFilterChips = document.querySelectorAll('.hist-filter-chip');

  function renderTransactions(listToRender) {
    if (!histTxList) return;
    histTxList.innerHTML = '';

    if (!listToRender || listToRender.length === 0) {
      if (histEmptyState) histEmptyState.style.display = 'block';
      return;
    }

    if (histEmptyState) histEmptyState.style.display = 'none';

    listToRender.forEach(tx => {
      const row = document.createElement('div');
      row.className = 'hist-tx-row ripple-btn';
      row.setAttribute('data-recipient', tx.name);
      row.setAttribute('data-amount', tx.amount);
      row.setAttribute('data-date', tx.date);
      row.setAttribute('data-time', tx.time || '12:00 pm');

      const isCredit = tx.type === 'received' || tx.type === 'cashback';
      const initial = tx.initial || (tx.name ? tx.name.charAt(0).toUpperCase() : '₹');
      const color = tx.color || '#00838f';
      const sign = isCredit ? '+ ' : '';

      row.innerHTML = `
        <div class="hist-avatar-box" style="background-color: ${color}">
          <span>${initial}</span>
        </div>
        <div class="hist-tx-info">
          <span class="hist-tx-title">${tx.name}</span>
          <span class="hist-tx-date">${tx.date} • ${tx.category || 'UPI'}</span>
        </div>
        <div class="hist-tx-amount ${isCredit ? 'credit' : ''}">${sign}₹${tx.amount.toLocaleString('en-IN')}</div>
      `;

      row.addEventListener('click', () => {
        openTxDetailView({
          amount: tx.amount,
          name: tx.name,
          initial: initial,
          color: color,
          date: tx.date,
          time: tx.time || '12:00 pm',
          upiId: tx.upiRefId || tx.id.replace(/\D/g, '') || '428819204812',
          toVpa: tx.upiId || `${tx.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
          fromVpa: '••••1234@federal on Google Pay',
          googleId: 'CICAg' + (tx.id || 'PjUgO37NA').slice(0, 10).toUpperCase()
        });
      });

      histTxList.appendChild(row);
    });
  }

  function applyHistoryFilters() {
    const query = histSearchInput ? histSearchInput.value.toLowerCase().trim() : '';
    const activeChip = document.querySelector('.hist-filter-chip.active-filter');
    const filterType = activeChip ? activeChip.getAttribute('data-filter') : 'all';

    const filtered = transactions.filter(tx => {
      // Filter Type Check
      let matchesType = true;
      if (filterType === 'sent') {
        matchesType = (tx.type === 'sent');
      } else if (filterType === 'received') {
        matchesType = (tx.type === 'received');
      } else if (filterType === 'cashback') {
        matchesType = (tx.type === 'cashback');
      }

      if (!matchesType) return false;

      // Query Search Check (Name, UPI ID, Transaction ID, Category, Amount)
      if (!query) return true;

      const nameMatch = (tx.name || '').toLowerCase().includes(query);
      const upiMatch = (tx.upiId || '').toLowerCase().includes(query);
      const idMatch = (tx.id || '').toLowerCase().includes(query);
      const catMatch = (tx.category || '').toLowerCase().includes(query);
      const amountMatch = String(tx.amount).includes(query);

      return nameMatch || upiMatch || idMatch || catMatch || amountMatch;
    });

    renderTransactions(filtered);
  }

  if (histSearchInput) {
    histSearchInput.addEventListener('input', applyHistoryFilters);
  }

  histFilterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      histFilterChips.forEach(c => c.classList.remove('active-filter'));
      chip.classList.add('active-filter');
      playSound('tap');
      applyHistoryFilters();
    });
  });

  // Initial render of history
  applyHistoryFilters();

  // Reset Demo Data Handler
  if (resetDemoDataBtn) {
    resetDemoDataBtn.addEventListener('click', () => {
      currentBalance = INITIAL_BALANCE;
      localStorage.setItem('gpay_balance', currentBalance);
      transactions = [...DEFAULT_TRANSACTIONS];
      localStorage.setItem('gpay_transactions', JSON.stringify(transactions));
      updateBalanceDisplay();
      applyHistoryFilters();
      if (settingsModalBackdrop) settingsModalBackdrop.classList.remove('active');
      playSound('success');
      showToast('Demo balance reset to ₹10,000 & transactions restored');
    });
  }

  // ================= 8. NAVIGATION TABS =================
  const navTabs = document.querySelectorAll('.nav-tab-item');
  const homeView = document.getElementById('homeView');
  const historyView = document.getElementById('historyView');
  const scrollContainer = document.getElementById('scrollContainer');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      playSound('tap');

      if (tab.id === 'navHomeTab') {
        if (historyView) historyView.classList.remove('active');
        if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (tab.id === 'navMoneyTab') {
        if (historyView) historyView.classList.add('active');
      } else if (tab.id === 'navYouTab') {
        openSettings();
      }
    });
  });

  // ================= 9. COMPLETE PAYMENT FLOW (SIMULATED) =================
  // State for active recipient
  let currentRecipient = {
    name: 'Adithya',
    initial: 'A',
    upi: 'adithya@upi',
    avatarBg: '#00838f'
  };

  // Step 1: Amount Sheet
  const paymentModalBackdrop = document.getElementById('paymentModalBackdrop');
  const payRecipientAvatar = document.getElementById('payRecipientAvatar');
  const payRecipientInitial = document.getElementById('payRecipientInitial');
  const payRecipientName = document.getElementById('payRecipientName');
  const payRecipientUpi = document.getElementById('payRecipientUpi');
  const payAmountInput = document.getElementById('payAmountInput');
  const confirmPayAmountText = document.getElementById('confirmPayAmountText');
  const confirmPayBtn = document.getElementById('confirmPayBtn');

  // Step 2: Confirmation Sheet
  const confirmModalBackdrop = document.getElementById('confirmModalBackdrop');
  const confirmRecipientAvatar = document.getElementById('confirmRecipientAvatar');
  const confirmRecipientInitial = document.getElementById('confirmRecipientInitial');
  const confirmRecipientName = document.getElementById('confirmRecipientName');
  const confirmRecipientUpi = document.getElementById('confirmRecipientUpi');
  const confirmDisplayAmount = document.getElementById('confirmDisplayAmount');
  const proceedAmountText = document.getElementById('proceedAmountText');
  const proceedToPinBtn = document.getElementById('proceedToPinBtn');
  const closeConfirmModalBtn = document.getElementById('closeConfirmModalBtn');

  // Step 3: 6-Digit PIN Sheet
  const upiPinBackdrop = document.getElementById('upiPinBackdrop');
  const pinDotsRow = document.getElementById('pinDotsRow');
  const pinRecipientName = document.getElementById('pinRecipientName');
  const pinAmountText = document.getElementById('pinAmountText');
  const pinBackspaceBtn = document.getElementById('pinBackspaceBtn');
  const pinSubmitBtn = document.getElementById('pinSubmitBtn');
  const closePinModalBtn = document.getElementById('closePinModalBtn');
  let currentPin = '';

  // Step 4: Processing Screen
  const processingBackdrop = document.getElementById('processingBackdrop');
  const processingAmountText = document.getElementById('processingAmountText');
  const processingRecipientText = document.getElementById('processingRecipientText');

  // Step 5: Success Screen
  const successBackdrop = document.getElementById('successBackdrop');
  const successAmountText = document.getElementById('successAmountText');
  const successRecipientSub = document.getElementById('successRecipientSub');
  const successRefId = document.getElementById('successRefId');
  const successBalanceSub = document.getElementById('successBalanceSub');
  const successDoneBtn = document.getElementById('successDoneBtn');

  // Open Step 1 (Enter Amount)
  function openPaymentSheet(name, initial, upi, avatarBg, defaultAmount) {
    currentRecipient = {
      name: name || 'Adithya',
      initial: initial || (name ? name.charAt(0) : 'A'),
      upi: upi || 'adithya@upi',
      avatarBg: avatarBg || '#00838f'
    };

    if (payRecipientName) payRecipientName.textContent = currentRecipient.name;
    if (payRecipientInitial) payRecipientInitial.textContent = currentRecipient.initial;
    if (payRecipientUpi) payRecipientUpi.textContent = currentRecipient.upi;
    if (payRecipientAvatar) payRecipientAvatar.style.background = currentRecipient.avatarBg;

    if (payAmountInput) {
      payAmountInput.value = defaultAmount !== undefined && defaultAmount !== null ? defaultAmount : '500';
      updateConfirmAmount();
    }

    if (paymentModalBackdrop) {
      paymentModalBackdrop.classList.add('active');
      setTimeout(() => {
        if (payAmountInput) payAmountInput.focus();
      }, 350);
    }
    playSound('tap');
  }

  function updateConfirmAmount() {
    const val = payAmountInput ? (parseFloat(payAmountInput.value) || 0) : 0;
    if (confirmPayAmountText) {
      confirmPayAmountText.textContent = `₹${val.toLocaleString('en-IN')}`;
    }
  }

  if (payAmountInput) {
    payAmountInput.addEventListener('input', updateConfirmAmount);
  }

  // Preset Amount Chips (+100, +500, +1000, +2000)
  document.querySelectorAll('.preset-chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const preset = parseInt(chip.getAttribute('data-preset'), 10) || 0;
      const current = parseInt(payAmountInput.value, 10) || 0;
      payAmountInput.value = current + preset;
      updateConfirmAmount();
      playSound('tap');
    });
  });

  // Step 1 -> Step 2: "Pay ₹500" opens Confirmation
  if (confirmPayBtn) {
    confirmPayBtn.addEventListener('click', () => {
      const amountVal = parseFloat(payAmountInput ? payAmountInput.value : 0) || 0;
      if (amountVal <= 0) {
        showToast('Please enter an amount to pay');
        return;
      }

      // Close Step 1
      if (paymentModalBackdrop) paymentModalBackdrop.classList.remove('active');

      // Populate Step 2 (Confirmation)
      if (confirmRecipientName) confirmRecipientName.textContent = currentRecipient.name;
      if (confirmRecipientUpi) confirmRecipientUpi.textContent = currentRecipient.upi;
      if (confirmRecipientInitial) confirmRecipientInitial.textContent = currentRecipient.initial;
      if (confirmRecipientAvatar) confirmRecipientAvatar.style.background = currentRecipient.avatarBg;
      if (confirmDisplayAmount) confirmDisplayAmount.textContent = `₹${amountVal.toLocaleString('en-IN')}`;
      if (proceedAmountText) proceedAmountText.textContent = `₹${amountVal.toLocaleString('en-IN')}`;

      // Open Step 2
      if (confirmModalBackdrop) confirmModalBackdrop.classList.add('active');
      playSound('tap');
    });
  }

  if (closeConfirmModalBtn && confirmModalBackdrop) {
    closeConfirmModalBtn.addEventListener('click', () => {
      confirmModalBackdrop.classList.remove('active');
      playSound('tap');
    });
  }

  // Step 2 -> Step 3: Confirmation "Pay ₹500" opens 6-Dot PIN Screen
  if (proceedToPinBtn) {
    proceedToPinBtn.addEventListener('click', () => {
      const amountVal = parseFloat(payAmountInput ? payAmountInput.value : 0) || 500;

      // Close Confirmation
      if (confirmModalBackdrop) confirmModalBackdrop.classList.remove('active');

      // Reset PIN
      resetPin();

      // Populate PIN Screen Header
      if (pinRecipientName) pinRecipientName.textContent = currentRecipient.name;
      if (pinAmountText) pinAmountText.textContent = `₹${amountVal.toLocaleString('en-IN')}`;

      // Open PIN Screen
      if (upiPinBackdrop) upiPinBackdrop.classList.add('active');
      playSound('tap');
    });
  }

  if (closePinModalBtn && upiPinBackdrop) {
    closePinModalBtn.addEventListener('click', () => {
      upiPinBackdrop.classList.remove('active');
      playSound('tap');
    });
  }

  // PIN keypad logic (6 Digits)
  function updatePinDisplay() {
    if (!pinDotsRow) return;
    const dots = pinDotsRow.querySelectorAll('.pin-dot');
    dots.forEach((dot, idx) => {
      if (idx < currentPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  function resetPin() {
    currentPin = '';
    updatePinDisplay();
  }

  document.querySelectorAll('#upiKeypad .key-digit[data-num]').forEach(key => {
    key.addEventListener('click', () => {
      const num = key.getAttribute('data-num');
      if (num !== null && currentPin.length < 6) {
        currentPin += num;
        updatePinDisplay();
        playSound('pin');
      }
    });
  });

  if (pinBackspaceBtn) {
    pinBackspaceBtn.addEventListener('click', () => {
      if (currentPin.length > 0) {
        currentPin = currentPin.slice(0, -1);
        updatePinDisplay();
        playSound('pin');
      }
    });
  }

  // Step 3 -> Step 4: PIN Submit
  if (pinSubmitBtn) {
    pinSubmitBtn.addEventListener('click', submitPin);
  }

  function submitPin() {
    if (currentPin.length !== 6) {
      showToast('Please enter full 6-digit UPI PIN');
      playSound('tap');
      return;
    }

    // Close PIN sheet
    if (upiPinBackdrop) upiPinBackdrop.classList.remove('active');

    // Step 4: Show Processing Screen for 1.5 seconds
    const amountVal = parseFloat(payAmountInput ? payAmountInput.value : 0) || 500;
    if (processingAmountText) processingAmountText.textContent = `₹${amountVal.toLocaleString('en-IN')}`;
    if (processingRecipientText) processingRecipientText.textContent = `Paying ${currentRecipient.name} (${currentRecipient.upi})`;

    if (processingBackdrop) processingBackdrop.classList.add('active');

    setTimeout(() => {
      // Step 5: Transition to Success
      if (processingBackdrop) processingBackdrop.classList.remove('active');
      triggerSuccess(amountVal);
    }, 1500);
  }

  // Support physical keyboard on desktop
  window.addEventListener('keydown', (e) => {
    if (upiPinBackdrop && upiPinBackdrop.classList.contains('active')) {
      if (e.key >= '0' && e.key <= '9') {
        if (currentPin.length < 6) {
          currentPin += e.key;
          updatePinDisplay();
          playSound('pin');
        }
      } else if (e.key === 'Backspace') {
        if (currentPin.length > 0) {
          currentPin = currentPin.slice(0, -1);
          updatePinDisplay();
          playSound('pin');
        }
      } else if (e.key === 'Enter') {
        submitPin();
      } else if (e.key === 'Escape') {
        upiPinBackdrop.classList.remove('active');
        playSound('tap');
      }
    }
  });

  // Step 5: Success celebration screen
  let pendingCompletedTx = null;

  function triggerSuccess(amountVal) {
    playSound('success');

    const generatedRefId = String(Math.floor(100000000000 + Math.random() * 900000000000));
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    const hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const timeStr = `${hours % 12 || 12}:${mins} ${ampm}`;

    // Calculate updated balance
    const newBal = Math.max(0, currentBalance - amountVal);

    if (successAmountText) successAmountText.textContent = `₹${amountVal.toLocaleString('en-IN')}.00`;
    if (successRecipientSub) successRecipientSub.textContent = `Paid to ${currentRecipient.name} (${currentRecipient.upi})`;
    if (successRefId) successRefId.textContent = generatedRefId;
    if (successBalanceSub) successBalanceSub.textContent = `Available balance: ₹${newBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // Prepare transaction object
    pendingCompletedTx = {
      id: 'tx_' + generatedRefId,
      upiRefId: generatedRefId,
      name: currentRecipient.name,
      upiId: currentRecipient.upi,
      amount: amountVal,
      type: 'sent',
      date: `Today, ${now.getDate()} ${months[now.getMonth()]}`,
      time: timeStr,
      status: 'Completed',
      category: 'Payment',
      color: currentRecipient.avatarBg || '#00838f',
      initial: currentRecipient.initial || currentRecipient.name.charAt(0)
    };

    if (successBackdrop) successBackdrop.classList.add('active');
  }

  // Tapping "Done" on Success Screen
  if (successDoneBtn) {
    successDoneBtn.addEventListener('click', () => {
      if (successBackdrop) successBackdrop.classList.remove('active');

      if (pendingCompletedTx) {
        // Update Balance
        currentBalance = Math.max(0, currentBalance - pendingCompletedTx.amount);
        localStorage.setItem('gpay_balance', currentBalance);
        updateBalanceDisplay();

        // Add to Transactions History (Newest at top)
        transactions.unshift(pendingCompletedTx);
        localStorage.setItem('gpay_transactions', JSON.stringify(transactions));
        applyHistoryFilters();

        // Append to Contact's Conversation Stream
        if (!contactHistoryData[pendingCompletedTx.name]) {
          contactHistoryData[pendingCompletedTx.name] = [];
        }
        contactHistoryData[pendingCompletedTx.name].push({
          type: 'payment',
          amount: pendingCompletedTx.amount,
          date: pendingCompletedTx.date,
          time: pendingCompletedTx.time
        });

        // Close any full-screen payment/chat views and return to Home
        if (payScreenView) payScreenView.classList.remove('active');
        if (chatView) chatView.classList.remove('active');
        if (homeView) homeView.classList.remove('slide-left');

        showToast(`Payment of ₹${pendingCompletedTx.amount} to ${pendingCompletedTx.name} completed!`);
        pendingCompletedTx = null;
      }

      playSound('tap');
    });
  }

  // ================= 10. QR SCANNER COMPLETE FLOW =================
  const scanQrBtn = document.getElementById('scanQrBtn');
  const scannerModalBackdrop = document.getElementById('scannerModalBackdrop');
  const closeScannerBtn = document.getElementById('closeScannerBtn');
  const scannerTorchBtn = document.getElementById('scannerTorchBtn');
  const scanGallerySimBtn = document.getElementById('scanGallerySimBtn');
  const scanDemoQrBtn = document.getElementById('scanDemoQrBtn');
  const scannerReticle = document.getElementById('scannerReticle');
  const scannerDetectedOverlay = document.getElementById('scannerDetectedOverlay');
  const scannerPromptText = document.getElementById('scannerPromptText');

  let qrDetectTimer = null;

  function triggerQrDetection() {
    clearTimeout(qrDetectTimer);
    playSound('qr_scan');

    if (scannerDetectedOverlay) scannerDetectedOverlay.classList.add('active');
    if (scannerPromptText) scannerPromptText.textContent = '✓ Adithya (adithya@upi) detected';

    showToast('✓ QR Code Detected • Adithya (adithya@upi)');

    setTimeout(() => {
      if (scannerModalBackdrop) scannerModalBackdrop.classList.remove('active');
      if (scannerDetectedOverlay) scannerDetectedOverlay.classList.remove('active');
      if (scannerPromptText) scannerPromptText.textContent = 'Align QR code within the frame to pay';

      // Transition immediately into payment flow for Adithya
      openPaymentSheet('Adithya', 'A', 'adithya@upi', '#00838f', 500);
    }, 600);
  }

  if (scanQrBtn && scannerModalBackdrop) {
    scanQrBtn.addEventListener('click', () => {
      scannerModalBackdrop.classList.add('active');
      playSound('tap');

      // Auto-detect after 1.8 seconds of scanning to simulate real camera scanning
      clearTimeout(qrDetectTimer);
      qrDetectTimer = setTimeout(() => {
        if (scannerModalBackdrop.classList.contains('active')) {
          triggerQrDetection();
        }
      }, 1800);
    });
  }

  if (closeScannerBtn && scannerModalBackdrop) {
    closeScannerBtn.addEventListener('click', () => {
      clearTimeout(qrDetectTimer);
      scannerModalBackdrop.classList.remove('active');
      if (scannerDetectedOverlay) scannerDetectedOverlay.classList.remove('active');
      playSound('tap');
    });
  }

  if (scanDemoQrBtn) {
    scanDemoQrBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerQrDetection();
    });
  }

  if (scannerReticle) {
    scannerReticle.addEventListener('click', () => {
      triggerQrDetection();
    });
  }

  if (scanGallerySimBtn) {
    scanGallerySimBtn.addEventListener('click', () => {
      showToast('Scanning QR from gallery...');
      setTimeout(triggerQrDetection, 500);
    });
  }

  if (scannerTorchBtn) {
    let torchOn = false;
    scannerTorchBtn.addEventListener('click', () => {
      torchOn = !torchOn;
      scannerTorchBtn.style.background = torchOn ? '#fbbc04' : 'rgba(255, 255, 255, 0.15)';
      showToast(torchOn ? 'Flashlight ON' : 'Flashlight OFF');
      playSound('tap');
    });
  }

  // ================= 11. CONTACT CHAT & CONVERSATION VIEW =================
  const chatView = document.getElementById('chatView');
  const chatBackBtn = document.getElementById('chatBackBtn');
  const chatHeaderName = document.getElementById('chatHeaderName');
  const chatHeaderInitial = document.getElementById('chatHeaderInitial');
  const chatHeaderAvatar = document.getElementById('chatHeaderAvatar');
  const chatMessagesStream = document.getElementById('chatMessagesStream');
  const chatScrollContainer = document.getElementById('chatScrollContainer');
  const chatFloatingPayBtn = document.getElementById('chatFloatingPayBtn');

  const contactHistoryData = {
    'CAFETERIA': [
      { type: 'payment', amount: 60, date: '18 Sept', time: '12:53 pm' },
      { type: 'scratch' },
      { type: 'payment', amount: 20, date: '18 Sept', time: '12:57 pm' }
    ],
    'Adithya': [
      { type: 'payment', amount: 500, date: '22 Sept', time: '8:10 pm' },
      { type: 'scratch' },
      { type: 'payment', amount: 150, date: '14 Sept', time: '4:25 pm' }
    ],
    'Cupcake Siblings': [
      { type: 'payment', amount: 350, date: '25 Sept', time: '5:20 pm' },
      { type: 'payment', amount: 180, date: '10 Sept', time: '11:15 am' }
    ],
    'SINDHU JOY': [
      { type: 'payment', amount: 1200, date: '20 Sept', time: '9:30 am' },
      { type: 'scratch' },
      { type: 'payment', amount: 450, date: '12 Sept', time: '2:15 pm' }
    ],
    'Kerala State Road Transport': [
      { type: 'payment', amount: 85, date: '19 Sept', time: '7:40 am' },
      { type: 'payment', amount: 120, date: '08 Sept', time: '6:15 pm' }
    ],
    'Alwin': [
      { type: 'payment', amount: 250, date: '21 Sept', time: '3:45 pm' },
      { type: 'scratch' },
      { type: 'payment', amount: 100, date: '15 Sept', time: '1:10 pm' }
    ],
    'Adarshuv': [
      { type: 'payment', amount: 400, date: '16 Sept', time: '6:50 pm' },
      { type: 'payment', amount: 75, date: '05 Sept', time: '10:05 am' }
    ]
  };

  function renderContactMessages(name) {
    if (!chatMessagesStream) return;
    const history = contactHistoryData[name] || [
      { type: 'payment', amount: 20, date: '18 Sept', time: '12:57 pm' },
      { type: 'scratch' }
    ];

    chatMessagesStream.innerHTML = '';

    history.forEach(item => {
      if (item.type === 'payment') {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble-payment right ripple-btn';
        bubble.setAttribute('data-amount', item.amount);
        bubble.setAttribute('data-date', item.date);
        bubble.innerHTML = `
          <div class="bubble-header-label">Payment to <span class="bubble-recipient-name">${name}</span></div>
          <div class="bubble-amount-text">₹${item.amount}</div>
          <div class="bubble-footer-row">
            <div class="bubble-status-left">
              <div class="status-check-circle">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="#003915">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <span class="bubble-status-text">Paid • ${item.date}</span>
            </div>
            <svg class="bubble-chevron" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </div>
        `;
        bubble.addEventListener('click', () => {
          openTxDetailView({
            amount: item.amount,
            name: name,
            initial: name.charAt(0),
            color: currentRecipient.avatarBg || '#c2185b',
            date: item.date.includes('2026') ? item.date : `${item.date} 2026`,
            time: item.time || '12:57 pm',
            upiId: '662729941462',
            toVpa: currentRecipient.upi || `${name.toLowerCase()}@okaxis`,
            fromVpa: '••••1234@federal on Google Pay',
            googleId: 'CICAgPjUgO37NA'
          });
        });
        chatMessagesStream.appendChild(bubble);
      } else if (item.type === 'scratch') {
        const scratchBubble = document.createElement('div');
        scratchBubble.className = 'chat-bubble-scratch-card right ripple-btn';
        scratchBubble.innerHTML = `
          <div class="scratch-bubble-title">You earned a scratch card!</div>
          <div class="scratch-card-illustration">
            <div class="scratch-graphic-card">
              <svg viewBox="0 0 200 90" width="100%" height="100%" fill="none">
                <g transform="translate(56, 44)" opacity="0.65">
                  <circle cx="0" cy="0" r="2.5" fill="#1d5fc4" />
                  <line x1="0" y1="-5" x2="0" y2="-16" stroke="#1d5fc4" stroke-width="2" stroke-linecap="round" />
                  <circle cx="0" cy="-18" r="1.5" fill="#1d5fc4" />
                  <line x1="6" y1="-6" x2="14" y2="-14" stroke="#1d5fc4" stroke-width="2" stroke-linecap="round" />
                  <circle cx="16" cy="-16" r="1.5" fill="#1d5fc4" />
                </g>
                <g transform="translate(108, 38)" opacity="0.65">
                  <circle cx="0" cy="0" r="10.5" fill="#1d5fc4" />
                  <polygon points="-5,9 0,22 2,9" fill="#1d5fc4" />
                  <polygon points="1,9 5,22 7,9" fill="#1a56b2" />
                </g>
              </svg>
            </div>
          </div>
          <div class="scratch-bubble-footer">
            <span class="scratch-tap-text">Tap to view</span>
            <svg class="bubble-chevron" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </div>
        `;
        scratchBubble.addEventListener('click', () => {
          openScratchCardModal();
        });
        chatMessagesStream.appendChild(scratchBubble);
      }
    });
  }

  function openChatView(name, initial, upi, color) {
    currentRecipient = { name, initial, upi, avatarBg: color };

    if (chatHeaderName) chatHeaderName.textContent = name;
    if (chatHeaderInitial) chatHeaderInitial.textContent = initial;
    if (chatHeaderAvatar) chatHeaderAvatar.style.backgroundColor = color || '#00838f';

    renderContactMessages(name);

    if (homeView && chatView) {
      homeView.classList.add('slide-left');
      chatView.classList.add('active');
    }

    if (chatScrollContainer) {
      setTimeout(() => {
        chatScrollContainer.scrollTop = chatScrollContainer.scrollHeight;
      }, 80);
    }
    playSound('tap');
  }

  function closeChatView() {
    if (homeView && chatView) {
      homeView.classList.remove('slide-left');
      chatView.classList.remove('active');
    }
    playSound('tap');
  }

  if (chatBackBtn) chatBackBtn.addEventListener('click', closeChatView);

  if (chatFloatingPayBtn) {
    chatFloatingPayBtn.addEventListener('click', () => {
      openPaymentSheet(
        currentRecipient.name || 'Adithya',
        currentRecipient.initial || 'A',
        currentRecipient.upi || 'adithya@upi',
        currentRecipient.avatarBg || '#00838f',
        500
      );
    });
  }

  // Contact list item taps
  document.querySelectorAll('.contact-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.id === 'moreContactsBtn') {
        showToast('Viewing all 42 contacts');
        return;
      }
      const name = btn.getAttribute('data-name');
      const initial = btn.getAttribute('data-initial');
      const upi = btn.getAttribute('data-upi');
      const color = btn.getAttribute('data-color') || '#00838f';
      openChatView(name, initial, upi, color);
    });
  });

  // Action button: "Pay anyone" opens payment sheet
  const payAnyoneBtn = document.getElementById('payAnyoneBtn');
  if (payAnyoneBtn) {
    payAnyoneBtn.addEventListener('click', () => {
      openPaymentSheet('Adithya', 'A', 'adithya@upi', '#00838f', 500);
    });
  }

  // Top search bar trigger opens payment sheet
  const searchTriggerBtn = document.getElementById('searchTriggerBtn');
  if (searchTriggerBtn) {
    searchTriggerBtn.addEventListener('click', (e) => {
      // If clicking profile avatar directly, that opens settings instead
      if (e.target.closest('#topProfileAvatarBtn')) return;
      openPaymentSheet('Adithya', 'A', 'adithya@upi', '#00838f', 500);
    });
  }

  // ================= 12. FULL SCREEN PAYMENT INTERFACE (VIEW 3) =================
  const payScreenView = document.getElementById('payScreenView');
  const payScreenBackBtn = document.getElementById('payScreenBackBtn');
  const payScreenRecipientName = document.getElementById('payScreenRecipientName');
  const payScreenRecipientPhone = document.getElementById('payScreenRecipientPhone');
  const payScreenAvatar = document.getElementById('payScreenAvatar');
  const payScreenAvatarImg = document.getElementById('payScreenAvatarImg');
  const payScreenInitial = document.getElementById('payScreenInitial');
  const payScreenAmountDisplay = document.getElementById('payScreenAmountDisplay');
  const payScreenSubmitAmountText = document.getElementById('payScreenSubmitAmountText');
  const payScreenSubmitBtn = document.getElementById('payScreenSubmitBtn');
  const payNotePillBtn = document.getElementById('payNotePillBtn');
  const payNotePillText = document.getElementById('payNotePillText');
  const payKeyBackspace = document.getElementById('payKeyBackspace');

  let currentPayAmount = '0';

  function updatePayScreenDisplay() {
    if (payScreenAmountDisplay) {
      payScreenAmountDisplay.textContent = currentPayAmount || '0';
    }
    if (payScreenSubmitAmountText) {
      const numVal = parseFloat(currentPayAmount) || 0;
      payScreenSubmitAmountText.textContent = `₹${numVal.toLocaleString('en-IN')}`;
    }
    if (payScreenSubmitBtn) {
      const numVal = parseFloat(currentPayAmount) || 0;
      payScreenSubmitBtn.disabled = numVal <= 0;
    }
  }

  function openPayScreenView(name, initial, phone, color, defaultAmount) {
    currentRecipient = {
      name: name || 'Adithya',
      initial: initial || 'A',
      upi: `${(name || 'adithya').toLowerCase().replace(/\s+/g, '')}@upi`,
      avatarBg: color || '#00838f',
      phone: phone || '+91 98765 43210'
    };

    if (payScreenRecipientName) payScreenRecipientName.textContent = currentRecipient.name;
    if (payScreenRecipientPhone) payScreenRecipientPhone.textContent = currentRecipient.phone;
    if (payScreenInitial) payScreenInitial.textContent = currentRecipient.initial;
    if (payScreenAvatar) payScreenAvatar.style.backgroundColor = currentRecipient.avatarBg;

    if (payScreenAvatarImg && payScreenInitial) {
      if (currentRecipient.name === 'Arjun S' || currentRecipient.name === 'Adithya') {
        payScreenAvatarImg.style.display = 'block';
        payScreenInitial.style.display = 'none';
      } else {
        payScreenAvatarImg.style.display = 'none';
        payScreenInitial.style.display = 'block';
      }
    }

    currentPayAmount = defaultAmount !== undefined ? String(defaultAmount) : '0';
    updatePayScreenDisplay();

    if (payNotePillText) payNotePillText.textContent = 'Add a note';

    if (payScreenView) payScreenView.classList.add('active');
    playSound('tap');
  }

  function closePayScreenView() {
    if (payScreenView) payScreenView.classList.remove('active');
    playSound('tap');
  }

  if (payScreenBackBtn) payScreenBackBtn.addEventListener('click', closePayScreenView);

  // Keypad keys
  document.querySelectorAll('.pay-key[data-key]').forEach(keyBtn => {
    keyBtn.addEventListener('click', () => {
      const key = keyBtn.getAttribute('data-key');
      if (key === '.') {
        if (!currentPayAmount.includes('.')) {
          currentPayAmount = currentPayAmount ? currentPayAmount + '.' : '0.';
        }
      } else {
        if (currentPayAmount === '0') {
          currentPayAmount = key;
        } else if (currentPayAmount.length < 8) {
          const parts = currentPayAmount.split('.');
          if (parts.length < 2 || parts[1].length < 2) {
            currentPayAmount += key;
          }
        }
      }
      updatePayScreenDisplay();
      playSound('pin');
    });
  });

  if (payKeyBackspace) {
    payKeyBackspace.addEventListener('click', () => {
      if (currentPayAmount.length > 0) {
        currentPayAmount = currentPayAmount.slice(0, -1);
      }
      if (currentPayAmount === '') {
        currentPayAmount = '0';
      }
      updatePayScreenDisplay();
      playSound('pin');
    });
  }

  if (payScreenSubmitBtn) {
    payScreenSubmitBtn.addEventListener('click', () => {
      const amountVal = parseFloat(currentPayAmount) || 0;
      if (amountVal <= 0) {
        showToast('Please enter an amount to pay');
        return;
      }
      if (payAmountInput) payAmountInput.value = amountVal;

      // Close pay screen and open confirmation
      closePayScreenView();
      if (confirmPayBtn) confirmPayBtn.click();
    });
  }

  if (payNotePillBtn) {
    const popularNotes = ['Lunch 🍱', 'Coffee ☕', 'Split bill 🧾', 'Groceries 🛒', 'Movie 🍿'];
    let noteIdx = 0;
    payNotePillBtn.addEventListener('click', () => {
      const note = popularNotes[noteIdx % popularNotes.length];
      noteIdx++;
      if (payNotePillText) payNotePillText.textContent = note;
      showToast(`Added note: ${note}`);
      playSound('tap');
    });
  }

  // ================= 13. TRANSACTION DETAILS / RECEIPT SCREEN =================
  const txDetailView = document.getElementById('txDetailView');
  const txDetailBackBtn = document.getElementById('txDetailBackBtn');
  const txDetailAvatar = document.getElementById('txDetailAvatar');
  const txDetailAvatarLetter = document.getElementById('txDetailAvatarLetter');
  const txDetailRecipientName = document.getElementById('txDetailRecipientName');
  const txDetailBigAmount = document.getElementById('txDetailBigAmount');
  const txDetailPayAgainBtn = document.getElementById('txDetailPayAgainBtn');
  const txDetailTimestamp = document.getElementById('txDetailTimestamp');
  const txDetailMsgTitle = document.getElementById('txDetailMsgTitle');
  const txDetailMsgSub = document.getElementById('txDetailMsgSub');
  const txStepTime1 = document.getElementById('txStepTime1');
  const txStepLabel2 = document.getElementById('txStepLabel2');
  const txStepTime2 = document.getElementById('txStepTime2');
  const txStepLabel3 = document.getElementById('txStepLabel3');
  const txStepTime3 = document.getElementById('txStepTime3');
  const txStepTime4 = document.getElementById('txStepTime4');
  const txDetailUpiId = document.getElementById('txDetailUpiId');
  const txDetailToLabel = document.getElementById('txDetailToLabel');
  const txDetailToVpa = document.getElementById('txDetailToVpa');
  const txDetailFromVpa = document.getElementById('txDetailFromVpa');
  const txDetailGoogleId = document.getElementById('txDetailGoogleId');

  function openTxDetailView(data) {
    if (!data) data = {};
    const amount = data.amount || 20;
    const name = data.name || currentRecipient.name || 'CAFETERIA';
    const initial = data.initial || (name ? name.charAt(0) : 'C');
    const color = data.color || currentRecipient.avatarBg || '#880e4f';
    const dateStr = data.date || '27 Sep 2026';
    const timeStr = data.time || '12:57 pm';
    const fullDateTime = `${dateStr}, ${timeStr}`;

    if (txDetailAvatar) txDetailAvatar.style.backgroundColor = color;
    if (txDetailAvatarLetter) txDetailAvatarLetter.textContent = initial;
    if (txDetailRecipientName) txDetailRecipientName.textContent = name;
    if (txDetailBigAmount) txDetailBigAmount.textContent = `₹${amount.toLocaleString('en-IN')}`;
    if (txDetailTimestamp) txDetailTimestamp.textContent = fullDateTime;
    if (txDetailMsgTitle) txDetailMsgTitle.textContent = `Payment of ₹${amount} completed`;
    if (txDetailMsgSub) txDetailMsgSub.textContent = `Receiver's bank has confirmed deposit of money to ${name}'s bank account`;

    if (txStepTime1) txStepTime1.textContent = fullDateTime;
    if (txStepLabel2) txStepLabel2.textContent = `₹${amount} was debited`;
    if (txStepTime2) txStepTime2.textContent = timeStr;
    if (txStepLabel3) txStepLabel3.textContent = `₹${amount} sent to ${name}`;
    if (txStepTime3) txStepTime3.textContent = timeStr;
    if (txStepTime4) txStepTime4.textContent = timeStr;

    if (txDetailToLabel) txDetailToLabel.textContent = `To: ${name}`;
    if (txDetailUpiId) txDetailUpiId.textContent = data.upiId || '662729941462';
    if (txDetailToVpa) txDetailToVpa.textContent = data.toVpa || `${name.toLowerCase()}@upi`;
    if (txDetailFromVpa) txDetailFromVpa.textContent = data.fromVpa || '••••1234@federal on Google Pay';
    if (txDetailGoogleId) txDetailGoogleId.textContent = data.googleId || 'CICAgPjUgO37NA';

    if (txDetailPayAgainBtn) {
      txDetailPayAgainBtn.onclick = () => {
        closeTxDetailView();
        openPaymentSheet(name, initial, data.toVpa || 'adithya@upi', color, amount);
      };
    }

    if (txDetailView) txDetailView.classList.add('active');
    playSound('tap');
  }

  function closeTxDetailView() {
    if (txDetailView) txDetailView.classList.remove('active');
    playSound('tap');
  }

  if (txDetailBackBtn) txDetailBackBtn.addEventListener('click', closeTxDetailView);

  // ================= 14. BANK BALANCE MODAL =================
  const rowCheckBalance = document.getElementById('rowCheckBalance');
  const balanceModalBackdrop = document.getElementById('balanceModalBackdrop');
  const balanceCloseBtn = document.getElementById('balanceCloseBtn');
  const closeBalanceModalBtn = document.getElementById('closeBalanceModalBtn');
  const bankTransferBtn = document.getElementById('bankTransferBtn');

  if (rowCheckBalance) {
    rowCheckBalance.addEventListener('click', () => {
      updateBalanceDisplay();
      if (balanceModalBackdrop) balanceModalBackdrop.classList.add('active');
      playSound('tap');
    });
  }

  if (balanceCloseBtn && balanceModalBackdrop) {
    balanceCloseBtn.addEventListener('click', () => {
      balanceModalBackdrop.classList.remove('active');
      playSound('tap');
    });
  }

  if (closeBalanceModalBtn && balanceModalBackdrop) {
    closeBalanceModalBtn.addEventListener('click', () => {
      balanceModalBackdrop.classList.remove('active');
      playSound('tap');
    });
  }

  if (bankTransferBtn) {
    bankTransferBtn.addEventListener('click', () => {
      openPaymentSheet('Adithya', 'A', 'adithya@upi', '#00838f', 500);
    });
  }

  // ================= 15. TRANSACTION HISTORY SCREEN (VIEW 6) =================
  const rowTxHistory = document.getElementById('rowTxHistory');
  const historyBackBtn = document.getElementById('historyBackBtn');

  if (rowTxHistory && historyView) {
    rowTxHistory.addEventListener('click', () => {
      applyHistoryFilters();
      historyView.classList.add('active');
      playSound('tap');
    });
  }

  if (historyBackBtn && historyView) {
    historyBackBtn.addEventListener('click', () => {
      historyView.classList.remove('active');
      playSound('tap');
    });
  }

  // ================= 16. SCRATCH CARD / REWARDS =================
  const rewardsTileBtn = document.getElementById('rewardsTileBtn');
  const offersTileBtn = document.getElementById('offersTileBtn');
  const referralsTileBtn = document.getElementById('referralsTileBtn');
  const chipRewards = document.getElementById('chipRewards');
  const scratchModalBackdrop = document.getElementById('scratchModalBackdrop');
  const scratchCanvas = document.getElementById('scratchCanvas');
  const claimRewardBtn = document.getElementById('claimRewardBtn');
  const closeScratchBtn = document.getElementById('closeScratchBtn');

  function openScratchCardModal() {
    if (scratchModalBackdrop) {
      scratchModalBackdrop.classList.add('active');
      initScratchCanvas();
      playSound('tap');
    }
  }

  if (rewardsTileBtn) rewardsTileBtn.addEventListener('click', openScratchCardModal);
  if (chipRewards) chipRewards.addEventListener('click', openScratchCardModal);

  if (closeScratchBtn && scratchModalBackdrop) {
    closeScratchBtn.addEventListener('click', () => {
      scratchModalBackdrop.classList.remove('active');
      playSound('tap');
    });
  }

  if (offersTileBtn) {
    offersTileBtn.addEventListener('click', () => {
      showToast('Showing 14 active merchant offers');
      playSound('tap');
    });
  }

  if (referralsTileBtn) {
    referralsTileBtn.addEventListener('click', () => {
      showToast('Invite friends to get ₹201 cashback');
      playSound('tap');
    });
  }

  function initScratchCanvas() {
    if (!scratchCanvas) return;
    const ctx = scratchCanvas.getContext('2d');
    const w = scratchCanvas.width;
    const h = scratchCanvas.height;

    // Draw shimmering silver scratch surface
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#c0c0c0');
    grad.addColorStop(0.3, '#e8e8e8');
    grad.addColorStop(0.6, '#b0b0b0');
    grad.addColorStop(1, '#999999');

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative GPay logo pattern
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Google Pay', w / 2, h / 2 - 10);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#777777';
    ctx.fillText('Scratch here', w / 2, h / 2 + 18);

    let isScratching = false;

    function scratch(e) {
      if (!isScratching) return;
      const rect = scratchCanvas.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x * (w / rect.width), y * (h / rect.height), 22, 0, Math.PI * 2);
      ctx.fill();
    }

    scratchCanvas.onmousedown = (e) => { isScratching = true; scratch(e); };
    scratchCanvas.onmousemove = scratch;
    window.onmouseup = () => { isScratching = false; };

    scratchCanvas.ontouchstart = (e) => { isScratching = true; scratch(e); };
    scratchCanvas.ontouchmove = scratch;
    window.ontouchend = () => { isScratching = false; };
  }

  if (claimRewardBtn && scratchModalBackdrop) {
    claimRewardBtn.addEventListener('click', () => {
      scratchModalBackdrop.classList.remove('active');

      // Add Cashback to balance
      currentBalance += 45;
      localStorage.setItem('gpay_balance', currentBalance);
      updateBalanceDisplay();

      // Add Cashback to transactions
      const cashbackTx = {
        id: 'tx_' + Date.now(),
        name: 'Google Pay Cashback',
        upiId: 'rewards@gpay',
        amount: 45,
        type: 'cashback',
        date: 'Today',
        time: 'Just now',
        status: 'Completed',
        category: 'Cashback',
        color: '#16a34a',
        initial: '₹'
      };
      transactions.unshift(cashbackTx);
      localStorage.setItem('gpay_transactions', JSON.stringify(transactions));
      applyHistoryFilters();

      showToast('₹45 Cashback credited directly to your bank account!');
      playSound('success');
    });
  }

  // ================= 17. CIBIL SCORE MODAL =================
  const rowCibilScore = document.getElementById('rowCibilScore');
  const cibilModalBackdrop = document.getElementById('cibilModalBackdrop');
  const closeCibilBtn = document.getElementById('closeCibilBtn');
  const closeCibilBtn2 = document.getElementById('closeCibilBtn2');

  if (rowCibilScore && cibilModalBackdrop) {
    rowCibilScore.addEventListener('click', () => {
      cibilModalBackdrop.classList.add('active');
      playSound('tap');
    });
  }
  if (closeCibilBtn && cibilModalBackdrop) {
    closeCibilBtn.addEventListener('click', () => {
      cibilModalBackdrop.classList.remove('active');
      playSound('tap');
    });
  }
  if (closeCibilBtn2 && cibilModalBackdrop) {
    closeCibilBtn2.addEventListener('click', () => {
      cibilModalBackdrop.classList.remove('active');
      playSound('tap');
    });
  }

  // ================= 18. BILLS & CARDS QUICK ACTIONS =================
  document.querySelectorAll('.bill-provider-item').forEach(item => {
    item.addEventListener('click', () => {
      const biller = item.getAttribute('data-biller') || 'Electricity';
      const amount = parseFloat(item.getAttribute('data-amount')) || 180;
      openPaymentSheet(biller, biller.charAt(0), `${biller.toLowerCase().replace(/\s+/g, '')}@billdesk`, '#0b57d0', amount);
    });
  });

  document.querySelectorAll('.category-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category');
      showToast(`Selected category: ${cat}`);
      playSound('tap');
    });
  });

  const chipTapPay = document.getElementById('chipTapPay');
  if (chipTapPay) {
    chipTapPay.addEventListener('click', () => {
      showToast('NFC Tap & Pay is active on this device');
      playSound('tap');
    });
  }

  const chipUpiLite = document.getElementById('chipUpiLite');
  if (chipUpiLite) {
    chipUpiLite.addEventListener('click', () => {
      showToast(`Primary Account Balance: ₹${currentBalance.toLocaleString('en-IN')}`);
      playSound('tap');
    });
  }

  const applyFlexBtn = document.getElementById('applyFlexBtn');
  if (applyFlexBtn) {
    applyFlexBtn.addEventListener('click', () => {
      showToast('Opening Flex Credit Card (Zero-fee welcome offer)');
      playSound('tap');
    });
  }

  const cardFlexGpay = document.getElementById('cardFlexGpay');
  if (cardFlexGpay) {
    cardFlexGpay.addEventListener('click', () => {
      showToast('Flex UPI Credit Card: Instant virtual card activation');
      playSound('tap');
    });
  }

  const cardPersonalLoan = document.getElementById('cardPersonalLoan');
  if (cardPersonalLoan) {
    cardPersonalLoan.addEventListener('click', () => {
      showToast('Personal Loan: Up to ₹40 lakh pre-approved');
      playSound('tap');
    });
  }

  // ================= 19. PWA SERVICE WORKER REGISTRATION =================
  if ('serviceWorker' in navigator) {
    const registerSW = () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('PWA ServiceWorker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('PWA ServiceWorker registration failed:', err);
        });
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }
  }
});
