
// --- DOM Helper Seguro (Previene XSS) ---
function createEl(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
        if (key === 'className') el.className = val;
        else if (key === 'onclick') el.addEventListener('click', val);
        else if (key === 'style') el.style.cssText = val;
        else el.setAttribute(key, val);
    }
    children.forEach(c => {
        if (typeof c === 'string' || typeof c === 'number') {
            el.appendChild(document.createTextNode(String(c)));
        } else if (c instanceof Node) {
            el.appendChild(c);
        }
    });
    return el;
}

// --- State & Data ---
const demoProducts = [
    { id: 'P001', barcode: '77912345001', name: 'Coca Cola 2L', category: 'Bebidas', price: 2.50, stock: 45 },
    { id: 'P002', barcode: '77912345002', name: 'Sprite 2L', category: 'Bebidas', price: 2.40, stock: 30 },
    { id: 'P003', barcode: '77912345003', name: 'Agua Mineral sin gas', category: 'Bebidas', price: 1.00, stock: 50 },
    { id: 'P004', barcode: '77912345004', name: 'Cerveza Patagonia 730ml', category: 'Bebidas', price: 3.20, stock: 24 },
    { id: 'P005', barcode: '77912345005', name: 'Jugo de Naranja Cepita', category: 'Bebidas', price: 1.50, stock: 15 },
    { id: 'P006', barcode: '77954321001', name: 'Papas Lays Clásicas', category: 'Snacks', price: 1.20, stock: 30 },
    { id: 'P007', barcode: '77954321002', name: 'Doritos Queso', category: 'Snacks', price: 1.30, stock: 25 },
    { id: 'P008', barcode: '77954321003', name: 'Maní Salado Pehuamar', category: 'Snacks', price: 0.80, stock: 40 },
    { id: 'P009', barcode: '77954321004', name: 'Nachos Macritas', category: 'Snacks', price: 1.10, stock: 20 },
    { id: 'P010', barcode: '77911111001', name: 'Leche Descremada La Serenísima', category: 'Lácteos', price: 1.80, stock: 15 },
    { id: 'P011', barcode: '77911111002', name: 'Yogur Firme Frutilla', category: 'Lácteos', price: 0.90, stock: 22 },
    { id: 'P012', barcode: '77911111003', name: 'Queso Crema Casancrem', category: 'Lácteos', price: 2.10, stock: 18 },
    { id: 'P013', barcode: '77911111004', name: 'Manteca Sancor 200g', category: 'Lácteos', price: 1.70, stock: 10 },
    { id: 'P014', barcode: '77922222001', name: 'Detergente Magistral', category: 'Limpieza', price: 3.50, stock: 12 },
    { id: 'P015', barcode: '77922222002', name: 'Lavandina Ayudín 1L', category: 'Limpieza', price: 1.20, stock: 35 },
    { id: 'P016', barcode: '77922222003', name: 'Jabón en Polvo Ala 3kg', category: 'Limpieza', price: 5.50, stock: 8 },
    { id: 'P017', barcode: '77922222004', name: 'Esponja Mortimer', category: 'Limpieza', price: 0.60, stock: 40 },
    { id: 'P018', barcode: '77999999001', name: 'Pilas AA Energizer x4', category: 'Otros', price: 4.00, stock: 15 },
    { id: 'P019', barcode: '77999999002', name: 'Encendedor Bic', category: 'Otros', price: 0.70, stock: 50 },
    { id: 'P020', barcode: '77999999003', name: 'Chicles Beldent Menta', category: 'Otros', price: 0.50, stock: 60 }
];

let products = JSON.parse(localStorage.getItem('pos_products'));
if (!products || products.length < 5) {
    products = demoProducts;
    localStorage.setItem('pos_products', JSON.stringify(products));
}
let sales = JSON.parse(localStorage.getItem('pos_sales')) || [];
let cart = [];
let currentCategoryFilter = 'Todos';
let currentSaleTotal = 0;

// --- Bootstrap Instances ---
let bsProductModal;
let bsCheckoutModal;
let bsReceiptModal;
let bsScannerModal;
let bsToast;

