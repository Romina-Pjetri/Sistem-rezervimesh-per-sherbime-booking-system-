/* ================================================================
   GLOW & RELAX — main.js
   Global Controller for Landing Page, User Dashboard & Admin Panel
   Nested Sub-Services Architecture
   ================================================================ */

// ========================
// 1. DATA LAYER (localStorage)
// ========================

// Default services with NESTED sub-services
const DEFAULT_SERVICES = [
    {
        id: 1,
        category: 'Hair Styling',
        icon: '💇‍♀️',
        subServices: [
            { name: 'Haircut', price: 20 },
            { name: 'Hair Color', price: 50 },
            { name: 'Blowout & Styling', price: 30 },
            { name: 'Deep Conditioning', price: 35 }
        ]
    },
    {
        id: 2,
        category: 'Nail Art',
        icon: '💅',
        subServices: [
            { name: 'Classic Manicure', price: 20 },
            { name: 'Gel Manicure', price: 35 },
            { name: 'Classic Pedicure', price: 25 },
            { name: 'Nail Art Design', price: 40 }
        ]
    },
    {
        id: 3,
        category: 'Spa & Massage',
        icon: '🧖‍♀️',
        subServices: [
            { name: 'Swedish Massage', price: 60 },
            { name: 'Deep Tissue Massage', price: 80 },
            { name: 'Hot Stone Therapy', price: 90 },
            { name: 'Couples Massage', price: 120 }
        ]
    },
    {
        id: 4,
        category: 'Facial Treatment',
        icon: '🧴',
        subServices: [
            { name: 'Classic Facial', price: 45 },
            { name: 'Anti-Aging Facial', price: 65 },
            { name: 'Hydrating Facial', price: 55 },
            { name: 'Acne Treatment', price: 50 }
        ]
    },
    {
        id: 5,
        category: 'Aromatherapy',
        icon: '🌿',
        subServices: [
            { name: 'Essential Oil Session', price: 40 },
            { name: 'Aroma Massage', price: 55 },
            { name: 'Stress Relief Package', price: 70 }
        ]
    },
    {
        id: 6,
        category: 'Body Scrub',
        icon: '✨',
        subServices: [
            { name: 'Salt Scrub', price: 35 },
            { name: 'Sugar Glow Scrub', price: 40 },
            { name: 'Coffee Exfoliation', price: 45 },
            { name: 'Full Body Polish', price: 60 }
        ]
    }
];

// Admin credentials (hardcoded)
const ADMIN_EMAIL = 'meginako2@gmail.com';
const ADMIN_PASSWORD = 'meginako123';
const API_BASE_URL = location.protocol === 'file:' ? 'http://127.0.0.1:8000/' : '';

// Load data from localStorage or use defaults
let services = JSON.parse(localStorage.getItem('services')) || JSON.parse(JSON.stringify(DEFAULT_SERVICES));
let reservations = JSON.parse(localStorage.getItem('reservations')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];

// Migration check: if old flat services are detected, replace with nested format
if (services.length > 0 && services[0].name && !services[0].category) {
    services = JSON.parse(JSON.stringify(DEFAULT_SERVICES));
    localStorage.setItem('services', JSON.stringify(services));
}

// Ensure admin is always in users array
if (!users.find(u => u.email === ADMIN_EMAIL)) {
    users.push({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
    localStorage.setItem('users', JSON.stringify(users));
}

// Get current session
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser'));
    } catch (e) {
        return null;
    }
}

// Save all data
function saveData() {
    localStorage.setItem('services', JSON.stringify(services));
    localStorage.setItem('reservations', JSON.stringify(reservations));
    localStorage.setItem('users', JSON.stringify(users));
}

// Helper: get price range string for a category
function getPriceRange(subServices) {
    if (!subServices || subServices.length === 0) return '—';
    const prices = subServices.map(s => s.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `${min}€` : `${min}€ — ${max}€`;
}


// ========================
// 2. TOAST NOTIFICATION
// ========================

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 3000);
}


// ========================
// 3. AUTH SYSTEM
// ========================

