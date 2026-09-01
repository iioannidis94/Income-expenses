/**
 * ui.js - Render DOM στοιχείων, πινάκων, widgets & γραφήματος Chart.js
 */
class UIManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.chartInstance = null;
    }

    renderFull(data) {
        this.renderInputs();
        this.renderExtraUsers();
        this.renderExtraIncomes();
        this.renderPaymentMethods();
        this.renderTickets();
        this.renderDashboard(data);
    }

    renderInputs() {
        const state = this.stateManager.state;
        document.getElementById('user1Name').value = state.users.u1.name;
        document.getElementById('user1Income').value = state.users.u1.income;
        document.getElementById('user2Name').value = state.users.u2.name;
        document.getElementById('user2Income').value = state.users.u2.income;

        document.getElementById('percNeeds').value = state.percentages.needs;
        document.getElementById('percWants').value = state.percentages.wants;
        document.getElementById('percInvest').value = state.percentages.invest;
        document.getElementById('percSavings').value = state.percentages.savings;

        document.getElementById('user2Container').style.display = state.users.u2.active ? 'block' : 'none';
        document.getElementById('addUser2Btn').style.display = state.users.u2.active ? 'none' : 'block';
    }

    renderExtraUsers() {
        const c = document.getElementById('extraUsersContainer');
        c.innerHTML = this.stateManager.state.extraUsers.map(u => `
            <div class="form-group row mt-10">
                <div class="col">
                    <label>Όνομα Επιπλέον Χρήστη</label>
                    <input type="text" value="${u.name}" oninput="App.updateExtraUser('${u.id}', 'name', this.value)">
                </div>
                <div class="col">
                    <label>Έσοδα (€)</label>
                    <input type="number" value="${u.income}" oninput="App.updateExtraUser('${u.id}', 'income', this.value)">
                </div>
                <div style="display: flex; align-items: end;">
                    <button class="btn-delete btn-small" onclick="App.removeExtraUser('${u.id}')">X</button>
                </div>
            </div>
        `).join('');
    }

    renderExtraIncomes() {
        const c = document.getElementById('extraIncomesContainer');
        c.innerHTML = this.stateManager.state.extraIncomes.map(inc => `
            <div class="row form-group align-items-center">
                <div class="col">
                    <label>Όνομα</label>
                    <input type="text" value="${inc.name}" oninput="App.updateExtraIncome('${inc.id}', 'name', this.value)">
                </div>
                <div class="col">
                    <label>Ποσό (€)</label>
                    <input type="number" value="${inc.amount}" oninput="App.updateExtraIncome('${inc.id}', 'amount', this.value)">
                </div>
                <div>
                    <button class="btn-delete btn-small" onclick="App.removeExtraIncome('${inc.id}')">X</button>
                </div>
            </div>
        `).join('');
    }

    renderPaymentMethods() {
        const activeUsers = this.stateManager.getActiveUsers();
        const pmOwnerSelect = document.getElementById('newPmOwner');
        const prevOwnerVal = pmOwnerSelect.value;
        pmOwnerSelect.innerHTML = `<option value="joint">Κοινός Λογαριασμός</option>` +
            activeUsers.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
        if (prevOwnerVal) pmOwnerSelect.value = prevOwnerVal;

        const c = document.getElementById('paymentMethodsContainer');
        c.innerHTML = this.stateManager.state.paymentMethods.map(pm => {
            const icon = pm.type === 'cash' ? '💵' : '💳';
            const ownerOpts = `<option value="joint" ${pm.owner === 'joint' ? 'selected' : ''}>Κοινό</option>` +
                activeUsers.map(u => `<option value="${u.id}" ${pm.owner === u.id ? 'selected' : ''}>${u.name}</option>`).join('');

            return `
            <div class="row form-group align-items-center" style="margin-bottom: 8px; flex-wrap:wrap;">
                <div class="col" style="display:flex; align-items:center; gap: 10px;">
                    <span style="font-size:1.2rem;">${icon}</span>
                    <input type="text" value="${pm.name}" onchange="App.updatePaymentMethod('${pm.id}', 'name', this.value)">
                </div>
                <div class="col">
                    <select onchange="App.updatePaymentMethod('${pm.id}', 'owner', this.value)">
                        ${ownerOpts}
                    </select>
                </div>
                <div>
                    <button class="btn-delete btn-small" onclick="App.removePaymentMethod('${pm.id}')">X</button>
                </div>
            </div>
            `;
        }).join('');
    }

    renderTickets() {
        const c = document.getElementById('ticketsContainer');
        const activeUsers = this.stateManager.getActiveUsers();
        c.innerHTML = this.stateManager.state.tickets.map(t => {
            const ownerOptions = activeUsers.map(u => `<option value="${u.id}" ${t.owner === u.id ? 'selected' : ''}>${u.name}</option>`).join('');
            return `
            <div class="row form-group align-items-center" style="flex-wrap: wrap;">
                <div class="col">
                    <label>Όνομα Ticket</label>
                    <input type="text" value="${t.name}" oninput="App.updateTicket('${t.id}', 'name', this.value)">
                </div>
                <div class="col">
                    <label>Ποσό (€)</label>
                    <input type="number" value="${t.amount}" oninput="App.updateTicket('${t.id}', 'amount', this.value)">
                </div>
                <div class="col">
                    <label>Προορισμός</label>
                    <select onchange="App.updateTicket('${t.id}', 'target', this.value)">
                        <option value="needs" ${t.target === 'needs' ? 'selected' : ''}>Needs</option>
                        <option value="wants" ${t.target === 'wants' ? 'selected' : ''}>Wants</option>
                    </select>
                </div>
                <div class="col">
                    <label>Κάτοχος</label>
                    <select onchange="App.updateTicket('${t.id}', 'owner', this.value)">
                        ${ownerOptions}
                    </select>
                </div>
                <div>
                    <button class="btn-delete btn-small" onclick="App.removeTicket('${t.id}')">X</button>
                </div>
            </div>
            `;
        }).join('');
    }

    handleExpenseFormUI(data) {
        const cat = document.getElementById('expCategory').value;
        const subCatSelect = document.getElementById('expSubCategory');
        const pmSelect = document.getElementById('expPaymentMethod');
        const expOwnerSelect = document.getElementById('expOwner');

        if (subCatSelect.dataset.currentCat !== cat) {
            subCatSelect.innerHTML = '';
            this.stateManager.categoryData[cat].forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = item.label;
                subCatSelect.appendChild(opt);
            });
            subCatSelect.dataset.currentCat = cat;
        }

        const currentPmValue = pmSelect.value;
        pmSelect.innerHTML = this.stateManager.state.paymentMethods.map(pm => {
            return `<option value="${pm.id}">${pm.name} (${pm.type === 'cash' ? 'Μετρητά' : 'Κάρτα'})</option>`;
        }).join('');
        if (currentPmValue && this.stateManager.state.paymentMethods.find(pm => pm.id === currentPmValue)) {
            pmSelect.value = currentPmValue;
        }

        const activeUsers = this.stateManager.getActiveUsers();
        const currentOwner = expOwnerSelect.value;
        expOwnerSelect.innerHTML = `<option value="joint">Κοινό Έξοδο (Μοιράζεται)</option>` +
            activeUsers.map(u => `<option value="${u.id}">Μόνο για: ${u.name}</option>`).join('');
        if (currentOwner) expOwnerSelect.value = currentOwner;

        const checkboxGroup = document.getElementById('voucherToggleGroup');
        const checkInput = document.getElementById('expIsTicket');

        if ((cat === 'needs' && data.rem.needsTickets > 0) || (cat === 'wants' && data.rem.wantsTickets > 0)) {
            checkboxGroup.style.display = 'block';
        } else {
            checkboxGroup.style.display = 'none';
            checkInput.checked = false;
        }
    }

    sortExpensesList(category, expensesList) {
        let sortPref = 'newest';
        if (category === 'needs') sortPref = document.getElementById('sortNeeds').value;
        if (category === 'wants') sortPref = document.getElementById('sortWants').value;

        let sorted = [...expensesList];
        sorted.sort((a, b) => {
            if (sortPref === 'newest') return b.timestamp - a.timestamp;
            if (sortPref === 'oldest') return a.timestamp - b.timestamp;
            if (sortPref === 'price_desc') return b.amount - a.amount;
            if (sortPref === 'price_asc') return a.amount - b.amount;
            if (sortPref === 'pm') {
                const pmA = this.stateManager.state.paymentMethods.find(p => p.id === a.paymentMethod)?.name || '';
                const pmB = this.stateManager.state.paymentMethods.find(p => p.id === b.paymentMethod)?.name || '';
                return pmA.localeCompare(pmB);
            }
            return 0;
        });
        return sorted;
    }

    renderDashboard(data) {
        const state = this.stateManager.state;
        const pN = state.percentages.needs / 100;
        const pW = state.percentages.wants / 100;
        const pI = state.percentages.invest / 100;
        const pS = state.percentages.savings / 100;

        const formatCell = (totalAlloc, ticketValue) => {
            const cashOwed = totalAlloc - ticketValue;
            return `<strong>${totalAlloc.toFixed(2)}€</strong><br>
                    <small style="font-size:0.75rem; font-weight:normal; color:var(--text-muted);">
                        Cash: <span style="color:${cashOwed < 0 ? 'var(--danger)' : 'inherit'}">${cashOwed.toFixed(2)}€</span>
                        ${ticketValue > 0 ? ` | Tcks: ${ticketValue.toFixed(2)}€` : ''}
                    </small>`;
        };

        let breakdownHTML = data.activeUsers.map(u => `
            <tr>
                <td>${u.name}</td>
                <td>${formatCell(u.totalIncome * pN, u.ticketsNeeds)}</td>
                <td>${formatCell(u.totalIncome * pW, u.ticketsWants)}</td>
                <td>${formatCell(u.totalIncome * pI, 0)}</td>
                <td>${formatCell(u.totalIncome * pS, 0)}</td>
            </tr>
        `).join('');
        document.getElementById('userBreakdownBody').innerHTML = breakdownHTML;

        document.getElementById('totalIncomeDisplay').innerText = data.totalIncome.toFixed(2) + ' €';

        const chipsHtml = state.paymentMethods.map(pm => {
            const spent = data.spentByMethod[pm.id] || 0;
            if (spent === 0) return '';
            const cssClass = pm.type === 'cash' ? 'chip-cash' : 'chip-card';
            return `<span class="chip ${cssClass}" title="Ξοδεύτηκαν από: ${pm.name}">${pm.name}: <b>${spent.toFixed(2)}€</b></span>`;
        }).join('');

        document.getElementById('paymentChipsContainer').innerHTML = chipsHtml || '<span style="font-size: 0.8rem; color: var(--text-muted);">Δεν υπάρχουν χρεώσεις</span>';

        document.getElementById('limitNeeds').innerHTML = `${data.limits.needs.toFixed(2)}€ <br><small style="font-size:0.75rem; font-weight:normal;">Cash/Card: ${data.needsCashAllocated.toFixed(2)}€ | Tickets: ${data.needsTicketsTotal.toFixed(2)}€</small>`;
        document.getElementById('limitWants').innerHTML = `${data.limits.wants.toFixed(2)}€ <br><small style="font-size:0.75rem; font-weight:normal;">Cash/Card: ${data.wantsCashAllocated.toFixed(2)}€ | Tickets: ${data.wantsTicketsTotal.toFixed(2)}€</small>`;
        document.getElementById('limitInvest').innerText = data.limits.invest.toFixed(2) + ' €';
        document.getElementById('limitSavings').innerText = data.limits.savings.toFixed(2) + ' €';

        const needsBody = document.getElementById('needsTableBody');
        const wantsBody = document.getElementById('wantsTableBody');
        needsBody.innerHTML = '';
        wantsBody.innerHTML = '';

        const needsExpenses = this.sortExpensesList('needs', state.expenses.filter(e => e.category === 'needs'));
        const wantsExpenses = this.sortExpensesList('wants', state.expenses.filter(e => e.category === 'wants'));

        const renderRow = (ex, container) => {
            const tr = document.createElement('tr');
            const subStr = this.stateManager.subCategoryMap[ex.subCategory] || 'Άλλο';
            const ownerStr = this.stateManager.getUserName(ex.expenseOwner);

            const breakdown = data.expenseBreakdown[ex.id];
            let badgesHTML = '';

            if (breakdown.ticket > 0) {
                badgesHTML += `<span class="badge badge-voucher" style="margin-right:4px; margin-bottom: 4px;">Ticket: ${breakdown.ticket.toFixed(2)}€</span>`;
            }
            if (breakdown.methodAmount > 0) {
                const pmInfo = state.paymentMethods.find(p => p.id === breakdown.customMethodId);
                if (pmInfo) {
                    const pmClass = pmInfo.type === 'cash' ? 'badge-cash' : 'badge-card';
                    badgesHTML += `<span class="badge ${pmClass}" style="margin-right:4px; margin-bottom: 4px;">${pmInfo.name}: ${breakdown.methodAmount.toFixed(2)}€</span>`;
                } else {
                    badgesHTML += `<span class="badge badge-cash" style="margin-right:4px; margin-bottom: 4px;">Άγνωστο: ${breakdown.methodAmount.toFixed(2)}€</span>`;
                }
            }

            tr.innerHTML = `
                <td>
                    <div style="margin-bottom: 4px; font-weight:500;">${ex.name}</div>
                </td>
                <td>
                    <span class="badge badge-sub ${ex.category === 'wants' ? 'wants-badge' : ''}">${subStr}</span>
                    <div style="margin-top:4px;"><span class="badge badge-owner">Αφορά: ${ownerStr}</span></div>
                </td>
                <td>
                    <div class="amount-main">${ex.amount.toFixed(2)} €</div>
                    <div class="badge-container" style="flex-direction:row; flex-wrap:wrap;">${badgesHTML}</div>
                </td>
                <td><button class="btn-delete btn-small" onclick="App.deleteExpense('${ex.id}')">X</button></td>
            `;
            container.appendChild(tr);
        };

        needsExpenses.forEach(ex => renderRow(ex, needsBody));
        wantsExpenses.forEach(ex => renderRow(ex, wantsBody));

        const setRem = (id, val) => {
            const el = document.getElementById(id);
            el.innerText = val.toFixed(2) + ' €';
            el.style.color = val < 0 ? 'var(--danger)' : 'inherit';
        };

        setRem('remNeedsCash', data.rem.needsCash);
        setRem('remNeedsTickets', data.rem.needsTickets);
        setRem('remWantsCash', data.rem.wantsCash);
        setRem('remWantsTickets', data.rem.wantsTickets);

        this.handleExpenseFormUI(data);
        SettlementsManager.populate(document.getElementById('settlementsBody'), data, this.stateManager);
    }

    renderChart(data) {
        const ctx = document.getElementById('budgetChart').getContext('2d');
        if (this.chartInstance) this.chartInstance.destroy();

        const needsSpent = data.spentAgg.needs;
        const needsRem = Math.max(0, data.limits.needs - needsSpent);
        const wantsSpent = data.spentAgg.wants;
        const wantsRem = Math.max(0, data.limits.wants - wantsSpent);

        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [
                    'Needs (Ξοδεύτηκαν)', 'Needs (Υπόλοιπο)',
                    'Wants (Ξοδεύτηκαν)', 'Wants (Υπόλοιπο)',
                    'Invest (Διαθέσιμο)', 'Savings (Διαθέσιμο)'
                ],
                datasets: [{
                    data: [needsSpent, needsRem, wantsSpent, wantsRem, data.limits.invest, data.limits.savings],
                    backgroundColor: ['#0284c7', '#bae6fd', '#059669', '#a7f3d0', '#8b5cf6', '#f59e0b'],
                    borderWidth: 1,
                    borderColor: '#1e293b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#f8fafc' } } }
            }
        });
    }
}
