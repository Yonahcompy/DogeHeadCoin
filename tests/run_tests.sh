#!/bin/bash

# Build the program
echo "Building the program..."
anchor build

# Run the tests
echo "Running the tests..."
anchor test

# Print the results
echo "Tests completed!" 