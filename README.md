# BigQuery Release Pulse 📢

A beautiful, premium web application built with **Python Flask**, **Vanilla CSS**, and **JavaScript** that fetches the official Google BigQuery release notes and allows you to easily filter, search, and share updates on Twitter/X.

## 🌟 Features

- **Real-time Feed Syncing**: Fetches release notes directly from the official Google Cloud Atom feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
- **Granular Update Parsing**: Automatically separates grouped release notes (daily notes containing multiple updates) into individual, clean, searchable updates categorized by type (e.g., *Features*, *Changes*, *Deprecations*, *Resolved*).
- **Smart Caching & Instancy**: Uses an in-memory caching mechanism with a 30-minute expiration to guarantee instant page loads.
- **Hard Refresh Spinner**: Includes a refresh button that pulls fresh data from Google's feed on-demand, featuring a rotating spinner.
- **Multi-Selection & Social Sharing**: Select single or multiple release updates to format and compose a Tweet directly inside a custom, Twitter/X-style Tweet Composer component.
- **Tweet Composer Details**:
  - Pre-populated templates containing release tags, summary details, links, and hashtags (`#BigQuery #GoogleCloud`).
  - Active character limit indicator (280 characters) with a circular SVG progress ring.
  - Interactive hashtag inserts.
  - Integration with Twitter/X native Web Intents for secure, OAuth-free posting.
- **Bespoke Theme Control**: Modern dark and light themes with state persistence via `localStorage`.
- **Search & Filters**: Instant full-text search and category filter tags to locate updates quickly.

## 📂 Project Structure

- `app.py`: Flask backend, feed fetcher, XML parser, and JSON API.
- `templates/index.html`: Fully semantic dashboard and Tweet composer UI structure.
- `static/css/styles.css`: Glassmorphic layout styling, color coding, animations, and dark/light modes.
- `static/js/app.js`: Interactive state control, filtering logic, modal events, character progress ring calculations, and web intent integrations.
- `requirements.txt`: Python packages (`Flask`, `requests`, `feedparser`, `beautifulsoup4`).

## 🚀 How to Run Locally

### 1. Set Up Python Virtual Environment
Verify Python launcher (`py`) is installed, then run:
```bash
# Create virtual environment
py -m venv venv

# Activate virtual environment (Windows Powershell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Launch the Application
Run the Flask server:
```bash
python app.py
```
The application will run on **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.
