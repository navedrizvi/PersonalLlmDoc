#!/bin/sh
# Start the server
/bin/ollama serve &

if [ -z "$1" ]; then
    echo "Please pass the model name as an argument."
    exit 1
fi

sleep 10

ollama pull "$1"
