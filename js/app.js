/**
 * Αρχιτεκτονίδα MVC / Modular State Management 
 * Έτοιμο για μελλοντικά updates (π.χ. προσθήκη user authentication, graphs, charts.js, κλπ.)
 */
class BudgetApp {
    constructor() {
        this.storageKeys = {
            incomes: 'smart_budget_incomes',
            expenses: 'smart_budget_expenses'
        };
        
        this.loadState();
    }

    loadState() {
        // Φόρτωση εσόδων (με default τιμές αν είναι κενό)
        const savedIncomes = localStorage.getItem(this.storageKeys.incomes);
        this.incomes = savedIncomes ? JSON.parse(savedIncomes) : { in1: 1483, in2: 1475, in3: 100 };

        // Φόρτωση εξόδων
        const savedExpenses = localStorage.getItem(this.storageKeys.expenses);
        this.expenses = savedExpenses ? JSON.parse(savedExpenses) : [];

        // Sync UI Inputs
        const in1El = document.getElementById('income1');
        const in2El = document.getElementById('income2');
        const in3El = document.getElementById('income3');
        
        if (in1El) in1El.value = this.incomes.in1;
        if (in2El) in2El.value = this.incomes.in2;
        if (in3El) in3El.value = this.incomes.in3;
    }

    saveState() {
        localStorage.setItem(this.storageKeys.incomes, JSON.stringify(this.incomes));
        localStorage.setItem(this.storageKeys.expenses, JSON.stringify(this.expenses));
    }

    handleIncomeChange() {
        this.incomes = {
            in1: parseFloat(document.getElementById('income1').value) || 0,
            in2: parseFloat(document.getElementById('income2').value) || 0,
            in3: parseFloat(document.getElementById('income3').value) || 0
        };
        this.saveState();
        this.render();
    }

    handleFormSubmit(event) {
        event.preventDefault();
        const nameInput = document.getElementById('expenseName');
        const categoryInput = document.getElementById('expenseCategory');
        const amountInput = document.getElementById('expenseAmount');

        const newExpense = {
            id: Date.now().toString(),
            name: nameInput.value.trim(),
            category: categoryInput.value,
            amount: parseFloat(amountInput.value)
        };

        this.expenses.push(newExpense);
        this.saveState();
        
        // Καθαρισμός φόρμας
        nameInput.value = '';
        amountInput.value = '';
        nameInput.focus();

        this.render();
    }

    deleteExpense(id) {
        this.expenses = this.expenses.filter(item => item.id !== id);
        this.saveState();
        this.render();
    }

    calculateTotals() {
        const totalIncome = this.incomes.in1 + this.incomes.in2 + this.incomes.in3;
        const limits = {
            needs: totalIncome * 0.50,
            wants: totalIncome * 0.30,
            invest: totalIncome * 0.20
        };

        const spent = this.expenses.reduce((acc, curr) => {
            acc[curr.category] += curr.amount;
            return acc;
        }, { needs: 0, wants: 0 });

        return {
            totalIncome,
            limits,
            spent,
            remaining: {
                needs: limits.needs - spent.needs,
                wants: limits.wants - spent.wants
            }
        };
    }

    render() {
        const data = this.calculateTotals();

        // Render Summary / Limits
        document.getElementById('totalIncomeDisplay').innerText = data.totalIncome.toFixed(2);
        document.getElementById('limitNeeds').innerText = data.limits.needs.toFixed(2) + '€';
        document.getElementById('limitWants').innerText = data.limits.wants.toFixed(2) + '€';
        document.getElementById('limitInvest').innerText = data.limits.invest.toFixed(2) + '€';
        document.getElementById('valInvest').innerText = data.limits.invest.toFixed(2) + ' €';

        // Render Tables
        const needsBody = document.getElementById('needsTableBody');
        const wantsBody = document.getElementById('wantsTableBody');

        needsBody.innerHTML = '';
        wantsBody.innerHTML = '';

        this.expenses.forEach(exp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${exp.name}</td>
                <td>${exp.amount.toFixed(2)} €</td>
                <td><button class="delete-btn" onclick="App.deleteExpense('${exp.id}')">Διαγραφή</button></td>
            `;

            if (exp.category === 'needs') {
                needsBody.appendChild(tr);
            } else {
                wantsBody.appendChild(tr);
            }
        });

        // Render Remainings
        const remNeedsEl = document.getElementById('remainingNeeds');
        const remWantsEl = document.getElementById('remainingWants');

        remNeedsEl.innerText = data.remaining.needs.toFixed(2) + ' €';
        remWantsEl.innerText = data.remaining.wants.toFixed(2) + ' €';

        remNeedsEl.style.color = data.remaining.needs < 0 ? 'var(--danger)' : 'var(--text-color)';
        remWantsEl.style.color = data.remaining.wants < 0 ? 'var(--danger)' : 'var(--text-color)';
    }
}

// Αρχικοποίηση εφαρμογής
const App = new BudgetApp();
// Πρώτο render κατά τη φόρτωση
document.addEventListener('DOMContentLoaded', () => {
    App.render();
});
