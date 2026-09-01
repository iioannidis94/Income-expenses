class BudgetApp {
    constructor() {
        this.storageKey = 'smart_budget_v2_data';
        
        this.state = {
            users: {
                u1: { active: true, name: 'Χρήστης 1', income: 1000 },
                u2: { active: false, name: 'Χρήστης 2', income: 1000 }
            },
            vouchers: 100,
            percentages: { needs: 50, wants: 30, invest: 20 },
            expenses: []
        };

        this.subCategoryMap = {
            'rent': 'Ενοίκιο',
            'supermarket': 'Supermarket/Τρόφιμα',
            'bills': 'Λογαριασμοί',
            'transport': 'Μετακίνηση',
            'other': 'Άλλο Πάγιο'
        };

        this.loadState();
        this.initUI();
    }

    loadState() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            this.state = JSON.parse(saved);
        }
    }

    saveState() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    initUI() {
        // Hydrate Inputs
        document.getElementById('user1Name').value = this.state.users.u1.name;
        document.getElementById('user1Income').value = this.state.users.u1.income;
        
        document.getElementById('user2Name').value = this.state.users.u2.name;
        document.getElementById('user2Income').value = this.state.users.u2.income;
        
        document.getElementById('vouchers').value = this.state.vouchers;

        document.getElementById('percNeeds').value = this.state.percentages.needs;
        document.getElementById('percWants').value = this.state.percentages.wants;
        document.getElementById('percInvest').value = this.state.percentages.invest;

        // Toggle User 2 visibility based on state
        this.toggleUser2(this.state.users.u2.active, true);
        
        this.handleCategoryChange(); // Setup form visibility
        this.render();
    }

    toggleUser2(isActive, isInit = false) {
        this.state.users.u2.active = isActive;
        
        document.getElementById('user2Container').style.display = isActive ? 'block' : 'none';
        document.getElementById('addUser2Btn').style.display = isActive ? 'none' : 'block';
        
        if (!isInit) {
            this.updateState();
        }
    }

    updateState() {
        // Users & Vouchers
        this.state.users.u1.name = document.getElementById('user1Name').value || 'Χρήστης 1';
        this.state.users.u1.income = parseFloat(document.getElementById('user1Income').value) || 0;
        
        this.state.users.u2.name = document.getElementById('user2Name').value || 'Χρήστης 2';
        this.state.users.u2.income = parseFloat(document.getElementById('user2Income').value) || 0;

        this.state.vouchers = parseFloat(document.getElementById('vouchers').value) || 0;

        // Percentages
        const pNeeds = parseFloat(document.getElementById('percNeeds').value) || 0;
        const pWants = parseFloat(document.getElementById('percWants').value) || 0;
        const pInvest = parseFloat(document.getElementById('percInvest').value) || 0;

        this.state.percentages = { needs: pNeeds, wants: pWants, invest: pInvest };

        // Validation
        const totalPerc = pNeeds + pWants + pInvest;
        const errEl = document.getElementById('percentageError');
        if (totalPerc !== 100) {
            errEl.style.display = 'block';
        } else {
            errEl.style.display = 'none';
        }

        this.saveState();
        this.render();
    }

    handleCategoryChange() {
        const cat = document.getElementById('expCategory').value;
        const subCatGroup = document.getElementById('subCategoryGroup');
        const subCat = document.getElementById('expSubCategory').value;
        const voucherGroup = document.getElementById('voucherToggleGroup');
        const useVoucherCheck = document.getElementById('expUseVoucher');

        if (cat === 'needs') {
            subCatGroup.style.display = 'block';
            if (subCat === 'supermarket') {
                voucherGroup.style.display = 'block';
            } else {
                voucherGroup.style.display = 'none';
                useVoucherCheck.checked = false;
            }
        } else {
            subCatGroup.style.display = 'none';
            voucherGroup.style.display = 'none';
            useVoucherCheck.checked = false;
        }
    }

    addExpense(e) {
        e.preventDefault();

        const name = document.getElementById('expName').value.trim();
        const category = document.getElementById('expCategory').value;
        const subCategory = category === 'needs' ? document.getElementById('expSubCategory').value : null;
        const amount = parseFloat(document.getElementById('expAmount').value);
        const useVoucher = category === 'needs' && subCategory === 'supermarket' ? document.getElementById('expUseVoucher').checked : false;

        if (!name || isNaN(amount) || amount <= 0) return;

        const expense = {
            id: Date.now().toString(),
            name,
            category,
            subCategory,
            amount,
            useVoucher
        };

        this.state.expenses.push(expense);
        this.saveState();

        // Reset form specifics
        document.getElementById('expName').value = '';
        document.getElementById('expAmount').value = '';
        document.getElementById('expUseVoucher').checked = false;
        document.getElementById('expName').focus();

        this.render();
    }

    deleteExpense(id) {
        this.state.expenses = this.state.expenses.filter(ex => ex.id !== id);
        this.saveState();
        this.render();
    }

    calculateTotals() {
        // Total Cash
        let totalCash = this.state.users.u1.income;
        if (this.state.users.u2.active) {
            totalCash += this.state.users.u2.income;
        }

        const p = this.state.percentages;
        // If percentages don't match 100, calculations will just use whatever they set.
        const limits = {
            needs: totalCash * (p.needs / 100),
            wants: totalCash * (p.wants / 100),
            invest: totalCash * (p.invest / 100),
            vouchers: this.state.vouchers
        };

        let spent = { needsCash: 0, wantsCash: 0, vouchers: 0 };

        this.state.expenses.forEach(ex => {
            if (ex.useVoucher) {
                spent.vouchers += ex.amount;
            } else {
                if (ex.category === 'needs') spent.needsCash += ex.amount;
                if (ex.category === 'wants') spent.wantsCash += ex.amount;
            }
        });

        return {
            limits,
            spent,
            rem: {
                needs: limits.needs - spent.needsCash,
                wants: limits.wants - spent.wantsCash,
                vouchers: limits.vouchers - spent.vouchers
            }
        };
    }

    render() {
        const data = this.calculateTotals();

        // Top limits update
        document.getElementById('limitNeeds').innerText = data.limits.needs.toFixed(2) + ' €';
        document.getElementById('limitWants').innerText = data.limits.wants.toFixed(2) + ' €';
        document.getElementById('limitInvest').innerText = data.limits.invest.toFixed(2) + ' €';
        document.getElementById('limitVouchers').innerText = data.limits.vouchers.toFixed(2) + ' €';

        // Table updates
        const needsBody = document.getElementById('needsTableBody');
        const wantsBody = document.getElementById('wantsTableBody');
        needsBody.innerHTML = '';
        wantsBody.innerHTML = '';

        this.state.expenses.forEach(ex => {
            const tr = document.createElement('tr');
            
            if (ex.category === 'needs') {
                const subStr = this.subCategoryMap[ex.subCategory] || '';
                const paymentBadge = ex.useVoucher 
                    ? `<span class="badge badge-voucher">Πληρώθηκε με Ticket</span>` 
                    : '';

                tr.innerHTML = `
                    <td>${ex.name} <br>${paymentBadge}</td>
                    <td><span class="badge badge-sub">${subStr}</span></td>
                    <td>${ex.amount.toFixed(2)} €</td>
                    <td><button class="btn-delete btn-small" onclick="App.deleteExpense('${ex.id}')">X</button></td>
                `;
                needsBody.appendChild(tr);
            } else {
                tr.innerHTML = `
                    <td>${ex.name}</td>
                    <td>${ex.amount.toFixed(2)} €</td>
                    <td><button class="btn-delete btn-small" onclick="App.deleteExpense('${ex.id}')">X</button></td>
                `;
                wantsBody.appendChild(tr);
            }
        });

        // Remainder updates
        const elNeeds = document.getElementById('remNeeds');
        const elWants = document.getElementById('remWants');
        const elVouch = document.getElementById('remVouchers');

        elNeeds.innerText = data.rem.needs.toFixed(2) + ' €';
        elNeeds.style.color = data.rem.needs < 0 ? 'var(--danger)' : 'var(--text-main)';

        elWants.innerText = data.rem.wants.toFixed(2) + ' €';
        elWants.style.color = data.rem.wants < 0 ? 'var(--danger)' : 'var(--text-main)';

        elVouch.innerText = data.rem.vouchers.toFixed(2) + ' €';
        elVouch.style.color = data.rem.vouchers < 0 ? 'var(--danger)' : 'var(--wants-color)';
    }
}

// Global App Instance
const App = new BudgetApp();