function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginBtn = document.getElementById('loginTabBtn');
    const signupBtn = document.getElementById('signupTabBtn');
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const prompt = document.getElementById('switchPrompt');
    const msg = document.getElementById('authMessage');

    if (!loginForm || !signupForm) return;

    if (msg) { msg.textContent = ''; msg.className = 'auth-message'; }

    if (tab === 'signup') {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        loginBtn.classList.remove('active');
        signupBtn.classList.add('active');
        if (title) title.textContent = 'Create Account';
        if (subtitle) subtitle.textContent = 'Join our wellness community';
        if (prompt) prompt.innerHTML = 'Already have an account? <a href="#" onclick="switchAuthTab(\'login\'); return false;">Login</a>';
    } else {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        loginBtn.classList.add('active');
        signupBtn.classList.remove('active');
        if (title) title.textContent = 'Welcome Back';
        if (subtitle) subtitle.textContent = 'Please enter your details to continue';
        if (prompt) prompt.innerHTML = 'Don\'t have an account? <a href="#" onclick="switchAuthTab(\'signup\'); return false;">Sign up</a>';
    }
}

function showAuthMessage(text, type) {
    const msg = document.getElementById('authMessage');
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'auth-message ' + (type === 'error' ? 'auth-error' : 'auth-success');
}

// Login Form Handler
const loginFormEl = document.getElementById('loginForm');
if (loginFormEl) {
    loginFormEl.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_BASE_URL}auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok || data.status !== 'ok') {
                throw new Error(data.message || 'Invalid email or password.');
            }

            const userObj = { email: data.user.email, role: data.user.role };
            localStorage.setItem('currentUser', JSON.stringify(userObj));
            window.location.href = data.user.role === 'admin' ? 'dashboard-admin.html' : 'dashboard-user.html';
        } catch (err) {
            console.error(err);
            showAuthMessage(err.message, 'error');
        }
    });
}

// Sign Up Form Handler
const signupFormEl = document.getElementById('signupForm');
if (signupFormEl) {
    signupFormEl.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const password = document.getElementById('signupPassword').value;
        const confirm = document.getElementById('signupConfirm').value;

        if (password.length < 6) {
            showAuthMessage('Password must be at least 6 characters.', 'error');
            return;
        }

        if (password !== confirm) {
            showAuthMessage('Passwords do not match!', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'signup',
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok || data.status !== 'ok') {
                throw new Error(data.message || 'Account could not be created.');
            }

            users.push({ email: email, password: password, role: 'user' });
            saveData();

            showAuthMessage('Account created successfully! You can now login.', 'success');
            signupFormEl.reset();
            setTimeout(() => switchAuthTab('login'), 1500);
        } catch (err) {
            console.error(err);
            showAuthMessage(err.message, 'error');
        }
    });
}

// Logout
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}


// ========================
// 4. LANDING PAGE LOGIC
// ========================

function handleBooking(categoryName) {
    const currentUser = getCurrentUser();

    if (currentUser) {
        window.location.href = 'dashboard-user.html';
    } else {
        openLoginModal();
    }
}

function openLoginModal() {
    const modal = document.getElementById('loginRequiredModal');
    if (modal) modal.style.display = 'flex';
}

function closeLoginModal() {
    const modal = document.getElementById('loginRequiredModal');
    if (modal) modal.style.display = 'none';
}

// Render service CATEGORIES on the Homepage
function renderHomeServices() {
    const grid = document.getElementById('homeServicesGrid');
    if (!grid) return;

    grid.innerHTML = services.map(s => `
        <div class="service-card">
            <div class="service-icon">${s.icon}</div>
            <h3>${s.category}</h3>
            <div class="sub-services-preview">
                ${s.subServices.slice(0, 3).map(sub =>
                    `<span class="sub-tag">${sub.name} <em>${sub.price}€</em></span>`
                ).join('')}
                ${s.subServices.length > 3 ? `<span class="sub-tag more">+${s.subServices.length - 3} more</span>` : ''}
            </div>
            <div class="service-price">${getPriceRange(s.subServices)}</div>
            <button onclick="handleBooking('${s.category.replace(/'/g, "\\'")}')" class="book-btn">Book Now</button>
        </div>
    `).join('');
}


// ========================
// 5. USER DASHBOARD LOGIC
// ========================

let selectedCategoryId = null;

