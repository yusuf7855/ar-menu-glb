#!/usr/bin/env python3
"""
USDZ → GLB Dönüştürücü
Blender kullanarak USDZ dosyalarını GLB formatına çevirir.
"""

import subprocess
import sys
import os

# Blender yolu
BLENDER_PATH = "/Applications/Blender.app/Contents/MacOS/Blender"

# Blender için Python scripti
BLENDER_SCRIPT = '''
import bpy
import sys

# Argümanları al
argv = sys.argv
argv = argv[argv.index("--") + 1:]
input_file = argv[0]
output_file = argv[1]

# Sahneyi temizle
bpy.ops.wm.read_factory_settings(use_empty=True)

# USDZ dosyasını içe aktar
bpy.ops.wm.usd_import(filepath=input_file)

# GLB olarak dışa aktar
bpy.ops.export_scene.gltf(
    filepath=output_file,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_materials='EXPORT'
)

print(f"✅ Dönüştürme tamamlandı: {output_file}")
'''

def convert(input_path, output_path):
    """USDZ dosyasını GLB'ye dönüştür"""
    
    if not os.path.exists(input_path):
        print(f"❌ Dosya bulunamadı: {input_path}")
        return False
    
    # Geçici script dosyası oluştur
    script_path = "/tmp/blender_convert.py"
    with open(script_path, "w") as f:
        f.write(BLENDER_SCRIPT)
    
    print(f"🔄 Dönüştürülüyor: {input_path}")
    print(f"📦 Hedef: {output_path}")
    
    # Blender'ı arka planda çalıştır
    cmd = [
        BLENDER_PATH,
        "--background",
        "--python", script_path,
        "--",
        input_path,
        output_path
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if os.path.exists(output_path):
            size_mb = os.path.getsize(output_path) / (1024 * 1024)
            print(f"✅ Başarılı! Dosya boyutu: {size_mb:.2f} MB")
            return True
        else:
            print(f"❌ Hata oluştu")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Hata: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("""
❌ Kullanım: python3 convert_usdz_to_glb.py <input.usdz> <output.glb>

Örnek: python3 convert_usdz_to_glb.py ./outputs/test-urun.usdz ./outputs/test-urun.glb
        """)
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    convert(input_file, output_file)