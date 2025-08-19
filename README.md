# Computer Science Hub - Kaduna Polytechnic

This is a collaborative platform for computer science students and lecturers at Kaduna Polytechnic. It allows for the sharing and management of academic materials.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Page Navigation Map](#page-navigation-map)
- [Making Changes](#making-changes)

## Prerequisites

Before you begin, ensure you have the following software installed on your machine.

- **Git:** A version control system for tracking changes in source code.
  - [Download Git](https://git-scm.com/downloads)
- **Node.js:** A JavaScript runtime environment. This project was built using Node.js, and it comes with `npm` (Node Package Manager) which is required to install project dependencies.
  - Download Node.js (LTS version recommended)
- **A Code Editor:** Any code editor will work, but we recommend Visual Studio Code.

## Getting Started

Follow these steps to get your local development environment up and running.

**1. Clone the Repository**

First, clone the project repository from GitHub to your local machine.

```sh
git clone <YOUR_REPOSITORY_URL>
```

Replace `<YOUR_REPOSITORY_URL>` with the actual URL of your Git repository.

**2. Navigate to the Project Directory**

```sh
cd computer-science-hub
```

**3. Install Dependencies**

Install all the necessary packages required for the project using npm. This command reads the `package.json` file and installs all the libraries listed under `dependencies` and `devDependencies`.

```sh
npm install
```

**4. Run the Application**

This project has two parts that need to be running simultaneously: the backend server and the frontend application. You should open two separate terminal windows for this.

**In your first terminal, start the backend server:**

The backend server handles file operations like uploads, downloads, and listings.

```sh
node server/server.js
```

You should see a message confirming that the server is running, typically on `http://localhost:3001`.

**In your second terminal, start the frontend development server:**

The frontend is a React application built with Vite.

```sh
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