// Render categories on the User Dashboard
function renderUserServices() {
    const grid = document.getElementById('userServicesGrid');
    if (!grid) return;

    grid.innerHTML = services.map(s => `
        <div class="service-card">
            <div class="service-icon">${s.icon}</div>
            <h3>${s.category}</h3>
            <div class="sub-services-preview">
                ${s.subServices.slice(0, 3).map(sub =>
                    `<span class="sub-tag">${sub.name} <em>${sub.price}€</em></span>`
                ).join('')}
                ${s.subServices.length > 3 ? `<span class="sub-tag more">+${s.subServices.length - 3} more</span>` : ''}
            </div>
            <div class="service-price">${getPriceRange(s.subServices)}</div>
            <button onclick="openBooking(${s.id})" class="book-btn">Book Now</button>
        </div>
    `).join('');
}

// Open Booking Modal with sub-service dropdown
function openBooking(categoryId) {
    selectedCategoryId = categoryId;
    const category = services.find(s => s.id === categoryId);
    if (!category) return;

    const modal = document.getElementById('bookingModal');
    const title = document.getElementById('modalTitle');
    const subSelect = document.getElementById('subServiceSelect');
    const priceDisplay = document.getElementById('selectedPrice');

    if (!modal) return;

    if (title) title.innerText = `Book ${category.category}`;

    // Populate sub-services dropdown
    if (subSelect) {
        subSelect.innerHTML = '<option value="">— Choose a treatment —</option>';
        category.subServices.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub.name;
            option.setAttribute('data-price', sub.price);
            option.textContent = `${sub.name} — ${sub.price}€`;
            subSelect.appendChild(option);
        });

        // Reset the price display
        if (priceDisplay) {
            priceDisplay.textContent = '';
            priceDisplay.style.display = 'none';
        }
    }

    // Auto-fill email
    const currentUser = getCurrentUser();
    const emailInput = document.getElementById('userEmail');
    if (emailInput && currentUser) emailInput.value = currentUser.email;

    // Set minimum date to today
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = '';
    }

    // Reset time
    const timeSelect = document.getElementById('bookingTime');
    if (timeSelect) timeSelect.value = '';

    modal.style.display = 'flex';
}

// Handle sub-service selection → show price dynamically
function onSubServiceChange() {
    const subSelect = document.getElementById('subServiceSelect');
    const priceDisplay = document.getElementById('selectedPrice');

    if (!subSelect || !priceDisplay) return;

    const selectedOption = subSelect.options[subSelect.selectedIndex];
    if (selectedOption && selectedOption.value) {
        const price = selectedOption.getAttribute('data-price');
        priceDisplay.textContent = `Price: ${price}€`;
        priceDisplay.style.display = 'block';
    } else {
        priceDisplay.textContent = '';
        priceDisplay.style.display = 'none';
    }
}

function closeBooking() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.style.display = 'none';
}

