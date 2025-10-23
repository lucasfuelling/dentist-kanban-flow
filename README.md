# Welcome to Boedefuelling's KV-APP

## Installation

**What we need - overview**

- KV-APP (this repository)
- N8N
- Supabase
- [Docker for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Visual Studio Code](https://code.visualstudio.com/docs/setup/windows#_install-vs-code-on-windows)
- [Node.js & npm](https://github.com/nvm-sh/nvm#installing-and-updating)

**Containerized approach**

We will put the KV-APP into a Docker image.
n8n and supabase already have Docker images. These three Docker images then communicate within a Docker network.

## Create KV-APP docker image and push it to Docker Hub

**Open VS Code & Clone Repo**

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone https://github.com/lucasfuelling/dentist-kanban-flow.git

# Step 2: Navigate to the project directory.
cd dentist-kanban-flow

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Build Docker image**
Open your terminal in the same directory as your Dockerfile and run:

```sh
docker build -t kv-app .
```

After the image is built, you can test run a container from it:

```sh
docker run -p 8080:80 kv-app
```

This command maps port 8080 on your host machine to port 80 inside the container, where Nginx is serving the application. You can now access your kv-app in your browser at http://localhost:8080.
You can stop the container in Docker.

**Push the Docker image to Docker Hub**

Open Docker and push the image to Docker Hub.
Our Repo is https://hub.docker.com/search?q=lucasfuelling

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/0ef69d3a-90de-499e-b824-40c4e9d6d838) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
