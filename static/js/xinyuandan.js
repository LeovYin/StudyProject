document.addEventListener('DOMContentLoaded', (event) => {
    const wishGrid = document.querySelector('.wish-grid');
    const addWishBtn = document.getElementById('add-wish-btn');
    const wishModal = document.getElementById('wish-modal');
    const wishForm = document.getElementById('wish-form');
    const editWishModal = document.getElementById('edit-wish-modal');
    const editWishForm = document.getElementById('edit-wish-form');
    const btnCancel = document.querySelector('.btn-cancel');
    const currentPointsElement = document.getElementById('current-points');

    let currentPoints = parseInt(currentPointsElement.textContent.trim(), 10);

    // 初始化积分显示
    updatePointsDisplay();

    // 打开添加心愿模态框
    addWishBtn.addEventListener('click', () => {
        wishModal.style.display = 'flex';
    });

    // 关闭模态框
    document.querySelectorAll('.cancel-btn, .modal').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target === el || e.target.classList.contains('cancel-btn')) {
                wishModal.style.display = 'none';
                editWishModal.style.display = 'none';
            }
        });
    });

    // 提交新心愿
    wishForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const wishName = document.getElementById('wish-name').value.trim();
        const wishPoints = parseInt(document.getElementById('wish-points').value);

        if (wishName && wishPoints > 0) {
            fetch('/add-wish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({name: wishName, points: wishPoints}),
            })
                .then(response => response.json())
                .then(data => {
                    console.log('ddataxuan', data)
                    if (data.status === 'success' && data.count < 9) {
                        const wishCard = document.createElement('div');
                        wishCard.className = 'wish-card';
                        wishCard.setAttribute('data-wish-id', data.wish_id); // 假设后端返回了心愿ID
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
                        updatePointsDisplay();
                    } else if (data.status === 'success' && data.count >= 9) {
                        wishModal.style.display = 'none';
                    } else {
                        alert(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error adding wish:', error);
                });
        }
    });

    // 心愿操作委托
    wishGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.wish-card');

        if (e.target.classList.contains('delete-btn')) {
            const wishId = card.getAttribute('data-wish-id');
            if (confirm('确定要删除这个心愿吗？')) {
                fetch('/delete-wish', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({id: wishId})
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            card.remove();
                            updatePointsDisplay();
                            alert('心愿删除成功');
                        } else {
                            alert('心愿删除失败');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
            }
        }

        if (e.target.classList.contains('edit-btn')) {
            const wishId = card.getAttribute('data-wish-id');
            const wishTitle = card.querySelector('.wish-title').textContent;
            const wishPoints = parseInt(card.querySelector('.wish-points').textContent.match(/\d+/)[0]);

            document.getElementById('edit-wish-id').value = wishId;
            document.getElementById('edit-wish-title').value = wishTitle;
            document.getElementById('edit-wish-points').value = wishPoints;

            editWishModal.style.display = 'flex';
        }
        //兑换心愿单
        if (e.target.classList.contains('redeem-btn') && !e.target.disabled) {
            if (confirm(`确定要兑换 ${card.querySelector('.wish-title').textContent} 吗？`)) {
                const wishId = card.getAttribute('data-wish-id');
                const points = parseInt(card.querySelector('.wish-points').textContent.match(/\d+/)[0]);
                const wishName = card.querySelector('.wish-title').textContent;

                fetch('/redeem-wish', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({id: wishId, points: points, wishName: wishName})
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            currentPoints -= points;
                            updatePointsDisplay();
                            alert('心愿兑换成功');
                        } else {
                            alert('心愿兑换失败，请试试刷新！');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
            }
        }
    });

    // 提交编辑心愿
    editWishForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const wishId = document.getElementById('edit-wish-id').value;
        const wishName = document.getElementById('edit-wish-title').value.trim();
        const wishPoints = parseInt(document.getElementById('edit-wish-points').value);

        if (wishName && wishPoints > 0) {
            fetch('/edit-wish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({id: wishId, name: wishName, points: wishPoints}),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        const wishCard = document.querySelector(`.wish-card[data-wish-id="${wishId}"]`);
                        wishCard.querySelector('.wish-title').textContent = wishName;
                        wishCard.querySelector('.wish-points').textContent = `🎫 ${wishPoints} 积分`;
                        editWishModal.style.display = 'none';
                        updatePointsDisplay();
                    } else {
                        alert(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error editing wish:', error);
                });
        }

    });

    // 积分显示更新函数
    function updatePointsDisplay() {
        currentPointsElement.textContent = currentPoints;
        document.querySelectorAll('.redeem-btn').forEach(btn => {
            const required = parseInt(btn.parentElement.querySelector('.wish-points').textContent.match(/\d+/)[0]);
            btn.disabled = currentPoints < required;
            btn.textContent = currentPoints < required ? '积分不足' : '立即兑换';
        });
    }
});
