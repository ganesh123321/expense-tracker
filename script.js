// Clean Refactored Javascript
if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
}

const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');

const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

let expensePieChartInstance = null;
let spendingBarChartInstance = null;
let currentFilter = 'all'; 
let transactionToDelete = null;

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
// Migrate old data
transactions = transactions.map(t => ({
    ...t,
    category: t.category || 'Others',
    date: t.date || new Date().toISOString().split('T')[0]
}));

function getFilteredData() {
    let timeFilter = localStorage.getItem('timeFilter') || 'month';
    if (timeFilter === '30') timeFilter = 'month';
    if (timeFilter === 'all') return transactions;
    const now = new Date();
    let pastDate = new Date();
    pastDate.setHours(0,0,0,0);
    if (timeFilter === 'month') {
        pastDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeFilter === '180') {
        pastDate.setDate(now.getDate() - 180);
    } else if (timeFilter === '365') {
        pastDate.setDate(now.getDate() - 365);
    }
    // Filter by comparing dates
    return transactions.filter(t => new Date(t.date) >= pastDate);
}

function generateID() { return Math.floor(Math.random() * 10000000).toString(); }
function formatNumber(num) { return Math.abs(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

function showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `px-6 py-3 rounded-lg text-white font-medium shadow-lg transition-opacity duration-300 ${isError ? 'bg-red-500' : 'bg-green-500'}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function addTransaction(e) {
    e.preventDefault();
    const transaction = {
        id: generateID(),
        text: text.value.trim(),
        amount: parseFloat(amount.value),
        category: categoryInput.value,
        date: dateInput.value
    };
    transactions.push(transaction);
    updateLocalStorage();
    renderApp();
    showToast('Transaction added successfully!');
    text.value = ''; amount.value = ''; text.focus();
}

window.initiateDelete = (id) => {
    transactionToDelete = id;
    deleteModal.classList.remove('hidden');
};

const closeDeleteModal = () => {
    transactionToDelete = null;
    deleteModal.classList.add('hidden');
};

const confirmDelete = () => {
    if(!transactionToDelete) return;
    transactions = transactions.filter(t => String(t.id) !== String(transactionToDelete));
    updateLocalStorage();
    renderApp();
    showToast('Transaction deleted', true);
    closeDeleteModal();
};

function renderList() {
    list.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase();
    
    let filtered = getFilteredData().filter(t => t.text.toLowerCase().includes(searchTerm));
    if (currentFilter === 'income') filtered = filtered.filter(t => t.amount > 0);
    else if (currentFilter === 'expense') filtered = filtered.filter(t => t.amount < 0);
    else if (currentFilter.startsWith('cat-')) filtered = filtered.filter(t => t.category === currentFilter.replace('cat-', ''));

    if (filtered.length === 0) {
        list.innerHTML = '<div class="text-center text-gray-400 py-6">No transactions found</div>';
        return;
    }

    const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    sorted.forEach(t => {
        const isInc = t.amount > 0;
        const color = isInc ? 'text-inc' : 'text-exp';
        const bg = isInc ? 'bg-green-50' : 'bg-red-50';
        
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center p-3 border rounded-xl hover:shadow-sm transition group';
        li.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="${bg} ${color} w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    ${t.category.substring(0,2).toUpperCase()}
                </div>
                <div>
                    <p class="font-bold text-gray-800">${t.text}</p>
                    <p class="text-xs text-gray-500">${t.category} • ${t.date}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-bold ${color}">${isInc?'+':'-'}₹${formatNumber(t.amount)}</span>
                <button onclick="initiateDelete('${t.id}')" class="text-red-500 opacity-0 group-hover:opacity-100 transition"><ion-icon name="trash"></ion-icon></button>
            </div>
        `;
        list.appendChild(li);
    });
}

function updateValues() {
    const amounts = getFilteredData().map(t => t.amount);
    const total = amounts.reduce((acc, item) => acc += item, 0);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => acc += item, 0);
    const exp = Math.abs(amounts.filter(item => item < 0).reduce((acc, item) => acc += item, 0));

    const sign = total < 0 ? '-' : '';
    balance.innerText = `${sign}₹${formatNumber(total)}`;
    money_plus.innerText = `+₹${formatNumber(income)}`;
    money_minus.innerText = `-₹${formatNumber(exp)}`;
    updateCharts();
}

function updateCharts() {
    const expenses = getFilteredData().filter(t => t.amount < 0);
    
    // Pie Chart
    const categories = {};
    expenses.forEach(t => categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount));
    const pLabels = Object.keys(categories).length ? Object.keys(categories) : ['No Data'];
    const pData = Object.keys(categories).length ? Object.values(categories) : [1];
    const pColors = Object.keys(categories).length ? ['#ef4444','#f97316','#eab308','#3b82f6','#8b5cf6','#64748b'] : ['#f3f4f6'];

    const pCtx = document.getElementById('expensePieChart');
    if (expensePieChartInstance) {
        expensePieChartInstance.data.labels = pLabels;
        expensePieChartInstance.data.datasets[0].data = pData;
        expensePieChartInstance.data.datasets[0].backgroundColor = pColors;
        expensePieChartInstance.update();
    } else if(pCtx) {
        expensePieChartInstance = new Chart(pCtx, {
            type: 'pie',
            data: { labels: pLabels, datasets: [{ data: pData, backgroundColor: pColors }] },
            options: { responsive: true }
        });
    }

    // Bar Chart
    const months = {};
    expenses.forEach(t => {
        let m = new Date(t.date).toLocaleString('default', { month: 'short' });
        months[m] = (months[m] || 0) + Math.abs(t.amount);
    });
    if(!Object.keys(months).length) months[new Date().toLocaleString('default', { month: 'short' })] = 0;

    const bLabels = Object.keys(months);
    const bData = Object.values(months);

    const bCtx = document.getElementById('spendingBarChart');
    if (spendingBarChartInstance) {
        spendingBarChartInstance.data.labels = bLabels;
        spendingBarChartInstance.data.datasets[0].data = bData;
        spendingBarChartInstance.update();
    } else if(bCtx) {
        spendingBarChartInstance = new Chart(bCtx, {
            type: 'bar',
            data: { labels: bLabels, datasets: [{ label: 'Spent', data: bData, backgroundColor: '#3b82f6' }] },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }
}

function updateLocalStorage() { localStorage.setItem('transactions', JSON.stringify(transactions)); }

function renderApp() { renderList(); updateValues(); }

// Listeners
form.addEventListener('submit', addTransaction);
searchInput.addEventListener('input', renderList);
filterBtns.forEach(btn => btn.addEventListener('click', e => {
    filterBtns.forEach(b => {
        b.classList.remove('bg-blue-600', 'text-white');
        b.classList.add('bg-gray-200');
    });
    e.target.classList.remove('bg-gray-200');
    e.target.classList.add('bg-blue-600', 'text-white');
    currentFilter = e.target.dataset.filter;
    renderList();
}));

confirmDeleteBtn.addEventListener('click', confirmDelete);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

const timeFilterSelect = document.getElementById('timeFilter');
if (timeFilterSelect) {
    let savedFilter = localStorage.getItem('timeFilter') || 'month';
    if (savedFilter === '30') savedFilter = 'month';
    timeFilterSelect.value = savedFilter;
    timeFilterSelect.addEventListener('change', (e) => {
        localStorage.setItem('timeFilter', e.target.value);
        renderApp();
    });
}

dateInput.value = new Date().toISOString().split('T')[0];
document.addEventListener('DOMContentLoaded', renderApp);
