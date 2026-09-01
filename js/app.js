class MainApp {
    constructor() {
        this.stateManager = new StateManager();
        this.ui = new UIManager(this.stateManager);
        this.editingExpenseId = null; // Track if we are editing
        this.init();
    }

    init() {
        const data = BudgetCalculator.calculate(this.stateManager);
        this.ui.renderFull(data);
    }

    refresh() {
        const data = BudgetCalculator.calculate(this.stateManager);
        this.ui.renderDashboard(data);
    }

    updateBaseState() {
        const state = this.stateManager.state;
        state.users.u1.name = document.getElementById('user1Name').value || 'Χρήστης 1';
        state.users.u1.income = parseFloat(document.getElementById('user1Income').value) || 0;

        state.users.u2.name = document.getElementById('user2Name').value || 'Χρήστης 2';
        state.users.u2.income = parseFloat(document.getElementById('user2Income').value) || 0;

        const pN = parseFloat(document.getElementById('percNeeds').value) || 0;
        const pW = parseFloat(document.getElementById('percWants').value) || 0;
        const pI = parseFloat(document.getElementById('percInvest').value) || 0;
        const pS = parseFloat(document.getElementById('percSavings').value) || 0;
        state.percentages = { needs: pN, wants: pW, invest: pI, savings: pS };

        document.getElementById('percentageError').style.display = (pN + pW + pI + pS !== 100) ? 'block' : 'none';

        this.stateManager.save();
        this.ui.renderPaymentMethods();
        this.ui.renderTickets();
        this.refresh();
    }
    
    applySmartFill(inputId, neededValue) {
        document.getElementById(inputId).value = neededValue;
        this.updateBaseState();
    }

    toggleUser2(isActive) {
        this.stateManager.state.users.u2.active = isActive;
        document.getElementById('user2Container').style.display = isActive ? 'block' : 'none';
        document.getElementById('addUser2Btn').style.display = isActive ? 'none' : 'block';
        if (!isActive) {
            this.stateManager.state.tickets.forEach(t => { if (t.owner === 'u2') t.owner = 'u1'; });
            this.stateManager.state.paymentMethods.forEach(p => { if (p.owner === 'u2') p.owner = 'u1'; });
        }
        this.updateBaseState();
    }

    // Extra Users
    addExtraUser() {
        const newId = 'u_' + Date.now().toString();
        this.stateManager.state.extraUsers.push({ id: newId, name: 'Νέος Χρήστης', income: 1000 });
        this.stateManager.save();
        this.ui.renderExtraUsers();
        this.ui.renderPaymentMethods();
        this.ui.renderTickets();
        this.refresh();
    }
    removeExtraUser(id) {
        this.stateManager.state.extraUsers = this.stateManager.state.extraUsers.filter(u => u.id !== id);
        this.stateManager.state.tickets.forEach(t => { if (t.owner === id) t.owner = 'u1'; });
        this.stateManager.state.paymentMethods.forEach(p => { if (p.owner === id) p.owner = 'u1'; });
        this.stateManager.save();
        this.ui.renderExtraUsers();
        this.ui.renderPaymentMethods();
        this.ui.renderTickets();
        this.refresh();
    }
    updateExtraUser(id, field, value) {
        const u = this.stateManager.state.extraUsers.find(x => x.id === id);
        if (u) {
            u[field] = field === 'income' ? (parseFloat(value) || 0) : value;
            this.stateManager.save();
            if (field === 'name') {
                this.ui.renderPaymentMethods();
                this.ui.renderTickets();
            }
            this.refresh();
        }
    }

    // Extra Incomes
    addExtraIncome() {
        this.stateManager.state.extraIncomes.push({ id: Date.now().toString(), name: 'Νέο Έσοδο', amount: 0 });
        this.stateManager.save();
        this.ui.renderExtraIncomes();
        this.refresh();
    }
    removeExtraIncome(id) {
        this.stateManager.state.extraIncomes = this.stateManager.state.extraIncomes.filter(x => x.id !== id);
        this.stateManager.save();
        this.ui.renderExtraIncomes();
        this.refresh();
    }
    updateExtraIncome(id, field, value) {
        const item = this.stateManager.state.extraIncomes.find(x => x.id === id);
        if (item) {
            item[field] = field === 'amount' ? (parseFloat(value) || 0) : value;
            this.stateManager.save();
            this.refresh();
        }
    }

    // Payment Methods
    addPaymentMethod() {
        const nameInput = document.getElementById('newPmName');
        const typeInput = document.getElementById('newPmType');
        const ownerInput = document.getElementById('newPmOwner');
        const isPrimary = document.getElementById('newPmPrimary').checked;
        const name = nameInput.value.trim();
        if (!name) return;

        this.stateManager.state.paymentMethods.push({
            id: 'pm_' + Date.now().toString(),
            name: name,
            type: typeInput.value,
            owner: ownerInput.value,
            isPrimary: isPrimary
        });
        nameInput.value = '';
        document.getElementById('newPmPrimary').checked = false; // Reset to unchecked
        this.stateManager.save();
        this.ui.renderPaymentMethods();
        this.handleExpenseFormUI();
    }
    removePaymentMethod(id) {
        if (this.stateManager.state.paymentMethods.length <= 1) {
            alert("Πρέπει να υπάρχει τουλάχιστον ένας λογαριασμός!");
            return;
        }
        this.stateManager.state.paymentMethods = this.stateManager.state.paymentMethods.filter(pm => pm.id !== id);
        this.stateManager.save();
        this.ui.renderPaymentMethods();
        this.handleExpenseFormUI();
    }
    updatePaymentMethod(id, field, value) {
        const pm = this.stateManager.state.paymentMethods.find(x => x.id === id);
        if (pm) {
            if (field === 'name' && !value.trim()) return;
            pm[field] = field === 'name' ? value.trim() : value;
            this.stateManager.save();
            this.ui.renderPaymentMethods();
            this.handleExpenseFormUI();
            this.refresh();
        }
    }

    // Tickets
    addTicket() {
        this.stateManager.state.tickets.push({ id: Date.now().toString(), name: 'Κουπόνι / Ticket', amount: 0, target: 'needs', owner: 'u1' });
        this.stateManager.save();
        this.ui.renderTickets();
        this.refresh();
    }
    removeTicket(id) {
        this.stateManager.state.tickets = this.stateManager.state.tickets.filter(x => x.id !== id);
        this.stateManager.save();
        this.ui.renderTickets();
        this.refresh();
    }
    updateTicket(id, field, value) {
        const item = this.stateManager.state.tickets.find(x => x.id === id);
        if (item) {
            item[field] = field === 'amount' ? (parseFloat(value) || 0) : value;
            this.stateManager.save();
            this.refresh();
        }
    }

    // Expenses
    handleExpenseFormUI() {
        const data = BudgetCalculator.calculate(this.stateManager);
        this.ui.handleExpenseFormUI(data);
    }
    
    saveExpense(e) {
        e.preventDefault();
        const name = document.getElementById('expName').value.trim();
        const category = document.getElementById('expCategory').value;
        const subCategory = document.getElementById('expSubCategory').value;
        const amount = parseFloat(document.getElementById('expAmount').value);
        const paymentMethod = document.getElementById('expPaymentMethod').value;
        const expenseOwner = document.getElementById('expOwner').value;
        const isTicket = document.getElementById('expIsTicket').checked;

        if (!name || isNaN(amount) || amount <= 0) return;

        if (this.editingExpenseId) {
            // Update existing
            const ex = this.stateManager.state.expenses.find(e => e.id === this.editingExpenseId);
            if (ex) {
                ex.name = name; ex.category = category; ex.subCategory = subCategory;
                ex.amount = amount; ex.isTicket = isTicket;
                ex.paymentMethod = paymentMethod; ex.expenseOwner = expenseOwner;
            }
            this.editingExpenseId = null;
        } else {
            // Create new
            this.stateManager.state.expenses.push({
                id: Date.now().toString(), timestamp: Date.now(),
                name, category, subCategory, amount, isTicket, paymentMethod, expenseOwner
            });
        }

        this.stateManager.save();
        this.ui.resetExpenseForm();
        this.refresh();
    }

    editExpense(id) {
        const ex = this.stateManager.state.expenses.find(e => e.id === id);
        if (!ex) return;
        this.editingExpenseId = id;
        this.ui.populateExpenseForm(ex);
    }

    cancelEdit() {
        this.editingExpenseId = null;
        this.ui.resetExpenseForm();
    }

    deleteExpense(id) {
        if(confirm('Διαγραφή εξόδου;')) {
            this.stateManager.state.expenses = this.stateManager.state.expenses.filter(ex => ex.id !== id);
            this.stateManager.save();
            this.refresh();
        }
    }
    
    renderDashboard() {
        this.refresh();
    }

    // Modals
    openChartModal() {
        document.getElementById('chartModal').style.display = 'flex';
        const data = BudgetCalculator.calculate(this.stateManager);
        this.ui.renderChart(data);
    }
    closeChartModal() {
        document.getElementById('chartModal').style.display = 'none';
    }
    openSettlementsModal() {
        document.getElementById('settlementsModal').style.display = 'flex';
    }
    closeSettlementsModal() {
        document.getElementById('settlementsModal').style.display = 'none';
    }

    // Month Clear
    clearMonth() {
        if (confirm("Είστε σίγουροι; Θα διαγραφούν ΟΛΑ τα έξοδα του τρέχοντος μήνα!")) {
            this.stateManager.clearExpenses();
            this.cancelEdit();
            this.refresh();
        }
    }

    // Backup
    exportData() {
        const dataStr = JSON.stringify(this.stateManager.state, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smart_budget_backup_v14_${new Date().toISOString().slice(0, 10)}.json`;
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
                    this.stateManager.migrateAndSetState(importedState);
                    this.stateManager.save();
                    this.init();
                    alert("Τα δεδομένα ανακτήθηκαν επιτυχώς!");
                } else alert("Το αρχείο JSON δεν έχει τη σωστή δομή.");
            } catch (err) { alert("Σφάλμα κατά την ανάγνωση του αρχείου."); }
            event.target.value = '';
        };
        reader.readAsText(file);
    }
}

const App = new MainApp();
