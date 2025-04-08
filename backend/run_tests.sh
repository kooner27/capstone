#!/bin/bash

echo "=== Backend Test Runner ==="

# Step 1: Navigate to tests folder and install test dependencies
echo "Installing test dependencies from tests/requirements.txt..."
cd tests || exit 1
pip3 install -r requirements.txt || exit 1

# Step 2: Go back to backend directory
cd ..

# Step 3: Run pytest with coverage
echo "Running tests with coverage..."
pytest --disable-warnings --cov=. --cov-report=term --cov-report=html

# Step 4: Inform user where to find coverage report
echo ""
echo "Test run complete."
echo "Coverage summary shown above."
echo "For detailed coverage, open htmlcov/index.html in a browser."
