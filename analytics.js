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
    const incTrendMap = {};
    const expTrendMap = {};

    transactions.forEach(t => {
        const text = t.text.trim().toLowerCase();
        // Capitalize for grouping
        const displayName = text.charAt(0).toUpperCase() + text.slice(1);
        
        let d = new Date(t.date);
        if (isNaN(d.getTime())) d = new Date(); // fallback
        const dateKey = d.toISOString().split('T')[0]; // "YYYY-MM-DD"
        
        if (t.amount > 0) {
            incomeGroups[displayName] = (incomeGroups[displayName] || 0) + t.amount;
            incTrendMap[dateKey] = (incTrendMap[dateKey] || 0) + t.amount;
        } else {
            expenseGroups[displayName] = (expenseGroups[displayName] || 0) + Math.abs(t.amount);
            expTrendMap[dateKey] = (expTrendMap[dateKey] || 0) + Math.abs(t.amount);
        }
    });

    // 1 & 2: Top Sources (Bar)
    const incomes = Object.keys(incomeGroups).map(key => ({
        name: key,
        amount: incomeGroups[key]
    })).sort((a, b) => b.amount - a.amount);

    const expenses = Object.keys(expenseGroups).map(key => ({
        name: key,
        amount: expenseGroups[key]
    })).sort((a, b) => b.amount - a.amount);

    // 3 & 4: Timeline / Trend (Line)
    const incKeys = Object.keys(incTrendMap).sort();
    const expKeys = Object.keys(expTrendMap).sort();
    
    const incTrend = incKeys.map(k => {
        const parts = k.split('-');
        return { name: `${parts[1]}/${parts[2]}`, amount: incTrendMap[k] };
    });
    
    const expTrend = expKeys.map(k => {
        const parts = k.split('-');
        return { name: `${parts[1]}/${parts[2]}`, amount: expTrendMap[k] };
    });

    // Color palettes for Doughnut charts
    const incColors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
    const expColors = ['#C41230', '#F5A9A9', '#f87171', '#fca5a5', '#fecaca'];

    // Render Bar Charts
    renderChart('bar', 'incomeCanvas', incomes, '#10B981', 'Total Income');
    renderChart('bar', 'expenseCanvas', expenses, '#F5A9A9', 'Total Expense');

    // Render Line Charts (Trend)
    renderChart('line', 'incomeTrendCanvas', incTrend, '#10B981', 'Income Trend');
    renderChart('line', 'expenseTrendCanvas', expTrend, '#F5A9A9', 'Expense Trend');

    // Render Doughnut Charts (Distribution)
    // We reuse incomes and expenses but just pick top 5
    renderChart('doughnut', 'incomeDoughnutCanvas', incomes.slice(0, 5), incColors, 'Income Dist');
    renderChart('doughnut', 'expenseDoughnutCanvas', expenses.slice(0, 5), expColors, 'Expense Dist');
}

function renderChart(type, canvasId, data, colorInfo, labelText) {
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (data.length === 0) {
        new Chart(ctx, {
            type: 'bar',
            data: { labels: ['No Data'], datasets: [{ data: [0], backgroundColor: 'rgba(255,255,255,0.05)' }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { display: false },
                    x: { display: false }
                },
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
        return;
    }

    const labels = data.map(d => d.name);
    const values = data.map(d => d.amount);

    let chartData = {
        labels: labels,
        datasets: [{
            label: labelText,
            data: values,
            backgroundColor: colorInfo,
            borderColor: type === 'line' ? colorInfo : (type === 'doughnut' ? '#0F0303' : 'transparent'),
            borderWidth: type === 'doughnut' ? 2 : (type === 'line' ? 3 : 0),
            fill: type === 'line' ? {
                target: 'origin',
                above: (type === 'line' && !Array.isArray(colorInfo)) ? colorInfo + '20' : 'transparent' // transparent or light fill
            } : false,
            tension: type === 'line' ? 0.3 : 0, // smooth curves for line charts
            borderRadius: type === 'bar' ? 6 : 0,
            barPercentage: type === 'bar' ? 0.6 : 0.9
        }]
    };

    let chartOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                display: type === 'doughnut', 
                position: 'right',
                labels: { font: { family: 'Inter', size: 10 } }
            },
            tooltip: {
                backgroundColor: '#0F0303',
                padding: 12,
                titleFont: { family: 'Inter', size: 13, weight: '500' },
                bodyFont: { family: 'Inter', size: 14, weight: '700' },
                callbacks: {
                    label: function(context) {
                        return ` ₹${formatNumber(context.raw)}`;
                    }
                }
            }
        }
    };

    if (type !== 'doughnut') {
        chartOpts.scales = {
            y: {
                beginAtZero: true,
                border: { display: false },
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: {
                    callback: function(value) { return '₹' + formatNumber(value); },
                    color: '#8B949E',
                    font: { family: 'Inter', size: 10 }
                }
            },
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    color: '#8B949E',
                    font: { family: 'Inter', size: 11, weight: '500' }
                }
            }
        };
    }

    new Chart(ctx, {
        type: type,
        data: chartData,
        options: chartOpts
    });
}

// Start processing on load
document.addEventListener('DOMContentLoaded', processAnalytics);
