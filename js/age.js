Papa.parse('../data/combined_dataset.csv', {
    download: true, header: true, dynamicTyping: true,
    complete: function(results) {
        const data = results.data.filter(r => r.REG_NAF === '11_J' && r.data_type === 'age' && r.category !== 'E' && r.SEXE === 'E'  );
        const labels = ['00-29', '30-39', '40-49', '50-59', '60+'];
        const salaries = labels.map(l => data.find(d => d.category === l)?.REMU_TOT_ANNU);
    
        new Chart(document.getElementById('ageLineChart'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ label: 'Salaire Annuel Moyen (€)', data: salaries, borderColor: '#007bff', tension: 0.1 }]
            }
        });


    }
});