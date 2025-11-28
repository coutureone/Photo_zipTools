# Deployment Guide

This project is configured to be easily deployed to GitHub Pages.

## Prerequisites

1.  A GitHub account.
2.  Git installed on your machine.

## Steps to Deploy

1.  **Initialize Git (if not already done):**
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```

2.  **Create a Repository on GitHub:**
    *   Go to [GitHub.com](https://github.com/new).
    *   Create a new repository (e.g., `photo-zip`).
    *   Do **not** initialize with README, .gitignore, or license (since you have them locally).

3.  **Link Local Repo to GitHub:**
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/photo-zip.git
    git branch -M main
    git push -u origin main
    ```

4.  **Deploy to GitHub Pages:**
    Run the following command in your terminal:
    ```bash
    npm run deploy
    ```

    This command will:
    *   Build the project (`npm run build`).
    *   Push the `dist` folder to the `gh-pages` branch of your repository.

5.  **Enable GitHub Pages:**
    *   Go to your repository settings on GitHub.
    *   Navigate to "Pages" (in the sidebar).
    *   Ensure the source is set to `gh-pages` branch.
    *   Your site should be live at `https://YOUR_USERNAME.github.io/photo-zip/`.

## Local Development

To run the project locally:

```bash
npm run dev
```