// Render user's own bookings
function renderUserBookings() {
    const tbody = document.getElementById('userBookingsBody');
    if (!tbody) return;

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const myBookings = reservations.filter(r => r.email === currentUser.email);

    if (myBookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #aaa;">
                    <div style="font-size: 2rem; margin-bottom: 8px;">📭</div>
                    No bookings yet. Browse services above to book your first appointment!
                </td>
            </tr>
        `;
        return;
    }

    myBookings.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    tbody.innerHTML = myBookings.map(r => `
        <tr>
            <td>${r.service}</td>
            <td>${r.subService || '—'}</td>
            <td>${r.date} | ${r.time}</td>
            <td><strong style="color: var(--gold-dark);">${r.price ? r.price + '€' : '—'}</strong></td>
            <td><span class="booking-status">Confirmed</span></td>
        </tr>
    `).join('');
}

// Handle Reservation Form Submission
const reservationForm = document.getElementById('reservationForm');
if (reservationForm) {
    reservationForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('userEmail').value;
        const date = document.getElementById('bookingDate').value;
        const time = document.getElementById('bookingTime').value;
        const subSelect = document.getElementById('subServiceSelect');

        if (!subSelect || !subSelect.value) {
            showToast('Please select a treatment.', 'error');
            return;
        }

        if (!date || !time) {
            showToast('Please select both a date and time.', 'error');
            return;
        }

        const selectedOption = subSelect.options[subSelect.selectedIndex];
        const subServiceName = selectedOption.value;
        const price = parseInt(selectedOption.getAttribute('data-price'));
        const category = services.find(s => s.id === selectedCategoryId);
        const categoryName = category ? category.category : 'Unknown';

        const reservation = {
            email: email,
            service: categoryName,
            subService: subServiceName,
            price: price,
            date: date,
            time: time
        };

        try {
            const response = await fetch('add_reservation.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reservation)
            });

           const data = await response.json();

// kontrolli i ri
if (data.status === "occupied") {
    showToast("The selected time slot is no longer available. Please choose a different time. ❌", "error");
    return;
}

if (!response.ok || data.status !== 'ok') {
    throw new Error(data.message || 'Reservation could not be saved.');
}

            reservations.push({
                id: data.id || Date.now(),
                ...reservation
            });
            saveData();

            showToast(`Your ${subServiceName} appointment is confirmed for ${date} at ${time}!`, 'success');

            closeBooking();
            reservationForm.reset();

            // Re-fill email for next booking
            const currentUser = getCurrentUser();
            const emailInput = document.getElementById('userEmail');
            if (emailInput && currentUser) emailInput.value = currentUser.email;

            renderUserBookings();
        } catch (err) {
            console.error(err);
            const isStaticPage = location.protocol === 'file:' || ['5500', '5501'].includes(location.port);
            const message = isStaticPage
                ? 'Open the site through XAMPP/PHP, not Live Server or file://, so reservations can reach add_reservation.php.'
                : err.message;
            showToast(`Reservation was not saved: ${message}`, 'error');
        }
    });
}


// ========================
// 6. ADMIN DASHBOARD LOGIC
// ========================

// Sidebar section toggle
function showSection(section) {
    const resSec = document.getElementById('reservations-section');
    const servSec = document.getElementById('services-section');

    if (!resSec || !servSec) return;

    resSec.style.display = section === 'reservations' ? 'block' : 'none';
    servSec.style.display = section === 'services-manage' ? 'block' : 'none';

    document.getElementById('link-res').classList.toggle('active', section === 'reservations');
    document.getElementById('link-serv').classList.toggle('active', section === 'services-manage');

    if (section === 'reservations') renderAdminReservations();
    else renderAdminServices();
}

// Render Reservations Table (now shows sub-service + price)
function renderAdminReservations() {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;

    if (reservations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 50px; color: #aaa;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">📭</div>
                    No appointments yet. Reservations will appear here when users book services.
                </td>
            </tr>
        `;
        return;
    }

    reservations.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    tbody.innerHTML = reservations.map(res => `
        <tr>
            <td>${res.email}</td>
            <td>
                <strong>${res.service}</strong>
                ${res.subService ? `<br><span style="font-size:0.8rem; color:var(--grey-text);">${res.subService} — ${res.price}€</span>` : ''}
            </td>
            <td>${res.date} | ${res.time}</td>
            <td>
                <button class="edit-btn" onclick="editReservation(${res.id})">Edit</button>
                <button class="delete-btn" onclick="deleteReservation(${res.id})">Cancel</button>
            </td>
        </tr>
    `).join('');
}

// Edit Reservation
function editReservation(id) {
    const res = reservations.find(r => r.id === id);
    if (!res) return;

    const modal = document.getElementById('adminModal');
    const inputArea = document.getElementById('modalInputs');
    const title = document.getElementById('adminModalTitle');

    title.innerText = `Edit Reservation — ${res.subService || res.service}`;
    inputArea.innerHTML = `
        <input type="hidden" id="editResId" value="${res.id}">
        <div class="input-group">
            <label>Customer Email</label>
            <input type="email" value="${res.email}" readonly style="background: #f5f5f5; cursor: not-allowed;">
        </div>
        <div class="input-group">
            <label>Service</label>
            <input type="text" value="${res.service}${res.subService ? ' → ' + res.subService : ''}" readonly style="background: #f5f5f5; cursor: not-allowed;">
        </div>
        <div class="input-group">
            <label>Date</label>
            <input type="date" id="editResDate" value="${res.date}" required>
        </div>
        <div class="input-group">
            <label>Time</label>
            <select id="editResTime" required>
                <option value="09:00" ${res.time === '09:00' ? 'selected' : ''}>09:00 AM</option>
                <option value="10:00" ${res.time === '10:00' ? 'selected' : ''}>10:00 AM</option>
                <option value="11:00" ${res.time === '11:00' ? 'selected' : ''}>11:00 AM</option>
                <option value="13:00" ${res.time === '13:00' ? 'selected' : ''}>01:00 PM</option>
                <option value="14:00" ${res.time === '14:00' ? 'selected' : ''}>02:00 PM</option>
                <option value="15:00" ${res.time === '15:00' ? 'selected' : ''}>03:00 PM</option>
                <option value="16:00" ${res.time === '16:00' ? 'selected' : ''}>04:00 PM</option>
                <option value="17:00" ${res.time === '17:00' ? 'selected' : ''}>05:00 PM</option>
            </select>
        </div>
    `;

    modal.style.display = 'flex';

    document.getElementById('adminForm').onsubmit = function (e) {
        e.preventDefault();
        const idx = reservations.findIndex(r => r.id === id);
        if (idx === -1) return;

        reservations[idx].date = document.getElementById('editResDate').value;
        reservations[idx].time = document.getElementById('editResTime').value;

        saveData();
        closeAdminModal();
        renderAdminReservations();
        showToast('Reservation updated successfully!', 'success');
    };
}

