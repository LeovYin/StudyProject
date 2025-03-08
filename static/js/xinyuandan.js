// 心愿单功能
const wishGrid = document.querySelector('.wish-grid');
const addWishBtn = document.getElementById('add-wish-btn');
const wishModal = document.getElementById('wish-modal');
const wishForm = document.getElementById('wish-form');

// 打开模态框
addWishBtn.addEventListener('click', () => {
    wishModal.style.display = 'flex';
});

// 关闭模态框
document.querySelectorAll('.cancel-btn, .modal').forEach(el => {
    el.addEventListener('click', (e) => {
        if (e.target === el) {
            wishModal.style.display = 'none';
        }
    });
});

// 提交新心愿
wishForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const wishName = document.getElementById('wish-name').value.trim();
    const wishPoints = parseInt(document.getElementById('wish-points').value);

    if (wishName && wishPoints > 0) {
        const wishCard = document.createElement('div');
        wishCard.className = 'wish-card';
        wishCard.innerHTML = `
            <div class="wish-content">
                <h3 class="wish-title">${wishName}</h3>
                <div class="wish-meta">
                    <span class="wish-points">🎫 ${wishPoints} 积分</span>
                    <div class="wish-actions">
                        <button class="icon-btn edit-btn">✏️</button>
                        <button class="icon-btn delete-btn">🗑️</button>
                    </div>
                </div>
            </div>
            <button class="redeem-btn" ${wishPoints > currentPoints ? 'disabled' : ''}>
                ${wishPoints > currentPoints ? '积分不足' : '立即兑换'}
            </button>
        `;

        wishGrid.appendChild(wishCard);
        wishModal.style.display = 'none';
        wishForm.reset();
    }
});

// 心愿操作委托
wishGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.wish-card');

    if (e.target.classList.contains('delete-btn')) {
        card.remove();
    }

    if (e.target.classList.contains('edit-btn')) {
        // 编辑功能实现（需补充逻辑）
        alert('编辑功能开发中...');
    }

    if (e.target.classList.contains('redeem-btn')) {
        if (confirm(`确定要兑换 ${card.querySelector('.wish-title').textContent} 吗？`)) {
            // 积分扣除逻辑
            const points = parseInt(card.querySelector('.wish-points').textContent.match(/\d+/)[0]);
            currentPoints -= points;
            updatePointsDisplay();
            card.remove();
        }
    }
});

// 积分显示更新函数
function updatePointsDisplay() {
    document.getElementById('current-points').textContent = currentPoints;
    document.querySelectorAll('.redeem-btn').forEach(btn => {
        const required = parseInt(btn.parentElement.querySelector('.wish-points').textContent.match(/\d+/)[0]);
        btn.disabled = currentPoints < required;
        btn.textContent = currentPoints < required ? '积分不足' : '立即兑换';
    });
}