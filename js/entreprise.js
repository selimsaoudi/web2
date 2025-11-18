Papa.parse('../data/combined_dataset.csv', {
    download: true, header: true, dynamicTyping: true,
    complete: function (results) {
        const data = results.data.filter(r => r.REG_NAF === '11_J' && r.data_type === 'taille_entreprise' && r.category !== 'E' && r.SEXE === 'E');
        const labelsMap = { 'E10_49': '10-49 salariés', 'E50_249': '50-249 salariés', 'E250_499': '250-499 salariés', 'E500_999': '500-999 salariés', 'E1000': '1000+ salariés' };
        const labels = Object.values(labelsMap);
        const salaries = Object.keys(labelsMap).map(code => data.find(d => d.category === code)?.REMU_TOT_ANNU);
        const counts = Object.keys(labelsMap).map(code => data.find(d => d.category === code)?.NB_POSTES);

        // Graphique 1: Barres Horizontales
        new Chart(document.getElementById('sizeBarChart'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Salaire Annuel Moyen (€)', data: salaries, backgroundColor: '#ffc107' }]
            },
            options: { indexAxis: 'y' }
        });

        // Graphique 2: Donut
        new Chart(document.getElementById('sizeDonutChart'), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: counts, backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8'] }]
            }
        });
    }
});