import pandas as pd
import json
import os

def process_all_csv_files():
    """
    Combine tous les fichiers CSV en un seul dataset cohérent
    """
    
    # Dictionnaire pour stocker tous les datasets
    all_data = {}
    
    # Liste des fichiers CSV
    csv_files = [
        'T2_CHP1_AGE.csv',
        'T2_CHP1_ANC.csv', 
        'T2_CHP1_DIPLOME.csv',
        'T2_CHP1_NUTS.csv',
        'T2_CHP1_PROF.csv',
        'T2_CHP1_TAILLENT.csv'
    ]
    
    # Charger chaque fichier CSV
    for file in csv_files:
        if os.path.exists(file):
            print(f"Chargement de {file}...")
            df = pd.read_csv(file, sep=';')
            
            # Nettoyer les données
            df = df.dropna()
            
            # Ajouter une colonne pour identifier le type de données
            if 'TR_AGE' in df.columns:
                df['data_type'] = 'age'
                df['category'] = df['TR_AGE']
            elif 'TR_ANC' in df.columns:
                df['data_type'] = 'anciennete'
                df['category'] = df['TR_ANC']
            elif 'B25' in df.columns:
                df['data_type'] = 'diplome'
                df['category'] = df['B25']
            elif 'REG' in df.columns:
                df['data_type'] = 'region'
                df['category'] = df['REG']
            elif 'CITP' in df.columns:
                df['data_type'] = 'profession'
                df['category'] = df['CITP']
            elif 'A12' in df.columns:
                df['data_type'] = 'taille_entreprise'
                df['category'] = df['A12']
            
            # Standardiser les colonnes communes
            df_standardized = df[['SEXE', 'REG_NAF', 'data_type', 'category', 'NB_POSTES', 'REMU_TOT_ANNU']].copy()
            
            all_data[file.replace('.csv', '')] = df_standardized
    
    # Combiner tous les datasets
    combined_df = pd.concat(all_data.values(), ignore_index=True)
    
    # Nettoyer les données
    combined_df = combined_df[combined_df['NB_POSTES'] != 'so']
    combined_df = combined_df[combined_df['REMU_TOT_ANNU'] != 'so']
    
    # Convertir les colonnes numériques
    combined_df['NB_POSTES'] = pd.to_numeric(combined_df['NB_POSTES'], errors='coerce')
    combined_df['REMU_TOT_ANNU'] = pd.to_numeric(combined_df['REMU_TOT_ANNU'], errors='coerce')
    
    # Supprimer les lignes avec des valeurs manquantes
    combined_df = combined_df.dropna()
    
    print(f"Dataset combiné créé avec {len(combined_df)} lignes")
    print(f"Colonnes: {list(combined_df.columns)}")
    print(f"Types de données: {combined_df['data_type'].unique()}")
    
    return combined_df