// Delete / Cancel Reservation
function deleteReservation(id) {
    if (confirm('Are you sure you want to cancel this reservation?')) {
        reservations = reservations.filter(r => r.id !== id);
        saveData();
        renderAdminReservations();
        showToast('Reservation cancelled.', 'info');
    }
}

// Render Admin Services Grid (shows categories with sub-service count)
function renderAdminServices() {
    const grid = document.getElementById('adminServicesGrid');
    if (!grid) return;

    if (services.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">🛠️</div>
                <p>No services yet. Click "+ Add New Category" to get started.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = services.map(s => `
        <div class="admin-service-card">
            <div class="card-icon">${s.icon}</div>
            <h3>${s.category}</h3>
            <div class="card-price">${getPriceRange(s.subServices)}</div>
            <div class="sub-services-list">
                ${s.subServices.map(sub =>
                    `<div class="sub-item"><span>${sub.name}</span><span class="sub-price">${sub.price}€</span></div>`
                ).join('')}
            </div>
            <div style="margin-top: 14px;">
                <button class="edit-btn" onclick="openServiceModal(${s.id})">Edit</button>
                <button class="delete-btn" onclick="deleteService(${s.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// ========================
// ADMIN: SERVICE MODAL (Add/Edit with dynamic sub-service rows)
// ========================

let subServiceCounter = 0;

function openServiceModal(id = null) {
    const modal = document.getElementById('adminModal');
    const inputArea = document.getElementById('modalInputs');
    const title = document.getElementById('adminModalTitle');

    const service = id ? services.find(s => s.id === id) : null;
    const isEdit = !!service;

    title.innerText = isEdit ? `Edit: ${service.category}` : 'Add New Category';

    const existingSubs = isEdit ? service.subServices : [{ name: '', price: '' }];
    subServiceCounter = 0;

    inputArea.innerHTML = `
        <input type="hidden" id="serviceId" value="${id || ''}">
        <div class="input-group">
            <label>Category Name</label>
            <input type="text" id="sCat" value="${isEdit ? service.category : ''}" placeholder="e.g., Hair Styling" required>
        </div>
        <div class="input-group">
            <label>Icon (Emoji)</label>
            <input type="text" id="sIcon" value="${isEdit ? service.icon : '✨'}" placeholder="e.g., 💇" required>
        </div>
        <div class="sub-services-section">
            <div class="sub-services-header">
                <label>Sub-Services (Name + Price)</label>
                <button type="button" class="add-sub-btn" onclick="addSubServiceRow()">+ Add Sub-Service</button>
            </div>
            <div id="subServicesContainer">
                ${existingSubs.map(sub => createSubServiceRowHTML(sub.name, sub.price)).join('')}
            </div>
        </div>
    `;

    modal.style.display = 'flex';

    document.getElementById('adminForm').onsubmit = function (e) {
        e.preventDefault();

        const sId = document.getElementById('serviceId').value;
        const category = document.getElementById('sCat').value.trim();
        const icon = document.getElementById('sIcon').value.trim();

        // Gather all sub-service rows
        const subRows = document.querySelectorAll('.sub-service-row');
        const subServices = [];
        let hasError = false;

        subRows.forEach(row => {
            const nameInput = row.querySelector('.sub-name');
            const priceInput = row.querySelector('.sub-price-input');
            const name = nameInput.value.trim();
            const price = parseInt(priceInput.value);

            if (name && !isNaN(price) && price >= 0) {
                subServices.push({ name: name, price: price });
            } else if (name || priceInput.value) {
                hasError = true;
            }
        });

        if (subServices.length === 0) {
            showToast('Please add at least one sub-service with a name and price.', 'error');
            return;
        }

        if (hasError) {
            showToast('Some sub-services have incomplete data. Please fix or remove them.', 'error');
            return;
        }

        const newService = {
            id: sId ? parseInt(sId) : Date.now(),
            category: category,
            icon: icon,
            subServices: subServices
        };

        if (sId) {
            const index = services.findIndex(s => s.id === parseInt(sId));
            if (index !== -1) services[index] = newService;
            showToast(`"${category}" updated successfully!`, 'success');
        } else {
            services.push(newService);
            showToast(`"${category}" added successfully!`, 'success');
        }

        saveData();
        closeAdminModal();
        renderAdminServices();
    };
}

// Create a single sub-service input row (HTML string)
function createSubServiceRowHTML(name, price) {
    subServiceCounter++;
    return `
        <div class="sub-service-row" id="subRow-${subServiceCounter}">
            <input type="text" class="sub-name" value="${name || ''}" placeholder="Treatment name">
            <input type="number" class="sub-price-input" value="${price || ''}" placeholder="Price (€)" min="0" step="1">
            <button type="button" class="remove-sub-btn" onclick="removeSubServiceRow('subRow-${subServiceCounter}')" title="Remove">✕</button>
        </div>
    `;
}

// Dynamically add a new sub-service row
function addSubServiceRow() {
    const container = document.getElementById('subServicesContainer');
    if (!container) return;
    subServiceCounter++;
    const row = document.createElement('div');
    row.className = 'sub-service-row';
    row.id = `subRow-${subServiceCounter}`;
    row.innerHTML = `
        <input type="text" class="sub-name" value="" placeholder="Treatment name">
        <input type="number" class="sub-price-input" value="" placeholder="Price (€)" min="0" step="1">
        <button type="button" class="remove-sub-btn" onclick="removeSubServiceRow('subRow-${subServiceCounter}')" title="Remove">✕</button>
    `;
    container.appendChild(row);

    // Animate in
    row.style.opacity = '0';
    row.style.transform = 'translateY(-10px)';
    requestAnimationFrame(() => {
        row.style.transition = 'all 0.25s ease';
        row.style.opacity = '1';
        row.style.transform = 'translateY(0)';
    });
}

// Remove a sub-service row
function removeSubServiceRow(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const container = document.getElementById('subServicesContainer');
    if (container && container.children.length <= 1) {
        showToast('A category must have at least one sub-service.', 'error');
        return;
    }

    row.style.transition = 'all 0.25s ease';
    row.style.opacity = '0';
    row.style.transform = 'translateX(20px)';
    setTimeout(() => row.remove(), 250);
}

// Delete Service Category
function deleteService(id) {
    const service = services.find(s => s.id === id);
    const name = service ? service.category : 'this category';

    if (confirm(`Delete "${name}" and all its sub-services? This affects all users.`)) {
        services = services.filter(s => s.id !== id);
        saveData();
        renderAdminServices();
        showToast(`"${name}" has been deleted.`, 'info');
    }
}

// Close Admin Modal
function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.style.display = 'none';
}


// ========================
// 7. GLOBAL MODAL CONTROLLER
// ========================

window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};


// ========================
// 8. NAVBAR SCROLL EFFECT
// ========================

window.addEventListener('scroll', function () {
    const nav = document.getElementById('mainNav');
    if (nav) {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }
});


// ========================
// 9. WINDOW ONLOAD — Dynamic Rendering
// ========================

window.onload = function () {
    // --- Landing Page ---
    renderHomeServices();

    // --- User Dashboard ---
    renderUserServices();
    renderUserBookings();

    const welcomeEl = document.getElementById('welcomeUser');
    const currentUser = getCurrentUser();
    if (welcomeEl && currentUser) {
        welcomeEl.textContent = `Welcome, ${currentUser.email}`;
    }

    const emailInput = document.getElementById('userEmail');
    if (emailInput && currentUser) {
        emailInput.value = currentUser.email;
    }

    // --- Admin Dashboard ---
    renderAdminReservations();
    renderAdminServices();
};
