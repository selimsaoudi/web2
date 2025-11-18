

async function initCharts() {
    // 1. Charger les données CSV et GeoJSON en parallèle
    const papaPromise = new Promise(resolve => {
        Papa.parse('../data/combined_dataset.csv', {
            download: true, header: true, dynamicTyping: true, complete: results => resolve(results.data)
        });
    });
    const geojsonPromise = fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson').then(res => res.json());

    const [csvData, geojsonData] = await Promise.all([papaPromise, geojsonPromise]);

    const data = csvData.filter(r => r.REG_NAF === '11_J' && r.data_type === 'region' && r.category !== 'E');
    const labelsMap = { 'FR1': 'Île-de-France', 'FRB': 'Centre-Val de Loire', 'FRC': 'Bourgogne-Franche-Comté', 'FRD': 'Normandie', 'FRE': 'Hauts-de-France', 'FRF': 'Grand Est', 'FRG': 'Pays de la Loire', 'FRH': 'Bretagne', 'FRI': 'Nouvelle-Aquitaine', 'FRJ': 'Occitanie', 'FRK': 'Auvergne-Rhône-Alpes', 'FRL': 'PACA', 'FRY': 'DOM' };


    const geoCodeToCategoryMap = {
        '11': 'FR1', '24': 'FRB', '27': 'FRC', '28': 'FRD', '32': 'FRE', '44': 'FRF',
        '52': 'FRG', '53': 'FRH', '75': 'FRI', '76': 'FRJ', '84': 'FRK', '93': 'FRL',
        '01': 'FRY', '02': 'FRY', '03': 'FRY', '04': 'FRY', '06': 'FRY'
    };

    //  Graphique 1 : Carte Interactive (Leaflet.js) 
    const map = L.map('map').setView([46.6, 2.2], 5.5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    function getColor(salary) {
        return salary > 60000 ? '#4b0303ff' : salary > 50000 ? '#c43f5aff' : salary > 45000 ? '#ff3807ff' : '#fe8876ff';
    }

    geojsonData.features.forEach(feature => {
        const categoryCode = geoCodeToCategoryMap[feature.properties.code]; // On utilise la map
        const regionData = data.find(d => d.SEXE === 'E' && d.category === categoryCode);
        if (regionData) {
            feature.properties.salaire = regionData.REMU_TOT_ANNU;
            feature.properties.postes = regionData.NB_POSTES;
        }
    });

    L.geoJson(geojsonData, {
        style: feature => ({
            fillColor: getColor(feature.properties.salaire),
            weight: 2, color: 'white', fillOpacity: 0.7
        }),
        onEachFeature: (feature, layer) => {
            const { nom, salaire, postes } = feature.properties;
            if (salaire) {
                layer.bindPopup(`<b>${nom}</b><br/>Salaire moyen: ${salaire.toLocaleString()} €<br/>Nombre de postes: ${postes.toLocaleString()}`);
            }
        }
    }).addTo(map);

    //  Graphique 2 : Nuage de points (ApexCharts) 
    const scatterData = data.filter(r => r.SEXE === 'E').map(r => ({
        x: r.NB_POSTES,
        y: r.REMU_TOT_ANNU,
        name: labelsMap[r.category]
    }));

    const scatterOptions = {
        series: [{ name: 'Région', data: scatterData.map(d => [d.x, d.y]) }],
        chart: { type: 'scatter', height: 350, zoom: { enabled: true, type: 'xy' } },
        xaxis: { title: { text: 'Nombre de postes' }, labels: { formatter: val => `${Math.round(val / 1000)}k` } },
        yaxis: { title: { text: 'Salaire Annuel Moyen (€)' }, labels: { formatter: val => `${Math.round(val / 1000)}k €` } },
        tooltip: {
            custom: function ({ dataPointIndex, w }) {
                const point = scatterData[dataPointIndex];
                return `<div class="apexcharts-tooltip-title">${point.name}</div>
                        <div class="apexcharts-tooltip-series-group">
                        Postes: ${point.x.toLocaleString()}<br>Salaire: ${point.y.toLocaleString()} €
                        </div>`;
            }
        }
    };
    new ApexCharts(document.querySelector("#scatterJobsSalary"), scatterOptions).render();

    //  Graphique 3 : Écart H/F dans les 5 plus grandes régions (ApexCharts) 
    const top5Regions = data.filter(r => r.SEXE === 'E').sort((a, b) => b.NB_POSTES - a.NB_POSTES).slice(0, 5).map(r => r.category);
    const genderData = data.filter(r => top5Regions.includes(r.category));

    const womenSalaries = top5Regions.map(region => genderData.find(d => d.SEXE === 'F' && d.category === region)?.REMU_TOT_ANNU);
    const menSalaries = top5Regions.map(region => genderData.find(d => d.SEXE === 'H' && d.category === region)?.REMU_TOT_ANNU);

    const genderGapOptions = {
        series: [{ name: 'Femmes', data: womenSalaries }, { name: 'Hommes', data: menSalaries }],
        chart: { type: 'bar', height: 350 },
        plotOptions: { bar: { horizontal: false } },
        xaxis: { categories: top5Regions.map(r => labelsMap[r]) },
        colors: ['#dc3545', '#007bff'],
        yaxis: { title: { text: 'Salaire Annuel Moyen (€)' } }
    };
    new ApexCharts(document.querySelector("#genderGapByRegion"), genderGapOptions).render();
}

initCharts();