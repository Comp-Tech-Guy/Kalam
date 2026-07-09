# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['kalam-core.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'pyvda', 'pyvda.build', 'pyvda.com_base', 'pyvda.com_defns',
        'pyvda.const', 'pyvda.pyvda', 'pyvda.utils', 'pyvda.winstring',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='kalam-core-x86_64-pc-windows-msvc',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
