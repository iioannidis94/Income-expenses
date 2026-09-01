class SettlementsManager {
    static populate(data, stateManager) {
        const container = document.getElementById('settlementsBody');
        const balances = data.settlements;
        let debtors = [];
        let creditors = [];

        Object.keys(balances).forEach(uid => {
            const bal = balances[uid];
            if (bal < -0.01) debtors.push({ id: uid, amount: Math.abs(bal) });
            else if (bal > 0.01) creditors.push({ id: uid, amount: bal });
        });

        if (debtors.length === 0 || creditors.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted);">Όλοι είναι εναρμονισμένοι! Δεν εκκρεμούν οφειλές από κοινά έξοδα.</div>';
        } else {
            let transfersHtml = '';
            let d = 0, c = 0;
            while (d < debtors.length && c < creditors.length) {
                let debtor = debtors[d];
                let creditor = creditors[c];
                let amountToTransfer = Math.min(debtor.amount, creditor.amount);

                const prefPm = stateManager.state.paymentMethods.find(pm => pm.owner === creditor.id && pm.isPrimary);
                const destName = prefPm ? `στην/στον [${prefPm.name}] του ` : 'στον ';

                transfersHtml += `
                <div class="transfer-item">
                    Ο <b>${stateManager.getUserName(debtor.id)}</b> μεταφέρει 
                    <span class="transfer-amount">${amountToTransfer.toFixed(2)}€</span><br>
                    ${destName}<b>${stateManager.getUserName(creditor.id)}</b>.
                </div>`;

                debtor.amount -= amountToTransfer;
                creditor.amount -= amountToTransfer;

                if (debtor.amount < 0.01) d++;
                if (creditor.amount < 0.01) c++;
            }
            container.innerHTML = transfersHtml;
        }

        const repContainer = document.getElementById('replenishmentsBody');
        const reps = data.replenishments;
        if (reps.length === 0) {
            repContainer.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted);">Δεν υπάρχουν έξοδα από δευτερεύοντες λογαριασμούς προς αναπλήρωση.</div>';
        } else {
            let repHtml = '';
            reps.forEach(r => {
                repHtml += `
                <div class="replenish-item">
                    Ο/Η <b>${stateManager.getUserName(r.ownerId)}</b> πρέπει να μεταφέρει 
                    <span class="transfer-amount" style="color:var(--primary);">${r.amount.toFixed(2)}€</span><br>
                    από <b>[${r.fromPm}]</b> <br>προς <b>[${r.toPm}]</b> (Αναπλήρωση Εξόδων).
                </div>`;
            });
            repContainer.innerHTML = repHtml;
        }
    }
}
