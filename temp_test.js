
        /********************************************************************
         * 1. HIGH-FIDELITY REALISTIC AUDIO ENGINE (Web Audio API)
         ********************************************************************/
        let audioCtx = null;
        let masterGain = null;
        let sfxGain = null;
        let ambientGain = null;

        function initAudio() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                masterGain = audioCtx.createGain();
                sfxGain = audioCtx.createGain();
                ambientGain = audioCtx.createGain();

                const mVol = (state.settings && state.settings.masterVol !== undefined) ? state.settings.masterVol : 0.8;
                const sVol = (state.settings && state.settings.sfxVol !== undefined) ? state.settings.sfxVol : 0.85;
                const aVol = (state.settings && state.settings.ambientVol !== undefined) ? state.settings.ambientVol : 0.5;
                const muted = state.settings && state.settings.muted;

                masterGain.gain.setValueAtTime(muted ? 0 : mVol, audioCtx.currentTime);
                sfxGain.gain.setValueAtTime(sVol, audioCtx.currentTime);
                ambientGain.gain.setValueAtTime(aVol, audioCtx.currentTime);

                sfxGain.connect(masterGain);
                ambientGain.connect(masterGain);
                masterGain.connect(audioCtx.destination);
            }
            if (audioCtx.state === 'suspended') audioCtx.resume();
        }

        /*
         * REALISTIC FELINE VOCAL TRACT SYNTHESIS
         * Types: 'trill' (mrrrp!), 'meow' (meeeooww~), 'kitten' (mew!), 'purr' (prrr-mrr), 'sigh' (sleepy exhale), 'hungry' (meo!)
         */
        function playRealisticMeow(type = 'trill', pitchMod = 1.0) {
            initAudio(); if (!audioCtx || (state.settings && state.settings.muted)) return;
            const now = audioCtx.currentTime;

            if (type === 'trill') {
                // "Mrrrp!" - Chirpy resonant cat greeting with realistic 22Hz throat trill
                const osc = audioCtx.createOscillator();
                const trillLFO = audioCtx.createOscillator();
                const trillGain = audioCtx.createGain();
                const filter = audioCtx.createBiquadFilter();
                const gain = audioCtx.createGain();

                osc.type = 'triangle';
                trillLFO.type = 'sine'; trillLFO.frequency.setValueAtTime(22, now);
                trillGain.gain.setValueAtTime(25, now);
                trillLFO.connect(trillGain);
                trillGain.connect(osc.frequency);

                const baseF = 460 * pitchMod;
                osc.frequency.setValueAtTime(baseF, now);
                osc.frequency.exponentialRampToValueAtTime(baseF * 1.35, now + 0.12);
                osc.frequency.exponentialRampToValueAtTime(baseF * 0.9, now + 0.28);

                filter.type = 'peaking'; filter.frequency.setValueAtTime(1400, now); filter.Q.setValueAtTime(3.5, now); filter.gain.setValueAtTime(9, now);

                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.24, now + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

                osc.connect(filter); filter.connect(gain); gain.connect(sfxGain);
                trillLFO.start(now); osc.start(now);
                trillLFO.stop(now + 0.33); osc.stop(now + 0.33);

            } else if (type === 'kitten') {
                // "Mew!" - High, sweet, delicate kitten chirp
                const osc = audioCtx.createOscillator();
                const filter = audioCtx.createBiquadFilter();
                const gain = audioCtx.createGain();

                osc.type = 'sine';
                const baseF = 820 * pitchMod;
                osc.frequency.setValueAtTime(baseF, now);
                osc.frequency.exponentialRampToValueAtTime(baseF * 1.25, now + 0.09);
                osc.frequency.exponentialRampToValueAtTime(baseF * 0.85, now + 0.22);

                filter.type = 'bandpass'; filter.frequency.setValueAtTime(1900, now); filter.Q.setValueAtTime(2.0, now);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

                osc.connect(filter); filter.connect(gain); gain.connect(sfxGain);
                osc.start(now); osc.stop(now + 0.25);

            } else if (type === 'sigh') {
                // Soft sleepy purr exhale
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(180 * pitchMod, now);
                osc.frequency.exponentialRampToValueAtTime(110 * pitchMod, now + 0.6);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
                osc.connect(gain); gain.connect(sfxGain);
                osc.start(now); osc.stop(now + 0.65);

            } else {
                // "Mee-ooww~" - Gentle realistic open cat meow
                const osc = audioCtx.createOscillator();
                const formantF1 = audioCtx.createBiquadFilter();
                const formantF2 = audioCtx.createBiquadFilter();
                const gain = audioCtx.createGain();

                osc.type = 'triangle';
                const baseF = 420 * pitchMod;
                osc.frequency.setValueAtTime(baseF * 0.85, now);
                osc.frequency.exponentialRampToValueAtTime(baseF * 1.35, now + 0.16);
                osc.frequency.exponentialRampToValueAtTime(baseF * 0.72, now + 0.52);

                // F1 (nasal M -> open EE -> round OW)
                formantF1.type = 'bandpass'; formantF1.Q.setValueAtTime(2.5, now);
                formantF1.frequency.setValueAtTime(450, now);
                formantF1.frequency.linearRampToValueAtTime(950, now + 0.18);
                formantF1.frequency.linearRampToValueAtTime(520, now + 0.52);

                // F2 (vocal throat resonance)
                formantF2.type = 'peaking'; formantF2.frequency.setValueAtTime(1600, now); formantF2.gain.setValueAtTime(6, now);

                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.22, now + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

                osc.connect(formantF1); formantF1.connect(formantF2); formantF2.connect(gain); gain.connect(sfxGain);
                osc.start(now); osc.stop(now + 0.56);
            }
        }

        // Backward compatible alias
        function playMeowSound(pitchMod = 1.0) {
            playRealisticMeow('trill', pitchMod);
        }

        function playPurrSound() {
            initAudio(); if (!audioCtx || (state.settings && state.settings.muted)) return;
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator(), lfo = audioCtx.createOscillator(), lfoGain = audioCtx.createGain(), mainGain = audioCtx.createGain();
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(58, now);
            lfo.type = 'sine'; lfo.frequency.setValueAtTime(24, now);
            lfoGain.gain.setValueAtTime(0.06, now);
            lfo.connect(lfoGain); lfoGain.connect(mainGain.gain);
            mainGain.gain.setValueAtTime(0.08, now);
            mainGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
            osc.connect(mainGain); mainGain.connect(sfxGain);
            lfo.start(now); osc.start(now);
            lfo.stop(now + 1.8); osc.stop(now + 1.8);
        }

        function playCoinSound() {
            initAudio(); if (!audioCtx || (state.settings && state.settings.muted)) return;
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1046.5, now);
            osc.frequency.setValueAtTime(1318.5, now + 0.08);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
            osc.connect(gain); gain.connect(sfxGain);
            osc.start(now); osc.stop(now + 0.32);
        }

        function playCrunchSound() {
            initAudio(); if (!audioCtx || (state.settings && state.settings.muted)) return;
            const now = audioCtx.currentTime;
            for (let i = 0; i < 4; i++) {
                const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(700 + Math.random() * 400, now + i * 0.07);
                gain.gain.setValueAtTime(0.08, now + i * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.05);
                osc.connect(gain); gain.connect(sfxGain);
                osc.start(now + i * 0.07); osc.stop(now + i * 0.07 + 0.05);
            }
        }

        function playSandSound() {
            initAudio(); if (!audioCtx || (state.settings && state.settings.muted)) return;
            const now = audioCtx.currentTime;
            const bufferSize = audioCtx.sampleRate * 0.3;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
            const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass'; filter.frequency.setValueAtTime(1200, now); filter.Q.setValueAtTime(1.5, now);
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            noise.connect(filter); filter.connect(gain); gain.connect(sfxGain);
            noise.start(now); noise.stop(now + 0.3);
        } else if (isDawnOrSunset) {
                scene.background.set(0xfb7185);
                street.skyMat.map = street.skySunset || street.skyDay;
                if (window.__amb) window.__amb.intensity = 0.55;
                if (window.__sun) {
                    window.__sun.intensity = 0.75;
                    window.__sun.color.setHex(0xfda4af);
                }
            } else {
                scene.background.set(0xfcefe3);
                street.skyMat.map = street.skyDay;
                if (window.__amb) window.__amb.intensity = 0.65;
                if (window.__sun) {
                    window.__sun.intensity = 0.85;
                    window.__sun.color.setHex(0xffedd5);
                }
            }

            // Street lamps active strictly between 18:00 and 06:00
            street.glow.forEach(item => {
                if (item.bulb) {
                    item.bulb.material.emissiveIntensity = realTimeData.streetLampsOn ? 2.8 : 0.05;
                } else if (item.material) {
                    item.material.emissiveIntensity = realTimeData.streetLampsOn ? 2.8 : 0.05;
                }
                if (item.light) {
                    item.light.intensity = realTimeData.streetLampsOn ? 1.6 : 0;
                }
            });

            street.skyMat.needsUpdate = true;
        }

        /********************************************************************
         * 3. USER LOGIN & CROSS-DEVICE MULTI-USER CO-PARENTING (LINA & QWAN)
         ********************************************************************/
        let currentUser = 'Qwan';

        function checkUserLogin() {
            const savedUser = localStorage.getItem('meowlator_logged_user');
            if (savedUser && (savedUser === 'Lina' || savedUser === 'Qwan')) {
                currentUser = savedUser;
                updateUserBadgeUI();
            } else {
                document.getElementById('login-modal').classList.remove('hidden');
            }
        }

        function selectUserLogin(name) {
            currentUser = name;
            localStorage.setItem('meowlator_logged_user', name);
            closeModal('login-modal');
            updateUserBadgeUI();
            showFloatingNotification(`Chào mừng ${name} đã trở về căn phòng mèo 💕!`, '#ec4899', '✨');
            syncWithCloud(true);
        }

        function promptUserLoginSwitch() {
            document.getElementById('login-modal').classList.remove('hidden');
        }

        function updateUserBadgeUI() {
            const badge = document.getElementById('current-user-name');
            if (badge) badge.textContent = `${currentUser} (${currentUser === 'Qwan' ? 'Vợ 👸' : 'Chồng 🤴'})`;
        }

        function openBottomCommandBar(actor) {
            const bar = document.getElementById('bottom-cat-command-bar');
            if (!bar) return;
            const emojiEl = document.getElementById('cmd-bar-cat-emoji');
            const titleEl = document.getElementById('cmd-bar-cat-title');
            if (emojiEl) emojiEl.textContent = actor.breed ? (actor.breed.pattern === 'calico' ? '🐱' : '🐈') : '🐱';
            if (titleEl) titleEl.textContent = `${actor.data.name}: Chọn hành động cho bé làm theo 💕`;
            bar.classList.remove('hidden');
        }

        function closeBottomCommandBar() {
            const bar = document.getElementById('bottom-cat-command-bar');
            if (bar) bar.classList.add('hidden');
        }

        function logActivity(text, icon = '📝') {
            if (!state.activityLogs) state.activityLogs = [];
            const role = currentUser === 'Qwan' ? 'Qwan (Vợ 👸)' : 'Lina (Chồng 🤴)';
            const d = new Date();
            const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
            state.activityLogs.unshift({
                id: Date.now() + Math.random(),
                time: timeStr,
                user: role,
                text: text,
                icon: icon
            });
            if (state.activityLogs.length > 50) state.activityLogs.pop();
            renderActivityLogs();
            pushStateToCloud();
        }

        function renderActivityLogs() {
            const list = document.getElementById('activity-logs-container');
            if (!list) return;
            if (!state.activityLogs || state.activityLogs.length === 0) {
                list.innerHTML = '<div class="text-xs font-bold text-slate-400 text-center py-6">Chưa có nhật ký nào gần đây. Hãy cùng chăm sóc các bé nhé!</div>';
                return;
            }
            list.innerHTML = state.activityLogs.map(log => `
                <div class="p-2.5 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-2 shadow-sm text-xs">
                    <div class="flex items-start gap-2 min-w-0">
                        <span class="text-base shrink-0">${log.icon || '📝'}</span>
                        <div class="min-w-0">
                            <div class="font-black text-slate-800 break-words">${log.text}</div>
                            <div class="text-[10px] font-bold text-pink-600">${log.user}</div>
                        </div>
                    </div>
                    <span class="text-[10px] font-black text-slate-400 shrink-0">${log.time}</span>
                </div>
            `).join('');
        }

        function updateLivePresenceUI() {
            const now = Date.now();
            state.presence = state.presence || {};
            state.presence[currentUser] = now;

            const qwanActive = (now - (state.presence.Qwan || 0)) < 35000;
            const linaActive = (now - (state.presence.Lina || 0)) < 35000;
            const count = (qwanActive ? 1 : 0) + (linaActive ? 1 : 0);

            const badgeText = document.getElementById('sync-status-text');
            const badgeDot = document.getElementById('sync-status-dot');

            if (count >= 2) {
                if (badgeText) badgeText.textContent = '🟢 Cả 2 đang online';
                if (badgeDot) badgeDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping';
            } else {
                if (badgeText) badgeText.textContent = '🟢 1 mình bạn đang online';
                if (badgeDot) badgeDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500';
            }
        }

        function openActivityLogModal() {
            renderActivityLogs();
            updateLivePresenceUI();
            document.getElementById('activity-log-modal').classList.remove('hidden');
        }

        function exportSaveFile() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute("href", dataStr);
            dlAnchor.setAttribute("download", `meowlator_room_save_${currentUser}_${Date.now()}.json`);
            document.body.appendChild(dlAnchor);
            dlAnchor.click();
            dlAnchor.remove();
            showFloatingNotification('💾 Đã tải file lưu (.json) về máy của bạn thành công!', '#10b981', '📁');
        }

        function importSaveFile(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const loadedState = JSON.parse(e.target.result);
                    if (loadedState && loadedState.cats) {
                        state = Object.assign(state, loadedState);
                        saveGameState();
                        rebuildRoomDecorAndCats();
                        updateUI();
                        pushStateToCloud();
                        closeModal('activity-log-modal');
                        showFloatingNotification('📂 Đã khôi phục căn phòng mèo từ file thành công!', '#10b981', '🎉');
                    } else {
                        alert('File lưu không đúng định dạng game!');
                    }
                } catch(err) {
                    alert('Lỗi đọc file: ' + err.message);
                }
            };
            reader.readAsText(file);
        }

        // REAL-TIME CLOUD ROOM SYNCHRONIZATION ACROSS 2 MACHINES (QWAN & LINA)
        const NTFY_SYNC_TOPIC = 'https://ntfy.sh/meowlator_room_qwan_lina_live_v1';
        let isSyncingNow = false;

        async function syncWithCloud(isInitial = false) {
            if (isSyncingNow) return;
            isSyncingNow = true;
            try {
                const getRes = await fetch(`${NTFY_SYNC_TOPIC}/json?poll=1`, { cache: 'no-store' });
                if (getRes.ok) {
                    const text = await getRes.text();
                    const lines = text.trim().split('\n');
                    for (let i = lines.length - 1; i >= 0; i--) {
                        try {
                            const entry = JSON.parse(lines[i]);
                            if (entry.event === 'message' && entry.message) {
                                const payload = JSON.parse(entry.message);
                                if (payload && payload.state && payload.state.lastSaved) {
                                    if (!state.lastSaved || payload.state.lastSaved > state.lastSaved) {
                                        state = Object.assign(state, payload.state);
                                        saveGameState();
                                        rebuildRoomDecorAndCats();
                                        updateUI();
                                        renderActivityLogs();
                                        updateLivePresenceUI();
                                        const otherPerson = currentUser === 'Qwan' ? 'Lina (Chồng 🤴)' : 'Qwan (Vợ 👸)';
                                        if (!isInitial) {
                                            showFloatingNotification(`✨ Đã nhận cập nhật mới từ ${payload.user || otherPerson}! 💕`, '#10b981', '🔄');
                                        }
                                        break;
                                    }
                                }
                            }
                        } catch(e) {}
                    }
                }
            } catch (e) {
                // fallback to local storage
            } finally {
                isSyncingNow = false;
            }
        }

        async function pushStateToCloud() {
            state.lastSaved = Date.now();
            state.lastUser = currentUser === 'Qwan' ? 'Qwan (Vợ 👸)' : 'Lina (Chồng 🤴)';
            state.presence = state.presence || {};
            state.presence[currentUser] = Date.now();
            saveGameState();
            try {
                const payload = JSON.stringify({
                    user: state.lastUser,
                    time: Date.now(),
                    state: state
                });
                await fetch(NTFY_SYNC_TOPIC, {
                    method: 'POST',
                    headers: { 'Title': 'MeowLator Sync', 'Tags': 'cat,heart' },
                    body: payload
                });
            } catch (e) {}
        }

        // Live Server-Sent Events Listener for Instant Real-Time Cross-Device Sync
        function startLiveCloudListener() {
            try {
                if (window.EventSource) {
                    const eventSource = new EventSource(`${NTFY_SYNC_TOPIC}/sse`);
                    eventSource.onmessage = function(event) {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.event === 'message' && data.message) {
                                const payload = JSON.parse(data.message);
                                if (payload && payload.state && payload.state.lastSaved) {
                                    if (!state.lastSaved || payload.state.lastSaved > state.lastSaved) {
                                        state = Object.assign(state, payload.state);
                                        saveGameState();
                                        rebuildRoomDecorAndCats();
                                        updateUI();
                                        renderActivityLogs();
                                        updateLivePresenceUI();
                                        const otherPerson = currentUser === 'Qwan' ? 'Lina (Chồng 🤴)' : 'Qwan (Vợ 👸)';
                                        showFloatingNotification(`✨ ${payload.user || otherPerson} vừa cập nhật phòng mèo! 💕`, '#10b981', '🔄');
                                    }
                                }
                            }
                        } catch(e) {}
                    };
                }
            } catch(e) {}
        }

        /********************************************************************
         * 4. GAME STATE & BALANCED REAL-TIME GROWTH (10 HOURS TO LVL 3)
         ********************************************************************/
        const CAT_GROWTH_LEVELS = {
            1: { name: 'Mèo Sơ Sinh', badge: '🍼 Cấp 1: Bé Con', minScale: 0.55, maxScale: 0.70, pitch: 1.35, desc: 'Bé xíu tí hon, cần bú sữa, ăn hạt mềm và được vuốt ve' },
            2: { name: 'Mèo Mới Lớn', badge: '🐾 Cấp 2: Mới Lớn', minScale: 0.75, maxScale: 0.90, pitch: 1.15, desc: 'Nhanh nhẹn tinh nghịch, thích leo tháp, chạy bánh xe và vờn laser' },
            3: { name: 'Mèo Trưởng Thành', badge: '👑 Cấp 3: Trưởng Thành', minScale: 0.95, maxScale: 1.10, pitch: 1.00, desc: 'Oai vệ mượt mà, mở khóa tính năng Ghép Đôi sinh mèo con' },
            4: { name: 'Đại Boss Hoàng Gia', badge: '🌟 Cấp 4: Đại Boss', minScale: 1.18, maxScale: 1.32, pitch: 0.90, desc: 'Múp míp núng nính, bá vương căn phòng, sinh lợi x2 xu mỗi ngày' }
        };

        function getCatScale(level, growthExp) {
            const lvl = CAT_GROWTH_LEVELS[level] || CAT_GROWTH_LEVELS[1];
            const norm = Math.min(100, Math.max(0, growthExp || 0)) / 100;
            return +(lvl.minScale + norm * (lvl.maxScale - lvl.minScale)).toFixed(2);
        }

        const CAT_BREEDS = [
            { id: 'ginger', name: 'Mèo Cam Mướp', price: 150, pattern: 'tabby', bodyColor: 0xf59e0b, stripeColor: 0xb45309, bellyColor: 0xfffbeb, earColor: 0xd97706, eyeColor: 0x10b981, noseColor: 0xf472b6, pitch: 1.0, earType: 'normal', fluffy: false, desc: 'Ham ăn, quấn chủ, vằn hổ chữ M trên trán' },
            { id: 'british', name: 'Mèo Anh Lông Ngắn', price: 220, pattern: 'solid', bodyColor: 0x718096, stripeColor: 0x4a5568, bellyColor: 0xcbd5e1, earColor: 0x475569, eyeColor: 0xf59e0b, noseColor: 0xbe185d, pitch: 0.92, earType: 'normal', fluffy: false, desc: 'Má phệ tròn xoe, lông xám xanh nhung mịn' },
            { id: 'calico', name: 'Mèo Tam Thể May Mắn', price: 260, pattern: 'calico', bodyColor: 0xfffdf9, stripeColor: 0xea580c, bellyColor: 0xffffff, earColor: 0x1e293b, eyeColor: 0x10b981, noseColor: 0xf472b6, pitch: 1.12, earType: 'normal', fluffy: false, desc: 'Đốm cam-đen-trắng tự nhiên, mang tài lộc cho vợ' },
            { id: 'siamese', name: 'Mèo Xiêm Hoàng Gia', price: 300, pattern: 'siamese', bodyColor: 0xf5ead6, stripeColor: 0x3e2723, bellyColor: 0xfffdf9, earColor: 0x3e2723, eyeColor: 0x0284c7, noseColor: 0x3e2723, pitch: 1.05, earType: 'normal', fluffy: false, desc: 'Mặt nạ nâu cacao, mắt xanh biển sâu thẳm' },
            { id: 'white', name: 'Mèo Ba Tư Trắng Tuyết', price: 280, pattern: 'solid', bodyColor: 0xf8fafc, stripeColor: 0xe2e8f0, bellyColor: 0xffffff, earColor: 0xfda4af, eyeColor: 0x38bdf8, noseColor: 0xf472b6, pitch: 1.18, earType: 'normal', fluffy: true, desc: 'Bờm lông cổ bông xù trắng muốt như mây' },
            { id: 'tuxedo', name: 'Mèo Đen Đi Tất Trắng', price: 250, pattern: 'tuxedo', bodyColor: 0x1e293b, stripeColor: 0x0f172a, bellyColor: 0xffffff, earColor: 0x0f172a, eyeColor: 0xfacc15, noseColor: 0xf472b6, pitch: 0.88, earType: 'normal', fluffy: false, desc: 'Lịch lãm mặc vest đen, yếm ngực & 4 bàn chân trắng' },
            { id: 'scottish', name: 'Mèo Anh Tai Cụp Vàng Bơ', price: 340, pattern: 'tabby', bodyColor: 0xfcd34d, stripeColor: 0xd97706, bellyColor: 0xfffbeb, earColor: 0xb45309, eyeColor: 0x059669, noseColor: 0xf472b6, pitch: 1.15, earType: 'folded', fluffy: true, desc: 'Đôi tai cụp siêu cưng, mặt bánh bao tròn trịa' },
            { id: 'pinky', name: 'Mèo Hồng Đào Tiên Tử', price: 450, pattern: 'tabby', bodyColor: 0xf9a8d4, stripeColor: 0xec4899, bellyColor: 0xfce7f3, earColor: 0xf472b6, eyeColor: 0x8b5cf6, noseColor: 0xdb2777, pitch: 1.25, earType: 'normal', fluffy: true, desc: 'Giống mèo hiếm siêu cấp đáng yêu dành riêng tặng Vợ' }
        ];

        const CAT_ACCESSORIES = [
            { id: 'bell', name: 'Chuông Vàng Đỏ' },
            { id: 'sprout', name: 'Mầm Cây Non 🌱' },
            { id: 'crown', name: 'Vương Miện Vàng 👑' },
            { id: 'bow', name: 'Nơ Hồng Xinh 🎀' },
            { id: 'beret', name: 'Mũ Nồi Họa Sĩ 🎨' }
        ];

        const DECOR_CATALOG = [
            { id: 'food_station', name: 'Máy Ăn & Uống 2-in-1 🥫💧', price: 100, type: 'station', score: 25, desc: 'Máy cấp hạt và bình nước tự động trắng-xám' },
            { id: 'litter_box', name: 'Chậu Cát Xám Viền Cao 🧹', price: 120, type: 'station', score: 22, desc: 'Chậu 2 màu xám-kem, có thành chắn bắn cát và lưới lọc' },
            { id: 'cat_tree', name: 'Cây Trèo Mèo 3 Tầng 🌳', price: 250, type: 'furniture', score: 22, desc: 'Tháp cào móng có đệm nằm để mèo leo nhảy từng tầng' },
            { id: 'cat_wheel', name: 'Bánh Xe Chạy Bộ Khổng Lồ 🏃', price: 200, type: 'toy', score: 24, desc: 'Bánh xe tập thể dục đường kính lớn cho mèo chạy bộ vòng vòng' },
            { id: 'cardboard_box', name: 'Hộp Carton Bí Mật 📦', price: 60, type: 'toy', score: 12, desc: 'Hộp giấy rỗng các bé mèo cực mê chui vào ngủ thò đầu ra' },
            { id: 'catnip_pot', name: 'Chậu Cỏ Mèo Catnip Tươi 🌿', price: 80, type: 'tree', score: 14, desc: 'Cỏ mèo thơm ngọt mát lành giúp mèo giải tỏa stress' },
            { id: 'yarn_ball', name: 'Bóng Len Lăn Tròn 🧶', price: 50, type: 'toy', score: 10, desc: 'Cuộn len ấm áp cho mèo vờn bắt vui nhộn trên sàn' },
            { id: 'donut_bed', name: 'Đệm Bánh Donut Êm Ái 🍩', price: 130, type: 'furniture', score: 15, desc: 'Đệm tròn rực rỡ êm như mây cho mèo lười cuộn tròn' },
            { id: 'scratching_post', name: 'Trụ Cào Móng Xương Rồng 🌵', price: 140, type: 'toy', score: 16, desc: 'Trụ cào móng xương rồng xanh mát đính hoa vàng' },
            { id: 'cat_tunnel', name: 'Ống Chui Vải Cầu Vồng 🎪', price: 130, type: 'toy', score: 14, desc: 'Ống chui mềm cho các bé mèo con tinh nghịch đuổi bắt' },
            { id: 'sakura_left', name: 'Cây Anh Đào Trắng 🌸', price: 180, type: 'tree', score: 15, desc: 'Cây anh đào bonsai trắng muốt phong cách Nhật Bản' },
            { id: 'sakura_right', name: 'Cây Anh Đào Hồng 🌸', price: 180, type: 'tree', score: 15, desc: 'Cây anh đào hồng phấn ngọt ngào lãng mạn' },
            { id: 'wood_arch', name: 'Cổng Vòm Gỗ Tự Nhiên 🪵', price: 210, type: 'furniture', score: 18, desc: 'Cổng vòm gỗ hoa cỏ thiên nhiên tô điểm phòng' },
            { id: 'cozy_bed', name: 'Ổ Nằm Lót Bông Hồng 🛏️', price: 120, type: 'furniture', score: 12, desc: 'Nệm bông tròn xoe êm ái cho mèo cuộn mình ngủ trưa' }
        ];

        const DEFAULT_DECOR_POSITIONS = {
            food_station: { x: 1.4, z: -1.0, rot: 0 },
            litter_box: { x: 3.3, z: -0.6, rot: -0.3 },
            cat_tree: { x: -3.2, z: -2.0, rot: 0 },
            cat_wheel: { x: -3.0, z: -0.4, rot: 0 },
            cardboard_box: { x: -0.8, z: 0.8, rot: 0.2 },
            catnip_pot: { x: 2.2, z: -1.8, rot: 0 },
            yarn_ball: { x: 0.5, z: 1.0, rot: 0 },
            donut_bed: { x: -2.2, z: -1.2, rot: 0 },
            scratching_post: { x: -1.7, z: -2.2, rot: 0 },
            cat_tunnel: { x: -2.1, z: 0.7, rot: 0.5 },
            sakura_left: { x: -4.3, z: -2.5, rot: 0 },
            sakura_right: { x: 4.3, z: -2.5, rot: 0 },
            wood_arch: { x: 0, z: -1.8, rot: 0 },
            cozy_bed: { x: 2.8, z: -2.0, rot: 0.2 }
        };

        const MAIN_QUESTS = [
            { title: 'Nuôi Boss Lớn Lên', desc: 'Nuôi dưỡng bé mèo đầu tiên đạt Cấp 2 (Mới Lớn)', check: s => ({ cur: (s.cats[0] && s.cats[0].level >= 2) ? 1 : 0, max: 1 }), reward: 150 },
            { title: 'Bữa Tiệc No Bụng', desc: 'Đổ thức ăn cho mèo măm măm 3 lần', check: s => ({ cur: s.stats.fedToday || 0, max: 3 }), reward: 120 },
            { title: 'Căn Phòng Sạch Sạch', desc: 'Dọn sạch cát vệ sinh thơm tho cho mèo', check: s => ({ cur: s.stats.cleanedToday || 0, max: 1 }), reward: 100 },
            { title: 'Sen Chu Đáo', desc: 'Chải lông thư giãn cho mèo 3 lần', check: s => ({ cur: s.stats.brushedToday || 0, max: 3 }), reward: 150 },
            { title: 'Mở Rộng Đàn Mèo', desc: 'Nhận nuôi thêm bé mèo thứ 2 từ Cửa Hàng', check: s => ({ cur: s.cats.length, max: 2 }), reward: 250 }
        ];

        // FRESH INITIAL STATE: 1 CAT, BASIC ESSENTIALS TO DECORATE STEP BY STEP
        let state = {
            coins: 1470,
            roomName: 'Phòng Mèo Của Qwan & Lina 💕',
            gameSpeed: 1,
            lampMode: 'on',
            nightMode: false,
            leftPanelOpen: false,
            rightPanelOpen: false,
            hunger: 70, // Ready to eat
            happiness: 85,
            cleanliness: 100,
            foodStock: 19,
            foodBowlPercent: 0,
            litterCleanliness: 100,
            lastGrowthCheck: Date.now(),
            lastPetTime: 0,
            lastBrushTime: 0,
            wallStyle: 'stripes',
            floorStyle: 'oak',
            ownedDecor: ['food_station', 'litter_box', 'cat_tree', 'cat_wheel', 'cardboard_box', 'catnip_pot'],
            activeDecor: ['food_station', 'litter_box', 'cat_tree', 'cat_wheel', 'cardboard_box', 'catnip_pot'],
            decorPositions: Object.assign({}, DEFAULT_DECOR_POSITIONS),
            mainQuestIdx: 0,
            stats: { fedToday: 0, cleanedToday: 0, brushedToday: 0, pettedToday: 1 },
            cats: [
                {
                    id: 'c1',
                    name: 'Miu Cam',
                    breedId: 'ginger',
                    hunger: 65, // Below 75% so player can feed right away!
                    happiness: 85,
                    love: 85,
                    level: 1, // Kitten
                    growthExp: 10,
                    scale: 0.58,
                    accessory: 'bell'
                }
            ]
        };

        function saveGameState() {
            localStorage.setItem('meowlator_wife_state_v7', JSON.stringify(state));
        }

        function loadGameState() {
            const saved = localStorage.getItem('meowlator_wife_state_v7');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    state = Object.assign(state, parsed);
                    if (!state.decorPositions) state.decorPositions = Object.assign({}, DEFAULT_DECOR_POSITIONS);
                    if (!state.cats || state.cats.length === 0) {
                        state.cats = [{ id: 'c1', name: 'Miu Cam', breedId: 'ginger', hunger: 65, happiness: 85, love: 85, level: 1, growthExp: 10, scale: 0.58, accessory: 'bell' }];
                    }
                } catch (e) {
                    console.error('Save state parse error', e);
                }
            }
        }

        let isHUDHidden = false;
        function toggleHUDVisibility() {
            isHUDHidden = !isHUDHidden;
            const header = document.getElementById('main-header');
            const footer = document.getElementById('main-footer');
            const middle = document.getElementById('middle-area');
            const showBtn = document.getElementById('hud-show-btn');

            if (isHUDHidden) {
                header.classList.remove('hud-visible'); header.classList.add('hud-hidden');
                footer.classList.remove('hud-visible'); footer.classList.add('hud-hidden');
                middle.classList.remove('hud-visible'); middle.classList.add('hud-hidden');
                showBtn.classList.remove('hidden');
            } else {
                header.classList.remove('hud-hidden'); header.classList.add('hud-visible');
                footer.classList.remove('hud-hidden'); footer.classList.add('hud-visible');
                middle.classList.remove('hud-hidden'); middle.classList.add('hud-visible');
                showBtn.classList.add('hidden');
            }
        }

        function toggleSidePanel(side) {
            if (side === 'left') state.leftPanelOpen = !state.leftPanelOpen;
            else if (side === 'right') state.rightPanelOpen = !state.rightPanelOpen;
            applySidePanelStates();
            saveGameState();
        }

        function applySidePanelStates() {
            const leftCard = document.getElementById('left-panel-card');
            const leftTab = document.getElementById('left-reopen-tab');
            const rightCard = document.getElementById('right-panel-card');
            const rightTab = document.getElementById('right-reopen-tab');

            if (leftCard && leftTab) {
                if (state.leftPanelOpen) { leftCard.classList.remove('left-collapsed'); leftTab.classList.add('hidden'); }
                else { leftCard.classList.add('left-collapsed'); leftTab.classList.remove('hidden'); }
            }
            if (rightCard && rightTab) {
                if (state.rightPanelOpen) { rightCard.classList.remove('right-collapsed'); rightTab.classList.add('hidden'); }
                else { rightCard.classList.add('right-collapsed'); rightTab.classList.remove('hidden'); }
            }
        }

        function showFloatingNotification(text, color = '#10b981', icon = '💖') {
            const container = document.getElementById('floating-fx-layer');
            if (!container) return;
            const bubble = document.createElement('div');
            bubble.className = 'cozy-pill px-4 py-1.5 text-xs sm:text-sm font-black flex items-center gap-2 shadow-2xl floating-bubble border-2 border-slate-900';
            bubble.style.backgroundColor = '#fffbf5';
            bubble.style.color = color;
            bubble.innerHTML = `<span class="text-base sm:text-lg">${icon}</span><span>${text}</span>`;
            container.appendChild(bubble);
            setTimeout(() => { if (bubble.parentNode) bubble.parentNode.removeChild(bubble); }, 2500);
        }

        /********************************************************************
         * 5. THREE.JS 3D ROOM SCENE & LIGHTING (WITH LINA'S CALLIGRAPHY RUG)
         ********************************************************************/
        let scene, camera, renderer;
        let roomGroup, catActors = [];
        let decorMeshes = {};
        let decorSelectionRing = null;
        let selectedDecorId = 'food_station';
        let isDecorEditMode = false;
        let isDraggingDecor = false;
        let isDraggingCat = false;
        let draggedCatActor = null;
        let dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 2.6);

        let foodBowlKibbleMesh = null;
        let litterBoxDirtGroup = null;
        let catWheelDrum = null;
        let streetVehicles = [];

        let laserActive = false;
        let laserTarget3D = new THREE.Vector3(0, 0, 0);
        let raycaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2();
        let selectedCatId = 'c1';

        const BOX_W = 10, BOX_H = 5.2, BOX_D = 6.5;
        const FLOOR_Y = -2.6;

        function fitCamera() {
            const aspect = window.innerWidth / window.innerHeight;
            camera.aspect = aspect;

            const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
            const needHalfW = aspect < 1.0 ? 2.6 : 4.0;
            const dist = Math.min(16, Math.max(5.5, needHalfW / (halfV * aspect)));

            if (aspect < 1.0) {
                camera.position.set(0, 2.2, 1.0 + dist);
                camera.lookAt(0, -1.8, 0.1);
            } else {
                camera.position.set(0, 2.0, 1.2 + dist);
                camera.lookAt(0, -1.75, 0.2);
            }
            camera.updateProjectionMatrix();
        }

        function initThreeScene() {
            const container = document.getElementById('canvas-container');
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xfcefe3);

            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            fitCamera();

            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.outputEncoding = THREE.sRGBEncoding;
            container.appendChild(renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.65);
            scene.add(ambientLight);

            const sunLight = new THREE.DirectionalLight(0xffedd5, 0.85);
            sunLight.position.set(5, 8, 4);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 1024;
            sunLight.shadow.mapSize.height = 1024;
            sunLight.shadow.bias = -0.001;
            scene.add(sunLight);
            window.__amb = ambientLight; window.__sun = sunLight;

            roomGroup = new THREE.Group();
            scene.add(roomGroup);

            const ringGeo = new THREE.RingGeometry(0.5, 0.62, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
            decorSelectionRing = new THREE.Mesh(ringGeo, ringMat);
            decorSelectionRing.rotation.x = -Math.PI / 2;
            decorSelectionRing.position.y = FLOOR_Y + 0.015;
            decorSelectionRing.visible = false;
            roomGroup.add(decorSelectionRing);

            buildRoomInterior();
            rebuildRoomDecorAndCats();

            window.addEventListener('resize', onWindowResize);
            window.addEventListener('orientationchange', onWindowResize);
            window.addEventListener('pointerdown', onPointerDown);
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        }

        const street = { cars: [], clouds: [], skyMat: null, skyDay: null, skySunset: null, skyNight: null, glow: [] };

        function canvasTex(w, h, draw, repeat) {
            const c = document.createElement('canvas'); c.width = w; c.height = h;
            draw(c.getContext('2d'), w, h);
            const t = new THREE.CanvasTexture(c);
            t.encoding = THREE.sRGBEncoding;
            if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
            return t;
        }

        function paintStreet(type) {
            return canvasTex(2048, 1024, (g, W, H) => {
                const sky = g.createLinearGradient(0, 0, 0, H * 0.62);
                if (type === 'night') {
                    sky.addColorStop(0, '#0b1230'); sky.addColorStop(1, '#3d4a82');
                } else if (type === 'sunset') {
                    sky.addColorStop(0, '#701a75'); sky.addColorStop(0.5, '#f43f5e'); sky.addColorStop(1, '#fed7aa');
                } else {
                    sky.addColorStop(0, '#6fbdf0'); sky.addColorStop(0.55, '#bfe3f7'); sky.addColorStop(1, '#fde7cf');
                }
                g.fillStyle = sky; g.fillRect(0, 0, W, H);

                if (type === 'night') {
                    g.fillStyle = '#fff';
                    for (let i = 0; i < 160; i++) {
                        g.globalAlpha = 0.4 + Math.random() * 0.6;
                        g.fillRect(Math.random() * W, Math.random() * H * 0.45, 2, 2);
                    }
                    g.globalAlpha = 1; g.fillStyle = '#fff6d6'; g.beginPath(); g.arc(W * 0.78, H * 0.26, 46, 0, 7); g.fill();
                } else if (type === 'sunset') {
                    g.fillStyle = 'rgba(255,237,160,0.95)'; g.beginPath(); g.arc(W * 0.4, H * 0.42, 54, 0, 7); g.fill();
                } else {
                    g.fillStyle = 'rgba(255,244,200,0.9)'; g.beginPath(); g.arc(W * 0.2, H * 0.27, 52, 0, 7); g.fill();
                }

                const base = H * 0.62;
                g.fillStyle = (type === 'night') ? '#232a52' : ((type === 'sunset') ? '#4c1d95' : '#b4c6e6');
                for (let x = 0; x < W; x += 70) g.fillRect(x, base - 90 - Math.random() * 130, 62, 400);

                const pal = (type === 'night') ? ['#4a4468', '#3f4f6e', '#5a4a62'] : ['#f6c6d0', '#fde2a8', '#bfe0d2', '#c9d6f5'];
                let x = -20, i = 0;
                while (x < W) {
                    const w = 150 + Math.random() * 110, h = 190 + Math.random() * 230;
                    g.fillStyle = pal[i++ % pal.length]; g.fillRect(x, base - h, w, h);
                    g.fillStyle = (type === 'night') ? '#2a2f55' : '#f4a7b9'; g.fillRect(x - 4, base - h - 12, w + 8, 14);
                    for (let wy = base - h + 26; wy < base - 40; wy += 46) {
                        for (let wx = x + 16; wx < x + w - 28; wx += 40) {
                            g.fillStyle = (type === 'night') ? (Math.random() < 0.55 ? '#ffd978' : '#273056') : '#9fd0ec'; g.fillRect(wx, wy, 24, 30);
                        }
                    }
                    x += w + 8;
                }
                g.fillStyle = (type === 'night') ? '#6b6674' : '#e9e1d5'; g.fillRect(0, base, W, H * 0.07);
                g.fillStyle = (type === 'night') ? '#262a3a' : '#6b7280'; g.fillRect(0, base + H * 0.07, W, H * 0.2);
                g.fillStyle = '#d8d2a8'; for (let lx = 20; lx < W; lx += 150) g.fillRect(lx, base + H * 0.165, 80, 8);
                g.fillStyle = (type === 'night') ? '#1a1d2b' : '#d6cdbf'; g.fillRect(0, base + H * 0.27, W, H);
            });
        }

        function sc(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
        function catMat(hex, rough) { return new THREE.MeshStandardMaterial({ color: sc(hex), roughness: rough === undefined ? 0.85 : rough }); }
        function catBasic(hex, extra) { return new THREE.MeshBasicMaterial(Object.assign({ color: sc(hex) }, extra || {})); }
        function addMesh(parent, geo, mat, x, y, z, sx, sy, sz) {
            const m = new THREE.Mesh(geo, mat);
            m.position.set(x || 0, y || 0, z || 0);
            if (sx !== undefined) m.scale.set(sx, sy, sz);
            parent.add(m);
            return m;
        }

        let floorMeshRef = null;
        let wallMeshesRef = [];

        function buildRoomInterior() {
            const shell = new THREE.Group();
            const F = FLOOR_Y, HW = BOX_W / 2, HD = BOX_D / 2;
            const add = (m, x, y, z, rx, ry) => { m.position.set(x, y, z); if (rx) m.rotation.x = rx; if (ry) m.rotation.y = ry; shell.add(m); return m; };
            const box = (w, h, d, hex, rough) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), catMat(hex, rough === undefined ? 0.7 : rough));

            // Wood plank floor
            const floorTex = canvasTex(512, 512, (g, W, H) => {
                for (let r = 0; r < 8; r++) {
                    const l = 62 + Math.random() * 8; g.fillStyle = `hsl(32,${48 + Math.random() * 8}%,${l}%)`; g.fillRect(0, r * 64, W, 64);
                    g.fillStyle = 'rgba(90,50,20,0.35)'; g.fillRect(0, r * 64, W, 3);
                    const off = Math.random() * W; g.fillRect(off, r * 64, 3, 64);
                }
            }, true);
            floorTex.repeat.set(BOX_W / 3.2, BOX_D / 3.2);
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(BOX_W, BOX_D), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55 }));
            floor.receiveShadow = true; floor.userData.isFloor = true;
            add(floor, 0, F, 0, -Math.PI / 2);
            floorMeshRef = floor;

            // RUG WITH BEAUTIFUL CALLIGRAPHY NAME: "LINA 💕"
            const rugTex = canvasTex(1024, 512, (ctx, W, H) => {
                // Soft gradient velvet oval base
                ctx.fillStyle = '#fce7f3'; // pastel rose
                ctx.beginPath(); ctx.ellipse(W / 2, H / 2, W * 0.48, H * 0.48, 0, 0, Math.PI * 2); ctx.fill();

                // Inner cream ring
                ctx.fillStyle = '#fffdfa';
                ctx.beginPath(); ctx.ellipse(W / 2, H / 2, W * 0.43, H * 0.43, 0, 0, Math.PI * 2); ctx.fill();

                // Delicate dotted lace border
                ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 6; ctx.setLineDash([12, 14]);
                ctx.beginPath(); ctx.ellipse(W / 2, H / 2, W * 0.455, H * 0.455, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);

                // CALLIGRAPHY NAME: "Lina 💕"
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = '#db2777'; // deep romantic rose
                ctx.shadowColor = 'rgba(219, 39, 119, 0.25)'; ctx.shadowBlur = 12;
                ctx.font = 'bold italic 110px "Dancing Script", "Playfair Display", "Caveat", cursive, sans-serif';
                ctx.fillText('Lina 💕', W / 2, H / 2 - 8);

                // Small decorative hearts and cat paws
                ctx.font = '36px sans-serif';
                ctx.fillText('🐾', W / 2 - 190, H / 2);
                ctx.fillText('🐾', W / 2 + 190, H / 2);
            });
            const rug = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.7), new THREE.MeshStandardMaterial({ map: rugTex, transparent: true, roughness: 0.9 }));
            rug.rotation.x = -Math.PI / 2;
            rug.receiveShadow = true;
            add(rug, 0, F + 0.015, 0.85);

            // Wallpaper texture
            const wallTex = canvasTex(256, 512, (g, W, H) => {
                g.fillStyle = '#fff4e2'; g.fillRect(0, 0, W, H);
                g.fillStyle = 'rgba(244,166,184,0.16)'; for (let x = 0; x < W; x += 64) g.fillRect(x, 0, 24, H * 0.68);
                g.fillStyle = '#f6dcc6'; g.fillRect(0, H * 0.68, W, H);
                g.strokeStyle = 'rgba(150,100,70,0.35)'; g.lineWidth = 3; for (let x = 10; x < W; x += 128) g.strokeRect(x, H * 0.72, 108, H * 0.22);
                g.fillStyle = '#fffaf0'; g.fillRect(0, H * 0.675, W, 8);
            }, true);
            const wallPlane = (w, h, u0, v0) => {
                const t = wallTex.clone(); t.needsUpdate = true; t.repeat.set(w / 2.5, h / BOX_H); t.offset.set(u0 / 2.5, v0 / BOX_H);
                const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 })); m.receiveShadow = true;
                wallMeshesRef.push(m);
                return m;
            };

            const WX = 2.4, WB = 1.3, WT = 4.4, zb = -HD;
            add(wallPlane(HW - WX, BOX_H, 0, 0), -(HW + WX) / 2, F + BOX_H / 2, zb);
            add(wallPlane(HW - WX, BOX_H, HW + WX, 0), (HW + WX) / 2, F + BOX_H / 2, zb);
            add(wallPlane(WX * 2, WB, HW - WX, 0), 0, F + WB / 2, zb);
            add(wallPlane(WX * 2, BOX_H - WT, HW - WX, WT), 0, F + (WT + BOX_H) / 2, zb);
            add(wallPlane(BOX_D, BOX_H, 0, 0), -HW, F + BOX_H / 2, 0, 0, Math.PI / 2);
            add(wallPlane(BOX_D, BOX_H, 0, 0), HW, F + BOX_H / 2, 0, 0, -Math.PI / 2);

            // Sky backdrop
            const sky = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), new THREE.MeshBasicMaterial({ map: paintStreet('day') }));
            street.skyDay = sky.material.map;
            street.skySunset = paintStreet('sunset');
            street.skyNight = paintStreet('night');
            street.skyMat = sky.material;
            add(sky, 0, -1.4, -13);

            // 3D STREET LAMPS OUTSIDE (LIT FROM 18H TO 6H)
            const makeStreetLamp = (x, z) => {
                const lampGroup = new THREE.Group();
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.5, 8), catMat(0x374151)); pole.position.y = 1.25; lampGroup.add(pole);
                const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), catMat(0x374151)); arm.rotation.z = Math.PI / 3; arm.position.set(0.15, 2.45, 0); lampGroup.add(arm);
                const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffd966, emissiveIntensity: 0.1 }));
                bulb.position.set(0.3, 2.45, 0); lampGroup.add(bulb);
                const light = new THREE.PointLight(0xffd57e, 0, 6, 2);
                light.position.set(0.3, 2.3, 0);
                lampGroup.add(light);
                lampGroup.position.set(x, -1.8, z);
                shell.add(lampGroup);
                street.glow.push({ bulb, light });
            };
            makeStreetLamp(-2.5, -4.5);
            makeStreetLamp(2.5, -4.5);

            // 3D CARS & MOTORBIKES (SEPARATE LANES & ANTI-COLLISION)
            buildStreetTraffic(shell);

            // Window frame & curtains
            const wood = 0xd9b48a, cy = F + (WB + WT) / 2, ch = WT - WB, fz = zb + 0.12;
            add(box(WX * 2 + 0.3, 0.14, 0.2, wood), 0, F + WT + 0.07, fz);
            add(box(0.14, ch, 0.2, wood), -WX - 0.07, cy, fz); add(box(0.14, ch, 0.2, wood), WX + 0.07, cy, fz);
            add(box(WX * 2 + 0.7, 0.1, 0.5, 0xf2dcc0), 0, F + WB - 0.05, zb + 0.25);
            add(box(0.08, ch, 0.08, wood), 0, cy, fz); add(box(WX * 2, 0.08, 0.08, wood), 0, cy + 0.2, fz);
            const glass = new THREE.Mesh(new THREE.PlaneGeometry(WX * 2, ch), new THREE.MeshBasicMaterial({ color: 0xdff1ff, transparent: true, opacity: 0.1, depthWrite: false }));
            add(glass, 0, cy, zb + 0.1);
            add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 6.4, 10), catMat(0xb08968)), 0, F + WT + 0.45, zb + 0.35, 0).rotation.z = Math.PI / 2;
            [-1, 1].forEach(s => {
                for (let k = 0; k < 3; k++) {
                    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 3.5, 12), catMat(k % 2 ? 0xf7a8bf : 0xfbc3d2, 0.9));
                    c.castShadow = true; add(c, s * (2.7 + k * 0.2), F + 2.85, zb + 0.4);
                }
            });

            roomGroup.add(shell);
        }

        // MOTORBIKES & CARS WITH COLLISION PREVENTION IN 2 DISTINCT LANES
        function buildStreetTraffic(parent) {
            streetVehicles = [];

            // 1. CAR BUILDER
            const carMk = (hex) => {
                const g = new THREE.Group();
                const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.36, 0.68), catMat(hex, 0.4)); body.position.y = 0.3; g.add(body);
                const cab = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.62), catMat(0xe6f2fb, 0.2)); cab.position.set(-0.05, 0.62, 0); g.add(cab);
                [[-0.45, 0.33], [0.45, 0.33], [-0.45, -0.33], [0.45, -0.33]].forEach(([x, z]) => {
                    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12), catMat(0x1f2937));
                    w.rotation.x = Math.PI / 2; w.position.set(x, 0.14, z); g.add(w);
                });
                return g;
            };

            // 2. STYLISH VIETNAMESE SCOOTER BUILDER (RETRO VESPA STYLE WITH RIDER)
            const bikeMk = (hex) => {
                const g = new THREE.Group();
                const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });
                const tireMat = catMat(0x1e293b, 0.9);
                const rimMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.7, roughness: 0.3 });
                const bodyMat = catMat(hex, 0.4);
                const darkBody = catMat(0x0f172a, 0.8);
                const leatherSeat = catMat(0x78350f, 0.7);
                const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffedd5, emissiveIntensity: 2.2 });
                const taillightMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.8 });

                // Wheels (Front & Rear)
                const makeWheel = (x, z) => {
                    const wg = new THREE.Group();
                    wg.position.set(x, 0.16, z);
                    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 12, 24), tireMat);
                    tire.rotation.y = Math.PI / 2; wg.add(tire);
                    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), rimMat);
                    rim.rotation.z = Math.PI / 2; wg.add(rim);
                    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.07, 12), chromeMat);
                    hub.rotation.z = Math.PI / 2; wg.add(hub);
                    return wg;
                };
                g.add(makeWheel(0.55, 0));
                g.add(makeWheel(-0.55, 0));

                // Front fork & curved fender
                const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.38, 8), chromeMat);
                fork.position.set(0.48, 0.32, 0); fork.rotation.z = -0.3; g.add(fork);

                const frontFender = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), bodyMat);
                frontFender.position.set(0.55, 0.19, 0); frontFender.rotation.x = Math.PI; g.add(frontFender);

                // Front Curved Apron (Yếm xe)
                const apron = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.36), bodyMat);
                apron.position.set(0.38, 0.45, 0); apron.rotation.z = -0.28; g.add(apron);

                const grill = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.08), chromeMat);
                grill.position.set(0.44, 0.46, 0); grill.rotation.z = -0.28; g.add(grill);

                // Retro Round Headlight
                const headHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.1, 16), chromeMat);
                headHousing.rotation.z = Math.PI / 2; headHousing.position.set(0.45, 0.72, 0); g.add(headHousing);
                const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 12), headlightMat);
                bulb.position.set(0.5, 0.72, 0); g.add(bulb);

                // Handlebars with Levers & Round Mirrors
                const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 10), chromeMat);
                handlebar.rotation.x = Math.PI / 2; handlebar.position.set(0.38, 0.72, 0); g.add(handlebar);
                [-0.22, 0.22].forEach(s => {
                    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.07, 10), darkBody);
                    grip.rotation.x = Math.PI / 2; grip.position.set(0.38, 0.72, s); g.add(grip);
                    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6), chromeMat);
                    stalk.position.set(0.38, 0.8, s * 0.9); stalk.rotation.z = 0.2; g.add(stalk);
                    const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), chromeMat);
                    mirror.rotation.y = s > 0 ? 0.3 : -0.3; mirror.position.set(0.39, 0.86, s * 0.9); g.add(mirror);
                });

                // Floorboard
                const floor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.32), darkBody);
                floor.position.set(0.12, 0.2, 0); g.add(floor);

                // Sleek Curved Rear Body Shell
                const rearBody = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 14), bodyMat);
                rearBody.scale.set(1.4, 0.75, 0.8); rearBody.position.set(-0.25, 0.38, 0); g.add(rearBody);

                // Contoured Vintage Leather Saddle Seat
                const seat = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.26), leatherSeat);
                seat.position.set(-0.16, 0.54, 0); seat.rotation.z = -0.05; g.add(seat);

                // Chrome Grab Rail at back
                const grabRail = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 8, 16, Math.PI), chromeMat);
                grabRail.rotation.y = Math.PI / 2; grabRail.position.set(-0.48, 0.56, 0); g.add(grabRail);

                // Taillight
                const tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.1), taillightMat);
                tail.position.set(-0.62, 0.44, 0); g.add(tail);

                // Chrome Exhaust Pipe
                const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.45, 10), chromeMat);
                exhaust.rotation.z = Math.PI / 2 - 0.15; exhaust.position.set(-0.28, 0.16, 0.18); g.add(exhaust);

                // RIDER: Stylish rider seated with helmet & sunglasses/visor
                const riderGroup = new THREE.Group();
                const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.26), catMat(0x0284c7, 0.7));
                jacket.position.set(0.02, 0.72, 0); jacket.rotation.z = -0.15; riderGroup.add(jacket);

                [-0.14, 0.14].forEach(s => {
                    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.035, 0.34, 8), catMat(0x0284c7, 0.7));
                    arm.position.set(0.2, 0.68, s); arm.rotation.z = -Math.PI / 3; arm.rotation.x = s * 0.1;
                    riderGroup.add(arm);
                });

                [-0.12, 0.12].forEach(s => {
                    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.042, 0.32, 8), catMat(0x1e293b));
                    thigh.position.set(0.12, 0.46, s); thigh.rotation.z = -0.55; riderGroup.add(thigh);
                    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.038, 0.28, 8), catMat(0x1e293b));
                    calf.position.set(0.22, 0.26, s); riderGroup.add(calf);
                });

                const headGroup = new THREE.Group();
                headGroup.position.set(0.06, 1.0, 0);
                addMesh(headGroup, new THREE.SphereGeometry(0.1, 14, 12), catMat(0xffdfba, 0.6), 0, 0, 0);
                const helmet = addMesh(headGroup, new THREE.SphereGeometry(0.13, 18, 16), catMat(0xf43f5e, 0.35), -0.01, 0.02, 0);
                const visor = new THREE.Mesh(new THREE.SphereGeometry(0.132, 14, 12, 0, Math.PI, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 }));
                visor.rotation.z = -Math.PI / 2; visor.position.set(0.03, 0.02, 0); headGroup.add(visor);
                riderGroup.add(headGroup);

                g.add(riderGroup);
                return g;
            };

            // LANE 1 (Near Lane: Z = -4.8, Motorbikes & Mini Car, Speed = 1.0, Direction = 1)
            const lane1Data = [
                { type: 'bike', col: 0xef4444, x: -6, sp: 1.1 },
                { type: 'bike', col: 0x10b981, x: -2.5, sp: 1.1 },
                { type: 'car',  col: 0xfacc15, x: 2.0, sp: 1.1 }
            ];
            lane1Data.forEach(d => {
                const v = d.type === 'bike' ? bikeMk(d.col) : carMk(d.col);
                v.position.set(d.x, -1.8, -4.8);
                v.userData = { sp: d.sp, lane: 1, minX: -7.5, maxX: 7.5 };
                parent.add(v);
                streetVehicles.push(v);
            });

            // LANE 2 (Far Lane: Z = -5.8, Cars, Speed = -0.85, Direction = -1)
            const lane2Data = [
                { type: 'car', col: 0x3b82f6, x: -4, sp: -0.9 },
                { type: 'car', col: 0xf472b6, x: 1.5, sp: -0.9 }
            ];
            lane2Data.forEach(d => {
                const v = carMk(d.col);
                v.position.set(d.x, -1.8, -5.8);
                v.rotation.y = Math.PI; // Heading opposite direction
                v.userData = { sp: d.sp, lane: 2, minX: -7.5, maxX: 7.5 };
                parent.add(v);
                streetVehicles.push(v);
            });
        }

        function animateStreetTraffic(dt) {
            // Move vehicles without overlapping (Keep minimum 2.5m spacing in each lane)
            for (let lane = 1; lane <= 2; lane++) {
                const vehs = streetVehicles.filter(v => v.userData.lane === lane);
                vehs.forEach(v => {
                    v.position.x += v.userData.sp * dt;
                    if (v.userData.sp > 0 && v.position.x > v.userData.maxX) v.position.x = v.userData.minX;
                    if (v.userData.sp < 0 && v.position.x < v.userData.minX) v.position.x = v.userData.maxX;
                });
            }
        }

        /********************************************************************
         * 6. 3D MODELS (CAT WHEEL, EXACT LITTER BOX & AUTOMATIC FEEDER)
         ********************************************************************/
        function createDecorMesh(decorId) {
            const g = new THREE.Group();
            const F = FLOOR_Y;
            const put = (geo, mat, x, y, z, sx, sy, sz, shadow) => {
                const m = addMesh(g, geo, mat, x, y, z, sx, sy, sz);
                m.castShadow = shadow !== false;
                m.receiveShadow = true;
                return m;
            };

            if (decorId === 'food_station') {
                /*
                 * 2-in-1 Automatic Cat Feeder & Waterer Station (Exact Match to Image 5)
                 */
                const whiteBody = catMat(0xffffff, 0.4);
                const slateGrey = catMat(0x64748b, 0.5);
                const glassMat = new THREE.MeshStandardMaterial({ color: sc(0xdff1ff), roughness: 0.1, transparent: true, opacity: 0.55, metalness: 0.1 });
                const waterInside = new THREE.MeshStandardMaterial({ color: sc(0x38bdf8), roughness: 0.05, transparent: true, opacity: 0.7 });
                const kibbleColor = catMat(0x78350f, 0.9);
                const meatCubeColor = catMat(0xfef08a, 0.85);

                put(new THREE.BoxGeometry(1.0, 0.08, 0.65), whiteBody, 0, F + 0.04, 0);

                // Water bottle
                put(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 24), whiteBody, -0.26, F + 0.11, -0.06);
                put(new THREE.CylinderGeometry(0.16, 0.16, 0.48, 24), glassMat, -0.26, F + 0.38, -0.06);
                put(new THREE.SphereGeometry(0.16, 24, 16), glassMat, -0.26, F + 0.62, -0.06, 1, 0.5, 1);
                put(new THREE.CylinderGeometry(0.145, 0.145, 0.44, 20), waterInside, -0.26, F + 0.36, -0.06);

                // Water dish
                put(new THREE.BoxGeometry(0.32, 0.05, 0.22), slateGrey, -0.26, F + 0.08, 0.18);
                put(new THREE.BoxGeometry(0.28, 0.03, 0.18), waterInside, -0.26, F + 0.1, 0.18);

                // Food tower
                put(new THREE.BoxGeometry(0.38, 0.68, 0.36), whiteBody, 0.26, F + 0.42, -0.06);
                put(new THREE.BoxGeometry(0.40, 0.05, 0.38), slateGrey, 0.26, F + 0.78, -0.06);
                put(new THREE.BoxGeometry(0.22, 0.14, 0.12), whiteBody, 0.26, F + 0.15, 0.12);

                // Food bowl
                put(new THREE.CylinderGeometry(0.20, 0.18, 0.08, 24), whiteBody, 0.26, F + 0.08, 0.18);

                const foodGroup = new THREE.Group();
                foodGroup.position.set(0.26, F + 0.1, 0.18);
                for (let i = 0; i < 18; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const r = Math.random() * 0.12;
                    if (i % 3 === 0) {
                        addMesh(foodGroup, new THREE.BoxGeometry(0.035, 0.035, 0.035), meatCubeColor, Math.cos(ang) * r, 0.02 + Math.random() * 0.02, Math.sin(ang) * r);
                    } else {
                        addMesh(foodGroup, new THREE.SphereGeometry(0.022, 8, 8), kibbleColor, Math.cos(ang) * r, 0.015 + Math.random() * 0.02, Math.sin(ang) * r);
                    }
                }
                foodGroup.visible = state.foodBowlPercent > 0;
                foodGroup.scale.set(1, (state.foodBowlPercent / 100) * 1.0, 1);
                g.add(foodGroup);
                foodBowlKibbleMesh = foodGroup;

            } else if (decorId === 'litter_box') {
                /*
                 * 2-Tone Grey & Cream Cat Litter Box with Splash Guard & Filter Step (Exact Match to Image 4)
                 */
                const darkTubGrey = catMat(0x3f434a, 0.6);
                const creamHood = catMat(0xede8dc, 0.5);
                const sandMat = catMat(0x9ca3af, 0.95);
                const dirtyMat = catMat(0x52525b, 0.95);

                put(new THREE.BoxGeometry(1.05, 0.18, 0.8), darkTubGrey, 0, F + 0.09, 0);

                // High splash hood
                put(new THREE.BoxGeometry(1.05, 0.28, 0.06), creamHood, 0, F + 0.32, -0.37);
                [-0.5, 0.5].forEach(s => {
                    put(new THREE.BoxGeometry(0.06, 0.28, 0.8), creamHood, s, F + 0.32, 0);
                });
                put(new THREE.BoxGeometry(0.35, 0.1, 0.06), creamHood, -0.35, F + 0.23, 0.37);
                put(new THREE.BoxGeometry(0.35, 0.1, 0.06), creamHood, 0.35, F + 0.23, 0.37);

                // Perforated litter step
                const stepTex = canvasTex(128, 64, (ctx, W, H) => {
                    ctx.fillStyle = '#ede8dc'; ctx.fillRect(0, 0, W, H);
                    ctx.fillStyle = '#9ca3af';
                    for (let y = 8; y < H; y += 12) {
                        for (let x = 8; x < W; x += 12) {
                            ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
                        }
                    }
                }, true);
                const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 0.22), new THREE.MeshStandardMaterial({ map: stepTex, roughness: 0.7 }));
                stepMesh.position.set(0, F + 0.19, 0.26);
                stepMesh.receiveShadow = true;
                g.add(stepMesh);

                put(new THREE.BoxGeometry(0.9, 0.1, 0.55), sandMat, 0, F + 0.14, -0.06);

                const dirtGroup = new THREE.Group();
                dirtGroup.position.set(0, F + 0.19, -0.06);
                [[-0.18, 0.08], [0.15, -0.06], [-0.02, 0.14]].forEach(([dx, dz]) => {
                    addMesh(dirtGroup, new THREE.SphereGeometry(0.045, 8, 8), dirtyMat, dx, 0, dz, 1.2, 0.6, 1.0);
                });
                dirtGroup.visible = (state.litterCleanliness < 90);
                g.add(dirtGroup);
                litterBoxDirtGroup = dirtGroup;

                // Scoop on right side
                const scoopGroup = new THREE.Group();
                scoopGroup.position.set(0.56, F + 0.28, 0.15);
                scoopGroup.rotation.z = -0.15;
                addMesh(scoopGroup, new THREE.BoxGeometry(0.04, 0.12, 0.06), creamHood, 0, 0, 0);
                addMesh(scoopGroup, new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), creamHood, 0, 0.12, 0);
                g.add(scoopGroup);

            } else if (decorId === 'cat_wheel') {
                /*
                 * Hamster-Style Giant Cat Running Exercise Wheel (Horizontal & Crystal Clear Acrylic)
                 */
                const baseStand = catMat(0xffffff, 0.4);
                const chromeAxle = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.15 });
                const drumAcrylic = new THREE.MeshStandardMaterial({
                    color: 0x38bdf8,
                    transparent: true,
                    opacity: 0.65,
                    roughness: 0.15,
                    metalness: 0.1
                });
                const slatMat = catMat(0xffffff, 0.7);

                // 1. Elegant curved white pedestal stand (behind wheel)
                put(new THREE.BoxGeometry(0.85, 0.08, 0.55), baseStand, 0, F + 0.04, -0.22);
                put(new THREE.CylinderGeometry(0.045, 0.06, 1.25, 12), baseStand, 0, F + 0.65, -0.25);

                // 2. Rotating Drum (facing forward horizontally)
                const drum = new THREE.Group();
                drum.position.set(0, F + 0.95, 0);

                // Outer hollow cylinder track for cat running
                const outerTrack = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.48, 36, 1, true), drumAcrylic);
                outerTrack.rotation.x = Math.PI / 2;
                drum.add(outerTrack);

                // Inner running ribbed slats
                for (let i = 0; i < 24; i++) {
                    const ang = (i / 24) * Math.PI * 2;
                    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 0.44), slatMat);
                    slat.position.set(Math.cos(ang) * 0.77, Math.sin(ang) * 0.77, 0);
                    slat.rotation.z = ang;
                    drum.add(slat);
                }

                // Transparent circular back disc
                const backDisc = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), drumAcrylic);
                backDisc.position.z = -0.23;
                drum.add(backDisc);

                // Front safety lip ring
                const frontLip = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.025, 8, 36), baseStand);
                frontLip.position.z = 0.24;
                drum.add(frontLip);

                // Center spinner star blossom knob
                const centerKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 16), baseStand);
                centerKnob.rotation.x = Math.PI / 2;
                centerKnob.position.z = -0.2;
                drum.add(centerKnob);
                for (let p = 0; p < 5; p++) {
                    const petalAng = (p / 5) * Math.PI * 2;
                    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), catMat(0xec4899, 0.5));
                    petal.position.set(Math.cos(petalAng) * 0.08, Math.sin(petalAng) * 0.08, -0.16);
                    drum.add(petal);
                }

                // Important: Wheel meshes do NOT block mouse rays, allowing easy cat clicking & dragging!
                drum.traverse(child => {
                    if (child.isMesh) child.raycast = () => {};
                });

                g.add(drum);
                catWheelDrum = drum;

            } else if (decorId === 'cat_tree') {
                // Multi-Tier Cat Tree
                const sisal = catMat(0xd9b98c, 1), cream = catMat(0xfff6e0, 0.8), pinkM = catMat(0xf9a8c0, 0.9);
                put(new THREE.BoxGeometry(1.2, 0.14, 1.2), catMat(0xb08968), 0, F + 0.07, 0);
                put(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 14), sisal, 0, F + 1.3, 0);
                put(new THREE.CylinderGeometry(0.1, 0.1, 1.0, 14), sisal, 0.4, F + 0.55, 0.1);

                // Tier 1 Platform (y = F + 1.05)
                put(new THREE.CylinderGeometry(0.58, 0.58, 0.1, 24), cream, 0.4, F + 1.05, 0.1);

                // Tier 2 Platform (y = F + 1.75)
                put(new THREE.CylinderGeometry(0.52, 0.52, 0.1, 24), cream, -0.35, F + 1.75, 0);

                // Tier 3 Top Hammock (y = F + 2.5)
                put(new THREE.TorusGeometry(0.46, 0.14, 10, 24), pinkM, 0, F + 2.5, 0, 1, 1, 1).rotation.x = Math.PI / 2;
                put(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 22), cream, 0, F + 2.48, 0);

                const t = put(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 5), catMat(0x888888), 0.5, F + 0.78, 0.5);
                put(new THREE.SphereGeometry(0.09, 10, 8), catMat(0xef4444, 0.4), 0.5, F + 0.5, 0.5);

            } else if (decorId === 'cardboard_box') {
                const kraftBrown = catMat(0xd97706, 0.9);
                put(new THREE.BoxGeometry(0.85, 0.38, 0.65), kraftBrown, 0, F + 0.19, 0);
                put(new THREE.BoxGeometry(0.77, 0.34, 0.57), catMat(0xb45309, 0.9), 0, F + 0.21, 0);

            } else if (decorId === 'catnip_pot') {
                const ceramic = catMat(0xffffff, 0.5);
                put(new THREE.CylinderGeometry(0.22, 0.16, 0.32, 20), ceramic, 0, F + 0.16, 0);
                put(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20), catMat(0x3f2e21), 0, F + 0.32, 0);
                for (let i = 0; i < 9; i++) {
                    const a = i * 0.7;
                    const leaf = put(new THREE.SphereGeometry(0.12, 8, 8), catMat(0x22c55e, 0.8), Math.cos(a) * 0.12, F + 0.42 + (i % 3) * 0.06, Math.sin(a) * 0.12, 1.2, 0.6, 1.0);
                    leaf.rotation.z = Math.cos(a) * 0.4;
                }

            } else if (decorId === 'yarn_ball') {
                const yarnCol = catMat(0xf43f5e, 0.85);
                put(new THREE.SphereGeometry(0.16, 16, 14), yarnCol, 0, F + 0.16, 0);

            } else if (decorId === 'donut_bed') {
                const dough = catMat(0xfcd34d, 0.9);
                const icing = catMat(0xf472b6, 0.8);
                const ring = put(new THREE.TorusGeometry(0.5, 0.22, 14, 28), dough, 0, F + 0.2, 0); ring.rotation.x = Math.PI / 2;
                const topIcing = put(new THREE.TorusGeometry(0.5, 0.16, 10, 28), icing, 0, F + 0.28, 0); topIcing.rotation.x = Math.PI / 2;

            } else if (decorId.includes('sakura')) {
                const pink = decorId.includes('right');
                put(new THREE.CylinderGeometry(0.34, 0.24, 0.42, 18), catMat(0xc2693e, 0.8), 0, F + 0.21, 0);
                put(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 18), catMat(0x4a3224, 1), 0, F + 0.4, 0);
                put(new THREE.CylinderGeometry(0.06, 0.11, 1.4, 10), catMat(0x6b4a35), 0, F + 1.1, 0);
                [-1, 1].forEach(s => { const br = put(new THREE.CylinderGeometry(0.03, 0.05, 0.7, 8), catMat(0x6b4a35), s * 0.25, F + 1.65, 0); br.rotation.z = -s * 0.6; });
                const cols = pink ? [0xffb7c5, 0xffc9d4, 0xff9fb5] : [0xffffff, 0xf7f3f8, 0xffe8ef];
                [[0, 2.0, 0, 0.7], [0.5, 1.8, 0.1, 0.5], [-0.5, 1.85, -0.05, 0.55], [0.25, 2.5, 0, 0.45], [-0.3, 2.4, 0.1, 0.42], [0, 1.75, 0.45, 0.4]].forEach(([a, b, c, r], i) => {
                    put(new THREE.SphereGeometry(r, 16, 14), catMat(cols[i % 3], 0.75), a, F + b, c);
                });

            } else if (decorId === 'wood_arch') {
                const w = catMat(0xc99a6b, 0.8);
                [-0.95, 0.95].forEach(s => put(new THREE.CylinderGeometry(0.1, 0.12, 1.9, 12), w, s, F + 0.95, 0));
                const arc = put(new THREE.TorusGeometry(0.95, 0.1, 10, 28, Math.PI), w, 0, F + 1.9, 0);
                for (let i = 0; i < 9; i++) {
                    const a = Math.PI * (i + 0.5) / 9;
                    put(new THREE.SphereGeometry(0.1, 8, 8), catMat(i % 3 ? 0x6ec48b : 0xffa8c5, 0.8), Math.cos(a) * 0.95, F + 1.9 + Math.sin(a) * 0.95, 0.05, 1, 1, 1, false);
                }

            } else if (decorId === 'cozy_bed') {
                const ring = put(new THREE.TorusGeometry(0.52, 0.17, 12, 28), catMat(0xf472b6, 0.9), 0, F + 0.17, 0); ring.rotation.x = Math.PI / 2;
                put(new THREE.CylinderGeometry(0.5, 0.5, 0.18, 24), catMat(0xfde2e4, 1), 0, F + 0.1, 0);
                put(new THREE.SphereGeometry(0.2, 12, 10), catMat(0xfff1f2, 1), 0.12, F + 0.26, 0, 1.3, 0.55, 1);

            } else if (decorId === 'scratching_post') {
                const cactusMat = catMat(0x22c55e, 0.85);
                put(new THREE.CylinderGeometry(0.38, 0.42, 0.1, 20), catMat(0xd4a373, 0.8), 0, F + 0.05, 0);
                put(new THREE.CylinderGeometry(0.13, 0.13, 1.2, 16), cactusMat, 0, F + 0.65, 0);
                const arm1 = put(new THREE.TorusGeometry(0.18, 0.09, 8, 16, Math.PI / 2), cactusMat, -0.15, F + 0.8, 0); arm1.rotation.z = Math.PI / 2;
                const arm2 = put(new THREE.TorusGeometry(0.18, 0.09, 8, 16, Math.PI / 2), cactusMat, 0.15, F + 0.55, 0); arm2.rotation.z = -Math.PI / 2;
                put(new THREE.SphereGeometry(0.09, 10, 8), catMat(0xfacc15, 0.5), 0, F + 1.3, 0);

            } else if (decorId === 'cat_tunnel') {
                const fabricMat = catMat(0x818cf8, 0.8);
                const tunnel = put(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 20, 1, true), fabricMat, 0, F + 0.36, 0);
                tunnel.rotation.z = Math.PI / 2;
            }

            g.userData.decorId = decorId;
            return g;
        }

        function rebuildRoomDecorAndCats() {
            while (roomGroup.children.length > 2) {
                roomGroup.remove(roomGroup.children[2]);
            }
            catActors = [];
            decorMeshes = {};

            state.activeDecor.forEach(decorId => {
                const mesh = createDecorMesh(decorId);
                if (mesh) {
                    const pos = state.decorPositions[decorId] || DEFAULT_DECOR_POSITIONS[decorId] || { x: 0, z: 0, rot: 0 };
                    mesh.position.set(pos.x, 0, pos.z);
                    mesh.rotation.y = pos.rot || 0;
                    roomGroup.add(mesh);
                    decorMeshes[decorId] = mesh;
                }
            });

            state.cats.forEach((catData, idx) => {
                const catActor = create3DCatMesh(catData);
                const xOffset = state.cats.length === 1 ? 0 : (idx - (state.cats.length - 1) / 2) * 1.5;
                catActor.mesh.position.set(xOffset, FLOOR_Y + 0.03, 0.3 + (idx % 2) * 1.1);
                roomGroup.add(catActor.mesh);
                catActors.push(catActor);
            });

            updateDecorSelectionRing();
        }

        /********************************************************************
         * 7. 3D CHIBI CAT MODEL BUILDER (WITH NATURAL UPSIDE-DOWN BACK POSE)
         ********************************************************************/
        const furTextureCache = {};
        function hexToCss(hex) { return '#' + hex.toString(16).padStart(6, '0'); }

        function getCatCoatTexture(breed, kind = 'body') {
            const key = breed.id + '_' + kind;
            if (furTextureCache[key]) return furTextureCache[key];
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 256;
            const ctx = canvas.getContext('2d');
            const base = hexToCss(breed.bodyColor), stripe = hexToCss(breed.stripeColor), belly = hexToCss(breed.bellyColor);
            ctx.fillStyle = base; ctx.fillRect(0, 0, 512, 256);
            ctx.globalAlpha = 0.05;
            for (let i = 0; i < 1500; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#000'; ctx.fillRect(Math.random() * 512, Math.random() * 256, 1.5, 6); }
            const blob = (x, y, rx, ry, col, a) => { ctx.globalAlpha = a === undefined ? 1 : a; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
            if (kind === 'body') {
                if (breed.pattern === 'tabby') {
                    for (let x = 6; x < 512; x += 24) blob(x, 100, 5 + Math.random() * 3, 52 + Math.random() * 14, stripe, 0.6);
                } else if (breed.pattern === 'calico') {
                    blob(70, 80, 46, 40, '#ea580c'); blob(190, 90, 52, 42, '#1e293b'); blob(310, 70, 44, 38, '#f97316');
                } else if (breed.pattern === 'siamese') {
                    ctx.globalAlpha = 1; const g = ctx.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(120,85,70,0.55)'); g.addColorStop(0.45, 'rgba(120,85,70,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 256);
                }
            } else {
                if (breed.pattern === 'tabby') { [-14, 0, 14].forEach(dx => blob(128 + dx, 62, 3.5, dx === 0 ? 24 : 17, stripe, 0.75)); }
                else if (breed.pattern === 'calico') { blob(60, 85, 50, 48, '#ea580c'); blob(190, 80, 44, 44, '#1e293b'); }
                else if (breed.pattern === 'siamese') { const g = ctx.createRadialGradient(128, 160, 5, 128, 160, 75); g.addColorStop(0, 'rgba(62,39,35,0.95)'); g.addColorStop(0.6, 'rgba(62,39,35,0.6)'); g.addColorStop(1, 'rgba(62,39,35,0)'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 256); }
                else if (breed.pattern === 'tuxedo') { blob(128, 180, 40, 32, '#ffffff'); blob(128, 120, 9, 34, '#ffffff'); }
                if (breed.pattern !== 'tuxedo' && breed.pattern !== 'siamese') blob(128, 182, 38, 26, belly, 0.95);
            }
            ctx.globalAlpha = 1;
            const tex = new THREE.CanvasTexture(canvas);
            tex.encoding = THREE.sRGBEncoding; tex.wrapS = THREE.RepeatWrapping; tex.needsUpdate = true;
            furTextureCache[key] = tex;
            return tex;
        }

        function create3DCatMesh(catData) {
            const breed = CAT_BREEDS.find(b => b.id === catData.breedId) || CAT_BREEDS[0];
            const root = new THREE.Group();
            root.userData.catId = catData.id;

            const lit = (tex) => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
            const bodyMat = lit(getCatCoatTexture(breed, 'body'));
            const headMat = lit(getCatCoatTexture(breed, 'head'));
            const solidMat = catMat(breed.bodyColor);
            const bellyMat = catMat(breed.bellyColor);
            const earMat = catMat(breed.earColor);
            const innerEarMat = catMat(0xffb3c1, 0.6);
            const dark = (breed.pattern === 'tuxedo' || breed.pattern === 'calico');
            const pawMat = (dark ? bellyMat : (breed.pattern === 'siamese' ? earMat : solidMat));
            const furry = breed.fluffy;

            const bodyPivot = new THREE.Group();
            bodyPivot.position.set(0, 0.4, 0);
            root.add(bodyPivot);

            const torso = addMesh(bodyPivot, new THREE.SphereGeometry(0.3, 28, 24), bodyMat, 0, 0, 0, furry ? 1.12 : 1.0, 0.9, 1.22);
            torso.castShadow = true;
            addMesh(bodyPivot, new THREE.SphereGeometry(0.24, 20, 18), bellyMat, 0, -0.08, 0.1, 0.9, 0.7, 1.1);

            // Head (Child of bodyPivot)
            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.3, 0.36);
            bodyPivot.add(headGroup);
            const head = addMesh(headGroup, new THREE.SphereGeometry(0.36, 32, 28), headMat, 0, 0, 0, furry ? 1.22 : 1.12, 0.93, 1.0);
            head.castShadow = true;
            if (furry) {
                addMesh(headGroup, new THREE.SphereGeometry(0.2, 16, 14), bellyMat, 0, -0.26, 0.1, 1.5, 0.7, 1.0);
            }

            // Eyes
            const eyes = [];
            const eyeBlack = catBasic(0x15151a), irisMat = new THREE.MeshStandardMaterial({ color: sc(breed.eyeColor), roughness: 0.25, emissive: sc(breed.eyeColor), emissiveIntensity: 0.25 });
            const shine = catBasic(0xffffff);
            [-1, 1].forEach(side => {
                const eye = new THREE.Group();
                eye.position.set(side * 0.16, 0.0, 0.3);
                eye.rotation.y = side * 0.3;
                addMesh(eye, new THREE.SphereGeometry(0.075, 20, 18), eyeBlack, 0, 0, 0, 1, 1.18, 0.5);
                addMesh(eye, new THREE.SphereGeometry(0.058, 20, 18), irisMat, 0, -0.005, 0.014, 1, 1.12, 0.4);
                addMesh(eye, new THREE.SphereGeometry(0.031, 16, 14), eyeBlack, 0, -0.005, 0.024, 0.8, 1.25, 0.3);
                addMesh(eye, new THREE.SphereGeometry(0.02, 12, 10), shine, -0.016, 0.03, 0.034, 1, 1, 0.5);
                headGroup.add(eye);
                eyes.push(eye);
            });

            // Nose, mouth
            addMesh(headGroup, new THREE.SphereGeometry(0.03, 12, 10), catMat(breed.noseColor || 0xf472b6, 0.35), 0, -0.065, 0.35, 1.25, 0.8, 0.8);
            const mouthMat = catBasic(0x3b2a26);
            [-1, 1].forEach(side => {
                const m = addMesh(headGroup, new THREE.TorusGeometry(0.026, 0.0055, 6, 14, Math.PI), mouthMat, side * 0.026, -0.105, 0.343);
                m.rotation.z = Math.PI;
                const bl = addMesh(headGroup, new THREE.CircleGeometry(0.045, 16), catBasic(0xff7b9c, { transparent: true, opacity: 0.45, depthWrite: false }), side * 0.235, -0.07, 0.295);
                bl.rotation.y = side * 0.65;
            });

            // Ears
            const ears = [];
            const folded = breed.earType === 'folded';
            [-1, 1].forEach(side => {
                const pivot = new THREE.Group();
                pivot.position.set(side * 0.22, 0.25, -0.02);
                pivot.rotation.z = -side * (folded ? 0.7 : 0.38);
                if (folded) pivot.rotation.x = 0.55;
                const h = folded ? 0.15 : 0.26;
                const outer = addMesh(pivot, new THREE.ConeGeometry(0.13, h, 20), earMat, 0, h / 2 - 0.02, 0);
                outer.scale.z = 0.55; outer.castShadow = true;
                if (!folded) { const inner = addMesh(pivot, new THREE.ConeGeometry(0.085, h * 0.8, 16), innerEarMat, 0, h * 0.4 - 0.02, 0.03); inner.scale.z = 0.4; }
                headGroup.add(pivot);
                ears.push(pivot);
            });

            // Accessory
            const accessoryGroup = new THREE.Group();
            headGroup.add(accessoryGroup);
            buildCatAccessoryMesh(accessoryGroup, catData.accessory || 'bell');

            // Legs (Attached to bodyPivot so they flip properly when cat is on back)
            const legs = [];
            [[-0.15, 0.2], [0.15, 0.2], [-0.15, -0.2], [0.15, -0.2]].forEach(([x, z]) => {
                const leg = new THREE.Group();
                leg.position.set(x, -0.15, z);
                const limb = addMesh(leg, new THREE.CylinderGeometry(0.075, 0.068, 0.2, 14), solidMat, 0, -0.1, 0);
                limb.castShadow = true;
                addMesh(leg, new THREE.SphereGeometry(0.08, 14, 12), pawMat, 0, -0.2, 0.012, 1, 0.62, 1.2);
                bodyPivot.add(leg);
                legs.push(leg);
            });

            // Tail
            const tailSegments = [];
            let parent = bodyPivot;
            for (let i = 0; i < 7; i++) {
                const seg = new THREE.Group();
                if (i === 0) { seg.position.set(0, 0.0, -0.34); seg.rotation.x = -1.05; }
                else { seg.position.set(0, 0.085, 0); seg.rotation.x = 0.16; }
                const striped = breed.pattern === 'tabby' && i % 2 === 1;
                const mat = (striped ? catMat(breed.stripeColor) : solidMat);
                addMesh(seg, new THREE.SphereGeometry(0.055 - i * 0.002, 12, 10), mat, 0, 0.04, 0, 1, 1.45, 1);
                parent.add(seg);
                parent = seg;
                tailSegments.push(seg);
            }

            const currentScale = getCatScale(catData.level || 1, catData.growthExp || 0);
            root.scale.set(currentScale, currentScale, currentScale);

            return {
                id: catData.id, data: catData, breed, mesh: root, bodyPivot, headGroup, accessoryGroup, eyes, ears, legs, tailSegments,
                aiState: 'wander', stateTimer: 2 + Math.random() * 4, moving: false, seed: Math.random() * 10,
                targetPos: new THREE.Vector3((Math.random() - 0.5) * 6, FLOOR_Y + 0.03, -0.4 + Math.random() * 2.5),
                walkPhase: Math.random() * 10, blinkTimer: 1 + Math.random() * 3, climbStep: 0, climbTimer: 0
            };
        }

        function buildCatAccessoryMesh(group, accId) {
            while (group.children.length > 0) group.remove(group.children[0]);
            const gold = new THREE.MeshStandardMaterial({ color: sc(0xfbbf24), metalness: 0.5, roughness: 0.3 });
            if (accId === 'sprout') {
                const green = catMat(0x22c55e, 0.6);
                addMesh(group, new THREE.CylinderGeometry(0.01, 0.014, 0.12, 8), green, 0, 0.37, 0.02);
                [-1, 1].forEach(s => { const l = addMesh(group, new THREE.SphereGeometry(0.05, 12, 10), green, s * 0.045, 0.44, 0.02, 1.3, 0.5, 0.7); l.rotation.z = -s * 0.5; });
            } else if (accId === 'crown') {
                addMesh(group, new THREE.CylinderGeometry(0.1, 0.085, 0.07, 12), gold, 0, 0.36, 0.02);
                for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; addMesh(group, new THREE.ConeGeometry(0.025, 0.07, 8), gold, Math.cos(a) * 0.085, 0.43, 0.02 + Math.sin(a) * 0.085); }
                addMesh(group, new THREE.SphereGeometry(0.018, 8, 8), catMat(0xef4444, 0.3), 0, 0.37, 0.115);
            } else if (accId === 'bow') {
                const pink = catMat(0xff4d8d, 0.5);
                [-1, 1].forEach(s => { const w = addMesh(group, new THREE.ConeGeometry(0.06, 0.11, 12), pink, 0.22 + s * 0.06, 0.28, 0.12); w.rotation.z = -s * Math.PI / 2; });
                addMesh(group, new THREE.SphereGeometry(0.032, 10, 10), pink, 0.22, 0.28, 0.12);
            } else if (accId === 'beret') {
                addMesh(group, new THREE.SphereGeometry(0.2, 20, 14), catMat(0xdc2626, 0.8), 0.04, 0.32, 0.02, 1.0, 0.4, 1.0);
                addMesh(group, new THREE.SphereGeometry(0.02, 8, 8), catMat(0x7f1d1d), 0.04, 0.42, 0.02);
            } else {
                const ring = addMesh(group, new THREE.TorusGeometry(0.2, 0.022, 8, 28), catMat(0xe11d48, 0.5), 0, -0.27, 0.06, 1.15, 1.0, 1.0);
                ring.rotation.x = Math.PI / 2;
                addMesh(group, new THREE.SphereGeometry(0.045, 14, 12), gold, 0, -0.3, 0.27);
            }
        }

        // CAT POSES - LEGS AND HEAD PROPERLY STICKING UP WHEN ON BACK
        const CAT_POSES = {
            stand: { bodyY: 0.4, bodyRX: 0, bodyRZ: 0, headY: 0.3, headRX: 0, headRZ: 0, legY: -0.15, legRZ: 0, fSY: 1, hSY: 1, fRX: 0, hRX: 0, tailRX: -1.05, eye: 1 },
            sit:   { bodyY: 0.38, bodyRX: -0.5, bodyRZ: 0, headY: 0.3, headRX: 0.45, headRZ: 0, legY: -0.12, legRZ: 0, fSY: 1.2, hSY: 0.7, fRX: 0, hRX: -1.3, tailRX: -1.25, eye: 1 },
            lie:   { bodyY: 0.25, bodyRX: 0, bodyRZ: 0, headY: 0.27, headRX: 0.12, headRZ: 0, legY: -0.08, legRZ: 0, fSY: 0.5, hSY: 0.3, fRX: -1.4, hRX: 0, tailRX: -1.4, eye: 0.3 },
            // WHEN ON BACK: Body rotated 180 deg around Z. Head tilted back flat. All 4 paws stick prominently straight UP in the air!
            back:  { bodyY: 0.26, bodyRX: 0, bodyRZ: Math.PI, headY: 0.22, headRX: -0.24, headRZ: 0, legY: -0.15, legRZ: 0.18, fSY: 1.25, hSY: 1.25, fRX: 0.55, hRX: -0.55, tailRX: -0.45, eye: 0.1 },
            eating:{ bodyY: 0.32, bodyRX: 0.35, bodyRZ: 0, headY: 0.18, headRX: 0.6, headRZ: 0, legY: -0.15, legRZ: 0, fSY: 0.9, hSY: 1.1, fRX: 0.2, hRX: -0.2, tailRX: -0.85, eye: 0.8 },
            loaf:  { bodyY: 0.24, bodyRX: 0, bodyRZ: 0, headY: 0.26, headRX: 0.1, headRZ: 0, legY: -0.05, legRZ: 0, fSY: 0.2, hSY: 0.2, fRX: 0, hRX: 0, tailRX: -1.45, eye: 0.4 }
        };

        function animateCatParts(dt, t) {
            catActors.forEach(a => {
                if (!a.legs) return;
                const mv = !!a.moving;
                const poseKey = a.aiState === 'eating' ? 'eating' : (a.aiState === 'loaf' ? 'loaf' : (mv ? 'stand' : (CAT_POSES[a.aiState] ? a.aiState : 'stand')));
                const P = CAT_POSES[poseKey];
                if (!a.pose) a.pose = Object.assign({}, CAT_POSES.stand);
                const k = Math.min(1, dt * 5.5);
                for (const key in P) a.pose[key] += (P[key] - a.pose[key]) * k;
                const p = a.pose;

                if (mv) a.walkPhase += dt * (a.aiState === 'running_wheel' ? 8.5 : 5.5);
                const sw = mv ? Math.sin(a.walkPhase) * 0.45 : 0;
                const isEating = a.aiState === 'eating';

                // If currently being dragged by user
                if (isDraggingCat && draggedCatActor === a) {
                    a.mesh.position.y = FLOOR_Y + 0.65; // Lift cat into the air
                    a.bodyPivot.position.y = 0.4;
                    a.bodyPivot.rotation.x = Math.sin(t * 8) * 0.1;
                    a.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 10 + i) * 0.5; });
                    return;
                }

                // If running on cat wheel (placed horizontally)
                if (a.aiState === 'running_wheel') {
                    const wheelPos = state.decorPositions['cat_wheel'] || DEFAULT_DECOR_POSITIONS.cat_wheel;
                    a.mesh.position.set(wheelPos.x, FLOOR_Y + 0.22, wheelPos.z + 0.05);
                    a.mesh.rotation.y = Math.PI / 2; // running in profile inside horizontal wheel
                    if (catWheelDrum) catWheelDrum.rotation.z += dt * 4.5;
                } else if (a.aiState !== 'climbing') {
                    a.mesh.position.y = FLOOR_Y + 0.03;
                }

                a.bodyPivot.position.y = p.bodyY + (mv ? Math.abs(Math.sin(a.walkPhase)) * 0.02 : (isEating ? Math.sin(t * 8) * 0.015 : Math.sin(t * 2 + a.seed) * 0.005));
                a.bodyPivot.rotation.x = p.bodyRX;
                a.bodyPivot.rotation.z = p.bodyRZ;
                a.headGroup.position.y = p.headY + (isEating ? Math.sin(t * 8) * 0.025 : 0);
                a.headGroup.rotation.x = p.headRX;
                a.headGroup.rotation.z = p.headRZ;

                a.legs.forEach((l, i) => {
                    const front = i < 2, ph = (i === 0 || i === 3) ? 1 : -1;
                    l.position.y = p.legY; l.rotation.z = p.legRZ;
                    l.scale.y = front ? p.fSY : p.hSY;
                    l.rotation.x = (front ? p.fRX : p.hRX) + sw * ph;
                });
                a.tailSegments.forEach((s, i) => {
                    if (i === 0) s.rotation.x = p.tailRX;
                    s.rotation.z = Math.sin(t * (isEating ? 5 : (mv ? 3 : 1.8)) + i * 0.6 + a.seed) * (0.05 + i * 0.03);
                });

                a.blinkTimer -= dt;
                let b = 1;
                if (a.blinkTimer < 0) { b = 0.1; if (a.blinkTimer < -0.12) a.blinkTimer = 2 + Math.random() * 4; }
                const open = Math.max(0.1, Math.min(b, p.eye));
                a.eyes.forEach(e => { e.scale.y = open; });
            });
        }

        /********************************************************************
         * 8. CAT AI, LASER CHASING & TREE CLIMBING LOGIC
         ********************************************************************/
        function updateCatsAI(dt) {
            const effDt = dt * (state.gameSpeed === 0 ? 0 : (state.gameSpeed === 3 ? 2.2 : 1.0));
            if (effDt <= 0) return;

            const bowlPos = state.decorPositions['food_station'] || DEFAULT_DECOR_POSITIONS.food_station;
            const treePos = state.decorPositions['cat_tree'] || DEFAULT_DECOR_POSITIONS.cat_tree;

            catActors.forEach(actor => {
                if (isDraggingCat && draggedCatActor === actor) return;

                // 1. LASER POINTER CHASE (SMOOTH & RESPONSIVE FOLLOW)
                if (laserActive) {
                    actor.aiState = 'wander';
                    actor.moving = true;
                    const dx = laserTarget3D.x - actor.mesh.position.x;
                    const dz = laserTarget3D.z - actor.mesh.position.z;
                    const dist = Math.hypot(dx, dz);
                    if (dist > 0.15) {
                        actor.mesh.position.x += (dx / dist) * 1.1 * effDt;
                        actor.mesh.position.z += (dz / dist) * 1.1 * effDt;
                        actor.mesh.rotation.y = Math.atan2(dx, dz);
                    } else {
                        // Reached laser dot: pounce playful action!
                        actor.moving = false;
                        actor.bodyPivot.position.y = 0.55;
                    }
                    return;
                }

                // 2. CAT TREE CLIMBING SEQUENCE (TIER 1 -> TIER 2 -> TOP HAMMOCK -> JUMP DOWN)
                if (actor.aiState === 'climbing') {
                    actor.climbTimer -= effDt;
                    const p = actor.mesh.position;
                    if (actor.climbStep === 1) { // Jump to Tier 1
                        p.set(treePos.x + 0.4, FLOOR_Y + 1.15, treePos.z + 0.1);
                        actor.mesh.rotation.y = 0;
                        if (actor.climbTimer <= 0) { actor.climbStep = 2; actor.climbTimer = 1.8; }
                    } else if (actor.climbStep === 2) { // Jump to Tier 2
                        p.set(treePos.x - 0.35, FLOOR_Y + 1.85, treePos.z);
                        if (actor.climbTimer <= 0) { actor.climbStep = 3; actor.climbTimer = 4.0; }
                    } else if (actor.climbStep === 3) { // Jump to Top Hammock
                        p.set(treePos.x, FLOOR_Y + 2.58, treePos.z);
                        if (actor.climbTimer <= 0) {
                            // Heroic jump down back to floor!
                            p.set(treePos.x + 0.5, FLOOR_Y + 0.03, treePos.z + 0.5);
                            actor.aiState = 'sit';
                            actor.stateTimer = 4;
                            playMeowSound(1.2);
                            showFloatingNotification(`✨ ${actor.data.name} đã leo đỉnh tháp mèo và nhảy xuống điệu nghệ!`, '#8b5cf6', '🌳');
                        }
                    }
                    return;
                }

                actor.stateTimer -= effDt;

                // 3. EATING AT FOOD STATION
                if (actor.aiState === 'eating') {
                    const dx = (bowlPos.x + 0.35) - actor.mesh.position.x;
                    const dz = (bowlPos.z + 0.35) - actor.mesh.position.z;
                    const dist = Math.hypot(dx, dz);
                    if (dist > 0.25) {
                        actor.moving = true;
                        actor.mesh.position.x += (dx / dist) * 0.65 * effDt;
                        actor.mesh.position.z += (dz / dist) * 0.65 * effDt;
                        actor.mesh.rotation.y = Math.atan2(dx, dz);
                    } else {
                        actor.moving = false;
                        actor.mesh.rotation.y = Math.atan2(bowlPos.x - actor.mesh.position.x, bowlPos.z - actor.mesh.position.z);
                        if (state.foodBowlPercent > 0) {
                            state.foodBowlPercent = Math.max(0, state.foodBowlPercent - effDt * 7);
                            updateFoodBowlVisual();
                        }
                    }

                    if (actor.stateTimer <= 0) {
                        actor.aiState = 'sit';
                        actor.stateTimer = 4;
                    }
                    return;
                }

                // 4. AUTONOMOUS BEHAVIOR CYCLE (Cats ONLY play with toys when BORED >= 55!)
                if (actor.stateTimer <= 0) {
                    const cData = state.cats.find(c => c.id === actor.id);
                    const isBored = cData && (cData.boredom >= 55);

                    if (isBored) {
                        // Cat is bored -> autonomously seek out toys to relieve boredom!
                        const rToy = Math.random();
                        if (rToy < 0.45 && state.activeDecor.includes('cat_wheel')) {
                            commandCatEmote('wheel');
                            if (cData) { cData.boredom = Math.max(0, cData.boredom - 45); cData.love = Math.min(100, (cData.love || 80) + 4); }
                            showFloatingNotification(`✨ ${actor.data.name} thấy buồn chán nên đã chạy vào bánh xe tập thể dục!`, '#06b6d4', '🏃');
                            return;
                        } else if (rToy < 0.85 && state.activeDecor.includes('cat_tree')) {
                            commandCatEmote('tree');
                            if (cData) { cData.boredom = Math.max(0, cData.boredom - 40); cData.love = Math.min(100, (cData.love || 80) + 4); }
                            showFloatingNotification(`🌳 ${actor.data.name} chán chường nên đi leo tháp mèo giải khuây!`, '#8b5cf6', '🐾');
                            return;
                        } else if (state.activeDecor.includes('cardboard_box')) {
                            commandCatEmote('box');
                            if (cData) cData.boredom = Math.max(0, cData.boredom - 35);
                            return;
                        }
                    }

                    // Not bored: peaceful natural feline routine (wander, loaf, sit, sleep, lie on back)
                    const r = Math.random();
                    actor.aiState = r < 0.45 ? 'wander' : (r < 0.68 ? 'sit' : (r < 0.82 ? 'lie' : (r < 0.92 ? 'back' : 'loaf')));
                    actor.stateTimer = actor.aiState === 'wander' ? 4 + Math.random() * 4 : 8 + Math.random() * 9;
                    actor.targetPos.set((Math.random() - 0.5) * 6, FLOOR_Y + 0.03, -0.4 + Math.random() * 2.5);
                }

                actor.moving = false;
                if (actor.aiState === 'wander') {
                    const pos = actor.mesh.position;
                    const dx = actor.targetPos.x - pos.x;
                    const dz = actor.targetPos.z - pos.z;
                    const dist = Math.hypot(dx, dz);
                    if (dist > 0.15) {
                        actor.moving = true;
                        pos.x += (dx / dist) * 0.45 * effDt;
                        pos.z += (dz / dist) * 0.45 * effDt;
                        const ty = Math.atan2(dx, dz);
                        let d = ty - actor.mesh.rotation.y;
                        d = Math.atan2(Math.sin(d), Math.cos(d));
                        actor.mesh.rotation.y += d * Math.min(1, effDt * 3);
                    }
                }
            });

            // Keep cats separated
            const minD = 0.95;
            for (let i = 0; i < catActors.length; i++) {
                for (let j = i + 1; j < catActors.length; j++) {
                    const a = catActors[i].mesh.position, b = catActors[j].mesh.position;
                    let dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
                    if (d < minD) {
                        if (d < 0.001) { dx = 0.1; dz = 0.1; d = 0.14; }
                        const push = (minD - d) * 0.25;
                        a.x -= (dx / d) * push; a.z -= (dz / d) * push;
                        b.x += (dx / d) * push; b.z += (dz / d) * push;
                    }
                }
            }
        }

        // REAL-TIME GROWTH: ~10 HOURS OF ONLINE CARE TO REACH LEVEL 3
        function processRealtimeCatGrowth() {
            const now = Date.now();
            if (!state.lastGrowthCheck) state.lastGrowthCheck = now;
            const elapsedSeconds = Math.max(0, (now - state.lastGrowthCheck) / 1000);
            state.lastGrowthCheck = now;

            state.cats.forEach(cat => {
                const isFull = (cat.hunger || 0) >= 60;
                const isLoved = (cat.love || 0) >= 60;
                const isClean = (state.cleanliness || 0) >= 60;

                // 200% EXP / 600 min = ~0.33% per min = ~0.0055% per sec (10 hours to adult)
                if (isFull && isLoved && isClean) {
                    const expGain = elapsedSeconds * 0.0055;
                    addCatGrowthExp(cat, expGain, 'Thời gian thực', true);
                }

                // Hunger decay: ~1% every 120s
                cat.hunger = Math.max(10, (cat.hunger || 70) - (elapsedSeconds / 120));

                // Boredom growth: climbs +1% every 25s if inactive (relieved by playing with toys/laser/petting)
                cat.boredom = Math.min(100, (cat.boredom !== undefined ? cat.boredom : 20) + (elapsedSeconds / 25));
            });

            state.cleanliness = Math.max(10, (state.cleanliness || 100) - (elapsedSeconds / 220));
            state.hunger = Math.round(state.cats.reduce((acc, c) => acc + (c.hunger || 70), 0) / state.cats.length);
        }

        function animateLoop() {
            requestAnimationFrame(animateLoop);
            const dt = 0.016;
            updateCatsAI(dt);
            processRealtimeCatGrowth();
            animateCatParts(dt, performance.now() / 1000);
            animateStreetTraffic(dt);
            processSpontaneousCatMeowing();
            renderer.render(scene, camera);
        }

        /********************************************************************
         * 9. CAT EMOTE COMMANDS (ON COMMAND ANIMATIONS)
         ********************************************************************/
        function commandCatEmote(cmd) {
            const actor = catActors.find(a => a.id === selectedCatId) || catActors[0];
            if (!actor) return;
            const treePos = state.decorPositions['cat_tree'] || DEFAULT_DECOR_POSITIONS.cat_tree;
            const wheelPos = state.decorPositions['cat_wheel'] || DEFAULT_DECOR_POSITIONS.cat_wheel;
            const boxPos = state.decorPositions['cardboard_box'] || DEFAULT_DECOR_POSITIONS.cardboard_box;

            if (cmd === 'sleep') {
                actor.aiState = Math.random() < 0.5 ? 'back' : 'lie';
                actor.stateTimer = 15;
                playMeowSound(0.9);
                showFloatingNotification(`😴 ${actor.data.name} đã nằm lăn ra ngủ phơi bụng rừ rừ!`, '#6366f1', '💤');
            } else if (cmd === 'wheel') {
                actor.aiState = 'running_wheel';
                actor.stateTimer = 10;
                playMeowSound(1.1);
                showFloatingNotification(`🏃 ${actor.data.name} đang chạy bánh xe tập thể dục tít mù!`, '#06b6d4', '✨');
            } else if (cmd === 'tree') {
                actor.aiState = 'climbing';
                actor.climbStep = 1;
                actor.climbTimer = 1.5;
                playMeowSound(1.2);
                showFloatingNotification(`🌳 ${actor.data.name} bắt đầu trèo lên tháp mèo nhiều tầng!`, '#8b5cf6', '🐾');
            } else if (cmd === 'box') {
                actor.aiState = 'loaf';
                actor.mesh.position.set(boxPos.x, FLOOR_Y + 0.12, boxPos.z);
                actor.stateTimer = 12;
                playMeowSound(1.15);
                showFloatingNotification(`📦 ${actor.data.name} đã chui tọt vào hộp carton ấm áp!`, '#f59e0b', '🐱');
            } else if (cmd === 'flip') {
                actor.bodyPivot.position.y = 0.7;
                actor.bodyPivot.rotation.x = Math.PI * 2;
                playLevelUpSound();
                showFloatingNotification(`🤸 ${actor.data.name} làm xiếc nhào lộn một vòng cực ngầu!`, '#ec4899', '🎉');
            } else if (cmd === 'come') {
                actor.targetPos.set(0, FLOOR_Y + 0.03, 0.8);
                actor.aiState = 'wander';
                playMeowSound(1.3);
                showFloatingNotification(`🐾 ${actor.data.name} đang chạy lại quấn chân bạn nè!`, '#10b981', '💕');
            }
        }

        /********************************************************************
         * 10. DRAG & DROP CATS ANYWHERE IN ROOM
         ********************************************************************/
        let pointerDownStartPos = { x: 0, y: 0 };

        function onPointerDown(e) {
            if (e.target.closest('button') || e.target.closest('.cozy-card') || e.target.closest('select')) return;
            pointerDownStartPos.x = e.clientX;
            pointerDownStartPos.y = e.clientY;

            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);

            // Decor edit mode
            if (isDecorEditMode) {
                const hits = raycaster.intersectObjects(roomGroup.children, true);
                for (let hit of hits) {
                    let obj = hit.object;
                    while (obj.parent && obj.parent !== roomGroup) obj = obj.parent;
                    if (obj.userData && obj.userData.decorId) {
                        selectDecorForEdit(obj.userData.decorId);
                        isDraggingDecor = true;
                        return;
                    }
                }
                return;
            }

            // Normal mode: check cat selection or drag initiation
            const intersects = raycaster.intersectObjects(roomGroup.children, true);
            if (intersects.length > 0) {
                let obj = intersects[0].object;
                while (obj.parent && obj.parent !== roomGroup) obj = obj.parent;

                // Check if clicking running wheel with cat inside -> instantly grab cat!
                const runningCat = catActors.find(a => a.aiState === 'running_wheel');
                if ((obj.userData && obj.userData.decorId === 'cat_wheel') && runningCat) {
                    selectedCatId = runningCat.id;
                    runningCat.aiState = 'wander';
                    runningCat.moving = false;
                    runningCat.mesh.position.z += 0.45;
                    draggedCatActor = runningCat;
                    isDraggingCat = true;
                    updateInspectorPanel();
                    openBottomCommandBar(runningCat);
                    playMeowSound(1.2);
                    showFloatingNotification(`Đã bế ${runningCat.data.name} ra khỏi bánh xe chạy bộ!`, '#10b981', '🐾');
                    logActivity(`Đã bế ${runningCat.data.name} ra khỏi bánh xe chạy bộ`, '🏃');
                    return;
                }

                if (obj.userData && obj.userData.catId) {
                    selectedCatId = obj.userData.catId;
                    const actor = catActors.find(a => a.id === selectedCatId);
                    if (actor) {
                        if (actor.aiState === 'running_wheel') {
                            actor.aiState = 'wander';
                            actor.moving = false;
                            actor.mesh.position.z += 0.45;
                        }
                        draggedCatActor = actor;
                        isDraggingCat = true;
                        openBottomCommandBar(actor);
                    }
                    updateInspectorPanel();
                    playMeowSound(1.2);
                    return;
                }

                if (obj.userData && obj.userData.decorId === 'food_station') {
                    openFeedingModal(); return;
                }
                if (obj.userData && obj.userData.decorId === 'litter_box') {
                    openLitterModal(); return;
                }
            }
        }

        function onPointerMove(e) {
            // Dragging cat across floor
            if (isDraggingCat && draggedCatActor) {
                mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const pt = new THREE.Vector3();
                raycaster.ray.intersectPlane(dragPlane, pt);
                if (pt) {
                    draggedCatActor.mesh.position.x = Math.max(-4.4, Math.min(4.4, pt.x));
                    draggedCatActor.mesh.position.z = Math.max(-2.5, Math.min(2.5, pt.z));
                }
                return;
            }

            // Dragging decor in edit mode
            if (isDecorEditMode && isDraggingDecor && selectedDecorId) {
                mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const pt = new THREE.Vector3();
                raycaster.ray.intersectPlane(dragPlane, pt);
                if (pt) {
                    nudgeSelectedDecor(pt.x - state.decorPositions[selectedDecorId].x, pt.z - state.decorPositions[selectedDecorId].z);
                }
                return;
            }

            // Laser pointer tracking
            if (laserActive) {
                const dot = document.getElementById('laser-dot');
                dot.style.left = e.clientX + 'px';
                dot.style.top = e.clientY + 'px';
                mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const pt = new THREE.Vector3();
                raycaster.ray.intersectPlane(dragPlane, pt);
                if (pt) laserTarget3D.copy(pt);
            }
        }

        function onPointerUp() {
            if (isDraggingCat && draggedCatActor) {
                const pos = draggedCatActor.mesh.position;
                pos.y = FLOOR_Y + 0.03;
                isDraggingCat = false;

                // Check landing near interactive toys
                const treePos = state.decorPositions['cat_tree'] || DEFAULT_DECOR_POSITIONS.cat_tree;
                const wheelPos = state.decorPositions['cat_wheel'] || DEFAULT_DECOR_POSITIONS.cat_wheel;

                if (Math.hypot(pos.x - treePos.x, pos.z - treePos.z) < 1.2) {
                    commandCatEmote('tree');
                } else if (Math.hypot(pos.x - wheelPos.x, pos.z - wheelPos.z) < 1.1) {
                    commandCatEmote('wheel');
                } else {
                    playMeowSound(1.0);
                    showFloatingNotification(`Đã đặt ${draggedCatActor.data.name} xuống vị trí mới!`, '#10b981', '🐾');
                }
                draggedCatActor = null;
            }
            isDraggingDecor = false;
        }

        function toggleLaserPointer() {
            laserActive = !laserActive;
            document.getElementById('laser-dot').style.display = laserActive ? 'block' : 'none';
            document.getElementById('laser-action-btn').classList.toggle('ring-4', laserActive);
        }

        /********************************************************************
         * 11. FEEDING, LITTER CLEANING & ANTI-SPAM CARE ACTIONS
         ********************************************************************/
        function openFeedingModal() {
            document.getElementById('feeding-modal').classList.remove('hidden');
            document.getElementById('feed-stock-kibble').textContent = state.foodStock;
            document.getElementById('bowl-status-txt').textContent = `Thức ăn: ${Math.round(state.foodBowlPercent)}% • Nước sạch: 100%`;
        }

        function updateFoodBowlVisual() {
            if (foodBowlKibbleMesh) {
                foodBowlKibbleMesh.visible = state.foodBowlPercent > 0;
                foodBowlKibbleMesh.scale.set(1.0, (state.foodBowlPercent / 100) * 1.0, 1.0);
            }
            const bowlTxt = document.getElementById('bowl-status-txt');
            if (bowlTxt) {
                bowlTxt.textContent = `Thức ăn: ${Math.round(state.foodBowlPercent)}% • Nước sạch: 100%`;
            }
        }

        function feedFoodToBowl(foodType) {
            // STRICT FEEDING LIMIT: Cats ONLY eat if hunger < 75%
            const targetCat = state.cats.find(c => c.id === selectedCatId) || state.cats[0];
            if (targetCat && targetCat.hunger >= 75) {
                alert(`😺 ${targetCat.name} đang no bụng (${Math.round(targetCat.hunger)}%) chưa đói đâu sen ơi!\n\nQuy định: Mèo chỉ ăn khi đói dưới 75% để tránh béo phì nhé 💕.`);
                return;
            }

            if (foodType === 'kibble') {
                if (state.foodStock <= 0) { alert('Hết thức ăn hạt rồi! Hãy mua thêm tại Cửa hàng nhé.'); return; }
                state.foodStock--;
            } else if (foodType === 'pate') {
                if (state.coins < 25) { alert('Không đủ xu!'); return; }
                state.coins -= 25;
            } else if (foodType === 'beef') {
                if (state.coins < 35) { alert('Không đủ xu!'); return; }
                state.coins -= 35;
            } else if (foodType === 'churu') {
                if (state.coins < 20) { alert('Không đủ xu!'); return; }
                state.coins -= 20;
            }

            closeModal('feeding-modal');
            state.foodBowlPercent = 100;
            state.hunger = Math.min(100, state.hunger + 30);
            state.stats.fedToday++;
            playCrunchSound();
            updateFoodBowlVisual();

            logActivity(`Đã đổ thức ăn vào khay cho mèo`, '🥫');
            showFloatingNotification(`🥫 ${currentUser} vừa đổ thức ăn thơm phức vào khay! Mèo đang chạy lại măm măm...`, '#10b981', '🥣');

            catActors.forEach(actor => {
                actor.aiState = 'eating';
                actor.stateTimer = 9.0;
                const cData = state.cats.find(c => c.id === actor.id);
                if (cData) {
                    cData.hunger = Math.min(100, cData.hunger + 35);
                    cData.love = Math.min(100, (cData.love || 85) + 5);
                }
            });

            updateUI();
            pushStateToCloud();
        }

        function openLitterModal() {
            document.getElementById('litter-modal').classList.remove('hidden');
            document.getElementById('litter-clean-txt').textContent = `Cát Sạch: ${Math.round(state.litterCleanliness)}%`;
            document.getElementById('litter-clean-bar').style.width = state.litterCleanliness + '%';
        }

        function executeCleanLitter() {
            closeModal('litter-modal');
            state.litterCleanliness = 100;
            state.cleanliness = 100;
            state.stats.cleanedToday++;
            playSandSound();

            if (litterBoxDirtGroup) litterBoxDirtGroup.visible = false;
            logActivity(`Đã dọn sạch cát vệ sinh 100%`, '🧹');
            showFloatingNotification(`✨ ${currentUser} đã xúc sạch cát và rải cát thơm mới 100%!`, '#06b6d4', '🧹');
            updateUI();
            pushStateToCloud();
        }

        function petSelectedCat() {
            const now = Date.now();
            if (now - (state.lastPetTime || 0) < 15000) {
                const waitSec = Math.ceil((15000 - (now - state.lastPetTime)) / 1000);
                showFloatingNotification(`Mèo đang tận hưởng cái vuốt vừa rồi! Đợi ${waitSec}s nữa nhé`, '#f59e0b', '⏳');
                return;
            }
            state.lastPetTime = now;

            const cat = state.cats.find(c => c.id === selectedCatId) || state.cats[0];
            if (!cat) return;
            state.stats.pettedToday++;
            state.coins += 2; // Tiny reward to prevent coin spam
            cat.love = Math.min(100, (cat.love || 85) + 4);
            cat.boredom = Math.max(0, (cat.boredom || 25) - 30);
            playMeowSound(1.25);
            showFloatingNotification(`👋 ${currentUser} vừa vuốt ve ${cat.name}! Bé rừ rừ thích thú (+2🪙)`, '#ec4899', '💖');
            updateUI();
            pushStateToCloud();
        }

        function actionBrush() {
            const now = Date.now();
            if (now - (state.lastBrushTime || 0) < 60000) {
                const waitSec = Math.ceil((60000 - (now - state.lastBrushTime)) / 1000);
                showFloatingNotification(`Lông bé đang mượt tinh tươm rồi! Đợi ${waitSec}s sau hãy chải tiếp nhé`, '#f59e0b', '⏳');
                return;
            }
            state.lastBrushTime = now;

            const targetCat = state.cats.find(c => c.id === selectedCatId) || state.cats[0];
            if (!targetCat) return;

            playPurrSound();
            state.happiness = Math.min(100, state.happiness + 15);
            state.stats.brushedToday++;
            state.coins += 10;

            const actor = catActors.find(a => a.id === targetCat.id);
            if (actor) { actor.aiState = 'lie'; actor.stateTimer = 5; }

            logActivity(`Đã chải lông mượt mà cho ${targetCat.name}`, '🪮');
            showFloatingNotification(`🪮 ${currentUser} đã chải lông mượt mà cho ${targetCat.name}! (+10🪙)`, '#ec4899', '💖');
            updateUI();
            pushStateToCloud();
        }

        /********************************************************************
         * 12. NEIGHBOR CAT GIFTING (IF > 3 CATS)
         ********************************************************************/
        function giftCatToNeighbor(catId) {
            if (state.cats.length <= 3) {
                alert('Chỉ có thể tặng bớt mèo cho hàng xóm khi bạn đang nuôi trên 3 bé mèo nhé!');
                return;
            }
            const cat = state.cats.find(c => c.id === catId);
            if (!cat) return;

            if (confirm(`Bạn có chắc muốn gửi tặng bé mèo "${cat.name}" cho người bạn hàng xóm yêu mèo chăm sóc hộ không?\n\nHàng xóm sẽ gửi lại bạn 250🪙 và thư cảm ơn chân thành!`)) {
                state.cats = state.cats.filter(c => c.id !== catId);
                state.coins += 250;
                playCoinSound();
                rebuildRoomDecorAndCats();
                renderCatsRoster();
                updateUI();
                pushStateToCloud();
                alert(`💌 Người hàng xóm tốt bụng đã nhận nuôi bé "${cat.name}" trong niềm hân hoan và gửi tặng bạn 250 xu!`);
            }
        }

        /********************************************************************
         * 13. ROOM WALL & FLOOR STYLES
         ********************************************************************/
        function switchDecorTab(tab) {
            document.getElementById('dec-tab-items').className = `cozy-btn px-3 py-1 font-black ${tab === 'items' ? 'bg-amber-200' : 'bg-slate-100'}`;
            document.getElementById('dec-tab-styles').className = `cozy-btn px-3 py-1 font-black ${tab === 'styles' ? 'bg-amber-200' : 'bg-slate-100'}`;
            document.getElementById('decor-items-tab').classList.toggle('hidden', tab !== 'items');
            document.getElementById('decor-styles-tab').classList.toggle('hidden', tab !== 'styles');
        }

        function setRoomWallStyle(style) {
            state.wallStyle = style;
            const colors = {
                stripes: '#fff4e2',
                cream: '#fef3c7',
                mint: '#ccfbf1',
                wood: '#fde68a'
            };
            const col = colors[style] || '#fff4e2';
            wallMeshesRef.forEach(m => {
                m.material.color.set(col);
                m.material.needsUpdate = true;
            });
            showFloatingNotification(`🎨 Đã đổi kiểu sơn tường: ${style}!`, '#8b5cf6', '✨');
            saveGameState();
        }

        function setRoomFloorStyle(style) {
            state.floorStyle = style;
            if (!floorMeshRef) return;
            const tints = {
                oak: 0xffffff,
                white_wood: 0xf1f5f9,
                walnut: 0xb45309
            };
            floorMeshRef.material.color.setHex(tints[style] || 0xffffff);
            floorMeshRef.material.needsUpdate = true;
            showFloatingNotification(`🪵 Đã đổi màu sàn gỗ: ${style}!`, '#8b5cf6', '✨');
            saveGameState();
        }

        /********************************************************************
         * 14. DECOR EDIT MODE & SELECTION
         ********************************************************************/
        function enterDecorEditMode() {
            closeModal('decor-modal');
            isDecorEditMode = true;
            document.getElementById('decor-edit-banner').classList.remove('hidden');
            document.getElementById('decor-edit-widget').classList.remove('hidden');
            populateDecorSelectDropdown();
            updateDecorSelectionRing();
            showFloatingNotification('🛠️ Chế độ Sắp Đặt: Kéo chuột trên sàn để di chuyển đồ!', '#8b5cf6', '🪑');
        }

        function exitDecorEditMode() {
            isDecorEditMode = false;
            document.getElementById('decor-edit-banner').classList.add('hidden');
            document.getElementById('decor-edit-widget').classList.add('hidden');
            if (decorSelectionRing) decorSelectionRing.visible = false;
            pushStateToCloud();
            showFloatingNotification('💾 Đã lưu cách sắp đặt phòng!', '#10b981', '✨');
        }

        function populateDecorSelectDropdown() {
            const sel = document.getElementById('decor-picker-select');
            sel.innerHTML = '';
            DECOR_CATALOG.forEach(dec => {
                const opt = document.createElement('option');
                opt.value = dec.id;
                opt.textContent = dec.name;
                if (dec.id === selectedDecorId) opt.selected = true;
                sel.appendChild(opt);
            });
            updateDecorToggleBtn();
        }

        function onDecorSelectChanged() {
            selectedDecorId = document.getElementById('decor-picker-select').value;
            updateDecorSelectionRing();
            updateDecorToggleBtn();
        }

        function selectDecorForEdit(decorId) {
            selectedDecorId = decorId;
            const sel = document.getElementById('decor-picker-select');
            if (sel) sel.value = decorId;
            updateDecorSelectionRing();
            updateDecorToggleBtn();
        }

        function updateDecorSelectionRing() {
            if (!decorSelectionRing) return;
            if (!isDecorEditMode) { decorSelectionRing.visible = false; return; }
            const mesh = decorMeshes[selectedDecorId];
            if (mesh && state.activeDecor.includes(selectedDecorId)) {
                decorSelectionRing.visible = true;
                decorSelectionRing.position.set(mesh.position.x, FLOOR_Y + 0.015, mesh.position.z);
            } else {
                decorSelectionRing.visible = false;
            }
        }

        function updateDecorToggleBtn() {
            const btn = document.getElementById('decor-toggle-btn');
            if (!btn) return;
            const active = state.activeDecor.includes(selectedDecorId);
            btn.textContent = active ? '📦 Cất' : '🪑 Bày';
            btn.className = `cozy-btn px-2.5 py-1 text-xs font-black ${active ? 'bg-rose-100 hover:bg-rose-200' : 'bg-emerald-100 hover:bg-emerald-200'}`;
        }

        function nudgeSelectedDecor(dx, dz) {
            if (!selectedDecorId) return;
            if (!state.decorPositions[selectedDecorId]) {
                state.decorPositions[selectedDecorId] = Object.assign({}, DEFAULT_DECOR_POSITIONS[selectedDecorId] || { x: 0, z: 0, rot: 0 });
            }
            const p = state.decorPositions[selectedDecorId];
            p.x = Math.max(-4.4, Math.min(4.4, +(p.x + dx).toFixed(2)));
            p.z = Math.max(-2.7, Math.min(2.7, +(p.z + dz).toFixed(2)));

            const mesh = decorMeshes[selectedDecorId];
            if (mesh) mesh.position.set(p.x, 0, p.z);
            updateDecorSelectionRing();
            saveGameState();
        }

        function rotateSelectedDecor() {
            if (!selectedDecorId) return;
            if (!state.decorPositions[selectedDecorId]) {
                state.decorPositions[selectedDecorId] = Object.assign({}, DEFAULT_DECOR_POSITIONS[selectedDecorId] || { x: 0, z: 0, rot: 0 });
            }
            const p = state.decorPositions[selectedDecorId];
            p.rot = +( (p.rot || 0) + Math.PI / 4 ).toFixed(3);
            const mesh = decorMeshes[selectedDecorId];
            if (mesh) mesh.rotation.y = p.rot;
            saveGameState();
        }

        function toggleSelectedDecorActive() {
            if (!selectedDecorId) return;
            if (state.activeDecor.includes(selectedDecorId)) {
                state.activeDecor = state.activeDecor.filter(id => id !== selectedDecorId);
            } else {
                state.activeDecor.push(selectedDecorId);
            }
            rebuildRoomDecorAndCats();
            updateDecorToggleBtn();
            saveGameState();
        }

        /********************************************************************
         * 15. UI UPDATES, SHOP & INSPECTOR
         ********************************************************************/
        function updateUI() {
            document.getElementById('coin-count').textContent = state.coins.toLocaleString();
            document.getElementById('room-name-display').textContent = state.roomName;
            document.getElementById('room-sub-info').textContent = `${state.cats.length} bé mèo cưng`;
            document.getElementById('stat-hunger-bar').style.width = state.hunger + '%';
            document.getElementById('stat-hunger-val').textContent = state.hunger + '%';
            document.getElementById('stat-happy-bar').style.width = state.happiness + '%';
            document.getElementById('stat-happy-val').textContent = state.happiness + '%';
            document.getElementById('stat-clean-bar').style.width = state.cleanliness + '%';
            document.getElementById('stat-clean-val').textContent = state.cleanliness + '%';
            document.getElementById('badge-food').textContent = state.foodStock;

            updateInspectorPanel();
            updateMainQuestUI();
        }

        function updateInspectorPanel() {
            const panel = document.getElementById('cat-inspector');
            const cat = state.cats.find(c => c.id === selectedCatId);
            if (!cat) { panel.classList.add('hidden'); return; }
            panel.classList.remove('hidden');

            const breed = CAT_BREEDS.find(b => b.id === cat.breedId) || CAT_BREEDS[0];
            const lvl = CAT_GROWTH_LEVELS[cat.level || 1] || CAT_GROWTH_LEVELS[1];

            document.getElementById('insp-name').textContent = cat.name;
            document.getElementById('insp-breed').textContent = breed.name;
            document.getElementById('insp-level-badge').textContent = lvl.badge;
            document.getElementById('insp-growth-val').textContent = `Lớn: ${Math.round(cat.growthExp || 0)}%`;
            document.getElementById('insp-growth-bar').style.width = (cat.growthExp || 0) + '%';
            document.getElementById('insp-hunger').textContent = Math.round(cat.hunger || 70) + '%';
            document.getElementById('insp-love').textContent = Math.round(cat.love || 85) + '% 💕';
            document.getElementById('insp-hat').textContent = (CAT_ACCESSORIES.find(a => a.id === cat.accessory) || { name: 'Chuông Vàng' }).name;

            const nextExp = 100 - Math.round(cat.growthExp || 0);
            const isFull = (cat.hunger || 0) >= 60 && (cat.love || 0) >= 60;
            document.getElementById('insp-growth-hint').innerHTML = `
                <span>${cat.level < 4 ? `Còn ${nextExp}% lên Cấp ${cat.level + 1}` : 'Cấp Tối Đa!'}</span>
                <span class="${isFull ? 'text-emerald-600 font-black' : 'text-amber-600 font-bold'}">${isFull ? '📈 Đang lớn tự nhiên' : '⚠️ Cần cho ăn & vuốt'}</span>`;
        }

        function closeInspector() {
            document.getElementById('cat-inspector').classList.add('hidden');
        }

        function addCatGrowthExp(catData, amount, reason, silent = false) {
            catData.growthExp = (catData.growthExp || 0) + amount;
            if (catData.growthExp >= 100) {
                if (catData.level < 4) {
                    catData.level++;
                    catData.growthExp -= 100;
                    triggerLevelUpCelebration(catData);
                } else {
                    catData.growthExp = 100;
                }
            }

            catData.scale = getCatScale(catData.level, catData.growthExp);
            const actor = catActors.find(a => a.id === catData.id);
            if (actor) {
                actor.mesh.scale.set(catData.scale, catData.scale, catData.scale);
            }
            if (!silent) updateInspectorPanel();
            saveGameState();
        }

        function triggerLevelUpCelebration(catData) {
            playLevelUpSound();
            fireConfetti();

            const lvlInfo = CAT_GROWTH_LEVELS[catData.level] || CAT_GROWTH_LEVELS[2];
            document.getElementById('levelup-cat-name').textContent = catData.name;
            document.getElementById('levelup-badge-new').textContent = lvlInfo.badge;
            document.getElementById('levelup-desc').textContent = lvlInfo.desc;
            document.getElementById('levelup-modal').classList.remove('hidden');

            state.coins += 100;
            updateUI();
            pushStateToCloud();
        }

        function fireConfetti() {
            const canvas = document.getElementById('confetti-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const particles = [];
            const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
            for (let i = 0; i < 80; i++) {
                particles.push({
                    x: canvas.width / 2, y: canvas.height * 0.4,
                    vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.7) * 15,
                    size: 6 + Math.random() * 7, color: colors[Math.floor(Math.random() * colors.length)],
                    rot: Math.random() * Math.PI, vRot: (Math.random() - 0.5) * 0.2, alpha: 1
                });
            }

            let startT = performance.now();
            function renderConfetti() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                let alive = false;
                particles.forEach(p => {
                    p.x += p.vx; p.y += p.vy; p.vy += 0.35;
                    p.rot += p.vRot; p.alpha -= 0.012;
                    if (p.alpha > 0) {
                        alive = true;
                        ctx.save(); ctx.globalAlpha = Math.max(0, p.alpha);
                        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
                        ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                        ctx.restore();
                    }
                });
                if (alive && performance.now() - startT < 2500) requestAnimationFrame(renderConfetti);
                else ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            requestAnimationFrame(renderConfetti);
        }

        function cycleSelectedCatAccessory() {
            const cat = state.cats.find(c => c.id === selectedCatId) || state.cats[0];
            if (!cat) return;
            const accs = CAT_ACCESSORIES.map(a => a.id);
            const curIdx = accs.indexOf(cat.accessory || 'bell');
            cat.accessory = accs[(curIdx + 1) % accs.length];

            const actor = catActors.find(a => a.id === cat.id);
            if (actor) buildCatAccessoryMesh(actor.accessoryGroup, cat.accessory);
            playCoinSound();
            updateInspectorPanel();
            pushStateToCloud();
        }

        function renameSelectedCat() {
            const cat = state.cats.find(c => c.id === selectedCatId);
            if (!cat) return;
            const n = prompt('Đổi tên bé mèo:', cat.name);
            if (n && n.trim()) {
                cat.name = n.trim();
                updateInspectorPanel();
                pushStateToCloud();
            }
        }

        function openModal(id) {
            document.getElementById(id).classList.remove('hidden');
            if (id === 'shop-modal') renderShop('cats');
            if (id === 'breed-modal') renderCatsRoster();
            if (id === 'decor-modal') renderDecorList();
            if (id === 'couple-modal') initCoupleSelects();
        }

        function closeModal(id) {
            document.getElementById(id).classList.add('hidden');
        }

        function switchShopTab(tab) {
            ['cats', 'decor', 'food'].forEach(t => {
                document.getElementById(`shop-tab-${t}`).className = `cozy-btn px-3 py-1 text-xs font-extrabold ${t === tab ? 'bg-amber-200' : 'bg-slate-100'}`;
            });
            renderShop(tab);
        }

        function renderShop(tab) {
            const area = document.getElementById('shop-content-area');
            area.innerHTML = '';
            if (tab === 'cats') {
                CAT_BREEDS.forEach(breed => {
                    area.innerHTML += `
                        <div class="cozy-card p-2.5 flex justify-between items-center bg-white">
                            <div>
                                <div class="font-black text-xs sm:text-sm">${breed.name}</div>
                                <div class="text-[10px] font-bold text-slate-500">${breed.desc}</div>
                                <div class="text-xs font-black text-amber-600 mt-0.5">🪙 ${breed.price}</div>
                            </div>
                            <button onclick="buyCat('${breed.id}', ${breed.price})" class="cozy-btn px-3 py-1 bg-emerald-400 text-white font-black text-xs">Nuôi</button>
                        </div>`;
                });
            } else if (tab === 'decor') {
                DECOR_CATALOG.forEach(dec => {
                    const owned = state.ownedDecor.includes(dec.id);
                    area.innerHTML += `
                        <div class="cozy-card p-2.5 flex justify-between items-center bg-white">
                            <div>
                                <div class="font-black text-xs sm:text-sm">${dec.name}</div>
                                <div class="text-[10px] font-bold text-slate-500">${dec.desc}</div>
                                <div class="text-xs font-black text-amber-600 mt-0.5">🪙 ${dec.price}</div>
                            </div>
                            <button onclick="buyDecor('${dec.id}', ${dec.price})" class="cozy-btn px-3 py-1 ${owned ? 'bg-slate-300' : 'bg-emerald-400 text-white'} font-black text-xs" ${owned ? 'disabled' : ''}>${owned ? 'Đã có' : 'Mua'}</button>
                        </div>`;
                });
            } else if (tab === 'food') {
                area.innerHTML += `
                    <div class="cozy-card p-2.5 flex justify-between items-center bg-white">
                        <div>
                            <div class="font-black text-xs sm:text-sm">Hũ Hạt Cá Hồi (x5 phần)</div>
                            <div class="text-[10px] font-bold text-slate-500">Thơm giòn cho mèo ăn măm măm</div>
                            <div class="text-xs font-black text-amber-600 mt-0.5">🪙 50</div>
                        </div>
                        <button onclick="buyFood()" class="cozy-btn px-3 py-1 bg-emerald-400 text-white font-black text-xs">Mua ngay</button>
                    </div>`;
            }
        }

        function buyCat(breedId, price) {
            if (state.coins < price) { alert('Không đủ xu!'); return; }
            state.coins -= price;
            const breed = CAT_BREEDS.find(b => b.id === breedId);
            const newCat = {
                id: 'c_' + Date.now(),
                name: breed.name.split(' ')[0],
                breedId,
                hunger: 100,
                happiness: 100,
                love: 100,
                level: 1,
                growthExp: 0,
                scale: 0.58,
                accessory: 'bell'
            };
            state.cats.push(newCat);
            selectedCatId = newCat.id;
            playCoinSound();
            rebuildRoomDecorAndCats();
            updateUI();
            closeModal('shop-modal');
            showFloatingNotification(`🎉 Chúc mừng bạn đã nhận nuôi bé ${newCat.name}!`, '#ec4899', '🐱');
            pushStateToCloud();
        }

        function buyDecor(decorId, price) {
            if (state.coins < price) { alert('Không đủ xu!'); return; }
            state.coins -= price;
            state.ownedDecor.push(decorId);
            state.activeDecor.push(decorId);
            playCoinSound();
            rebuildRoomDecorAndCats();
            updateUI();
            renderShop('decor');
            showFloatingNotification('🪑 Đã mua đồ mới cho mèo! Vào Bày Trí để xếp chỗ', '#8b5cf6', '✨');
            pushStateToCloud();
        }

        function buyFood() {
            if (state.coins < 50) { alert('Không đủ xu!'); return; }
            state.coins -= 50;
            state.foodStock += 5;
            playCoinSound();
            updateUI();
            showFloatingNotification('🥫 Đã mua thêm 5 phần hạt thơm ngon!', '#f59e0b', '🛒');
            pushStateToCloud();
        }

        function renderCatsRoster() {
            const list = document.getElementById('cats-roster-list');
            list.innerHTML = '';
            state.cats.forEach(c => {
                const b = CAT_BREEDS.find(x => x.id === c.breedId) || CAT_BREEDS[0];
                const lvl = CAT_GROWTH_LEVELS[c.level || 1] || CAT_GROWTH_LEVELS[1];
                const canGift = state.cats.length > 3;

                list.innerHTML += `
                    <div class="cozy-card p-2.5 sm:p-3 flex justify-between items-center bg-white gap-2">
                        <div class="flex-1 pr-1">
                            <div class="flex items-center gap-2">
                                <span class="font-black text-xs sm:text-sm">${c.name}</span>
                                <span class="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black">${lvl.badge}</span>
                            </div>
                            <div class="text-[10px] font-bold text-slate-500">${b.name}</div>
                            <div class="stat-bar-track mt-1 w-36 sm:w-44 bg-pink-50">
                                <div class="stat-bar-fill bg-gradient-to-r from-pink-400 to-amber-400" style="width: ${c.growthExp || 0}%"></div>
                            </div>
                            <div class="text-[9px] font-extrabold text-pink-600 mt-0.5">Tiến trình lớn: ${Math.round(c.growthExp || 0)}% (Lớn theo thời gian)</div>
                        </div>
                        <div class="flex flex-col gap-1 items-end">
                            <button onclick="selectCatForInspector('${c.id}')" class="cozy-btn px-2.5 py-1 text-xs font-black bg-amber-100">
                                Chăm sóc
                            </button>
                            ${canGift ? `<button onclick="giftCatToNeighbor('${c.id}')" class="cozy-btn px-2 py-0.5 text-[10px] font-black bg-rose-100 text-rose-800" title="Tặng bớt cho hàng xóm nuôi hộ khi có trên 3 con">🏠 Tặng hàng xóm</button>` : ''}
                        </div>
                    </div>`;
            });
        }

        function selectCatForInspector(catId) {
            selectedCatId = catId;
            closeModal('breed-modal');
            updateInspectorPanel();
        }

        function renderDecorList() {
            const list = document.getElementById('decor-toggle-list');
            list.innerHTML = '';
            DECOR_CATALOG.forEach(dec => {
                const owned = state.ownedDecor.includes(dec.id);
                if (!owned) return;
                const active = state.activeDecor.includes(dec.id);
                list.innerHTML += `
                    <div class="cozy-card p-2 flex justify-between items-center bg-white text-xs">
                        <div>
                            <div class="font-black text-xs">${dec.name}</div>
                            <div class="text-[10px] font-bold text-slate-500">${dec.desc}</div>
                        </div>
                        <button onclick="toggleDecor('${dec.id}')" class="cozy-btn px-2.5 py-1 text-[11px] font-black ${active ? 'bg-emerald-400 text-white' : 'bg-slate-200'}">
                            ${active ? 'Đang bày' : 'Cất kho'}
                        </button>
                    </div>`;
            });
        }

        function toggleDecor(decId) {
            if (state.activeDecor.includes(decId)) {
                state.activeDecor = state.activeDecor.filter(id => id !== decId);
            } else {
                state.activeDecor.push(decId);
            }
            rebuildRoomDecorAndCats();
            renderDecorList();
            pushStateToCloud();
        }

        function initCoupleSelects() {
            const s1 = document.getElementById('couple-cat-1');
            const s2 = document.getElementById('couple-cat-2');
            s1.innerHTML = ''; s2.innerHTML = '';
            const adultCats = state.cats.filter(c => (c.level || 1) >= 3);
            if (adultCats.length === 0) {
                s1.innerHTML = '<option disabled>Chưa có mèo Cấp 3 Trưởng Thành</option>';
                s2.innerHTML = '<option disabled>Hãy chăm sóc mèo lớn lên!</option>';
                return;
            }
            adultCats.forEach(c => {
                s1.innerHTML += `<option value="${c.id}">${c.name}</option>`;
                s2.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
        }

        function executeBreeding() {
            const adultCats = state.cats.filter(c => (c.level || 1) >= 3);
            if (adultCats.length < 2) {
                alert('Cần ít nhất 2 bé mèo đạt Cấp 3 (Trưởng Thành) để ghép đôi sinh mèo con!');
                return;
            }
            if (state.coins < 100) { alert('Cần 100 xu để ghép đôi!'); return; }
            state.coins -= 100;
            const randomBreed = CAT_BREEDS[Math.floor(Math.random() * CAT_BREEDS.length)];
            const babyCat = {
                id: 'baby_' + Date.now(),
                name: 'Boss Con',
                breedId: randomBreed.id,
                hunger: 100,
                happiness: 100,
                love: 100,
                level: 1,
                growthExp: 0,
                scale: 0.55,
                accessory: 'bow'
            };
            state.cats.push(babyCat);
            selectedCatId = babyCat.id;
            playCoinSound();
            rebuildRoomDecorAndCats();
            updateUI();
            closeModal('couple-modal');
            fireConfetti();
            alert('🎉 Chúc mừng Lina & Qwan đã chào đón thêm một bé mèo con siêu đáng yêu!');
            pushStateToCloud();
        }

        function updateMainQuestUI() {
            const q = MAIN_QUESTS[state.mainQuestIdx];
            if (!q) {
                document.getElementById('main-quest-title').textContent = 'Hoàn thành tất cả nhiệm vụ!';
                document.getElementById('main-quest-desc').textContent = 'Bạn là người chăm sóc mèo tuyệt vời!';
                document.getElementById('claim-main-quest-btn').classList.add('hidden');
                return;
            }
            const prog = q.check(state);
            document.getElementById('main-quest-step').textContent = `NHIỆM VỤ ${state.mainQuestIdx + 1}/${MAIN_QUESTS.length}`;
            document.getElementById('main-quest-title').textContent = q.title;
            document.getElementById('main-quest-desc').textContent = q.desc;
            document.getElementById('main-quest-prog').textContent = `${Math.min(prog.cur, prog.max)}/${prog.max}`;
            document.getElementById('main-quest-reward').textContent = `🪙${q.reward}`;
            const pct = Math.min(100, (prog.cur / prog.max) * 100);
            document.getElementById('main-quest-bar').style.width = pct + '%';

            const claimBtn = document.getElementById('claim-main-quest-btn');
            if (prog.cur >= prog.max) claimBtn.classList.remove('hidden');
            else claimBtn.classList.add('hidden');
        }

        function claimMainQuest() {
            const q = MAIN_QUESTS[state.mainQuestIdx];
            if (!q) return;
            state.coins += q.reward;
            state.mainQuestIdx++;
            playCoinSound();
            fireConfetti();
            updateUI();
            pushStateToCloud();
            showFloatingNotification('🎁 Đã nhận thưởng nhiệm vụ thành công!', '#10b981', '🪙');
        }

        function renameRoomPrompt() {
            const n = prompt('Nhập tên mới cho phòng mèo:', state.roomName);
            if (n && n.trim()) {
                state.roomName = n.trim();
                updateUI();
                pushStateToCloud();
            }
        }

        function onWindowResize() {
            fitCamera();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        
        /********************************************************************
         * GAME SETTINGS & VOLUME CONTROLS
         ********************************************************************/
        function openSettingsModal() {
            state.settings = state.settings || { masterVol: 0.8, sfxVol: 0.85, ambientVol: 0.5, muted: false, autoMeow: true };
            document.getElementById('slider-master-vol').value = Math.round((state.settings.masterVol !== undefined ? state.settings.masterVol : 0.8) * 100);
            document.getElementById('slider-sfx-vol').value = Math.round((state.settings.sfxVol !== undefined ? state.settings.sfxVol : 0.85) * 100);
            document.getElementById('slider-ambient-vol').value = Math.round((state.settings.ambientVol !== undefined ? state.settings.ambientVol : 0.5) * 100);
            document.getElementById('val-master-vol').textContent = document.getElementById('slider-master-vol').value + '%';
            document.getElementById('val-sfx-vol').textContent = document.getElementById('slider-sfx-vol').value + '%';
            document.getElementById('val-ambient-vol').textContent = document.getElementById('slider-ambient-vol').value + '%';
            document.getElementById('chk-sound-mute').checked = !!state.settings.muted;
            document.getElementById('chk-auto-meow').checked = state.settings.autoMeow !== false;
            document.getElementById('settings-modal').classList.remove('hidden');
        }

        function onSettingsVolumeChange() {
            initAudio();
            state.settings = state.settings || {};
            const m = parseInt(document.getElementById('slider-master-vol').value) / 100;
            const s = parseInt(document.getElementById('slider-sfx-vol').value) / 100;
            const a = parseInt(document.getElementById('slider-ambient-vol').value) / 100;

            state.settings.masterVol = m;
            state.settings.sfxVol = s;
            state.settings.ambientVol = a;

            document.getElementById('val-master-vol').textContent = Math.round(m * 100) + '%';
            document.getElementById('val-sfx-vol').textContent = Math.round(s * 100) + '%';
            document.getElementById('val-ambient-vol').textContent = Math.round(a * 100) + '%';

            if (masterGain && audioCtx) {
                masterGain.gain.setValueAtTime(state.settings.muted ? 0 : m, audioCtx.currentTime);
                sfxGain.gain.setValueAtTime(s, audioCtx.currentTime);
                ambientGain.gain.setValueAtTime(a, audioCtx.currentTime);
            }
            saveGameState();
        }

        function onSettingsMuteToggle() {
            initAudio();
            state.settings = state.settings || {};
            state.settings.muted = document.getElementById('chk-sound-mute').checked;
            if (masterGain && audioCtx) {
                masterGain.gain.setValueAtTime(state.settings.muted ? 0 : (state.settings.masterVol || 0.8), audioCtx.currentTime);
            }
            saveGameState();
        }

        function resetGamePrompt() {
            if (confirm('Bạn có chắc muốn xóa toàn bộ dữ liệu để bắt đầu căn phòng mèo mới tinh từ đầu không?')) {
                localStorage.removeItem('meowlator_wife_state_v7');
                location.reload();
            }
        }

        // SPONTANEOUS REALISTIC MEOWING (EVERY 22-38 SECONDS)
        let lastAutoMeowTime = Date.now();
        function processSpontaneousCatMeowing() {
            if (state.settings && state.settings.autoMeow === false) return;
            const now = Date.now();
            if (now - lastAutoMeowTime > (22000 + Math.random() * 16000)) {
                lastAutoMeowTime = now;
                if (catActors.length > 0) {
                    const randomActor = catActors[Math.floor(Math.random() * catActors.length)];
                    const types = ['trill', 'meow', 'kitten', 'sigh'];
                    const chosen = types[Math.floor(Math.random() * types.length)];
                    const bubbleIcons = { trill: '🐾 Mrrrp~', meow: '💖 Meoow~', kitten: '✨ Mew!', sigh: '💤 Hzzz' };
                    playRealisticMeow(chosen);
                    showFloatingNotification(`${randomActor.data.name}: ${bubbleIcons[chosen]}`, '#ec4899', '🐱');
                }
            }
        }

        window.onload = function () {
            startLiveCloudListener();
            loadGameState();
            checkUserLogin();
            applySidePanelStates();
            initThreeScene();
            updateRealTimeAndWeather();
            setInterval(updateRealTimeAndWeather, 15000);
            setInterval(updateLivePresenceUI, 8000);
            setInterval(() => syncWithCloud(false), 20000); // Background sync between Lina & Qwan
            updateUI();
            requestAnimationFrame(animateLoop);
        };
    