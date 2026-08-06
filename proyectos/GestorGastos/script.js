const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const type = document.getElementById('type');
const category = document.getElementById('category');
const transactionCount = document.getElementById('transaction-count');

// Mapeo de iconos para categorías
const categoryIcons = {
    food: '🍔',
    transport: '🚌',
    salary: '💰',
    shopping: '🛍️',
    bills: '📄',
    other: '📌'
};

// Referencia al gráfico
let financeChart;

// Init LocalStorage
const localStorageTransactions = JSON.parse(localStorage.getItem('transactions_advanced'));
let transactions = localStorage.getItem('transactions_advanced') !== null ? localStorageTransactions : [];

// Mostrar Notificación Toast
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    
    const icon = type === 'success' ? '<i class="ph ph-check-circle"></i>' : '<i class="ph ph-warning-circle"></i>';
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Agregar transacción
function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }

    let val = parseFloat(amount.value);
    if (type.value === 'expense') {
        val = -Math.abs(val);
    } else {
        val = Math.abs(val);
    }

    // Fecha actual formateada
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const transaction = {
        id: generateID(),
        text: text.value,
        amount: val,
        type: type.value,
        category: category.value,
        date: dateStr
    };

    transactions.push(transaction);

    updateDOM();
    updateLocalStorage();
    
    showToast('Transacción agregada con éxito', 'success');

    // Resetear formulario
    text.value = '';
    amount.value = '';
}

// Generar ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Actualizar TODO el DOM
function updateDOM() {
    list.innerHTML = '';
    
    // Invertir para mostrar los más recientes arriba
    const sortedTransactions = [...transactions].reverse();
    sortedTransactions.forEach(addTransactionDOM);
    
    transactionCount.innerText = transactions.length;
    updateValues();
    updateChart();
}

// Añadir transacción a la UI
function addTransactionDOM(transaction) {
    const isIncome = transaction.type === 'income' || transaction.amount > 0;
    const itemClass = isIncome ? 'income' : 'expense';
    const sign = isIncome ? '+' : '-';
    const icon = categoryIcons[transaction.category] || categoryIcons['other'];

    const li = document.createElement('li');
    li.classList.add(itemClass);

    li.innerHTML = `
        <div class="icon-box">${icon}</div>
        <div class="transaction-info">
            <div class="title">${transaction.text}</div>
            <div class="date">${transaction.date}</div>
        </div>
        <div class="transaction-amount">${sign}$${Math.abs(transaction.amount).toFixed(2)}</div>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})" title="Eliminar"><i class="ph ph-trash"></i></button>
    `;

    list.appendChild(li);
}

// Actualizar valores numéricos
function updateValues() {
    const amounts = transactions.map(t => t.amount);
    
    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0).toFixed(2);
    const expense = (amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1).toFixed(2);

    balance.innerText = `$${total}`;
    money_plus.innerText = `+$${income}`;
    money_minus.innerText = `-$${expense}`;
}

// Remover transacción
function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateLocalStorage();
    updateDOM();
    showToast('Transacción eliminada', 'error');
}

// Actualizar LocalStorage
function updateLocalStorage() {
    localStorage.setItem('transactions_advanced', JSON.stringify(transactions));
}

// Graficar con Chart.js
function updateChart() {
    const amounts = transactions.map(t => t.amount);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0);
    const expense = amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1;

    const ctx = document.getElementById('financeChart').getContext('2d');
    
    // Si ya existe un chart, lo destruimos para redibujar
    if (financeChart) {
        financeChart.destroy();
    }

    // Si no hay datos, mostrar algo por defecto
    const dataValues = (income === 0 && expense === 0) ? [1] : [income, expense];
    const dataColors = (income === 0 && expense === 0) ? ['#333'] : ['#10b981', '#ef4444'];
    const dataLabels = (income === 0 && expense === 0) ? ['Sin transacciones'] : ['Ingresos', 'Gastos'];

    financeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: dataLabels,
            datasets: [{
                data: dataValues,
                backgroundColor: dataColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#a8a8b3', padding: 20 }
                }
            }
        }
    });
}

// Iniciar aplicación
function init() {
    // Escuchar cambios de tipo para seleccionar categoría automática
    type.addEventListener('change', (e) => {
        if(e.target.value === 'income') {
            category.value = 'salary';
        } else {
            category.value = 'food';
        }
    });

    form.addEventListener('submit', addTransaction);
    updateDOM();
}

init();
