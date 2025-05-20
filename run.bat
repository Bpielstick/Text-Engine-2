@echo off
echo Starting server for Text Engine 2...
cd public
start http://localhost:8000/
python -m http.server 8000
cd ..
echo Server stopped.