// --- Hardware ---
let html5QrcodeScanner;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    bsProductModal = new bootstrap.Modal(document.getElementById('productModal'));
    bsCheckoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    bsReceiptModal = new bootstrap.Modal(document.getElementById('receiptModal'));
    bsScannerModal = new bootstrap.Modal(document.getElementById('scannerModal'));
    bsToast = new bootstrap.Toast(document.getElementById('liveToast'));

    initNavigation();
    initThemes();
    initNotifications();
    updateDashboard();
    renderInventory();
    renderPOSProducts();
    renderSalesHistory();
    initCategoryFilters();
    initCheckout();
    initExportCSV();
    initScanner();
});

function saveData() {
    localStorage.setItem('pos_products', JSON.stringify(products));
    localStorage.setItem('pos_sales', JSON.stringify(sales));
    initNotifications(); 
}

// --- Navigation ---
function initNavigation() {
    const navLinks = document.querySelectorAll('#sidebar-nav .nav-link');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');

            const targetId = link.getAttribute('data-target');
            views.forEach(view => {
                view.classList.add('d-none');
                view.classList.remove('active');
                if (view.id === targetId) {
                    view.classList.remove('d-none');
                    view.classList.add('active');
                }
            });

            pageTitle.textContent = link.textContent.trim();
            
            if(targetId === 'dashboard') updateDashboard();
            if(targetId === 'pos') renderPOSProducts();
            if(targetId === 'inventory') renderInventory();
            if(targetId === 'sales') renderSalesHistory();
        });
    });
}

// --- Themes ---
function initThemes() {
    const themeBtns = document.querySelectorAll('.theme-btn');
    const savedTheme = localStorage.getItem('pos_theme') || 'blue';
    document.body.setAttribute('data-theme', savedTheme);
    
    themeBtns.forEach(btn => {
        if(btn.dataset.color === savedTheme) {
            themeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', () => {
            const color = btn.dataset.color;
            document.body.setAttribute('data-theme', color);
            localStorage.setItem('pos_theme', color);
            themeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// --- Notifications ---
function initNotifications() {
    const notifBadge = document.getElementById('notif-badge');
    const notifList = document.getElementById('notif-list');
    
    const lowStockProducts = products.filter(p => p.stock <= 10);
    notifList.innerHTML = '';
    
    if (lowStockProducts.length > 0) {
        notifBadge.textContent = lowStockProducts.length;
        notifBadge.style.display = 'block';
        
        lowStockProducts.forEach(p => {
            const li = createEl('li', { className: 'px-3 py-2 border-bottom d-flex align-items-center gap-2 dropdown-item text-wrap' }, [
                createEl('i', { className: `ph-fill ph-warning fs-4 ${p.stock === 0 ? 'text-danger' : 'text-warning'}` }),
                createEl('div', {}, [
                    createEl('div', { className: 'fw-semibold' }, [p.name]),
                    createEl('div', { className: 'small text-muted' }, [`Solo quedan ${p.stock} unidades`])
                ])
            ]);
            notifList.appendChild(li);
        });
    } else {
        notifBadge.style.display = 'none';
        notifList.appendChild(createEl('li', { className: 'px-3 py-4 text-center text-muted' }, ['No hay alertas de stock']));
    }
}

function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

function showToast(message) {
    document.getElementById('toast-message').textContent = message;
    bsToast.show();
}

function generateId(prefix) {
    return prefix + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// --- Barcode Scanner (Webcam) ---
function initScanner() {
    const btnOpenScanner = document.getElementById('btn-open-scanner');
    const btnCloseScanner = document.getElementById('btn-close-scanner');
    
    btnOpenScanner.addEventListener('click', () => {
        bsScannerModal.show();
        html5QrcodeScanner = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 250, height: 150 } };
        
        html5QrcodeScanner.start({ facingMode: "environment" }, config, (decodedText) => {
            handleBarcodeScanned(decodedText);
        }, (error) => {}).catch(err => {
            document.getElementById('scanner-status').textContent = 'Error accediendo a la cámara';
        });
    });

    btnCloseScanner.addEventListener('click', stopScanner);
    document.getElementById('scannerModal').addEventListener('hidden.bs.modal', stopScanner);
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            html5QrcodeScanner.clear();
        }).catch(err => console.log(err));
    }
}

