"""Run the unchanged R3 audit from its new nested location."""
from pathlib import Path
import runpy
import subprocess

original = subprocess.check_output


def full_tree(command, *args, **kwargs):
    # git ls-tree otherwise limits results to the fallback subdirectory.
    if isinstance(command, list) and "ls-tree" in command:
        command = command.copy()
        command.insert(command.index("ls-tree") + 1, "--full-tree")
    return original(command, *args, **kwargs)


subprocess.check_output = full_tree
runpy.run_path(str(Path(__file__).parent / "source" / "r3" / "validate_stl.py"),
              run_name="__main__")
