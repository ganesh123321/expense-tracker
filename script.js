const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const filterBtns = document.querySelectorAll('.filter-btn');

let expenseChartInstance = null;
let currentFilter = 'all'; 

// Local storage init & legacy dates migration wrapper
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
transactions = transactions.map(t => {
    if (!t.date) {
        t.date = new Date().toISOString(); 
    }
    return t;
});

function addTransaction(e) {
    e.preventDefault();
    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please specify an amount and description');
        return;
    }
    
    const transaction = {
        id: generateID(),
        text: text.value.trim(),
        amount: parseFloat(amount.value),
        date: new Date().toISOString()
    };

    transactions.push(transaction);
    updateLocalStorage();
    renderApp();
    
    text.value = '';
    amount.value = '';
    text.focus();
}

function generateID() {
    return Math.floor(Math.random() * 100000000).toString();
}

function formatDate(dateString) {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatNumber(num) {
    const numStr = Math.abs(num).toFixed(2);
    const parts = numStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
}

function renderList() {
    list.innerHTML = '';
    
    let filtered = transactions;
    if (currentFilter === 'income') {
        filtered = transactions.filter(t => t.amount > 0);
    } else if (currentFilter === 'expense') {
        filtered = transactions.filter(t => t.amount < 0);
    }

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <ion-icon name="receipt-outline"></ion-icon>
                <p>No transactions found</p>
            </div>
        `;
        return;
    }

    // Sort: newest first explicitly
    const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(transaction => {
        const type = transaction.amount > 0 ? 'plus' : 'minus';
        const sign = transaction.amount > 0 ? '+' : '-';
        const iconName = transaction.amount > 0 ? 'arrow-down-outline' : 'arrow-up-outline';

        const li = document.createElement('li');
        li.classList.add('transaction-item', type);
        li.innerHTML = `
            <div class="t-icon">
                <ion-icon name="${iconName}"></ion-icon>
            </div>
            <div class="t-details">
                <div class="t-title">${transaction.text}</div>
                <div class="t-date">${formatDate(transaction.date)}</div>
            </div>
            <div class="t-amount-wrapper">
                <div class="t-amount">${sign}₹${formatNumber(transaction.amount)}</div>
                <button class="delete-btn" onclick="removeTransaction('${transaction.id}', this)" title="Delete">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
        `;
        list.appendChild(li);
    });
}

function updateValues() {
    const amounts = transactions.map(t => t.amount);
    const total = amounts.reduce((acc, item) => (acc += item), 0);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0);
    const expense = Math.abs(amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0));

    balance.innerText = `${total < 0 ? '-' : ''}₹${formatNumber(total)}`;
    money_plus.innerText = `+₹${formatNumber(income)}`;
    money_minus.innerText = `-₹${formatNumber(expense)}`;

    updateChart(income, expense);
}

function updateChart(income, expense) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    const dataValues = (income === 0 && expense === 0) ? [1] : [income, expense];
    const bgColors = (income === 0 && expense === 0) ? ['rgba(255,255,255,0.05)'] : ['#10B981', '#F5A9A9'];
    const labels = (income === 0 && expense === 0) ? ['No Data'] : ['Income', 'Expense'];

    if (expenseChartInstance) {
        expenseChartInstance.data.datasets[0].data = dataValues;
        expenseChartInstance.data.datasets[0].backgroundColor = bgColors;
        expenseChartInstance.data.labels = labels;
        expenseChartInstance.update();
    } else {
        expenseChartInstance = new Chart(ctx, {
            type: 'doughnut', // Doughnut is more modern fintech compliant vs standard pie
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: bgColors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.label === 'No Data') return ' No entries yet';
                                return ` ₹${formatNumber(context.raw)}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Global hook for onclick
window.removeTransaction = function(id, btnElement) {
    const li = btnElement.closest('.transaction-item');
    li.classList.add('removing');
    
    // timeout aligns seamlessly with the CSS fadeOut animation
    setTimeout(() => {
        // Enforce string comparison for backwards compatibility with legacy localstorage instances
        transactions = transactions.filter(t => String(t.id) !== String(id));
        updateLocalStorage();
        renderApp();
    }, 250);
}

function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function handleFilter(e) {
    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    renderList();
}

filterBtns.forEach(btn => btn.addEventListener('click', handleFilter));
form.addEventListener('submit', addTransaction);

function renderApp() {
    renderList();
    updateValues();
}

document.addEventListener('DOMContentLoaded', renderApp);
