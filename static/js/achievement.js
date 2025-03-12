document.addEventListener('DOMContentLoaded', (event) => {
    const achievementsTable = document.querySelector('.achievements-table'); // 选择表格的类名
    const currentPointsElement = document.getElementById('current-points'); // 当前积分显示的元素

    let currentPoints = parseInt(currentPointsElement.textContent.trim(), 10);

    // 初始化积分显示
    updatePointsDisplay();

    // 领取成就操作委托
    achievementsTable.addEventListener('click', (e) => {
        if (e.target.classList.contains('claim-button')) {
            const achievementRow = e.target.closest('tr');
            const achievementTitle = achievementRow.querySelector('.extended-title-cell').textContent;
            const achievementPoints = parseInt(achievementRow.querySelector('.compact-score-column').textContent, 10);
            const achievementName = achievementRow.querySelector('.extended-title-cell').textContent;
            const achievementCondition = achievementRow.querySelector('.compact-condition-column').textContent;

            if (confirm(`确定要领取成就 "${achievementTitle}" 吗？`)) {
                const achievementId = e.target.getAttribute('data-achievement-id');

                fetch('/claim-achievement', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: achievementId,
                        points: achievementPoints,
                        achievementName: achievementName,
                        condition: achievementCondition // 确保键名与服务器端一致
                    })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            currentPoints += achievementPoints;
                            updatePointsDisplay();
                            e.target.disabled = true;
                            e.target.textContent = '✅ 已领取';
                            alert('成就领取成功！');
                        } else {
                            alert('成就领取失败：' + data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error claiming achievement:', error);
                    });
            }
        }
    });

    // 积分显示更新函数
    function updatePointsDisplay() {
        currentPointsElement.textContent = currentPoints;
    }
});