function handleBarcodeScanned(barcode) {
    stopScanner();
    bsScannerModal.hide();

    const product = products.find(p => p.barcode === barcode || p.id === barcode);
    if (product) {
        addToCart(product.id);
        showToast(`✔ Agregado`);
    } else {
        showToast(`❌ Producto no encontrado: ${barcode}`);
    }
}


// --- Inventory Management ---
const inventoryTbody = document.getElementById('inventory-tbody');
const productForm = document.getElementById('product-form');
const btnAddProduct = document.getElementById('btn-add-product');
const inventorySearch = document.getElementById('inventory-search');

let inventoryCurrentPage = 1;
const inventoryItemsPerPage = 7;

function renderInventory(filterText = '') {
    inventoryTbody.innerHTML = '';
    
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(filterText.toLowerCase()) || 
        (p.barcode && p.barcode.includes(filterText))
    );
    
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / inventoryItemsPerPage) || 1;
    if (inventoryCurrentPage > totalPages) inventoryCurrentPage = totalPages;
    
    const startIndex = (inventoryCurrentPage - 1) * inventoryItemsPerPage;
    const endIndex = Math.min(startIndex + inventoryItemsPerPage, totalItems);
    
    const paginated = filtered.slice(startIndex, endIndex);
    
    paginated.forEach(p => {
        const badgeColor = p.stock <= 10 ? 'bg-danger' : p.stock <= 20 ? 'bg-warning text-dark' : 'bg-success';
        
        const tr = createEl('tr', {}, [
            createEl('td', { className: 'ps-3 text-muted' }, [
                createEl('div', { className: 'small fw-bold' }, [p.id]),
                createEl('div', { className: 'small', style: 'font-size: 0.75rem;' }, [
                    createEl('i', { className: 'ph ph-barcode' }), ' ' + (p.barcode || 'N/A')
                ])
            ]),
            createEl('td', {}, [createEl('strong', { className: 'text-dark' }, [p.name])]),
            createEl('td', {}, [createEl('span', { className: 'badge bg-light text-dark border' }, [p.category])]),
            createEl('td', {}, [formatCurrency(p.price)]),
            createEl('td', {}, [createEl('span', { className: `badge ${badgeColor}` }, [p.stock])]),
            createEl('td', { className: 'pe-3 text-end' }, [
                createEl('button', { className: 'btn btn-sm btn-light border text-secondary me-1', onclick: () => editProduct(p.id) }, [
                    createEl('i', { className: 'ph ph-pencil-simple' })
                ]),
                createEl('button', { className: 'btn btn-sm btn-light border text-danger', onclick: () => deleteProduct(p.id) }, [
                    createEl('i', { className: 'ph ph-trash' })
                ])
            ])
        ]);
        inventoryTbody.appendChild(tr);
    });
    
    document.getElementById('inventory-pagination-info').textContent = 
        totalItems === 0 ? 'No hay productos' : `Mostrando ${startIndex + 1} - ${endIndex} de ${totalItems} productos`;
        
    const paginationUl = document.getElementById('inventory-pagination');
    paginationUl.innerHTML = '';
    
    paginationUl.appendChild(
        createEl('li', { className: `page-item ${inventoryCurrentPage === 1 ? 'disabled' : ''}` }, [
            createEl('a', { className: 'page-link', href: '#', onclick: (e) => { e.preventDefault(); changeInventoryPage(inventoryCurrentPage - 1); } }, ['Anterior'])
        ])
    );
    
    for (let i = 1; i <= totalPages; i++) {
        paginationUl.appendChild(
            createEl('li', { className: `page-item ${inventoryCurrentPage === i ? 'active' : ''}` }, [
                createEl('a', { className: 'page-link', href: '#', onclick: (e) => { e.preventDefault(); changeInventoryPage(i); } }, [i])
            ])
        );
    }
    
    paginationUl.appendChild(
        createEl('li', { className: `page-item ${inventoryCurrentPage === totalPages ? 'disabled' : ''}` }, [
            createEl('a', { className: 'page-link', href: '#', onclick: (e) => { e.preventDefault(); changeInventoryPage(inventoryCurrentPage + 1); } }, ['Siguiente'])
        ])
    );
}

