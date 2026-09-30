// 数据版本号：每次修改下面的 DEFAULT_DATA，就把这个数字 +1，
// 这样所有设备打开时都会强制用最新代码数据覆盖本地旧数据。
const DATA_VERSION = 2;

// 默认安吉竹海行程（所有设备共享的"唯一数据源"）
const DEFAULT_DATA = {
    destinations: [
        { id: 'dest_1', name: '中国大竹海', address: '安吉县天荒坪镇', type: 'attraction', price: 116, contact: '', notes: '1.5H  卧虎藏龙取景地，登观竹楼俯瞰万顷竹海，林间木栈道散步，拍照很有武侠感' },
        { id: 'dest_2', name: '就近午餐（竹海附近）', address: '大竹海附近', type: 'restaurant', price: 150, contact: '', notes: '推荐：笋干烧肉、竹筒饭、安吉干挑面、土鸡汤' },
        { id: 'dest_3', name: '井空里大峡谷', address: '安吉县', type: 'attraction', price: 0, contact: '', notes: '40min 免费 没有商业化，峡谷竹林，清澈溪流、小水潭，平缓路段很多，不用高强度爬山；可以溪边散步踩水，听山泉，人比网红景点少很多，不嘈杂。' },
        { id: 'dest_4', name: '雷迪森世嘉酒店(安吉苕溪路美食街店)', address: '安吉县昌硕街道苕溪路658号', type: 'hotel', price: 385, contact: '', notes: '到酒店50min' },
        { id: 'dest_5', name: '就近晚餐', address: '山川乡', type: 'restaurant', price: 150, contact: '', notes: '' },
        { id: 'dest_7', name: '小杭坑（安吉小瑞士）', address: '安吉县', type: 'attraction', price: 100, contact: '', notes: '1.5H  溪流+大草坪+连绵竹海，商业化低；1号营地门票，2号营地免费大片草甸，湖边漫步、拍牛羊，适合两人慢慢散步发呆' },
        { id: 'dest_8', name: '农家菜午餐（小杭坑附近）', address: '小杭坑附近', type: 'restaurant', price: 100, contact: '', notes: '附近农家菜' },
        { id: 'dest_9', name: '白茶观景台', address: '安吉县', type: 'attraction', price: 0, contact: '', notes: '1H  免费，俯瞰整片白茶梯田，窗边咖啡馆喝杯白茶，茶山出片，时间紧可跳过' }
    ],
    schedule: [
        { day: 1, items: [
            { id: 'item_1_1', destinationId: 'dest_1', time: '10:10', duration: 2, notes: '游玩2h，登观竹楼、木栈道散步' },
            { id: 'item_1_2', destinationId: 'dest_2', time: '12:10', duration: 1.5, notes: '农家乐午餐' },
            { id: 'item_1_3', destinationId: 'dest_3', time: '14:00', duration: 3, notes: '自驾40分钟到达，游玩至17:00' },
            { id: 'item_1_5', destinationId: 'dest_5', time: '18:30', duration: 2, notes: '晚餐+休息' }
        ]},
        { day: 2, items: [
            { id: 'item_2_2', destinationId: 'dest_7', time: '09:00', duration: 3, notes: '自驾25分钟到达，游玩2.5-3h，环湖轻徒步' },
            { id: 'item_2_3', destinationId: 'dest_8', time: '12:00', duration: 1.5, notes: '农家菜午餐' },
            { id: 'item_2_4', destinationId: 'dest_9', time: '13:30', duration: 1, notes: '可选打卡，时间紧可跳过' }
        ]}
    ]
};

// 旅游规划应用主逻辑
class TravelPlanner {
    constructor() {
        this.destinations = [];
        this.schedule = [];
        
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.renderDestinations();
        this.renderSchedule();
        this.updateBudget();
    }

    // 数据持久化
    saveData() {
        const data = {
            dataVersion: DATA_VERSION,
            destinations: this.destinations,
            schedule: this.schedule
        };
        localStorage.setItem('travelPlannerData', JSON.stringify(data));
    }

    loadData() {
        const raw = localStorage.getItem('travelPlannerData');
        let parsed = null;
        if (raw) {
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                parsed = null;
            }
        }
        
        // 当本地无数据、数据为空、或版本号与代码不一致时，统一用代码默认数据覆盖
        const isStale = !parsed
            || !Array.isArray(parsed.destinations)
            || parsed.destinations.length === 0
            || parsed.dataVersion !== DATA_VERSION;
        
