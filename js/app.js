class BudgetApp {
    constructor() {
        this.storageKey = 'smart_budget_v7_data';
        
        this.state = {
            users: {
                u1: { active: true, name: 'Χρήστης 1', income: 1000 },
                u2: { active: false, name: 'Χρήστης 2', income: 1000 }
            },
            extraUsers: [], // {id, name, income}
            extraIncomes: [], // {id, name, amount}
            tickets: [], // {id, name, amount, target: 'needs' | 'wants', owner: 'u1' | 'u2' | 'u_...'}
            percentages: { needs: 50, wants: 30, invest: 20 },
            expenses: [] // {id, name, category, subCategory, amount, isTicket}
        };

        this.categoryData = {
            needs: [
                { id: 'rent', label: 'Ενοίκιο' },
                { id: 'supermarket', label: 'Supermarket / Τρόφιμα' },
                { id: 'bills', label: 'Λογαριασμοί (Ρεύμα, Νερό, Τηλ)' },
                { id: 'transport', label: 'Μετακίνηση / Βενζίνες' },
                { id: 'medical', label: 'Υγεία / Γιατροί / Φάρμακα' },
                { id: 'insurance', label: 'Ασφάλειες' },
                { id: 'other_need', label: 'Άλλο Πάγιο' }
            ],
            wants: [
                { id: 'dining', label: 'Φαγητό έξω / Delivery' },
                { id: 'entertainment', label: 'Διασκέδαση / Χόμπι' },
                { id: 'shopping', label: 'Αγορές / Ρούχα / Δώρα' },
                { id: 'travel', label: 'Ταξίδια / Εκδρομές' },
                { id: 'other_want', label: 'Άλλη Επιθυμία' }
            ]
        };

        this.subCategoryMap = {};
        this.categoryData.needs.forEach(item => { this.subCategoryMap[item.id] = item.label; });
        this.categoryData.wants.forEach(item => { this.subCategoryMap[item.id] = item.label; });

        this.loadState();
        this.fullRender();
    }

    // --- Core Data Helpers ---
    getActiveUsers() {
        const active = [ { id: 'u1', name: this.state.users.u1.name, cash: this.state.users.u1.income } ];
        if (this.state.users.u2.active) {
            active.push({ id: 'u2', name: this.state.users.u2.name, cash: this.state.users.u2.income });
        }
        this.state.extraUsers.forEach(eu => {
            active.push({ id: eu.id, name: eu.name, cash: eu.income });
        });
        return active;
    }

    // --- State Management ---
    loadState() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try { this.migrateAndSetState(JSON.parse(saved)); return; } catch(e) {}
        }
        
        // Fallback to previous versions if v7 doesn't exist yet
        const savedV6 = localStorage.getItem('smart_budget_v6_data');
        if (savedV6) {
            try { this.migrateAndSetState(JSON.parse(savedV6)); return; } catch(e) {}
        }
        const savedV5 = localStorage.getItem('smart_budget_v5_data');
        if (savedV5) {
            try { this.migrateAndSetState(JSON.parse(savedV5)); return; } catch(e) {}
        }
    }

    migrateAndSetState(data) {
        if (!data.extraIncomes) data.extraIncomes = [];
        if (!data.tickets) data.tickets = [];
        if (!data.extraUsers) data.extraUsers = [];
        
        data.tickets.forEach(t => {
            if (!t.owner) t.owner = 'u1';
        });

        if (data.expenses) {
            data.expenses.forEach(e => {
                if (e.useVoucher !== undefined) {
                    e.isTicket = e.useVoucher;
                    delete e.useVoucher;
                }
            });
        }
        this.state = data;
    }

    saveState() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    // --- DOM Updates ---
    fullRender() {
        document.getElementById('user1Name').value = this.state.users.u1.name;
        document.getElementById('user1Income').value = this.state.users.u1.income;
        document.getElementById('user2Name').value = this.state.users.u2.name;
        document.getElementById('user2Income').value = this.state.users.u2.income;
        
        document.getElementById('percNeeds').value = this.state.percentages.needs;
        document.getElementById('percWants').value = this.state.percentages.wants;
        document.getElementById('percInvest').value = this.state.percentages.invest;

        this.toggleUser2(this.state.users.u2.active, true);
        
        this.renderExtraUsers();
        this.renderExtraIncomes();
        this.renderTickets();
        
        const subCatSelect = document.getElementById('expSubCategory');
        subCatSelect.dataset.currentCat = ''; 
        this.handleExpenseFormUI(); 

        this.renderDashboard();
    }

    updateBaseState() {
        this.state.users.u1.name = document.getElementById('user1Name').value || 'Χρήστης 1';
        this.state.users.u1.income = parseFloat(document.getElementById('user1Income').value) || 0;
        
        this.state.users.u2.name = document.getElementById('user2Name').value || 'Χρήστης 2';
        this.state.users.u2.income = parseFloat(document.getElementById('user2Income').value) || 0;

        const pN = parseFloat(document.getElementById('percNeeds').value) || 0;
        const pW = parseFloat(document.getElementById('percWants').value) || 0;
        const pI = parseFloat(document.getElementById('percInvest').value) || 0;
        this.state.percentages = { needs: pN, wants: pW, invest: pI };

        document.getElementById('percentageError').style.display = (pN + pW + pI !== 100) ? 'block' : 'none';

        this.saveState();
        this.renderTickets(); // Re-render to update user names in dropdowns
        this.renderDashboard();
    }

    toggleUser2(isActive, isInit = false) {
        this.state.users.u2.active = isActive;
        document.getElementById('user2Container').style.display = isActive ? 'block' : 'none';
        document.getElementById('addUser2Btn').style.display = isActive ? 'none' : 'block';
        
        if (!isActive) {
            this.state.tickets.forEach(t => { if (t.owner === 'u2') t.owner = 'u1'; });
        }
        
        if (!isInit) this.updateBaseState();
    }

    // --- Dynamic Extra Users ---
    addExtraUser() {
        const newId = 'u_' + Date.now().toString();
        this.state.extraUsers.push({ id: newId, name: 'Νέος Χρήστης', income: 1000 });
        this.saveState();
        this.renderExtraUsers();
        this.renderTickets();
        this.renderDashboard();
    }

    removeExtraUser(id) {
        this.state.extraUsers = this.state.extraUsers.filter(u => u.id !== id);
        // Reassign tickets of removed user to u1
        this.state.tickets.forEach(t => { if (t.owner === id) t.owner = 'u1'; });
        this.saveState();
        this.renderExtraUsers();
        this.renderTickets();
        this.renderDashboard();
    }

    updateExtraUser(id, field, value) {
        const u = this.state.extraUsers.find(x => x.id === id);
        if (u) {
            u[field] = field === 'income' ? (parseFloat(value) || 0) : value;
            this.saveState();
            if (field === 'name') this.renderTickets(); // Update dropdowns if name changes
            this.renderDashboard();
        }
    }

    renderExtraUsers() {
        const c = document.getElementById('extraUsersContainer');
        c.innerHTML = this.state.extraUsers.map(u => `
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

    // --- Dynamic Extra Incomes ---
    addExtraIncome() {
        this.state.extraIncomes.push({ id: Date.now().toString(), name: 'Νέο Έσοδο', amount: 0 });
        this.saveState();
        this.renderExtraIncomes();
        this.renderDashboard();
    }
    removeExtraIncome(id) {
        this.state.extraIncomes = this.state.extraIncomes.filter(x => x.id !== id);
        this.saveState();
        this.renderExtraIncomes();
        this.renderDashboard();
    }
    updateExtraIncome(id, field, value) {
        const item = this.state.extraIncomes.find(x => x.id === id);
        if (item) {
            item[field] = field === 'amount' ? (parseFloat(value) || 0) : value;
            this.saveState();
            this.renderDashboard();
        }
    }
    renderExtraIncomes() {
        const c = document.getElementById('extraIncomesContainer');
        c.innerHTML = this.state.extraIncomes.map(inc => `
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

    // --- Dynamic Tickets ---
    addTicket() {
        this.state.tickets.push({ id: Date.now().toString(), name: 'Κουπόνι / Ticket', amount: 0, target: 'needs', owner: 'u1' });
        this.saveState();
        this.renderTickets();
        this.renderDashboard();
    }
    removeTicket(id) {
        this.state.tickets = this.state.tickets.filter(x => x.id !== id);
        this.saveState();
        this.renderTickets();
        this.renderDashboard();
    }
    updateTicket(id, field, value) {
        const item = this.state.tickets.find(x => x.id === id);
        if (item) {
            item[field] = field === 'amount' ? (parseFloat(value) || 0) : value;
            this.saveState();
            this.renderDashboard();
        }
    }
    renderTickets() {
        const c = document.getElementById('ticketsContainer');
        const activeUsers = this.getActiveUsers();
        
        c.innerHTML = this.state.tickets.map(t => {
            // Options for owner
            const ownerOptions = activeUsers.map(u => 
                `<option value="${u.id}" ${t.owner === u.id ? 'selected' : ''}>${u.name}</option>`
            ).join('');

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

    // --- Expense Management ---
    handleExpenseFormUI() {
        const cat = document.getElementById('expCategory').value;
        const subCatSelect = document.getElementById('expSubCategory');
        
        if (subCatSelect.dataset.currentCat !== cat) {
            subCatSelect.innerHTML = '';
            this.categoryData[cat].forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = item.label;
                subCatSelect.appendChild(opt);
            });
            subCatSelect.dataset.currentCat = cat;
        }

        const totals = this.calculateTotals();
        const checkboxGroup = document.getElementById('voucherToggleGroup');
        const checkInput = document.getElementById('expIsTicket');

        if ((cat === 'needs' && totals.rem.needsTickets > 0) || (cat === 'wants' && totals.rem.wantsTickets > 0)) {
            checkboxGroup.style.display = 'block';
        } else {
            checkboxGroup.style.display = 'none';
            checkInput.checked = false;
        }
    }

    addExpense(e) {
        e.preventDefault();
        const name = document.getElementById('expName').value.trim();
        const category = document.getElementById('expCategory').value;
        const subCategory = document.getElementById('expSubCategory').value;
        const amount = parseFloat(document.getElementById('expAmount').value);
        const isTicket = document.getElementById('expIsTicket').checked;

        if (!name || isNaN(amount) || amount <= 0) return;

        this.state.expenses.push({ id: Date.now().toString(), name, category, subCategory, amount, isTicket });
        this.saveState();

        document.getElementById('expName').value = '';
        document.getElementById('expAmount').value = '';
        document.getElementById('expIsTicket').checked = false;
        document.getElementById('expName').focus();

        this.renderDashboard();
    }

    deleteExpense(id) {
        this.state.expenses = this.state.expenses.filter(ex => ex.id !== id);
        this.saveState();
        this.renderDashboard();
    }

    // --- Core Math ---
    calculateTotals() {
        const activeUsers = this.getActiveUsers();
        let userMap = {};
        activeUsers.forEach(u => {
            u.ticketsNeeds = 0;
            u.ticketsWants = 0;
            userMap[u.id] = u;
        });

        // Distribute tickets to owners
        this.state.tickets.forEach(t => {
            let ownerId = t.owner;
            if (!userMap[ownerId]) ownerId = 'u1'; // Safety fallback
            
            if (t.target === 'needs') userMap[ownerId].ticketsNeeds += t.amount;
            if (t.target === 'wants') userMap[ownerId].ticketsWants += t.amount;
        });

        // Sum up total income
        let totalCash = 0;
        let needsTicketsTotal = 0;
        let wantsTicketsTotal = 0;

        activeUsers.forEach(u => {
            u.ticketsTotal = u.ticketsNeeds + u.ticketsWants;
            u.totalIncome = u.cash + u.ticketsTotal;
            
            totalCash += u.cash;
            needsTicketsTotal += u.ticketsNeeds;
            wantsTicketsTotal += u.ticketsWants;
        });

        let extraIncomeTotal = 0;
        this.state.extraIncomes.forEach(e => extraIncomeTotal += e.amount);

        const totalIncome = totalCash + extraIncomeTotal + needsTicketsTotal + wantsTicketsTotal;

        const pN = this.state.percentages.needs / 100;
        const pW = this.state.percentages.wants / 100;
        const pI = this.state.percentages.invest / 100;

        const limits = {
            needs: totalIncome * pN,
            wants: totalIncome * pW,
            invest: totalIncome * pI
        };

        const needsCashAllocated = limits.needs - needsTicketsTotal;
        const wantsCashAllocated = limits.wants - wantsTicketsTotal;

        let spent = { needsCash: 0, needsTickets: 0, wantsCash: 0, wantsTickets: 0 };

        this.state.expenses.forEach(ex => {
            if (ex.category === 'needs') {
                if (ex.isTicket) spent.needsTickets += ex.amount;
                else spent.needsCash += ex.amount;
            } else if (ex.category === 'wants') {
                if (ex.isTicket) spent.wantsTickets += ex.amount;
                else spent.wantsCash += ex.amount;
            }
        });

        return {
            activeUsers,
            extraIncomeTotal, totalIncome, limits, 
            needsCashAllocated, wantsCashAllocated, needsTicketsTotal, wantsTicketsTotal,
            rem: {
                needsCash: needsCashAllocated - spent.needsCash,
                needsTickets: needsTicketsTotal - spent.needsTickets,
                wantsCash: wantsCashAllocated - spent.wantsCash,
                wantsTickets: wantsTicketsTotal - spent.wantsTickets
            }
        };
    }

    // --- Render Dashboard & Tables ---
    renderDashboard() {
        const data = this.calculateTotals();

        // 1. User Breakdown Table
        const pN = this.state.percentages.needs / 100;
        const pW = this.state.percentages.wants / 100;
        const pI = this.state.percentages.invest / 100;

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
            </tr>
        `).join('');

        document.getElementById('userBreakdownBody').innerHTML = breakdownHTML;

        // 2. Summary Dashboard limits
        document.getElementById('totalIncomeDisplay').innerText = data.totalIncome.toFixed(2) + ' €';
        
        document.getElementById('limitNeeds').innerHTML = `${data.limits.needs.toFixed(2)}€ <br><small style="font-size:0.75rem; font-weight:normal;">Cash: ${data.needsCashAllocated.toFixed(2)}€ | Tickets: ${data.needsTicketsTotal.toFixed(2)}€</small>`;
        document.getElementById('limitWants').innerHTML = `${data.limits.wants.toFixed(2)}€ <br><small style="font-size:0.75rem; font-weight:normal;">Cash: ${data.wantsCashAllocated.toFixed(2)}€ | Tickets: ${data.wantsTicketsTotal.toFixed(2)}€</small>`;
        document.getElementById('limitInvest').innerText = data.limits.invest.toFixed(2) + ' €';

        // 3. Expense Tables
        const needsBody = document.getElementById('needsTableBody');
        const wantsBody = document.getElementById('wantsTableBody');
        needsBody.innerHTML = '';
        wantsBody.innerHTML = '';

        this.state.expenses.forEach(ex => {
            const tr = document.createElement('tr');
            const subStr = this.subCategoryMap[ex.subCategory] || 'Άλλο';
            const paymentBadge = ex.isTicket ? `<br><span class="badge badge-voucher">Πληρώθηκε με Ticket</span>` : '';

            if (ex.category === 'needs') {
                tr.innerHTML = `
                    <td>${ex.name} ${paymentBadge}</td>
                    <td><span class="badge badge-sub">${subStr}</span></td>
                    <td>${ex.amount.toFixed(2)} €</td>
                    <td><button class="btn-delete btn-small" onclick="App.deleteExpense('${ex.id}')">X</button></td>
                `;
                needsBody.appendChild(tr);
            } else {
                tr.innerHTML = `
                    <td>${ex.name} ${paymentBadge}</td>
                    <td><span class="badge badge-sub wants-badge">${subStr}</span></td>
                    <td>${ex.amount.toFixed(2)} €</td>
                    <td><button class="btn-delete btn-small" onclick="App.deleteExpense('${ex.id}')">X</button></td>
                `;
                wantsBody.appendChild(tr);
            }
        });

        // 4. Remainders
        const setRem = (id, val) => {
            const el = document.getElementById(id);
            el.innerText = val.toFixed(2) + ' €';
            el.style.color = val < 0 ? 'var(--danger)' : 'inherit';
        };

        setRem('remNeedsCash', data.rem.needsCash);
        setRem('remNeedsTickets', data.rem.needsTickets);
        setRem('remWantsCash', data.rem.wantsCash);
        setRem('remWantsTickets', data.rem.wantsTickets);

        this.handleExpenseFormUI();
    }

    // --- JSON Backup & Restore ---
    exportData() {
        const dataStr = JSON.stringify(this.state, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `smart_budget_backup_v7_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedState = JSON.parse(e.target.result);
                if (importedState && importedState.users && Array.isArray(importedState.expenses)) {
                    this.migrateAndSetState(importedState);
                    this.saveState();
                    this.fullRender();
                    alert("Τα δεδομένα ανακτήθηκαν επιτυχώς!");
                } else {
                    alert("Το αρχείο JSON δεν έχει τη σωστή δομή.");
                }
            } catch (err) {
                alert("Σφάλμα κατά την ανάγνωση του αρχείου. Βεβαιωθείτε ότι είναι έγκυρο JSON.");
            }
            event.target.value = ''; 
        };
        reader.readAsText(file);
    }
}

// Global App Instance
const App = new BudgetApp();
