// Budget Dashboard Script

let budgetData = {};

// Load data from data.json on page load
async function loadDefaultData() {
    try {
        const response = await fetch('data.json');
        budgetData = await response.json();
        renderMonthly();
        renderRetirement();
        renderPortfolio();
        calculateTotals();
    } catch (error) {
        console.error('Error loading data.json:', error);
        alert('Error loading default data. Make sure data.json is in the same folder as index.html');
    }
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

// Download data as JSON file
function downloadData() {
    const dataStr = JSON.stringify(budgetData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Upload and load data from JSON file
function uploadData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const loadedData = JSON.parse(e.target.result);
            budgetData = loadedData;
            renderMonthly();
            renderRetirement();
            renderPortfolio();
            calculateTotals();
            alert('Data loaded successfully!');
            document.getElementById('fileInput').value = '';
        } catch (error) {
            alert('Error loading file. Make sure it\'s a valid budget JSON file.');
            document.getElementById('fileInput').value = '';
        }
    };
    reader.readAsText(file);
}

// Calculate gain/loss for a stock
function calculateGainLoss(shares, purchasePrice, currentPrice) {
    const gain = (currentPrice - purchasePrice) * shares;
    const percent = ((currentPrice - purchasePrice) / purchasePrice) * 100;
    return { gain, percent };
}

// Render monthly table
function renderMonthly() {
    const table = document.getElementById('monthlyTable');
    table.innerHTML = '';
    
    Object.entries(budgetData.monthly).forEach(([name, amount]) => {
        const row = table.insertRow();
        const amountClass = amount >= 0 ? 'text-success' : 'text-danger';
        const sign = amount >= 0 ? '+' : '';
        row.innerHTML = `
            <td>${name}</td>
            <td class="text-end ${amountClass}"><strong>${sign}${formatCurrency(amount)}</strong></td>
            <td class="text-end" style="width: 60px;">
                <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteMonthly('${name}')">Remove</button>
            </td>
        `;
    });
}

// Render retirement table
function renderRetirement() {
    const table = document.getElementById('retirementTable');
    table.innerHTML = '';
    
    Object.entries(budgetData.retirement).forEach(([name, amount]) => {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${name}</td>
            <td class="text-end text-success">${formatCurrency(amount)}</td>
            <td class="text-end" style="width: 60px;">
                <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteRetirement('${name}')">Remove</button>
            </td>
        `;
    });
}

// Render portfolio table
function renderPortfolio() {
    const table = document.getElementById('portfolioTable');
    table.innerHTML = '';
    
    budgetData.portfolio.forEach((stock, index) => {
        const { gain, percent } = calculateGainLoss(stock.shares, stock.purchasePrice, stock.currentPrice);
        const gainClass = gain >= 0 ? 'text-success' : 'text-danger';
        
        const row = table.insertRow();
        row.innerHTML = `
            <td>${stock.stock}</td>
            <td class="text-end">${stock.shares.toFixed(4)}</td>
            <td class="text-end">$${stock.purchasePrice.toFixed(2)}</td>
            <td class="text-end">$${stock.currentPrice.toFixed(2)}</td>
            <td class="text-end ${gainClass}">${formatCurrency(gain)}</td>
            <td class="text-end ${gainClass}">${percent.toFixed(2)}%</td>
            <td class="text-end" style="width: 60px;">
                <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteStock(${index})">Remove</button>
            </td>
        `;
    });
}

// Calculate totals
function calculateTotals() {
    const monthlyTotal = Object.values(budgetData.monthly).reduce((a, b) => a + b, 0);
    const retirementTotal = Object.values(budgetData.retirement).reduce((a, b) => a + b, 0);
    
    document.getElementById('netMonthly').textContent = formatCurrency(monthlyTotal);
    document.getElementById('retirementTotal').textContent = formatCurrency(retirementTotal);
}

// Add monthly item
function addMonthly() {
    const nameInput = document.getElementById('monthlyNameInput');
    const amountInput = document.getElementById('monthlyAmountInput');
    
    if (nameInput.value && amountInput.value) {
        budgetData.monthly[nameInput.value] = parseFloat(amountInput.value);
        renderMonthly();
        calculateTotals();
        nameInput.value = '';
        amountInput.value = '';
    }
}

// Add retirement account
function addRetirement() {
    const nameInput = document.getElementById('retirementNameInput');
    const amountInput = document.getElementById('retirementAmountInput');
    
    if (nameInput.value && amountInput.value) {
        budgetData.retirement[nameInput.value] = parseFloat(amountInput.value);
        renderRetirement();
        calculateTotals();
        nameInput.value = '';
        amountInput.value = '';
    }
}

// Add stock
function addStock() {
    const symbolInput = document.getElementById('stockSymbolInput');
    const sharesInput = document.getElementById('stockSharesInput');
    const purchaseInput = document.getElementById('stockPurchaseInput');
    const currentInput = document.getElementById('stockCurrentInput');
    
    if (symbolInput.value && sharesInput.value && purchaseInput.value && currentInput.value) {
        budgetData.portfolio.push({
            stock: symbolInput.value.toUpperCase(),
            shares: parseFloat(sharesInput.value),
            purchasePrice: parseFloat(purchaseInput.value),
            currentPrice: parseFloat(currentInput.value)
        });
        renderPortfolio();
        symbolInput.value = '';
        sharesInput.value = '';
        purchaseInput.value = '';
        currentInput.value = '';
    }
}

// Delete monthly item
function deleteMonthly(name) {
    delete budgetData.monthly[name];
    renderMonthly();
    calculateTotals();
}

// Delete retirement
function deleteRetirement(name) {
    delete budgetData.retirement[name];
    renderRetirement();
    calculateTotals();
}

// Delete stock
function deleteStock(index) {
    budgetData.portfolio.splice(index, 1);
    renderPortfolio();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDefaultData();
});