

Papa.parse('../data/combined_dataset.csv', {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function (results) {
        const data = results.data.filter(r => r.REG_NAF === '11_J');
        const profCodes = ['1', '2', '3'];
        const labelsMap = { '1': 'Cadres', '2': 'Prof. Intermédiaires', '3': 'Employés' };

        // --- Données pour Graphiques 1 & 2 ---
        const totalData = data.filter(r => r.data_type === 'profession' && profCodes.includes(String(r.category)) && r.SEXE === 'E');
        const salaries = totalData.map(d => d.REMU_TOT_ANNU);
        const counts = totalData.map(d => d.NB_POSTES);
        const maxSalary = Math.max(...salaries);



        // --- Graphique 2: Répartition des postes (Camembert) ---
        const pieOptions = {
            series: counts,
            chart: { type: 'pie', height: 350 },
            labels: totalData.map(d => labelsMap[d.category]),
            legend: { position: 'bottom' }
        };
        new ApexCharts(document.querySelector("#jobsPieChart"), pieOptions).render();




        // --- Graphique 4: Écart H/F par métier (Barres groupées) ---
        const genderData = data.filter(r => r.data_type === 'profession' && profCodes.includes(String(r.category)));
        const womenSalaries = profCodes.map(c => genderData.find(d => d.SEXE === 'F' && d.category == c)?.REMU_TOT_ANNU);
        const menSalaries = profCodes.map(c => genderData.find(d => d.SEXE === 'H' && d.category == c)?.REMU_TOT_ANNU);

        const genderGapOptions = {
            series: [{ name: 'Femmes', data: womenSalaries }, { name: 'Hommes', data: menSalaries }],
            chart: { type: 'bar', height: 350 },
            xaxis: { categories: profCodes.map(c => labelsMap[c]) },
            yaxis: { title: { text: 'Salaire Annuel Moyen (€)' } },
            plotOptions: { bar: { horizontal: false } },
            colors: ['#dc3545', '#007bff']
        };
        new ApexCharts(document.querySelector("#genderGapByJobChart"), genderGapOptions).render();
    }
});