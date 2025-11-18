

Papa.parse('../data/combined_dataset.csv', {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function (results) {
        const data = results.data.filter(r => r.REG_NAF === '11_J' && ['F', 'H'].includes(r.SEXE));

        //  Graphique 1 : Évolution du salaire par ancienneté (Line Chart)
        const seniorityData = data.filter(r => r.data_type === 'anciennete' && r.category !== 'E');
        const seniorityLabels = ['0-5 ans', '6-9 ans', '10-14 ans', '15-19 ans', '20-29 ans', '30+ ans'];
        const seniorityCodes = ['00-05', '06-09', '10-14', '15-19', '20-29', '30+'];

        const womenSenioritySalaries = seniorityCodes.map(c => seniorityData.find(d => d.SEXE === 'F' && d.category === c)?.REMU_TOT_ANNU);
        const menSenioritySalaries = seniorityCodes.map(c => seniorityData.find(d => d.SEXE === 'H' && d.category === c)?.REMU_TOT_ANNU);

        const seniorityOptions = {
            series: [
                { name: 'Hommes', data: menSenioritySalaries },
                { name: 'Femmes', data: womenSenioritySalaries }
            ],
            chart: { type: 'line', height: 350 },
            stroke: { curve: 'smooth' },
            xaxis: { categories: seniorityLabels },
            yaxis: { labels: { formatter: (val) => `${(val / 1000).toFixed(0)}k €` } },
            colors: ['#007bff', '#dc3545']
        };
        new ApexCharts(document.querySelector("#genderSeniorityChart"), seniorityOptions).render();

        // Graphique 2 : Écart de salaire global (Bar Chart)
        const totalF = data.find(d => d.data_type === 'age' && d.category === 'E' && d.SEXE === 'F');
        const totalM = data.find(d => d.data_type === 'age' && d.category === 'E' && d.SEXE === 'H');
        const payGap = ((totalM.REMU_TOT_ANNU - totalF.REMU_TOT_ANNU) / totalM.REMU_TOT_ANNU * 100).toFixed(1);

        const gapOptions = {
            series: [
                { name: 'Salaire Annuel Moyen', data: [totalM.REMU_TOT_ANNU, totalF.REMU_TOT_ANNU] }
            ],
            chart: { type: 'bar', height: 350 },
            plotOptions: { bar: { horizontal: false, columnWidth: '50%' } },
            xaxis: { categories: ['Hommes', 'Femmes'] },
            yaxis: { title: { text: 'Salaire en €' } },
            colors: ['#007bff', '#dc3545'],
            dataLabels: { enabled: false },
            title: { text: `Écart de ${payGap}%`, align: 'center', style: { fontSize: '20px', color: '#333' } }
        };
        new ApexCharts(document.querySelector("#genderGapBarChart"), gapOptions).render();

        // Graphique 3 : Répartition par profession (Stacked Bar ) 
        const professionData = data.filter(r => r.data_type === 'profession' && r.category !== 'E');
        const profLabelsMap = { '1': 'Cadres', '2': 'Prof. Interm.', '3': 'Employés' };
        const profLabels = Object.values(profLabelsMap);

        const womenProfCounts = Object.keys(profLabelsMap).map(c => professionData.find(d => d.SEXE === 'F' && d.category == c)?.NB_POSTES || 0);
        const menProfCounts = Object.keys(profLabelsMap).map(c => professionData.find(d => d.SEXE === 'H' && d.category == c)?.NB_POSTES || 0);

        const professionOptions = {
            series: [
                { name: 'Femmes', data: womenProfCounts },
                { name: 'Hommes', data: menProfCounts }
            ],
            chart: { type: 'bar', height: 350, stacked: true, stackType: '100%' },
            plotOptions: { bar: { horizontal: true } },
            xaxis: { categories: profLabels },
            colors: ['#dc3545', '#007bff']
        };
        new ApexCharts(document.querySelector("#genderProfessionChart"), professionOptions).render();
    }
});