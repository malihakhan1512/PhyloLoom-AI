import pathlib
ROOT = pathlib.Path(".")

# Fix: don't render Biopython internal node labels (Inner1 etc.)
p = ROOT / "frontend/src/components/PhyloTree.tsx"
t = p.read_text(encoding="utf-8")
t = t.replace('} else if (n.name && n.name !== "Root") {',
              '} else if (n.name && n.name !== "Root" && !n.name.startsWith("Inner")) {')
p.write_text(t, encoding="utf-8")
print("PhyloTree label fix applied")

(ROOT / "backend/Dockerfile").write_text("""FROM python:3.12-slim
WORKDIR /code
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
""")

(ROOT / "backend/.dockerignore").write_text(".venv\n__pycache__\n.pytest_cache\ntests\n")

(ROOT / "frontend/Dockerfile").write_text("""FROM node:20-alpine AS build
WORKDIR /code
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build
FROM node:20-alpine
WORKDIR /code
COPY --from=build /code ./
EXPOSE 3000
CMD ["npm", "start"]
""")

(ROOT / "frontend/.dockerignore").write_text("node_modules\n.next\n")

(ROOT / "docker-compose.yml").write_text("""services:
  backend:
    build: ./backend
    environment:
      - AI_PROVIDER=mock
    restart: unless-stopped
  frontend:
    build:
      context: ./frontend
      args:
        NEXT_PUBLIC_API_URL: https://phyloloom.study
    restart: unless-stopped
  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    restart: unless-stopped
volumes:
  caddy_data:
  caddy_config:
""")

(ROOT / "Caddyfile").write_text("""phyloloom.study {
    handle /api/* {
        reverse_proxy backend:8000
    }
    handle /health {
        reverse_proxy backend:8000
    }
    handle {
        reverse_proxy frontend:3000
    }
}

www.phyloloom.study {
    redir https://phyloloom.study{uri} permanent
}
""")
print("Deployment files created: docker-compose.yml, Caddyfile, Dockerfiles")