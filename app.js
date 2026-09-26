/**
 * Google Pay Mobile Interface - Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Sound synthesizer using Web Audio API
  let soundEnabled = true;
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
        // Iconic Google Pay / UPI success chime: two upbeat high notes
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
        playTone(1046.50, now + 0.38, 0.35);// C6
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
      }
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // Live status bar clocks
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

  // Toast notification system
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

  // Modal Backdrop dismiss helper
  document.querySelectorAll('.interactive-modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('active');
      }
    });
  });

  // Modal close buttons
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = btn.closest('.interactive-modal-backdrop');
      if (modal) modal.classList.remove('active');
    });
  });

  // Bottom Navigation Switcher
  const navTabs = document.querySelectorAll('.nav-tab-item');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      playSound('tap');
      const tabName = tab.querySelector('.nav-tab-label').textContent;
      showToast(`Navigated to ${tabName}`);
    });
  });

  // ================= PAYMENT FLOW =================
  const paymentModalBackdrop = document.getElementById('paymentModalBackdrop');
  const payRecipientAvatar = document.getElementById('payRecipientAvatar');
  const payRecipientInitial = document.getElementById('payRecipientInitial');
  const payRecipientName = document.getElementById('payRecipientName');
  const payRecipientUpi = document.getElementById('payRecipientUpi');
  const payAmountInput = document.getElementById('payAmountInput');
  const confirmPayAmountText = document.getElementById('confirmPayAmountText');
  const confirmPayBtn = document.getElementById('confirmPayBtn');

  let currentRecipient = {
    name: 'Adithya',
    initial: 'A',
    upi: 'adithya.kumar@okicici',
    avatarBg: '#00838f'
  };

  function openPaymentSheet(name, initial, upi, avatarBg, defaultAmount) {
    currentRecipient = { name, initial, upi, avatarBg };
    if (payRecipientName) payRecipientName.textContent = name;
    if (payRecipientInitial) payRecipientInitial.textContent = initial;
    if (payRecipientUpi) payRecipientUpi.textContent = upi;
    if (payRecipientAvatar) payRecipientAvatar.style.background = avatarBg || '#00838f';
    if (payAmountInput) {
      payAmountInput.value = defaultAmount || '';
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

  // Quick Preset Amount Chips
  document.querySelectorAll('.preset-chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const preset = parseInt(chip.getAttribute('data-preset'), 10);
      const current = parseInt(payAmountInput.value, 10) || 0;
      payAmountInput.value = current + preset;
      updateConfirmAmount();
      playSound('tap');
    });
  });

  // ================= CONTACT CHAT / CONVERSATION VIEW =================
  const homeView = document.getElementById('homeView');
  const chatView = document.getElementById('chatView');
  const chatBackBtn = document.getElementById('chatBackBtn');
  const chatHeaderName = document.getElementById('chatHeaderName');
  const chatHeaderInitial = document.getElementById('chatHeaderInitial');
  const chatHeaderAvatar = document.getElementById('chatHeaderAvatar');
  const chatMessagesStream = document.getElementById('chatMessagesStream');
  const chatScrollContainer = document.getElementById('chatScrollContainer');
  const chatFloatingPayBtn = document.getElementById('chatFloatingPayBtn');
  const chatStatusClock = document.getElementById('chatStatusClock');
  const chatScratchCardBubble = document.getElementById('chatScratchCardBubble');

  // Contact Transaction Data Store
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
            toVpa: currentRecipient.upi || '••••460a@sib',
            fromVpa: '••••0421@okicici on Google Pay',
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
                <!-- Sunburst / radiating rays on the left -->
                <g transform="translate(56, 44)" opacity="0.65">
                  <circle cx="0" cy="0" r="2.5" fill="#1d5fc4" />
                  <line x1="0" y1="-5" x2="0" y2="-16" stroke="#1d5fc4" stroke-width="2" stroke-linecap="round" />
                  <circle cx="0" cy="-18" r="1.5" fill="#1d5fc4" />
                  <line x1="6" y1="-6" x2="14" y2="-14" stroke="#1d5fc4" stroke-width="2" stroke-linecap="round" />
                  <circle cx="16" cy="-16" r="1.5" fill="#1d5fc4" />
                  <line x1="8" y1="0" x2="19" y2="0" stroke="#1d5fc4" stroke-width="2" stroke-linecap="round" />
                  <circle cx="21" cy="0" r="1.5" fill="#1d5fc4" />
                  <line x1="6" y1="6" x2="14" y2="14" stroke="#1d5fc4" stroke-width="2" stroke-linecap="round" />
                  <circle cx="16" cy="16" r="1.5" fill="#1d5fc4" />
                  <line x1="0" y1="8" x2="0" y2="19" stroke="#1d5fc4" stroke-width="2" stroke-linecap="round" />
                  <circle cx="0" cy="21" r="1.5" fill="#1d5fc4" />
                  <line x1="-6" y1="6" x2="-14" y2="14" stroke="#1d5fc4" stroke-width="2" stroke-linecap="round" />
                  <circle cx="-16" cy="16" r="1.5" fill="#1d5fc4" />
                  <line x1="-8" y1="0" x2="-19" y2="0" stroke="#1d5fc4" stroke-width="2" stroke-linecap="round" />
                  <circle cx="-21" cy="0" r="1.5" fill="#1d5fc4" />
                  <line x1="-6" y1="-6" x2="-14" y2="-14" stroke="#1d5fc4" stroke-width="2" stroke-linecap="round" />
                  <circle cx="-16" cy="-16" r="1.5" fill="#1d5fc4" />
                </g>

                <!-- Rosette Medal Badge -->
                <g transform="translate(108, 38)" opacity="0.65">
                  <circle cx="0" cy="0" r="10.5" fill="#1d5fc4" />
                  <polygon points="-5,9 0,22 2,9" fill="#1d5fc4" />
                  <polygon points="1,9 5,22 7,9" fill="#1a56b2" />
                  <polygon points="0,-4.5 1.4,-1.2 5,-1.2 2.2,0.8 3.2,4.2 0,2.1 -3.2,4.2 -2.2,0.8 -5,-1.2 -1.4,-1.2" fill="#2d77e5" />
                </g>

                <!-- Confetti shapes scattered across card -->
                <rect x="145" y="44" width="22" height="11" rx="2" transform="rotate(-8 145 44)" fill="#1d5fc4" opacity="0.65" />
                <path d="M 28 32 A 4 4 0 0 1 36 28" fill="none" stroke="#1d5fc4" stroke-width="2.5" stroke-linecap="round" opacity="0.65" />
                <path d="M 132 58 A 4 4 0 0 1 140 54" fill="none" stroke="#1d5fc4" stroke-width="2.5" stroke-linecap="round" opacity="0.65" />
                <circle cx="68" cy="18" r="2.2" fill="#1d5fc4" opacity="0.65" />
                <circle cx="152" cy="24" r="2" fill="#1d5fc4" opacity="0.65" />
                <circle cx="170" cy="38" r="2.2" fill="#1d5fc4" opacity="0.65" />
                <circle cx="95" cy="62" r="2.2" fill="#1d5fc4" opacity="0.65" />
                <circle cx="140" cy="72" r="2.2" fill="#1d5fc4" opacity="0.65" />
                <polygon points="135,18 136.5,21.5 140,23 136.5,24.5 135,28 133.5,24.5 130,23 133.5,21.5" fill="#1d5fc4" opacity="0.65" />
                <polygon points="172,60 173.2,62.5 176,63.5 173.2,64.5 172,67 170.8,64.5 168,63.5 170.8,62.5" fill="#1d5fc4" opacity="0.65" />
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

  if (chatBackBtn) {
    chatBackBtn.addEventListener('click', closeChatView);
  }

  if (chatFloatingPayBtn) {
    chatFloatingPayBtn.addEventListener('click', () => {
      openPayScreenView(
        currentRecipient.name || 'CAFETERIA',
        currentRecipient.initial || 'C',
        currentRecipient.phone || '+91 98765 43210',
        currentRecipient.avatarBg || '#c2185b',
        0
      );
    });
  }

  // ================= VIEW 3: FULL SCREEN PAYMENT INTERFACE =================
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
  const payBankSelector = document.getElementById('payBankSelector');
  const payKeyBackspace = document.getElementById('payKeyBackspace');

  let currentPayAmount = '0'; // Default: ₹ 0
  let currentPayNote = '';

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
    if (name) currentRecipient.name = name;
    if (initial) currentRecipient.initial = initial;
    if (color) currentRecipient.avatarBg = color;
    if (phone) currentRecipient.phone = phone;

    const displayName = currentRecipient.name || 'Arjun S';
    if (payScreenRecipientName) {
      payScreenRecipientName.textContent = displayName;
    }
    if (payScreenRecipientPhone) {
      payScreenRecipientPhone.textContent = currentRecipient.phone || '+91 98765 43210';
    }
    if (payScreenInitial) {
      payScreenInitial.textContent = currentRecipient.initial || 'A';
    }
    if (payScreenAvatar) {
      payScreenAvatar.style.backgroundColor = currentRecipient.avatarBg || '#00838f';
    }

    if (payScreenAvatarImg && payScreenInitial) {
      // If Arjun S or specific contacts, show the portrait photo just like user's screenshot
      if (displayName === 'Arjun S' || displayName === 'Adithya' || displayName === 'Alwin') {
        payScreenAvatarImg.style.display = 'block';
        payScreenInitial.style.display = 'none';
      } else {
        payScreenAvatarImg.style.display = 'none';
        payScreenInitial.style.display = 'block';
      }
    }

    currentPayAmount = defaultAmount !== undefined ? String(defaultAmount) : '0';
    updatePayScreenDisplay();

    if (payNotePillText) {
      payNotePillText.textContent = 'Add a note';
      currentPayNote = '';
    }

    if (payScreenView) {
      payScreenView.classList.add('active');
    }
    playSound('tap');
  }

  function closePayScreenView() {
    if (payScreenView) {
      payScreenView.classList.remove('active');
    }
    playSound('tap');
  }

  if (payScreenBackBtn) {
    payScreenBackBtn.addEventListener('click', closePayScreenView);
  }

  // Tapping Pay in Chat View opens this exact interface!
  if (chatFloatingPayBtn) {
    chatFloatingPayBtn.addEventListener('click', () => {
      openPayScreenView(currentRecipient.name, currentRecipient.initial, '+91 98765 43210', currentRecipient.avatarBg, 0);
    });
  }

  // Numeric Keypad Digits
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

  // Numeric Keypad Backspace
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

  // "Add a note" Button
  if (payNotePillBtn) {
    const popularNotes = ['Lunch 🍱', 'Coffee ☕', 'Split bill 🧾', 'Groceries 🛒', 'Movie 🍿'];
    let noteIdx = 0;
    payNotePillBtn.addEventListener('click', () => {
      currentPayNote = popularNotes[noteIdx % popularNotes.length];
      noteIdx++;
      if (payNotePillText) {
        payNotePillText.textContent = currentPayNote;
      }
      showToast(`Added note: ${currentPayNote}`);
      playSound('tap');
    });
  }

  // Bank Selector Card Click
  if (payBankSelector) {
    payBankSelector.addEventListener('click', () => {
      showToast('Selected: Federal Bank •••• 1234 (Primary)');
      playSound('tap');
    });
  }

  // "Pay ₹500" Submit Click
  if (payScreenSubmitBtn) {
    payScreenSubmitBtn.addEventListener('click', () => {
      const amountVal = parseFloat(currentPayAmount) || 0;
      if (amountVal <= 0) {
        showToast('Please enter an amount to pay');
        return;
      }
      if (payAmountInput) {
        payAmountInput.value = amountVal;
      }
      resetPin();
      if (upiPinBackdrop) {
        upiPinBackdrop.classList.add('active');
      }
      playSound('tap');
    });
  }

  // Reward Bazaar Card
  const rewardBazaarCard = document.getElementById('rewardBazaarCard');
  if (rewardBazaarCard) {
    rewardBazaarCard.addEventListener('click', () => {
      showToast('Reward bazaar campaign has expired');
      playSound('tap');
    });
  }

  // Contacts tap: opens corresponding contact chat interface
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

  // Action buttons: Pay anyone opens the full screen payment interface
  const payAnyoneBtn = document.getElementById('payAnyoneBtn');
  if (payAnyoneBtn) {
    payAnyoneBtn.addEventListener('click', () => {
      openPayScreenView('Arjun S', 'A', '+91 98765 43210', '#00838f', 0);
    });
  }

  // Bills & Recharges quick items
  document.querySelectorAll('.bill-provider-item').forEach(item => {
    item.addEventListener('click', () => {
      const biller = item.getAttribute('data-biller');
      const amount = item.getAttribute('data-amount');
      openPaymentSheet(biller, biller.charAt(0), `${biller.toLowerCase().replace(/\s+/g, '')}@billdesk`, '#0b57d0', amount);
    });
  });

  // Bill categories
  document.querySelectorAll('.category-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category');
      showToast(`Selected category: ${cat}`);
      playSound('tap');
    });
  });

  // Manage bills button
  const manageBillsBtn = document.getElementById('manageBillsBtn');
  if (manageBillsBtn) {
    manageBillsBtn.addEventListener('click', () => {
      showToast('Opening Bills & Subscriptions Manager');
      playSound('tap');
    });
  }

  // Quick Chips
  const chipTapPay = document.getElementById('chipTapPay');
  if (chipTapPay) {
    chipTapPay.addEventListener('click', () => {
      showToast('Tap & Pay is active on this device');
      playSound('tap');
    });
  }

  const chipUpiLite = document.getElementById('chipUpiLite');
  if (chipUpiLite) {
    chipUpiLite.addEventListener('click', () => {
      showToast('UPI Lite Balance: ₹0.00 • Tap to add money');
      playSound('tap');
    });
  }

  const chipRewards = document.getElementById('chipRewards');
  if (chipRewards) {
    chipRewards.addEventListener('click', () => {
      openScratchCardModal();
    });
  }

  // ================= UPI PIN KEYPAD SIMULATION =================
  const upiPinBackdrop = document.getElementById('upiPinBackdrop');
  const pinDotsRow = document.getElementById('pinDotsRow');
  let currentPin = '';

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

  // When clicking "Pay ₹XXX"
  if (confirmPayBtn) {
    confirmPayBtn.addEventListener('click', () => {
      const amount = parseFloat(payAmountInput.value) || 0;
      if (amount <= 0) {
        showToast('Please enter a valid amount');
        return;
      }
      if (paymentModalBackdrop) paymentModalBackdrop.classList.remove('active');
      resetPin();
      if (upiPinBackdrop) {
        upiPinBackdrop.classList.add('active');
      }
      playSound('tap');
    });
  }

  // Digit Pad Inputs
  document.querySelectorAll('.key-digit').forEach(key => {
    key.addEventListener('click', () => {
      const num = key.getAttribute('data-num');
      if (num !== null && currentPin.length < 4) {
        currentPin += num;
        updatePinDisplay();
        playSound('pin');
        // NOTE: Auto-completion removed! Payment only transacts when user presses confirm (✔)
      }
    });
  });

  const pinBackspaceBtn = document.getElementById('pinBackspaceBtn');
  if (pinBackspaceBtn) {
    pinBackspaceBtn.addEventListener('click', () => {
      if (currentPin.length > 0) {
        currentPin = currentPin.slice(0, -1);
        updatePinDisplay();
        playSound('pin');
      }
    });
  }

  const pinSubmitBtn = document.getElementById('pinSubmitBtn');
  if (pinSubmitBtn) {
    pinSubmitBtn.addEventListener('click', () => {
      if (currentPin.length === 4) {
        completePayment();
      } else {
        showToast('Enter full 4-digit UPI PIN');
        playSound('tap');
      }
    });
  }

  // Support physical keyboard on desktop
  window.addEventListener('keydown', (e) => {
    if (upiPinBackdrop && upiPinBackdrop.classList.contains('active')) {
      if (e.key >= '0' && e.key <= '9') {
        if (currentPin.length < 4) {
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
        if (currentPin.length === 4) {
          completePayment();
        } else {
          showToast('Enter full 4-digit UPI PIN');
        }
      } else if (e.key === 'Escape') {
        upiPinBackdrop.classList.remove('active');
        playSound('tap');
      }
    }
  });

  // ================= VIEW 4: FULL-SCREEN PAYMENT SUCCESS =================
  const successScreenView = document.getElementById('successScreenView');
  const fullSuccessSubText = document.getElementById('fullSuccessSubText');
  const fullSuccessHeadline = document.getElementById('fullSuccessHeadline');
  let successDismissTimer = null;

  function dismissSuccessScreen() {
    clearTimeout(successDismissTimer);
    if (successScreenView) {
      successScreenView.classList.remove('active');
    }
    if (chatScrollContainer) {
      chatScrollContainer.scrollTop = chatScrollContainer.scrollHeight;
    }
  }

  if (successScreenView) {
    successScreenView.addEventListener('click', dismissSuccessScreen);
  }

  function completePayment() {
    if (upiPinBackdrop) upiPinBackdrop.classList.remove('active');
    if (payScreenView) payScreenView.classList.remove('active');
    if (paymentModalBackdrop) paymentModalBackdrop.classList.remove('active');

    const amountVal = parseFloat(currentPayAmount) || parseFloat(payAmountInput ? payAmountInput.value : 0) || 10;
    const formattedAmount = amountVal % 1 === 0 ? amountVal.toString() : amountVal.toFixed(2);

    // Update full success screen text matching user's screenshot
    if (fullSuccessSubText) {
      fullSuccessSubText.textContent = `₹${formattedAmount} paid to ${currentRecipient.name}`;
    }

    const startingBalance = 42850;
    const newBal = Math.max(0, startingBalance - amountVal);
    if (fullSuccessHeadline) {
      fullSuccessHeadline.textContent = `New Balance: ₹${newBal.toLocaleString('en-IN')}`;
    }

    // Play iconic Google Pay success sound
    playSound('success');

    // Show full-screen success screen
    if (successScreenView) {
      successScreenView.classList.add('active');
    }

    // Add to recipient's conversation history
    if (!contactHistoryData[currentRecipient.name]) {
      contactHistoryData[currentRecipient.name] = [];
    }
    const now = new Date();
    const hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const timeStr = `${hours % 12 || 12}:${mins} ${ampm}`;
    contactHistoryData[currentRecipient.name].push({
      type: 'payment',
      amount: amountVal,
      date: `Today, ${timeStr}`,
      time: timeStr
    });

    // If chat view is open, append the new bubble immediately
    if (chatMessagesStream) {
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble-payment right ripple-btn';
      bubble.setAttribute('data-amount', amountVal);
      bubble.setAttribute('data-date', `Today, ${timeStr}`);
      bubble.innerHTML = `
        <div class="bubble-header-label">Payment to <span class="bubble-recipient-name">${currentRecipient.name}</span></div>
        <div class="bubble-amount-text">₹${formattedAmount}</div>
        <div class="bubble-footer-row">
          <div class="bubble-status-left">
            <div class="status-check-circle">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="#ffffff">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <span class="bubble-status-text">Paid • Today, ${timeStr}</span>
          </div>
          <svg class="bubble-chevron" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </div>
      `;
      bubble.addEventListener('click', () => {
        openTxDetailView({
          amount: formattedAmount,
          name: currentRecipient.name,
          initial: currentRecipient.initial,
          color: currentRecipient.avatarBg || '#880e4f',
          date: 'Today',
          time: timeStr,
          upiId: String(Math.floor(100000000000 + Math.random() * 900000000000)),
          toVpa: currentRecipient.upi || '••••460a@sib',
          fromVpa: '••••0421@okicici on Google Pay',
          googleId: 'CICAgPj' + Math.random().toString(36).substring(2, 8).toUpperCase()
        });
      });
      chatMessagesStream.appendChild(bubble);
      if (chatScrollContainer) {
        setTimeout(() => {
          chatScrollContainer.scrollTop = chatScrollContainer.scrollHeight;
        }, 100);
      }
    }

    // Auto-dismiss full-screen success screen after 3.2s back to chat
    clearTimeout(successDismissTimer);
    successDismissTimer = setTimeout(() => {
      dismissSuccessScreen();
    }, 3200);
  }

  // ================= VIEW 5: TRANSACTION DETAILS / RECEIPT SCREEN =================
  const txDetailView = document.getElementById('txDetailView');
  const txDetailBackBtn = document.getElementById('txDetailBackBtn');
  const txDetailInfoBtn = document.getElementById('txDetailInfoBtn');
  const txDetailMenuBtn = document.getElementById('txDetailMenuBtn');
  const txDetailAvatar = document.getElementById('txDetailAvatar');
  const txDetailAvatarLetter = document.getElementById('txDetailAvatarLetter');
  const txDetailRecipientName = document.getElementById('txDetailRecipientName');
  const txDetailBigAmount = document.getElementById('txDetailBigAmount');
  const txDetailPayAgainBtn = document.getElementById('txDetailPayAgainBtn');
  const txDetailTimestamp = document.getElementById('txDetailTimestamp');
  const txDetailBankText = document.getElementById('txDetailBankText');
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
  const txHavingIssuesBtn = document.getElementById('txHavingIssuesBtn');
  const txShareBtn = document.getElementById('txShareBtn');
  const txSplitBtn = document.getElementById('txSplitBtn');

  function openTxDetailView(data) {
    if (!data) data = {};
    const amount = data.amount || 20;
    const name = data.name || currentRecipient.name || 'CAFETERIA';
    const initial = data.initial || (name ? name.charAt(0) : 'C');
    const color = data.color || currentRecipient.avatarBg || '#880e4f';
    const dateStr = data.date || '18 Sept 2026';
    const timeStr = data.time || '12:57 pm';
    const fullDateTime = `${dateStr}, ${timeStr}`;

    if (txDetailAvatar) txDetailAvatar.style.backgroundColor = color;
    if (txDetailAvatarLetter) txDetailAvatarLetter.textContent = initial;
    if (txDetailRecipientName) txDetailRecipientName.textContent = name;
    if (txDetailBigAmount) txDetailBigAmount.textContent = `₹${amount}`;
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
    if (txDetailToVpa) txDetailToVpa.textContent = data.toVpa || '••••460a@sib';
    if (txDetailFromVpa) txDetailFromVpa.textContent = data.fromVpa || '••••0421@okicici on Google Pay';
    if (txDetailGoogleId) txDetailGoogleId.textContent = data.googleId || 'CICAgPjUgO37NA';

    if (txDetailPayAgainBtn) {
      txDetailPayAgainBtn.onclick = () => {
        closeTxDetailView();
        openPayScreenView(name, initial, '+91 98765 43210', color, amount);
      };
    }

    if (txDetailView) {
      txDetailView.classList.add('active');
    }
    playSound('tap');
  }

  function closeTxDetailView() {
    if (txDetailView) {
      txDetailView.classList.remove('active');
    }
    playSound('tap');
  }

  if (txDetailBackBtn) {
    txDetailBackBtn.addEventListener('click', closeTxDetailView);
  }
  if (txDetailInfoBtn) {
    txDetailInfoBtn.addEventListener('click', () => {
      showToast('Google Pay Help & Support for this transaction');
      playSound('tap');
    });
  }
  if (txDetailMenuBtn) {
    txDetailMenuBtn.addEventListener('click', () => {
      showToast('Report an issue or dispute this charge');
      playSound('tap');
    });
  }
  if (txHavingIssuesBtn) {
    txHavingIssuesBtn.addEventListener('click', () => {
      showToast('Opening 24x7 UPI Support Desk');
      playSound('tap');
    });
  }
  if (txShareBtn) {
    txShareBtn.addEventListener('click', () => {
      showToast('Receipt details copied to clipboard');
      playSound('tap');
    });
  }
  if (txSplitBtn) {
    txSplitBtn.addEventListener('click', () => {
      showToast('Select contacts to split this bill');
      playSound('tap');
    });
  }

  // Also bind all existing static payment bubbles on the page
  document.querySelectorAll('.chat-bubble-payment').forEach(bubble => {
    bubble.addEventListener('click', () => {
      const amount = bubble.getAttribute('data-amount') || 60;
      const recipientName = bubble.querySelector('.bubble-recipient-name') ? bubble.querySelector('.bubble-recipient-name').textContent : 'CAFETERIA';
      openTxDetailView({
        amount: amount,
        name: recipientName,
        initial: recipientName.charAt(0),
        color: '#c2185b',
        date: '18 Sept 2026',
        time: '12:53 pm',
        upiId: '662729941462',
        toVpa: '••••460a@sib',
        fromVpa: '••••0421@okicici on Google Pay',
        googleId: 'CICAgPjUgO37NA'
      });
    });
  });

  // ================= BANK BALANCE =================
  const rowCheckBalance = document.getElementById('rowCheckBalance');
  const balanceModalBackdrop = document.getElementById('balanceModalBackdrop');
  const balanceCloseBtn = document.getElementById('balanceCloseBtn');
  const bankTransferBtn = document.getElementById('bankTransferBtn');

  if (rowCheckBalance) {
    rowCheckBalance.addEventListener('click', () => {
      if (balanceModalBackdrop) balanceModalBackdrop.classList.add('active');
      playSound('tap');
    });
  }
  if (bankTransferBtn) {
    bankTransferBtn.addEventListener('click', () => {
      showToast('Initiating Direct Bank Account Transfer');
      playSound('tap');
    });
  }
  if (balanceCloseBtn && balanceModalBackdrop) {
    balanceCloseBtn.addEventListener('click', () => {
      balanceModalBackdrop.classList.remove('active');
    });
  }

  // ================= QR SCANNER MODAL =================
  const scanQrBtn = document.getElementById('scanQrBtn');
  const scannerModalBackdrop = document.getElementById('scannerModalBackdrop');
  const closeScannerBtn = document.getElementById('closeScannerBtn');
  const scannerTorchBtn = document.getElementById('scannerTorchBtn');
  const scanGallerySimBtn = document.getElementById('scanGallerySimBtn');

  if (scanQrBtn && scannerModalBackdrop) {
    scanQrBtn.addEventListener('click', () => {
      scannerModalBackdrop.classList.add('active');
      playSound('tap');
    });
  }
  if (closeScannerBtn && scannerModalBackdrop) {
    closeScannerBtn.addEventListener('click', () => {
      scannerModalBackdrop.classList.remove('active');
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
  if (scanGallerySimBtn) {
    scanGallerySimBtn.addEventListener('click', () => {
      showToast('Simulating QR scan from photo...');
      setTimeout(() => {
        if (scannerModalBackdrop) scannerModalBackdrop.classList.remove('active');
        openPaymentSheet('Cafeteria Store', 'C', 'cafeteria.store@okaxis', '#c2185b', 180);
      }, 700);
    });
  }

  // ================= CIBIL SCORE MODAL =================
  const rowCibilScore = document.getElementById('rowCibilScore');
  const cibilModalBackdrop = document.getElementById('cibilModalBackdrop');
  const closeCibilBtn2 = document.getElementById('closeCibilBtn2');

  if (rowCibilScore && cibilModalBackdrop) {
    rowCibilScore.addEventListener('click', () => {
      cibilModalBackdrop.classList.add('active');
      playSound('tap');
    });
  }
  if (closeCibilBtn2 && cibilModalBackdrop) {
    closeCibilBtn2.addEventListener('click', () => {
      cibilModalBackdrop.classList.remove('active');
    });
  }

  // ================= VIEW 6: TRANSACTION HISTORY SCREEN =================
  const rowTxHistory = document.getElementById('rowTxHistory');
  const historyView = document.getElementById('historyView');
  const historyBackBtn = document.getElementById('historyBackBtn');
  const histSearchInput = document.getElementById('histSearchInput');
  const histMicBtn = document.getElementById('histMicBtn');
  const histMenuBtn = document.getElementById('histMenuBtn');
  const histPromoCard = document.getElementById('histPromoCard');
  const historyModalBackdrop = document.getElementById('historyModalBackdrop');

  // Open Full-screen Transaction History Screen when tapping "See transaction history"
  if (rowTxHistory && historyView) {
    rowTxHistory.addEventListener('click', () => {
      historyView.classList.add('active');
      playSound('tap');
    });
  }

  // Close Transaction History Screen
  if (historyBackBtn && historyView) {
    historyBackBtn.addEventListener('click', () => {
      historyView.classList.remove('active');
      playSound('tap');
    });
  }

  // Color mapping by recipient name
  const recipientColors = {
    'UPI Lite': '#ea580c',
    'Federal Bank ••••8299 to UPI Lite': '#ea580c',
    'Nithin Mathew': '#374151',
    'GO GRILL': '#4f46e5',
    'Cupcake Siblings': '#388e3c',
    'CAFETERIA': '#c2185b',
    'Alwin': '#d97706',
    'Adarshuv': '#4338ca'
  };

  // Wire each transaction item to open Transaction Details / Receipt Screen (View 5)
  document.querySelectorAll('.hist-tx-row').forEach(row => {
    row.addEventListener('click', () => {
      const recipient = row.getAttribute('data-recipient') || 'CAFETERIA';
      const amount = parseFloat(row.getAttribute('data-amount')) || 20;
      const isCredit = row.getAttribute('data-credit') === 'true';
      const date = row.getAttribute('data-date') || '27 September 2026';
      const time = row.getAttribute('data-time') || '11:42 am';
      const initial = recipient.charAt(0);
      const color = recipientColors[recipient] || '#374151';

      openTxDetailView({
        amount: amount,
        name: recipient,
        initial: initial,
        color: color,
        date: date,
        time: time,
        upiId: '428819204812',
        toVpa: `${recipient.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
        fromVpa: '••••8299@federal on Google Pay',
        googleId: 'CICAgPjUgO37NA'
      });
    });
  });

  // Live filter for transaction history
  if (histSearchInput) {
    histSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.hist-tx-row').forEach(row => {
        const title = (row.querySelector('.hist-tx-title')?.textContent || '').toLowerCase();
        const date = (row.querySelector('.hist-tx-date')?.textContent || '').toLowerCase();
        const amount = (row.querySelector('.hist-tx-amount')?.textContent || '').toLowerCase();
        if (!query || title.includes(query) || date.includes(query) || amount.includes(query)) {
          row.style.display = 'flex';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }

  // Voice search pill button
  if (histMicBtn) {
    histMicBtn.addEventListener('click', () => {
      showToast('Listening for transactions search...');
      playSound('tap');
    });
  }

  // 3-dots menu button
  if (histMenuBtn) {
    histMenuBtn.addEventListener('click', () => {
      showToast('Options: Export statement, Download PDF');
      playSound('tap');
    });
  }

  // Filter chips interaction
  document.querySelectorAll('.hist-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filterName = chip.getAttribute('data-filter');
      chip.classList.toggle('active-filter');
      showToast(`Filtered by ${filterName}`);
      playSound('tap');
    });
  });

  // Flex promo card in history list
  if (histPromoCard) {
    histPromoCard.addEventListener('click', () => {
      showToast('Opening Flex Credit Card (₹1,000 welcome rewards)');
      playSound('tap');
    });
  }

  // Also support old drawer items if clicked
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const nameEl = item.querySelector('.history-name');
      const amountEl = item.querySelector('.history-amount');
      const name = nameEl ? nameEl.textContent.trim() : 'CAFETERIA';
      let amount = 20;
      if (amountEl) {
        const match = amountEl.textContent.match(/[\d.]+/);
        if (match) amount = parseFloat(match[0]);
      }
      if (historyModalBackdrop) historyModalBackdrop.classList.remove('active');
      openTxDetailView({
        amount: amount,
        name: name,
        initial: name.charAt(0),
        color: name === 'CAFETERIA' ? '#c2185b' : '#00838f',
        date: '18 Sept 2026',
        time: '12:57 pm',
        upiId: '662729941462',
        toVpa: '••••460a@sib',
        fromVpa: '••••0421@okicici on Google Pay',
        googleId: 'CICAgPjUgO37NA'
      });
    });
  });

  // ================= SCRATCH CARD / REWARDS =================
  const rewardsTileBtn = document.getElementById('rewardsTileBtn');
  const offersTileBtn = document.getElementById('offersTileBtn');
  const referralsTileBtn = document.getElementById('referralsTileBtn');
  const scratchModalBackdrop = document.getElementById('scratchModalBackdrop');
  const scratchCanvas = document.getElementById('scratchCanvas');
  const claimRewardBtn = document.getElementById('claimRewardBtn');

  function openScratchCardModal() {
    if (scratchModalBackdrop) {
      scratchModalBackdrop.classList.add('active');
      initScratchCanvas();
      playSound('tap');
    }
  }

  if (rewardsTileBtn) rewardsTileBtn.addEventListener('click', openScratchCardModal);
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

    // Decorative GPay logo pattern on scratch card
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
      showToast('₹45 Cashback transferred to your bank account!');
      playSound('success');
    });
  }

  // Promo Banner "Apply now"
  const applyFlexBtn = document.getElementById('applyFlexBtn');
  if (applyFlexBtn) {
    applyFlexBtn.addEventListener('click', () => {
      showToast('Opening Flex Credit Card application (Zero-fee)');
      playSound('tap');
    });
  }

  // Manage your money cards
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

  // Top Search Trigger
  const searchTriggerBtn = document.getElementById('searchTriggerBtn');
  if (searchTriggerBtn) {
    searchTriggerBtn.addEventListener('click', () => {
      openPaymentSheet('Adithya', 'A', 'adithya.kumar@okicici', '#00838f');
    });
  }

  // PWA Service Worker Registration
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
