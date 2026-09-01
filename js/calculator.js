class BudgetCalculator {
    static calculate(stateManager) {
        const state = stateManager.state;
        const activeUsers = stateManager.getActiveUsers();
        let userMap = {};
        let totalCash = 0;

        activeUsers.forEach(u => {
            u.ticketsNeeds = 0;
            u.ticketsWants = 0;
            userMap[u.id] = u;
            totalCash += u.cash;
        });

        let needsTicketsTotal = 0;
        let wantsTicketsTotal = 0;

        state.tickets.forEach(t => {
            let ownerId = t.owner;
            if (!userMap[ownerId]) ownerId = 'u1';
            if (t.target === 'needs') { userMap[ownerId].ticketsNeeds += t.amount; needsTicketsTotal += t.amount; }
            if (t.target === 'wants') { userMap[ownerId].ticketsWants += t.amount; wantsTicketsTotal += t.amount; }
        });

        activeUsers.forEach(u => {
            u.ticketsTotal = u.ticketsNeeds + u.ticketsWants;
            u.totalIncome = u.cash + u.ticketsTotal;
            u.incomeRatio = u.totalIncome / (totalCash + needsTicketsTotal + wantsTicketsTotal || 1);
        });

        let extraIncomeTotal = 0;
        state.extraIncomes.forEach(e => extraIncomeTotal += e.amount);

        const totalIncome = totalCash + extraIncomeTotal + needsTicketsTotal + wantsTicketsTotal;

        const pN = state.percentages.needs / 100;
        const pW = state.percentages.wants / 100;
        const pI = state.percentages.invest / 100;
        const pS = state.percentages.savings / 100;

        const limits = {
            needs: totalIncome * pN,
            wants: totalIncome * pW,
            invest: totalIncome * pI,
            savings: totalIncome * pS
        };

        const needsCashAllocated = limits.needs - needsTicketsTotal;
        const wantsCashAllocated = limits.wants - wantsTicketsTotal;

        let currentNeedsTickets = needsTicketsTotal;
        let currentWantsTickets = wantsTicketsTotal;

        let totalNeedsCashSpent = 0;
        let totalWantsCashSpent = 0;

        let spentByMethod = {};
        state.paymentMethods.forEach(pm => spentByMethod[pm.id] = 0);
        let expenseBreakdown = {};
        let settlementExpenses = [];

        state.expenses.forEach(ex => {
            let amountLeft = ex.amount;
            let b = { ticket: 0, customMethodId: ex.paymentMethod, methodAmount: 0 };
            const pmInfo = state.paymentMethods.find(p => p.id === ex.paymentMethod);
            const payerId = pmInfo ? pmInfo.owner : 'u1';

            if (ex.category === 'needs') {
                if (ex.isTicket && currentNeedsTickets > 0) {
                    b.ticket = Math.min(amountLeft, currentNeedsTickets);
                    currentNeedsTickets -= b.ticket;
                    amountLeft -= b.ticket;
                }
                if (amountLeft > 0) {
                    b.methodAmount = amountLeft;
                    if (!spentByMethod[ex.paymentMethod]) spentByMethod[ex.paymentMethod] = 0;
                    spentByMethod[ex.paymentMethod] += amountLeft;
                    totalNeedsCashSpent += amountLeft;
                }
            } else if (ex.category === 'wants') {
                if (ex.isTicket && currentWantsTickets > 0) {
                    b.ticket = Math.min(amountLeft, currentWantsTickets);
                    currentWantsTickets -= b.ticket;
                    amountLeft -= b.ticket;
                }
                if (amountLeft > 0) {
                    b.methodAmount = amountLeft;
                    if (!spentByMethod[ex.paymentMethod]) spentByMethod[ex.paymentMethod] = 0;
                    spentByMethod[ex.paymentMethod] += amountLeft;
                    totalWantsCashSpent += amountLeft;
                }
            }
            expenseBreakdown[ex.id] = b;

            if (b.methodAmount > 0) {
                settlementExpenses.push({
                    name: ex.name,
                    amount: b.methodAmount,
                    payerId: payerId,
                    expenseOwner: ex.expenseOwner,
                    pmName: pmInfo ? pmInfo.name : 'Άγνωστο'
                });
            }
        });

        // 1. Settlements (Inter-user debts)
        let userBalances = {};
        activeUsers.forEach(u => userBalances[u.id] = 0);

        settlementExpenses.forEach(item => {
            if (item.payerId !== 'joint' && userBalances[item.payerId] !== undefined) {
                userBalances[item.payerId] += item.amount;
            }
            if (item.expenseOwner === 'joint') {
                activeUsers.forEach(u => {
                    userBalances[u.id] -= (item.amount * u.incomeRatio);
                });
            } else {
                if (userBalances[item.expenseOwner] !== undefined) {
                    userBalances[item.expenseOwner] -= item.amount;
                }
            }
        });

        // 2. Account Replenishments (Secondary -> Primary transfer suggestions)
        let replenishments = [];
        state.paymentMethods.forEach(pm => {
            if (!pm.isPrimary && spentByMethod[pm.id] > 0) {
                const ownerPrimaryPm = state.paymentMethods.find(p => p.owner === pm.owner && p.isPrimary);
                replenishments.push({
                    ownerId: pm.owner,
                    amount: spentByMethod[pm.id],
                    fromPm: ownerPrimaryPm ? ownerPrimaryPm.name : 'Βασικός σας Λογαριασμός',
                    toPm: pm.name
                });
            }
        });

        return {
            activeUsers,
            extraIncomeTotal,
            totalIncome,
            limits,
            needsCashAllocated,
            wantsCashAllocated,
            needsTicketsTotal,
            wantsTicketsTotal,
            expenseBreakdown,
            spentByMethod,
            rem: {
                needsCash: needsCashAllocated - totalNeedsCashSpent,
                needsTickets: currentNeedsTickets,
                wantsCash: wantsCashAllocated - totalWantsCashSpent,
                wantsTickets: currentWantsTickets
            },
            spentAgg: {
                needs: totalNeedsCashSpent + (needsTicketsTotal - currentNeedsTickets),
                wants: totalWantsCashSpent + (wantsTicketsTotal - currentWantsTickets)
            },
            settlements: userBalances,
            replenishments: replenishments
        };
    }
}