def create_chart_data(combined_df):
    """
    Créer les données pour les différents types de graphiques
    """
    
    chart_data = {}
    
    # 1. Graphique en barres - Salaires moyens par sexe et secteur
    salary_by_gender_sector = combined_df.groupby(['SEXE', 'REG_NAF'])['REMU_TOT_ANNU'].mean().reset_index()
    chart_data['salary_by_gender_sector'] = {
        'labels': salary_by_gender_sector['REG_NAF'].unique().tolist(),
        'datasets': [
            {
                'label': 'Femmes',
                'data': salary_by_gender_sector[salary_by_gender_sector['SEXE'] == 'F']['REMU_TOT_ANNU'].tolist(),
                'backgroundColor': 'rgba(255, 99, 132, 0.6)',
                'borderColor': 'rgba(255, 99, 132, 1)',
                'borderWidth': 1
            },
            {
                'label': 'Hommes',
                'data': salary_by_gender_sector[salary_by_gender_sector['SEXE'] == 'H']['REMU_TOT_ANNU'].tolist(),
                'backgroundColor': 'rgba(54, 162, 235, 0.6)',
                'borderColor': 'rgba(54, 162, 235, 1)',
                'borderWidth': 1
            }
        ]
    }
    
    # 2. Graphique en secteurs - Répartition des emplois par type de données
    jobs_by_type = combined_df.groupby('data_type')['NB_POSTES'].sum().reset_index()
    chart_data['jobs_by_type'] = {
        'labels': jobs_by_type['data_type'].tolist(),
        'datasets': [{
            'data': jobs_by_type['NB_POSTES'].tolist(),
            'backgroundColor': [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 205, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)'
            ]
        }]
    }
    
    # 3. Graphique linéaire - Évolution des salaires par âge
    age_data = combined_df[combined_df['data_type'] == 'age']
    if not age_data.empty:
        salary_by_age = age_data.groupby('category')['REMU_TOT_ANNU'].mean().reset_index()
        # Trier par âge
        age_order = ['00-29', '30-39', '40-49', '50-59', '60+']
        salary_by_age['category'] = pd.Categorical(salary_by_age['category'], categories=age_order, ordered=True)
        salary_by_age = salary_by_age.sort_values('category')
        
        chart_data['salary_by_age'] = {
            'labels': salary_by_age['category'].tolist(),
            'datasets': [{
                'label': 'Salaire moyen',
                'data': salary_by_age['REMU_TOT_ANNU'].tolist(),
                'borderColor': 'rgba(75, 192, 192, 1)',
                'backgroundColor': 'rgba(75, 192, 192, 0.2)',
                'tension': 0.1
            }]
        }
    
    # 4. Graphique en barres horizontales - Top 10 des secteurs par nombre d'emplois
    top_sectors = combined_df.groupby('REG_NAF')['NB_POSTES'].sum().nlargest(10).reset_index()
    chart_data['top_sectors'] = {
        'labels': top_sectors['REG_NAF'].tolist(),
        'datasets': [{
            'label': 'Nombre d\'emplois',
            'data': top_sectors['NB_POSTES'].tolist(),
            'backgroundColor': 'rgba(54, 162, 235, 0.6)',
            'borderColor': 'rgba(54, 162, 235, 1)',
            'borderWidth': 1
        }]
    }
    
    # 5. Graphique en radar - Comparaison des salaires par profession
    prof_data = combined_df[combined_df['data_type'] == 'profession']
    if not prof_data.empty:
        salary_by_prof = prof_data.groupby('category')['REMU_TOT_ANNU'].mean().nlargest(8).reset_index()
        chart_data['salary_by_profession'] = {
            'labels': salary_by_prof['category'].tolist(),
            'datasets': [{
                'label': 'Salaire moyen',
                'data': salary_by_prof['REMU_TOT_ANNU'].tolist(),
                'backgroundColor': 'rgba(255, 99, 132, 0.2)',
                'borderColor': 'rgba(255, 99, 132, 1)',
                'pointBackgroundColor': 'rgba(255, 99, 132, 1)',
                'pointBorderColor': '#fff',
                'pointHoverBackgroundColor': '#fff',
                'pointHoverBorderColor': 'rgba(255, 99, 132, 1)'
            }]
        }
    
    # 6. Graphique en barres empilées - Répartition par diplôme et sexe
    diplome_data = combined_df[combined_df['data_type'] == 'diplome']
    if not diplome_data.empty:
        diplome_gender = diplome_data.groupby(['category', 'SEXE'])['NB_POSTES'].sum().reset_index()
        diplome_pivot = diplome_gender.pivot(index='category', columns='SEXE', values='NB_POSTES').fillna(0)
        
        chart_data['diplome_by_gender'] = {
            'labels': diplome_pivot.index.tolist(),
            'datasets': [
                {
                    'label': 'Femmes',
                    'data': diplome_pivot['F'].tolist() if 'F' in diplome_pivot.columns else [0] * len(diplome_pivot),
                    'backgroundColor': 'rgba(255, 99, 132, 0.6)'
                },
                {
                    'label': 'Hommes', 
                    'data': diplome_pivot['H'].tolist() if 'H' in diplome_pivot.columns else [0] * len(diplome_pivot),
                    'backgroundColor': 'rgba(54, 162, 235, 0.6)'
                }
            ]
        }
    
    # 7. Graphique en aires - Évolution des emplois par taille d'entreprise
    taille_data = combined_df[combined_df['data_type'] == 'taille_entreprise']
    if not taille_data.empty:
        jobs_by_size = taille_data.groupby('category')['NB_POSTES'].sum().reset_index()
        # Trier par taille
        size_order = ['E1_9', 'E10_49', 'E50_249', 'E250_499', 'E500_999', 'E1000']
        jobs_by_size['category'] = pd.Categorical(jobs_by_size['category'], categories=size_order, ordered=True)
        jobs_by_size = jobs_by_size.sort_values('category')
        
        chart_data['jobs_by_company_size'] = {
            'labels': jobs_by_size['category'].tolist(),
            'datasets': [{
                'label': 'Nombre d\'emplois',
                'data': jobs_by_size['NB_POSTES'].tolist(),
                'backgroundColor': 'rgba(153, 102, 255, 0.2)',
                'borderColor': 'rgba(153, 102, 255, 1)',
                'fill': True
            }]
        }
    
    # 8. Graphique en barres - Salaires moyens par région
    region_data = combined_df[combined_df['data_type'] == 'region']
    if not region_data.empty:
        salary_by_region = region_data.groupby('category')['REMU_TOT_ANNU'].mean().nlargest(10).reset_index()
        chart_data['salary_by_region'] = {
            'labels': salary_by_region['category'].tolist(),
            'datasets': [{
                'label': 'Salaire moyen',
                'data': salary_by_region['REMU_TOT_ANNU'].tolist(),
                'backgroundColor': 'rgba(255, 159, 64, 0.6)',
                'borderColor': 'rgba(255, 159, 64, 1)',
                'borderWidth': 1
            }]
        }
    
    return chart_data

def main():
    """
    Fonction principale pour traiter les données et créer le dataset unifié
    """
    print("Début du traitement des données...")
    
    # Traiter tous les fichiers CSV
    combined_df = process_all_csv_files()
    
    # Créer les données pour les graphiques
    chart_data = create_chart_data(combined_df)
    
    # Sauvegarder le dataset combiné
    combined_df.to_csv('combined_dataset.csv', index=False)
    print("Dataset combiné sauvegardé dans 'combined_dataset.csv'")
    
    # Sauvegarder les données des graphiques
    with open('chart_data.json', 'w', encoding='utf-8') as f:
        json.dump(chart_data, f, ensure_ascii=False, indent=2)
    print("Données des graphiques sauvegardées dans 'chart_data.json'")
    
    # Afficher un résumé
    print("\n=== RÉSUMÉ ===")
    print(f"Nombre total de lignes: {len(combined_df)}")
    print(f"Types de données inclus: {', '.join(combined_df['data_type'].unique())}")
    print(f"Nombre de graphiques créés: {len(chart_data)}")
    
    for chart_name, chart_info in chart_data.items():
        print(f"- {chart_name}: {len(chart_info['labels'])} éléments")
    
    return combined_df, chart_data

if __name__ == "__main__":
    combined_df, chart_data = main()