window.changeInventoryPage = (newPage) => {
    inventoryCurrentPage = newPage;
    renderInventory(inventorySearch.value);
};

inventorySearch.addEventListener('input', (e) => {
    inventoryCurrentPage = 1;
    renderInventory(e.target.value);
});

btnAddProduct.addEventListener('click', () => {
    productForm.reset();
    document.getElementById('product-id').value = '';
    document.getElementById('modal-title').textContent = 'Nuevo Producto';
    bsProductModal.show();
});

productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const newProduct = {
        id: id || generateId('P'),
        barcode: document.getElementById('product-barcode').value.trim(),
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
    };

    if (id) {
        const index = products.findIndex(p => p.id === id);
        products[index] = newProduct;
        showToast('Producto actualizado exitosamente');
    } else {
        products.push(newProduct);
        showToast('Producto agregado exitosamente');
    }
    
    saveData();
    renderInventory();
    bsProductModal.hide();
});

window.editProduct = (id) => {
    const p = products.find(p => p.id === id);
    if(p) {
        document.getElementById('product-id').value = p.id;
        document.getElementById('product-barcode').value = p.barcode || '';
        document.getElementById('product-name').value = p.name;
        document.getElementById('product-category').value = p.category;
        document.getElementById('product-price').value = p.price;
        document.getElementById('product-stock').value = p.stock;
        document.getElementById('modal-title').textContent = 'Editar Producto';
        bsProductModal.show();
    }
};

window.deleteProduct = (id) => {
    if(confirm('¿Seguro que deseas eliminar este producto permanentemente?')) {
        products = products.filter(p => p.id !== id);
        saveData();
        renderInventory();
        showToast('Producto eliminado');
    }
};

// --- POS (Punto de Venta) ---
const posGrid = document.getElementById('pos-products-grid');
const posSearch = document.getElementById('pos-search');
const cartContainer = document.getElementById('cart-items-container');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartTotalEl = document.getElementById('cart-total');
const cartCountEl = document.getElementById('cart-count');
const btnPreCheckout = document.getElementById('btn-pre-checkout');
const btnClearCart = document.getElementById('btn-clear-cart');

function initCategoryFilters() {
    const chips = document.querySelectorAll('.category-chips .btn');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCategoryFilter = chip.dataset.cat;
            renderPOSProducts(posSearch.value);
        });
    });
}

function renderPOSProducts(filterText = '') {
    posGrid.innerHTML = '';
    let filtered = products.filter(p => p.stock > 0 && 
        (p.name.toLowerCase().includes(filterText.toLowerCase()) || 
         (p.barcode && p.barcode.includes(filterText)))
    );
    
    if (currentCategoryFilter !== 'Todos') {
        filtered = filtered.filter(p => p.category === currentCategoryFilter);
    }
    
    filtered.forEach(p => {
        const col = createEl('div', { className: 'col' }, [
            createEl('div', { className: 'card h-100 product-card shadow-sm border-0', onclick: () => addToCart(p.id) }, [
                createEl('div', { className: 'card-body p-2 text-center d-flex flex-column' }, [
                    createEl('div', { className: 'product-img-placeholder mb-2' }, [
                        createEl('i', { className: 'ph-fill ph-package' })
                    ]),
                    createEl('h6', { className: 'card-title text-truncate mb-1 small fw-bold' }, [p.name]),
                    createEl('div', { className: 'text-theme fw-bold mb-1' }, [formatCurrency(p.price)]),
                    createEl('div', { className: 'mt-auto small text-muted' }, [`Stock: ${p.stock}`])
                ])
            ])
        ]);
        posGrid.appendChild(col);
    });
}

posSearch.addEventListener('input', (e) => renderPOSProducts(e.target.value));

