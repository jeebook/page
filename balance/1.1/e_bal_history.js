// history-container user_data

function formatDate(isoString) {
    return isoString ? isoString.split('T')[0] : '';
}

function createCardHTML(item) {
    let label = '';
    let subLabel = '';
    let amountElement = '';
    let badgeClass = '';
    let badgeText = '';
    
    const isPadding = item.status === 'padding';
    const type = item.type || 'Confirmed';
    
    if (isPadding) {
        amountElement = `
                <svg class="clock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/>
                </svg>`;
        badgeClass = 'pending';
        badgeText = 'Pending..';
    } else if (type === 'Purchased') {
        label = item.grade;
        subLabel = item.title;
        amountElement = `<div class="amount">-₹${item.balance}</div>`;
        badgeClass = 'purchased';
        badgeText = 'Purchased';
        
    } else if (type === 'refunded') {
    label = 'UTR';
    subLabel = item.utr;
    amountElement = `<div class="amount">-₹${item.balance}</div>`;
    badgeClass = 'purchased';
    badgeText = 'Refund';
    } else if (type === 'deposited') {
        label = 'UTR';
        subLabel = item.utr;
        amountElement = `<div class="amount">-₹${item.balance}</div>`;
        badgeClass = 'purchased';
        badgeText = 'Deposited';
        
    } else if (type === 'Canceled') {
        const temp_item_balance = item.balance ?? 0;
        label = 'warning';
        subLabel = item.warning;
        amountElement = `<div class="amount">₹${temp_item_balance}</div>`;
        badgeClass = 'canceled';
        badgeText = 'Canceled';
    } else {
        label = 'UTR';
        subLabel = item.utr;
        amountElement = `<div class="amount">₹${item.balance}</div>`;
        badgeClass = 'confirmed';
        badgeText = 'Confirmed';
    }
    
    let utrInfoHTML = '';
    if (label || subLabel) {
        utrInfoHTML = `
                <div class="utr-label">${label}</div>
                <div class="utr-number">${subLabel}</div>
            `;
    }
    
    return `
        <div class="card">
            <img src="${item.img}" alt="Receipt" class="card-img" onclick="open_img_preview('${item.img}')">
            <div class="card-content">
                <div class="card-top">
                    <div class="utr-info">${utrInfoHTML}</div>
                    <div class="amount-info">${amountElement}</div>
                </div>
                <div class="card-bottom">
                    <div class="date-row">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                        </svg>
                        ${formatDate(item.date_time)}
                    </div>
                    <div class="badge ${badgeClass}">${badgeText}</div>
                </div>
            </div>
        </div>`;
}

function renderHistoryHTML() {
    const container = document.getElementById('bal_history_container_id');
    // Inside your renderHistoryHTML() function:
// Inside your renderHistoryHTML() function:

const historyData = user_data?.payment_history;
const isPaddingEmpty = !historyData?.of_padding || historyData.of_padding.length === 0;
const isConfirmedEmpty = !historyData?.of_confirmed || Object.keys(historyData.of_confirmed).length === 0;
if (!historyData || (isPaddingEmpty && isConfirmedEmpty)) {
    container.innerHTML = `
        <div class="fade-in" style="text-align: center; padding: 30px; color: var(--text-muted);">
            Data Not Found
        </div>`;
    return; 
}
    let html = '';
    
    // SAFE FALLBACKS: Default to empty objects if missing
    const confirmedData = historyData.of_confirmed || {};
    
    // Safely get padding items
    const paddingItems = historyData.of_padding || [];
    paddingItems.forEach(item => { html += createCardHTML(item); });
    
    // Safely get recent items
    const recentItems = confirmedData.recent_first || [];
    recentItems.forEach(item => { html += createCardHTML(item); });
    
    // Safely get list items
    const listIndex = confirmedData.list_index || 0;
    for (let i = listIndex; i >= 1; i--) {
        const listKey = `list_${i}`;
        const currentList = confirmedData[listKey] || [];
        currentList.forEach(item => { html += createCardHTML(item); });
    }
    
    container.innerHTML = html;
    show_history_cards();
}

// Animation functions
function show_history_cards() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card, index) => {
        // Reset the state to restart the animation if already shown
        card.classList.remove('animate-in');
        card.style.display = 'flex';
        
        // Trigger reflow to restart CSS animation
        void card.offsetWidth;
        
        // Apply a staggered delay for the top-to-bottom effect
        card.style.animationDelay = `${index * 0.1}s`;
        
        // Add the animation class
        card.classList.add('animate-in');
    });
}

function data_not_found_ani() {
    const data_not_found_id = document.getElementById("data_not_found_id");
}
// Modal Logic
function open_img_preview(imgSrc) {
    document.getElementById('full_img_preview_id').src = imgSrc;
    document.getElementById('img_preview_id').classList.add('active');
}

function close_img_preview(event) {
    document.getElementById('img_preview_id').classList.remove('active');
    document.getElementById('full_img_preview_id').src = '';
}

// Generate HTML on page load but keep it hidden until 'Show' is clicked
