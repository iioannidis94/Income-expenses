class StateManager {
    constructor() {
        this.storageKey = 'smart_budget_v14_data';
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

        this.state = {
            users: {
                u1: { active: true, name: 'Χρήστης 1', income: 1000 },
                u2: { active: false, name: 'Χρήστης 2', income: 1000 }
            },
            extraUsers: [],
            extraIncomes: [],
            tickets: [],
            paymentMethods: [
                { id: 'pm_cash', name: 'Βασικά Μετρητά', type: 'cash', owner: 'u1', isPrimary: true },
                { id: 'pm_card', name: 'Βασική Κάρτα', type: 'card', owner: 'u1', isPrimary: true }
            ],
            percentages: { needs: 50, wants: 30, invest: 10, savings: 10 },
            expenses: []
        };
        
        this.load();
    }

    load() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try { this.migrateAndSetState(JSON.parse(saved)); return; } catch (e) {}
        }
        const olderKeys = ['smart_budget_v13_data', 'smart_budget_v12_data', 'smart_budget_v11_data'];
        for (let key of olderKeys) {
            const olderSaved = localStorage.getItem(key);
            if (olderSaved) {
                try { this.migrateAndSetState(JSON.parse(olderSaved)); return; } catch (e) {}
            }
        }
    }

    migrateAndSetState(data) {
        if (!data.extraIncomes) data.extraIncomes = [];
        if (!data.tickets) data.tickets = [];
        if (!data.extraUsers) data.extraUsers = [];
        if (!data.paymentMethods) {
            data.paymentMethods = [
                { id: 'pm_cash', name: 'Βασικά Μετρητά', type: 'cash', owner: 'u1', isPrimary: true },
                { id: 'pm_card', name: 'Βασική Κάρτα', type: 'card', owner: 'u1', isPrimary: true }
            ];
        } else {
            data.paymentMethods.forEach(pm => { 
                if (!pm.owner) pm.owner = 'u1'; 
                if (pm.isPrimary === undefined) pm.isPrimary = true; // Make old accounts primary by default
            });
        }
        if (data.percentages.savings === undefined) data.percentages.savings = 0;
        data.tickets.forEach(t => { if (!t.owner) t.owner = 'u1'; });

        if (data.expenses) {
            data.expenses.forEach(e => {
                if (e.useVoucher !== undefined) { e.isTicket = e.useVoucher; delete e.useVoucher; }
                if (!e.paymentMethod || e.paymentMethod === 'cash') e.paymentMethod = 'pm_cash';
                if (e.paymentMethod === 'card') e.paymentMethod = 'pm_card';
                if (!e.expenseOwner) e.expenseOwner = 'joint';
                if (!e.timestamp) e.timestamp = Date.now();
            });
        }
        this.state = data;
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    clearExpenses() {
        this.state.expenses = [];
        this.save();
    }

    getActiveUsers() {
        const active = [{ id: 'u1', name: this.state.users.u1.name, cash: this.state.users.u1.income }];
        if (this.state.users.u2.active) {
            active.push({ id: 'u2', name: this.state.users.u2.name, cash: this.state.users.u2.income });
        }
        this.state.extraUsers.forEach(eu => {
            active.push({ id: eu.id, name: eu.name, cash: eu.income });
        });
        return active;
    }

    getUserName(id) {
        if (id === 'joint') return 'Κοινό';
        const u = this.getActiveUsers().find(x => x.id === id);
        return u ? u.name : 'Άγνωστο';
    }
}
