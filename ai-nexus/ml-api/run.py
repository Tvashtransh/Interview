#!/usr/bin/env python3
"""
AI-NEXUS ML API Runner
Simple Python script to run the ML API server
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is 3.8+"""
    if sys.version_info < (3, 8):
        print("[ERROR] Python 3.8+ is required")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    print(f"[OK] Python {sys.version.split()[0]}")

def setup_venv():
    """Create and activate virtual environment"""
    venv_path = Path("venv")
    
    if not venv_path.exists():
        print("[1/3] Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
    else:
        print("[1/3] Virtual environment already exists")
    
    # Determine activation script based on OS
    if sys.platform == "win32":
        activate_script = venv_path / "Scripts" / "activate.bat"
        python_exe = venv_path / "Scripts" / "python.exe"
    else:
        activate_script = venv_path / "bin" / "activate"
        python_exe = venv_path / "bin" / "python"
    
    return python_exe

def install_dependencies(python_exe):
    """Install required dependencies"""
    print("[2/3] Installing dependencies...")
    subprocess.run([str(python_exe), "-m", "pip", "install", "--upgrade", "pip"], check=True)
    subprocess.run([str(python_exe), "-m", "pip", "install", "-r", "requirements.txt"], check=True)
    print("[OK] Dependencies installed")

def run_server(python_exe):
    """Run the FastAPI server"""
    print("[3/3] Starting ML API server...")
    print("=" * 50)
    print("  URL: http://localhost:8000")
    print("  Docs: http://localhost:8000/docs")
    print("  Health: http://localhost:8000/api/health")
    print("=" * 50)
    print("\nPress Ctrl+C to stop the server\n")
    
    # Convert to absolute path to ensure we use the correct Python
    python_exe = Path(python_exe).resolve()
    
    # Change to app directory
    app_dir = Path("app").resolve()
    os.chdir(app_dir)
    
    # Use absolute path for Python executable
    subprocess.run([
        str(python_exe), "-m", "uvicorn",
        "main:app",
        "--reload",
        "--host", "0.0.0.0",
        "--port", "8000"
    ], check=False)  # Don't raise on exit, let user handle Ctrl+C

def main():
    """Main function"""
    print("=" * 50)
    print("  AI-NEXUS ML API Server")
    print("=" * 50)
    print()
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    try:
        check_python_version()
        python_exe = setup_venv()
        install_dependencies(python_exe)
        run_server(python_exe)
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Command failed: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n[INFO] Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

