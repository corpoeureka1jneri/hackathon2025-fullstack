#!/usr/bin/env python3
"""
Script de diagnóstico para verificar la configuración de OpenAI.
Ejecutar con: python test_openai_config.py
"""
import os
import sys

def test_openai_config():
    print("=" * 70)
    print("DIAGNÓSTICO DE CONFIGURACIÓN OPENAI")
    print("=" * 70)
    
    # 1. Verificar variable de entorno
    print("\n1. Verificando variable de entorno OPENAI_API_KEY...")
    api_key = os.environ.get('OPENAI_API_KEY')
    if api_key:
        print(f"   ✓ API Key encontrada: {api_key[:10]}...{api_key[-4:]}")
        print(f"   Longitud: {len(api_key)} caracteres")
    else:
        print("   ✗ OPENAI_API_KEY NO configurada")
        print("\n   Para configurarla en Windows PowerShell:")
        print('   $env:OPENAI_API_KEY="tu-api-key-aqui"')
        print("\n   O permanentemente:")
        print("   [System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', 'tu-api-key', 'User')")
        return False
    
    # 2. Verificar instalación de librería
    print("\n2. Verificando instalación de librería openai...")
    try:
        import openai
        print(f"   ✓ Librería openai instalada (versión: {openai.__version__})")
    except ImportError:
        print("   ✗ Librería openai NO instalada")
        print("\n   Para instalarla:")
        print("   pip install openai")
        return False
    
    # 3. Verificar conexión a OpenAI
    print("\n3. Probando conexión a OpenAI API...")
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        print("   Enviando request de prueba...")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un asistente útil."},
                {"role": "user", "content": "Di 'OK' si me puedes leer."}
            ],
            max_tokens=10
        )
        
        resultado = response.choices[0].message.content
        print(f"   ✓ Respuesta de OpenAI: '{resultado}'")
        print("   ✓ Conexión exitosa con OpenAI API")
        
    except Exception as e:
        print(f"   ✗ Error al conectar con OpenAI: {str(e)}")
        print(f"\n   Tipo de error: {type(e).__name__}")
        return False
    
    # 4. Probar clasificación de ticket
    print("\n4. Probando clasificación de ticket de prueba...")
    try:
        test_prompt = """Eres un asistente de clasificación de tickets de soporte. 
Analiza el siguiente ticket y clasifica su prioridad en: alta, media o baja.

Título: Sistema caído en producción
Descripción: El servidor principal no responde desde hace 30 minutos. Clientes reportan error 500.

Responde SOLO con un JSON en este formato:
{
  "prioridad": "alta|media|baja",
  "explicacion": "Breve explicación de por qué se asignó esta prioridad"
}"""
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un clasificador de prioridad de tickets. Respondes solo con JSON válido."},
                {"role": "user", "content": test_prompt}
            ],
            temperature=0.3,
            max_tokens=150
        )
        
        resultado_texto = response.choices[0].message.content.strip()
        print(f"   Respuesta raw: {resultado_texto}")
        
        import json
        # Limpiar marcadores de código si existen
        if resultado_texto.startswith('```'):
            resultado_texto = resultado_texto.split('\n', 1)[1]
        if resultado_texto.endswith('```'):
            resultado_texto = resultado_texto.rsplit('\n', 1)[0]
        
        resultado = json.loads(resultado_texto)
        print(f"   ✓ Prioridad clasificada: {resultado.get('prioridad')}")
        print(f"   ✓ Explicación: {resultado.get('explicacion')}")
        print("   ✓ Clasificación de tickets funciona correctamente")
        
    except Exception as e:
        print(f"   ✗ Error al clasificar ticket: {str(e)}")
        return False
    
    # Resumen final
    print("\n" + "=" * 70)
    print("✓ TODAS LAS PRUEBAS PASARON")
    print("  OpenAI está configurado correctamente y funcionando")
    print("=" * 70)
    return True

if __name__ == "__main__":
    success = test_openai_config()
    sys.exit(0 if success else 1)
