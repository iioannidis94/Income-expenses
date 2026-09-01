# Smart Budget Planner V12 (Modular Architecture)

Ολοκληρωμένο εργαλείο διαχείρισης οικογενειακού/προσωπικού προϋπολογισμού (50/30/10/10: Needs, Wants, Invest, Savings) με διαχωρισμό αρχείων JavaScript ανά λειτουργία.

## Δομή Project & Διαχωρισμός JS:
- `index.html`: Η κεντρική δομή και τα Modals.
- `css/style.css`: Το σύστημα στυλ (Dark Mode).
- `js/`:
  - `state.js`: Διαχείριση State, LocalStorage caching, Migrations παλαιών εκδόσεων και δομή δεδομένων.
  - `calculator.js`: Μαθηματικοί υπολογισμοί προϋπολογισμού, αναλογίες συνεισφοράς χρηστών, έξυπνο overflow κουπονιών και αλγόριθμος εκκαθάρισης.
  - `settlements.js`: Υπολογισμός και εμφάνιση του modal μεταφορών χρημάτων μεταξύ χρηστών.
  - `ui.js`: Διαχείριση DOM, δημιουργία badges, ταξινομήσεις πινάκων και απόδοση γραφήματος Chart.js.
  - `app.js`: Κεντρικός Controller και Event Listeners που ενώνουν τα παραπάνω modules.
