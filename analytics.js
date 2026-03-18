let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

function formatNumber(num) {
    const numStr = Math.abs(num).toFixed(2);
    const parts = numStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
}

function processAnalytics() {
    const incomeGroups = {};
    const expenseGroups = {};

    transactions.forEach(t => {
        const text = t.text.trim().toLowerCase();
        // Capitalize for grouping
        const displayName = text.charAt(0).toUpperCase() + text.slice(1);
        
        if (t.amount > 0) {
            incomeGroups[displayName] = (incomeGroups[displayName] || 0) + t.amount;
        } else {
            expenseGroups[displayName] = (expenseGroups[displayName] || 0) + Math.abs(t.amount);
        }
    });

    const incomes = Object.keys(incomeGroups).map(key => ({
        name: key,
        amount: incomeGroups[key]
    })).sort((a, b) => b.amount - a.amount);

    const expenses = Object.keys(expenseGroups).map(key => ({
        name: key,
        amount: expenseGroups[key]
    })).sort((a, b) => b.amount - a.amount);

    // Render using Chart.js now
    renderBarChart('incomeCanvas', incomes, '#10b981', 'Total Income');
    renderBarChart('expenseCanvas', expenses, '#ef4444', 'Total Expense');
}

function renderBarChart(canvasId, data, colorHex, labelText) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (data.length === 0) {
        new Chart(ctx, {
            type: 'bar',
            data: { labels: ['No Data'], datasets: [{ data: [0], backgroundColor: '#e2e8f0' }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, display: false },
                    x: { display: false }
                },
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
        return;
    }

    const labels = data.map(d => d.name);
    const values = data.map(d => d.amount);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: labelText,
                data: values,
                backgroundColor: colorHex,
                borderRadius: 8, // Fintech soft rounded corners
                borderWidth: 0,
                barPercentage: 0.6 // Slightly thinner bars for modern feel
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    border: { display: false }, // Hide the main axis line
                    grid: { color: '#f1f5f9' }, // Very subtle horizontal guides
                    ticks: {
                        callback: function(value) {
                            return '₹' + formatNumber(value);
                        },
                        color: '#9fb3c8',
                        font: { family: 'Inter', size: 11 }
                    }
                },
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: '#627d98',
                        font: { family: 'Inter', size: 12, weight: '500' }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#102a43', // Dark premium tooltip
                    padding: 12,
                    titleFont: { family: 'Inter', size: 13, weight: '500' },
                    bodyFont: { family: 'Inter', size: 15, weight: '700' },
                    callbacks: {
                        label: function(context) {
                            return ` ₹${formatNumber(context.raw)}`;
                        }
                    }
                }
            }
        }
    });
}

// Start processing on load
document.addEventListener('DOMContentLoaded', processAnalytics);