        if (isStale) {
            this.destinations = JSON.parse(JSON.stringify(DEFAULT_DATA.destinations));
            this.schedule = JSON.parse(JSON.stringify(DEFAULT_DATA.schedule));
            this.saveData();
        } else {
            this.destinations = parsed.destinations;
            this.schedule = parsed.schedule || [];
        }
    }

    // 事件绑定
    bindEvents() {
        // 标签页切换
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // 目的地模态框
        const destModal = document.getElementById('destinationModal');
        const addDestBtn = document.getElementById('addDestinationBtn');
        const closeBtns = destModal.querySelectorAll('.close-btn, .cancel-btn');
        
        addDestBtn.addEventListener('click', () => this.openDestinationModal());
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(destModal));
        });

        // 目的地表单提交
        document.getElementById('destinationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDestination();
        });

        // 日程模态框
        const scheduleModal = document.getElementById('scheduleItemModal');
        const addDayBtn = document.getElementById('addDayBtn');
        const scheduleCloseBtns = scheduleModal.querySelectorAll('.close-btn, .cancel-btn');
        
        addDayBtn.addEventListener('click', () => this.addDay());
        scheduleCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(scheduleModal));
        });

        // 日程项表单提交
        document.getElementById('scheduleItemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveScheduleItem();
        });

        // 导出按钮
        document.getElementById('exportBtn').addEventListener('click', () => {
            document.getElementById('exportModal').classList.add('active');
        });

        // 导出选项
        document.getElementById('exportImage').addEventListener('click', () => this.exportAsImage());
        document.getElementById('exportPDF').addEventListener('click', () => this.exportAsPDF());

        // 关闭导出模态框
        const exportModal = document.getElementById('exportModal');
        exportModal.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(exportModal));
        });

        // 点击模态框外部关闭
        [destModal, scheduleModal, exportModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    // 标签页切换
    switchTab(tabId) {
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });

        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
    }

    // 模态框控制
    openDestinationModal(destination = null) {
        const modal = document.getElementById('destinationModal');
        const form = document.getElementById('destinationForm');
        const title = document.getElementById('modalTitle');

        if (destination) {
            title.textContent = '编辑目的地';
            document.getElementById('destinationId').value = destination.id;
            document.getElementById('destName').value = destination.name;
            document.getElementById('destAddress').value = destination.address || '';
            document.getElementById('destType').value = destination.type;
            document.getElementById('destPrice').value = destination.price || '';
            document.getElementById('destContact').value = destination.contact || '';
            document.getElementById('destNotes').value = destination.notes || '';
        } else {
            title.textContent = '添加目的地';
            form.reset();
            document.getElementById('destinationId').value = '';
        }

        modal.classList.add('active');
    }

    closeModal(modal) {
        modal.classList.remove('active');
    }

    // 目的地管理
    saveDestination() {
        const id = document.getElementById('destinationId').value;
        const name = document.getElementById('destName').value.trim();
        const address = document.getElementById('destAddress').value.trim();
        const type = document.getElementById('destType').value;
        const price = parseFloat(document.getElementById('destPrice').value) || 0;
        const contact = document.getElementById('destContact').value.trim();
        const notes = document.getElementById('destNotes').value.trim();

        const destination = {
            id: id || Date.now().toString(),
            name,
            address,
            type,
            price,
            contact,
            notes
        };

        if (id) {
            // 编辑现有目的地
            const index = this.destinations.findIndex(d => d.id === id);
            if (index !== -1) {
                this.destinations[index] = destination;
            }
        } else {
            // 添加新目的地
            this.destinations.push(destination);
        }

        this.saveData();
        this.renderDestinations();
        this.updateBudget();
        this.closeModal(document.getElementById('destinationModal'));
    }

    deleteDestination(id) {
        if (confirm('确定要删除这个目的地吗？')) {
            this.destinations = this.destinations.filter(d => d.id !== id);
            // 同时从日程中移除相关项
            this.schedule.forEach(day => {
                day.items = day.items.filter(item => item.destinationId !== id);
            });
            this.saveData();
            this.renderDestinations();
            this.renderSchedule();
            this.updateBudget();
        }
    }

    renderDestinations() {
        const container = document.getElementById('destinationsList');
        
        if (this.destinations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📍</div>
                    <p>暂无目的地</p>
                    <p>点击"添加目的地"开始规划您的旅行</p>
                </div>
            `;
            return;
        }

        const typeLabels = {
            attraction: '景点',
            hotel: '酒店',
            restaurant: '餐厅',
            transport: '交通',
            other: '其他'
        };

        container.innerHTML = this.destinations.map(dest => `
            <div class="destination-card">
                <div class="destination-header">
                    <span class="destination-name">${this.escapeHtml(dest.name)}</span>
                    <span class="destination-type" data-type="${dest.type}">${typeLabels[dest.type]}</span>
                </div>
                <div class="destination-info">
                    ${dest.address ? `<p>📍 ${this.escapeHtml(dest.address)}</p>` : ''}
                    ${dest.price ? `<p>💰 ¥${dest.price}</p>` : ''}
                    ${dest.contact ? `<p>📞 ${this.escapeHtml(dest.contact)}</p>` : ''}
                    ${dest.notes ? `<p>📝 ${this.escapeHtml(dest.notes)}</p>` : ''}
                </div>
                <div class="destination-actions">
                    <button class="btn btn-secondary btn-small" onclick="app.editDestination('${dest.id}')">编辑</button>
                    <button class="btn btn-danger btn-small" onclick="app.deleteDestination('${dest.id}')">删除</button>
                </div>
            </div>
        `).join('');
    }

    editDestination(id) {
        const destination = this.destinations.find(d => d.id === id);
        if (destination) {
            this.openDestinationModal(destination);
        }
    }

    // 日程管理
    addDay() {
        const dayIndex = this.schedule.length + 1;
        this.schedule.push({
            day: dayIndex,
            items: []
        });
        this.saveData();
        this.renderSchedule();
    }

    deleteDay(dayIndex) {
        if (confirm(`确定要删除第 ${dayIndex} 天的行程吗？`)) {
            this.schedule.splice(dayIndex - 1, 1);
            // 重新编号
            this.schedule.forEach((day, index) => {
                day.day = index + 1;
            });
            this.saveData();
            this.renderSchedule();
        }
    }

    openScheduleItemModal(dayIndex) {
        const modal = document.getElementById('scheduleItemModal');
        const select = document.getElementById('scheduleDestination');
        
        // 填充目的地选择器
        select.innerHTML = '<option value="">请选择...</option>' + 
            this.destinations.map(dest => 
                `<option value="${dest.id}">${this.escapeHtml(dest.name)}</option>`
            ).join('');

        document.getElementById('scheduleDayIndex').value = dayIndex;
        document.getElementById('scheduleItemForm').reset();
        document.getElementById('scheduleDayIndex').value = dayIndex;
        
        modal.classList.add('active');
    }

    saveScheduleItem() {
        const dayIndex = parseInt(document.getElementById('scheduleDayIndex').value);
        const destinationId = document.getElementById('scheduleDestination').value;
        const time = document.getElementById('scheduleTime').value;
        const duration = parseFloat(document.getElementById('scheduleDuration').value) || 1;
        const notes = document.getElementById('scheduleNotes').value.trim();

        if (!destinationId) {
            alert('请选择一个目的地');
            return;
        }

        const item = {
            id: Date.now().toString(),
            destinationId,
            time,
            duration,
            notes
        };

        const day = this.schedule[dayIndex - 1];
        if (day) {
            day.items.push(item);
            // 按时间排序
            day.items.sort((a, b) => {
                if (!a.time) return 1;
                if (!b.time) return -1;
                return a.time.localeCompare(b.time);
            });
        }

        this.saveData();
        this.renderSchedule();
        this.closeModal(document.getElementById('scheduleItemModal'));
    }

    deleteScheduleItem(dayIndex, itemId) {
        const day = this.schedule[dayIndex - 1];
        if (day) {
            day.items = day.items.filter(item => item.id !== itemId);
            this.saveData();
            this.renderSchedule();
        }
    }

    renderSchedule() {
        const container = document.getElementById('scheduleContainer');
        
        if (this.schedule.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📅</div>
                    <p>暂无行程安排</p>
                    <p>点击"添加一天"开始规划您的行程</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.schedule.map((day, index) => `
            <div class="day-card">
                <div class="day-header">
                    <span class="day-title">第 ${day.day} 天</span>
                    <div class="day-actions">
                        <button class="btn btn-primary btn-small" onclick="app.openScheduleItemModal(${day.day})">+ 添加行程</button>
                        <button class="btn btn-danger btn-small" onclick="app.deleteDay(${day.day})">删除此天</button>
                    </div>
                </div>
                <div class="schedule-items">
                    ${day.items.length === 0 ? 
                        '<p style="color: var(--text-secondary); padding: 1rem;">暂无行程，点击上方按钮添加</p>' :
                        day.items.map(item => {
                            const dest = this.destinations.find(d => d.id === item.destinationId);
                            if (!dest) return '';
                            return `
                                <div class="schedule-item">
                                    <span class="schedule-time">${item.time || '--:--'}</span>
                                    <div class="schedule-details">
                                        <div class="schedule-destination">${this.escapeHtml(dest.name)}</div>
                                        <div class="schedule-meta">
                                            ${item.duration ? `时长: ${item.duration}小时` : ''}
                                            ${item.notes ? ` | ${this.escapeHtml(item.notes)}` : ''}
                                        </div>
                                    </div>
                                    <div class="schedule-item-actions">
                                        <button class="btn btn-danger btn-small" onclick="app.deleteScheduleItem(${day.day}, '${item.id}')">×</button>
                                    </div>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>
        `).join('');
    }

    // 费用估算
    updateBudget() {
        let transport = 0;
        let accommodation = 0;
        let ticket = 0;
        let food = 0;
        let other = 0;

        this.destinations.forEach(dest => {
            const price = dest.price || 0;
            switch (dest.type) {
                case 'transport':
                    transport += price;
                    break;
                case 'hotel':
                    accommodation += price;
                    break;
                case 'attraction':
                    ticket += price;
                    break;
                case 'restaurant':
                    food += price;
                    break;
                default:
                    other += price;
            }
        });

        const total = transport + accommodation + ticket + food + other;

        document.getElementById('totalBudget').textContent = `¥${total.toFixed(2)}`;
        document.getElementById('transportBudget').textContent = `¥${transport.toFixed(2)}`;
        document.getElementById('accommodationBudget').textContent = `¥${accommodation.toFixed(2)}`;
        document.getElementById('ticketBudget').textContent = `¥${ticket.toFixed(2)}`;
        document.getElementById('foodBudget').textContent = `¥${food.toFixed(2)}`;
        document.getElementById('otherBudget').textContent = `¥${other.toFixed(2)}`;

        // 渲染费用明细
        const detailsList = document.getElementById('budgetDetailsList');
        const itemsWithPrice = this.destinations.filter(d => d.price > 0);
        
        if (itemsWithPrice.length === 0) {
            detailsList.innerHTML = '<p style="color: var(--text-secondary); padding: 1rem;">暂无费用记录</p>';
        } else {
            detailsList.innerHTML = itemsWithPrice.map(dest => `
                <div class="budget-item">
                    <span class="budget-item-name">${this.escapeHtml(dest.name)} <span class="type-tag">${this.getTypeLabel(dest.type)}</span></span>
                    <span class="budget-item-price">¥${dest.price.toFixed(2)}</span>
                </div>
            `).join('');
        }
    }

    getTypeLabel(type) {
        const labels = {
            attraction: '景点',
            hotel: '酒店',
            restaurant: '餐厅',
            transport: '交通',
            other: '其他'
        };
        return labels[type] || '其他';
    }

    // 导出功能
    async exportAsImage() {
        try {
            const element = document.querySelector('.main-content');
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const link = document.createElement('a');
            link.download = `旅游规划_${new Date().toLocaleDateString()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            this.closeModal(document.getElementById('exportModal'));
        } catch (error) {
            console.error('导出图片失败:', error);
            alert('导出图片失败，请稍后重试');
        }
    }

    async exportAsPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            const element = document.querySelector('.main-content');
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210; // A4 宽度 (mm)
            const pageHeight = 297; // A4 高度 (mm)
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;

            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            doc.save(`旅游规划_${new Date().toLocaleDateString()}.pdf`);
            this.closeModal(document.getElementById('exportModal'));
        } catch (error) {
            console.error('导出 PDF 失败:', error);
            alert('导出 PDF 失败，请稍后重试');
        }
    }

    // 工具函数
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TravelPlanner();
    initStarfield();
});

// 星空粒子背景初始化
async function initStarfield() {
    if (typeof tsParticles === 'undefined' || typeof loadSlim === 'undefined') return;
    try {
        await loadSlim(tsParticles);
        await tsParticles.load({
            id: "tsparticles",
            options: {
                background: { color: "#0a0e27" },
                fpsLimit: 60,
                particles: {
                    number: { value: 120 },
                    color: { value: "#ffffff" },
                    links: { enable: false },
                    opacity: {
                        value: { min: 0.2, max: 1 },
                        animation: { enable: true, speed: 1.5, sync: false }
                    },
                    move: {
                        enable: true,
                        speed: 0.8,
                        direction: "none",
                        outModes: { default: "out" }
                    },
                    size: { value: { min: 0.5, max: 2 } }
                },
                interactivity: {
                    detect_on: "none",
                    events: {
                        onHover: { enable: false },
                        onClick: { enable: false }
                    }
                }
            }
        });
    } catch (e) {
        console.error('星空背景初始化失败:', e);
    }
}
