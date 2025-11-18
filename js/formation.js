Papa.parse('../data/combined_dataset.csv', {
    download: true, header: true, dynamicTyping: true,
    complete: function (results) {
        const data = results.data.filter(r => r.REG_NAF === '11_J' && r.data_type === 'diplome' && r.category !== 'E' && r.SEXE === 'E');
        const labelsMap = { 'G2': 'Bac', 'G3': 'Bac+2/3', 'G4': 'Bac+5' };
        const labels = Object.values(labelsMap);
        const salaries = Object.keys(labelsMap).map(code => data.find(d => d.category === code)?.REMU_TOT_ANNU);
        const counts = Object.keys(labelsMap).map(code => data.find(d => d.category === code)?.NB_POSTES);

        // Graphique 1: Barres
        new Chart(document.getElementById('diplomaBarChart'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Salaire Annuel Moyen (€)', data: salaries, backgroundColor: ['#007bff', '#28a745', '#ffc107'] }]
            }
        });

        // Graphique 2: Donut
        new Chart(document.getElementById('diplomaDonutChart'), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: counts, backgroundColor: ['#007bff', '#28a745', '#ffc107'] }]
            }
        });
    }
});