window.addToCart = (id) => {
    const product = products.find(p => p.id === id);
    if(!product) return;

    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
        if (existing.qty < product.stock) {
            existing.qty++;
        } else {
            showToast('No hay suficiente stock');
            return;
        }
    } else {
        cart.push({ product, qty: 1 });
    }
    renderCart();
};

window.updateCartQty = (id, delta) => {
    const item = cart.find(i => i.product.id === id);
    if(item) {
        const newQty = item.qty + delta;
        if(newQty <= 0) {
            cart = cart.filter(i => i.product.id !== id);
        } else if (newQty > item.product.stock) {
            showToast('Stock máximo alcanzado');
        } else {
            item.qty = newQty;
        }
        renderCart();
    }
};

function renderCart() {
    cartContainer.innerHTML = '';
    currentSaleTotal = 0;
    let totalItemsCount = 0;

    if (cart.length === 0) {
        cartContainer.appendChild(createEl('div', { className: 'text-center text-muted mt-5 fst-italic' }, ['El carrito está vacío']));
        btnPreCheckout.disabled = true;
    } else {
        btnPreCheckout.disabled = false;
        cart.forEach(item => {
            const itemTotal = item.product.price * item.qty;
            currentSaleTotal += itemTotal;
            totalItemsCount += item.qty;
            
            const div = createEl('div', { className: 'd-flex justify-content-between align-items-center p-2 mb-2 bg-white rounded border shadow-sm' }, [
                createEl('div', {}, [
                    createEl('h6', { className: 'm-0 small fw-bold text-truncate', style: 'max-width: 150px;' }, [item.product.name]),
                    createEl('span', { className: 'small text-theme fw-bold' }, [
                        formatCurrency(item.product.price) + ' ',
                        createEl('span', { className: 'text-muted fw-normal' }, ['c/u'])
                    ])
                ]),
                createEl('div', { className: 'd-flex align-items-center gap-2' }, [
                    createEl('button', { className: 'btn btn-sm btn-light border qty-btn', onclick: () => updateCartQty(item.product.id, -1) }, ['-']),
                    createEl('span', { className: 'fw-bold px-1' }, [item.qty]),
                    createEl('button', { className: 'btn btn-sm btn-light border qty-btn', onclick: () => updateCartQty(item.product.id, 1) }, ['+'])
                ])
            ]);
            cartContainer.appendChild(div);
        });
    }

    cartCountEl.textContent = `${totalItemsCount} items`;
    cartSubtotalEl.textContent = formatCurrency(currentSaleTotal);
    cartTotalEl.textContent = formatCurrency(currentSaleTotal);
    
    updateAIRecommendations();
}

btnClearCart.addEventListener('click', () => {
    cart = [];
    renderCart();
});

// --- AI Assistant (Smart Recommendations) ---
const categoryRules = {
    'Snacks': ['Bebidas'],
    'Bebidas': ['Snacks'],
    'Lácteos': ['Snacks', 'Otros'],
    'Limpieza': ['Otros'],
    'Todos': []
};

async function updateAIRecommendations() {
    const aiCard = document.getElementById('ai-assistant-card');
    const aiContainer = document.getElementById('ai-recommendations');
    
    if (cart.length === 0) {
        aiCard.style.display = 'none';
        return;
    }
    
    aiCard.style.display = 'block';
    aiContainer.innerHTML = '';
    aiContainer.appendChild(
        createEl('span', { className: 'text-muted small' }, [
            createEl('i', { className: 'ph ph-spinner ph-spin' }), ' Pensando sugerencias...'
        ])
    );
    
    try {
        const response = await fetch('http://localhost:3000/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart, inventory: products })
        });
        
        const data = await response.json();
        
        if(data.fallback || data.error) {
            fallbackAIRecommendations(aiCard, aiContainer);
            return;
        }

        const recommendedIds = data.recommendations || [];
        const recommendations = products.filter(p => recommendedIds.includes(p.id));
        renderRecommendations(recommendations, aiCard, aiContainer);
        
    } catch (error) {
        fallbackAIRecommendations(aiCard, aiContainer);
    }
}

