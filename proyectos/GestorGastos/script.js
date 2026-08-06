const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const type = document.getElementById('type');
const errorMsg = document.getElementById('error-msg');

// Obtener transacciones desde LocalStorage
const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));

let transactions = localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

// Agregar transacción
function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        errorMsg.innerText = 'Por favor, añade una descripción y un monto.';
        setTimeout(() => errorMsg.innerText = '', 3000);
    } else {
        let val = parseFloat(amount.value);
        if (type.value === 'expense') {
            val = -Math.abs(val);
        } else {
            val = Math.abs(val);
        }

        const transaction = {
            id: generateID(),
            text: text.value,
            amount: val
        };

        transactions.push(transaction);

        addTransactionDOM(transaction);
        updateValues();
        updateLocalStorage();

        text.value = '';
        amount.value = '';
        errorMsg.innerText = '';
    }
}

// Generar ID aleatorio
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Añadir transacción al DOM (Lista)
function addTransactionDOM(transaction) {
    // Definir la clase (plus o minus)
    const sign = transaction.amount < 0 ? '-' : '+';
    const itemClass = transaction.amount < 0 ? 'minus' : 'plus';

    const li = document.createElement('li');
    li.classList.add(itemClass);

    li.innerHTML = `
        ${transaction.text} <span>${sign}$${Math.abs(transaction.amount).toFixed(2)}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})"><i class="ph ph-trash"></i></button>
    `;

    list.appendChild(li);
}

// Actualizar el balance, ingresos y gastos
function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);

    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0)
        .toFixed(2);

    const expense = (
        amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1
    ).toFixed(2);

    balance.innerText = `$${total}`;
    money_plus.innerText = `+$${income}`;
    money_minus.innerText = `-$${expense}`;
}

// Remover transacción
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    init();
}

// Actualizar LocalStorage
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Inicializar la app
function init() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
}

init();

form.addEventListener('submit', addTransaction);
