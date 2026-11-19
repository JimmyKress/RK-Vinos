import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Usar backend no interactivo
import sys
import json
import os

# Configurar matplotlib para usar fuentes que funcionen mejor
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['Arial', 'DejaVu Sans', 'Helvetica']
plt.rcParams['axes.unicode_minus'] = False
plt.rcParams['font.size'] = 14  # Aumentar tamaño de fuente base

def create_bar_chart(data, title, filename, color='#5a1f3f'):
    """Crear un gráfico de barras horizontal"""
    if not data:
        return None
    
    # Extraer nombres y valores
    names = [item['name'] for item in data]
    values = [item['value'] for item in data]
    
    # Crear figura con más espacio
    fig, ax = plt.subplots(figsize=(12, len(data) * 0.9))
    
    # Crear barras horizontales
    bars = ax.barh(names, values, color=color, edgecolor='none', height=0.6)
    
    # Personalizar
    ax.set_xlabel('Cantidad', fontsize=16, fontweight='bold', color='#333')
    ax.set_title(title, fontsize=18, fontweight='bold', pad=20, color='#1a1a1a')
    ax.grid(axis='x', alpha=0.3, linestyle='--', color='#999')
    
    # Añadir valores en las barras con mejor legibilidad
    for bar, value in zip(bars, values):
        width = bar.get_width()
        ax.text(width + max(values) * 0.02, bar.get_y() + bar.get_height()/2,
                f'{value}', ha='left', va='center', fontsize=14, fontweight='bold', color='#333')
    
    # Mejorar etiquetas del eje Y
    ax.tick_params(axis='y', labelsize=13, colors='#333')
    ax.tick_params(axis='x', labelsize=13, colors='#333')
    
    # Ajustar layout con más padding
    plt.tight_layout(pad=2.0)
    
    # Guardar
    plt.savefig(filename, dpi=120, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    
    return filename

def create_pie_chart(data, title, filename):
    """Crear un gráfico circular"""
    if not data:
        return None
    
    # Extraer nombres y valores
    names = [item['name'] for item in data]
    values = [item['value'] for item in data]
    
    # Colores más vibrantes y legibles
    colors = ['#5a1f3f', '#8b5a2b', '#a78bfa', '#4f9cf9', '#00c48c', '#ff7f5a', '#f9c74f', '#e76f51']
    
    # Crear figura más grande
    fig, ax = plt.subplots(figsize=(10, 10))
    
    # Crear gráfico circular con mejor separación
    wedges, texts, autotexts = ax.pie(values, labels=names, autopct='%1.1f%%',
                                         colors=colors[:len(data)], startangle=90,
                                         explode=[0.05] * len(data),  # Separar las porciones
                                         textprops={'fontsize': 13, 'fontweight': 'bold', 'color': '#333'})
    
    # Personalizar textos de porcentaje
    for autotext in autotexts:
        autotext.set_fontsize(12)
        autotext.set_fontweight('bold')
        autotext.set_color('white')
    
    ax.set_title(title, fontsize=18, fontweight='bold', pad=20, color='#1a1a1a')
    
    # Ajustar layout
    plt.tight_layout(pad=2.0)
    
    # Guardar
    plt.savefig(filename, dpi=120, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    
    return filename

if __name__ == '__main__':
    # Leer datos desde stdin
    input_data = json.loads(sys.stdin.read())
    
    # Crear directorio para gráficos si no existe
    charts_dir = os.path.join(os.path.dirname(__file__), 'public', 'charts')
    os.makedirs(charts_dir, exist_ok=True)
    
    results = {}
    
    # Generar gráfico de vinos más visitados
    if 'topViewed' in input_data and input_data['topViewed']:
        viewed_data = [{'name': item['wineName'], 'value': item['views']} 
                       for item in input_data['topViewed']]
        viewed_file = os.path.join(charts_dir, 'top_viewed.png')
        if create_bar_chart(viewed_data, 'Vinos Más Visitados', viewed_file, '#4f9cf9'):
            results['topViewedChart'] = '/charts/top_viewed.png'
    
    # Generar gráfico de vinos más comprados
    if 'topPurchased' in input_data and input_data['topPurchased']:
        purchased_data = [{'name': item['wineName'], 'value': item['total']} 
                         for item in input_data['topPurchased']]
        purchased_file = os.path.join(charts_dir, 'top_purchased.png')
        if create_bar_chart(purchased_data, 'Vinos Más Comprados', purchased_file, '#5a1f3f'):
            results['topPurchasedChart'] = '/charts/top_purchased.png'
    
    # Generar gráfico circular de distribución
    if 'topPurchased' in input_data and input_data['topPurchased']:
        pie_file = os.path.join(charts_dir, 'distribution.png')
        if create_pie_chart(purchased_data, 'Distribución de Ventas', pie_file):
            results['distributionChart'] = '/charts/distribution.png'
    
    # Imprimir resultado como JSON
    print(json.dumps(results))