function fallbackAIRecommendations(aiCard, aiContainer) {
    const cartCategories = [...new Set(cart.map(item => item.product.category))];
    let suggestedCategories = [];
    cartCategories.forEach(cat => {
        if(categoryRules[cat]) {
            suggestedCategories = [...suggestedCategories, ...categoryRules[cat]];
        }
    });
    
    if(suggestedCategories.length === 0) suggestedCategories = ['Snacks', 'Bebidas'];
    
    const cartProductIds = cart.map(item => item.product.id);
    let recommendations = products.filter(p => 
        suggestedCategories.includes(p.category) && 
        !cartProductIds.includes(p.id) &&
        p.stock > 0
    );
    
    recommendations = recommendations.sort(() => 0.5 - Math.random()).slice(0, 2);
    renderRecommendations(recommendations, aiCard, aiContainer);
}

function renderRecommendations(recommendations, aiCard, aiContainer) {
    aiContainer.innerHTML = '';
    if (recommendations.length > 0) {
        aiCard.style.display = 'block';
        recommendations.forEach(p => {
            const btn = createEl('button', { 
                className: 'btn btn-sm btn-light border border-theme d-flex align-items-center gap-2 rounded-pill shadow-sm',
                onclick: () => addToCart(p.id)
            }, [
                createEl('i', { className: 'ph ph-plus-circle text-theme' }),
                p.name
            ]);
            aiContainer.appendChild(btn);
        });
    } else {
        aiCard.style.display = 'none';
    }
}


// --- Checkout Modal Logic ---
function initCheckout() {
    const amountTotalEl = document.getElementById('checkout-amount-total');
    const inputPaid = document.getElementById('checkout-paid');
    const changeContainer = document.getElementById('checkout-change-container');
    const changeAmountEl = document.getElementById('checkout-change-amount');
    const errorEl = document.getElementById('checkout-error');
    const btnConfirmSale = document.getElementById('btn-confirm-sale');

    btnPreCheckout.addEventListener('click', () => {
        if(cart.length === 0) return;
        amountTotalEl.textContent = formatCurrency(currentSaleTotal);
        inputPaid.value = '';
        changeContainer.style.setProperty('display', 'none', 'important');
        errorEl.style.display = 'none';
        btnConfirmSale.disabled = true;
        
        bsCheckoutModal.show();
        setTimeout(() => inputPaid.focus(), 500);
    });

    inputPaid.addEventListener('input', () => {
        const paid = parseFloat(inputPaid.value) || 0;
        if (paid >= currentSaleTotal) {
            const change = paid - currentSaleTotal;
            changeAmountEl.textContent = formatCurrency(change);
            changeContainer.style.setProperty('display', 'flex', 'important');
            errorEl.style.display = 'none';
            btnConfirmSale.disabled = false;
        } else {
            changeContainer.style.setProperty('display', 'none', 'important');
            errorEl.style.display = inputPaid.value.length > 0 ? 'block' : 'none';
            btnConfirmSale.disabled = true;
        }
    });

    btnConfirmSale.addEventListener('click', () => {
        const paid = parseFloat(inputPaid.value) || currentSaleTotal;
        const change = paid - currentSaleTotal;
        processSale(paid, change);
        bsCheckoutModal.hide();
    });
}

function processSale(paid, change) {
    const sale = {
        id: generateId('TKT'),
        date: new Date().toISOString(),
        items: [...cart],
        total: currentSaleTotal,
        paidAmount: paid,
        changeAmount: change
    };
    
    sales.unshift(sale);
    cart.forEach(item => {
        const p = products.find(prod => prod.id === item.product.id);
        if(p) p.stock -= item.qty;
    });

    saveData();
    showReceipt(sale);
    
    cart = [];
    renderCart();
    renderPOSProducts(posSearch.value);
    updateDashboard();
    showToast('Venta procesada con éxito');
}

