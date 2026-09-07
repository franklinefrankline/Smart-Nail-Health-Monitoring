FROM python:3.10-slim

# Install postgresql-client because db_client.py uses the psql command
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the backend files
COPY . .

# Expose the port
EXPOSE 8000

# Start the server
CMD ["python", "server.py"]
