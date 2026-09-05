import os
import sys
import uvicorn

if __name__ == "__main__":
    from backend.app.main import app
    uvicorn.run(app, host="127.0.0.1", port=8000)