function showReceipt(sale) {
    document.getElementById('receipt-id').textContent = sale.id;
    document.getElementById('receipt-date').textContent = new Date(sale.date).toLocaleString();
    
    const itemsContainer = document.getElementById('receipt-items');
    itemsContainer.innerHTML = '';
    
    sale.items.forEach(item => {
        const div = createEl('div', { className: 'd-flex justify-content-between small mb-1' }, [
            createEl('span', {}, [`${item.qty}x ${item.product.name}`]),
            createEl('span', {}, [formatCurrency(item.qty * item.product.price)])
        ]);
        itemsContainer.appendChild(div);
    });
    
    document.getElementById('receipt-total-amount').textContent = formatCurrency(sale.total);
    document.getElementById('receipt-paid-amount').textContent = formatCurrency(sale.paidAmount || sale.total);
    document.getElementById('receipt-change-amount').textContent = formatCurrency(sale.changeAmount || 0);
    
    bsReceiptModal.show();
}

// --- Dashboard & Sales History ---
function updateDashboard() {
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
    const totalRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const lowStock = products.filter(p => p.stock <= 10).length;

    document.getElementById('dash-today-sales').textContent = formatCurrency(totalRevenue);
    document.getElementById('dash-today-orders').textContent = todaySales.length;
    document.getElementById('dash-total-products').textContent = products.length;
    document.getElementById('dash-low-stock').textContent = lowStock;

    const tbody = document.getElementById('recent-sales-tbody');
    tbody.innerHTML = '';
    sales.slice(0, 5).forEach(s => {
        const tr = createEl('tr', {}, [
            createEl('td', { className: 'ps-3 fw-bold text-muted' }, [s.id]),
            createEl('td', {}, [new Date(s.date).toLocaleTimeString()]),
            createEl('td', {}, [createEl('span', { className: 'badge bg-light text-dark border' }, [`${s.items.reduce((sum, i)=>sum+i.qty, 0)} items`])]),
            createEl('td', { className: 'pe-3 fw-bold' }, [formatCurrency(s.total)])
        ]);
        tbody.appendChild(tr);
    });
}

function renderSalesHistory() {
    const tbody = document.getElementById('sales-history-tbody');
    tbody.innerHTML = '';
    sales.forEach(s => {
        const totalItems = s.items.reduce((sum, i) => sum + i.qty, 0);
        const tr = createEl('tr', {}, [
            createEl('td', { className: 'ps-3 fw-bold text-muted' }, [s.id]),
            createEl('td', {}, [new Date(s.date).toLocaleString()]),
            createEl('td', {}, [createEl('span', { className: 'badge bg-light text-dark border' }, [totalItems])]),
            createEl('td', { className: 'fw-bold' }, [formatCurrency(s.total)]),
            createEl('td', {}, [formatCurrency(s.paidAmount || s.total)]),
            createEl('td', { className: 'text-success fw-semibold' }, [formatCurrency(s.changeAmount || 0)]),
            createEl('td', { className: 'pe-3 text-end' }, [
                createEl('button', { className: 'btn btn-sm btn-outline-secondary', onclick: () => viewSaleReceipt(s.id) }, [
                    createEl('i', { className: 'ph ph-receipt' }), ' Ver Ticket'
                ])
            ])
        ]);
        tbody.appendChild(tr);
    });
}

window.viewSaleReceipt = (id) => {
    const s = sales.find(sale => sale.id === id);
    if(s) showReceipt(s);
};

// --- Export to CSV ---
function initExportCSV() {
    const btnExport = document.getElementById('btn-export-csv');
    btnExport.addEventListener('click', () => {
        if(sales.length === 0) {
            showToast('No hay ventas para exportar');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID Venta,Fecha,Total Articulos,Monto Total,Pagó con,Vuelto\n";

        sales.forEach(s => {
            const totalItems = s.items.reduce((sum, i) => sum + i.qty, 0);
            const dateStr = new Date(s.date).toLocaleString().replace(',', '');
            const row = [
                s.id,
                dateStr,
                totalItems,
                s.total.toFixed(2),
                (s.paidAmount || s.total).toFixed(2),
                (s.changeAmount || 0).toFixed(2)
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "historial_ventas.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}
