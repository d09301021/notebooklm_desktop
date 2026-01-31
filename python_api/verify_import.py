
try:
    from notebooklm.rpc.types import ReportFormat
    print(f"Import successful! Study Guide value: {ReportFormat.STUDY_GUIDE}")
except Exception as e:
    print(f"Import failed: {e}")
