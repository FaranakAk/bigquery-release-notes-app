# BigQuery Release Pulse 📢

A beautiful, premium web application built with **Python Flask**, **Vanilla CSS**, and **JavaScript** that fetches the official Google BigQuery release notes and allows you to easily filter, search, and share updates on Twitter/X.

---

## 🌟 Key Features

*   **Real-time Feed Syncing**: Fetches release notes directly from the official Google Cloud Atom feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
*   **Granular Update Parsing**: Automatically separates grouped release notes (daily notes containing multiple updates) into individual, clean, searchable updates categorized by type (e.g., *Features*, *Changes*, *Deprecations*, *Resolved*).
*   **Smart Caching & Instancy**: Uses an in-memory caching mechanism with a 30-minute expiration to guarantee instant page loads.
*   **Hard Refresh Spinner**: Includes a refresh button that pulls fresh data from Google's feed on-demand, featuring a rotating spinner.
*   **Multi-Selection & Social Sharing**: Select single or multiple release updates to format and compose a Tweet directly inside a custom, Twitter/X-style Tweet Composer component.
*   **Tweet Composer Details**:
    *   Pre-populated templates containing release tags, summary details, links, and hashtags (`#BigQuery #GoogleCloud`).
    *   Active character limit indicator (280 characters) with a circular SVG progress ring.
    *   Interactive hashtag inserts.
    *   Integration with Twitter/X native Web Intents for secure, OAuth-free posting.
*   **Bespoke Theme Control**: Modern dark and light themes with state persistence via `localStorage`.
*   **Search & Filters**: Instant full-text search and category filter tags to locate updates quickly.

---

## 📂 Project Structure

*   [app.py](file:///C:/Documents/5%20day%20agent%20-%20vibe%20code%20-%20google/agy-cli-projects/bq-releases-notes/app.py): Flask backend, feed fetcher, XML parser, and JSON API.
*   [templates/index.html](file:///C:/Documents/5%20day%20agent%20-%20vibe%20code%20-%20google/agy-cli-projects/bq-releases-notes/templates/index.html): Fully semantic dashboard and Tweet composer UI structure.
*   [static/css/styles.css](file:///C:/Documents/5%20day%20agent%20-%20vibe%20code%20-%20google/agy-cli-projects/bq-releases-notes/static/css/styles.css): Glassmorphic layout styling, color coding, animations, and dark/light modes.
*   [static/js/app.js](file:///C:/Documents/5%20day%20agent%20-%20vibe%20code%20-%20google/agy-cli-projects/bq-releases-notes/static/js/app.js): Interactive state control, filtering logic, modal events, character progress ring calculations, and web intent integrations.
*   [requirements.txt](file:///C:/Documents/5%20day%20agent%20-%20vibe%20code%20-%20google/agy-cli-projects/bq-releases-notes/requirements.txt): Python packages (`Flask`, `requests`, `feedparser`, `beautifulsoup4`).

---

## ⚙️ Architecture Breakdown

### Server-Side
*   **Framework**: Flask
*   **Parsing Engine**: `feedparser` reads the XML feed, and `BeautifulSoup` decomposes compound daily updates into separate updates based on `<h3>` heading delimiters.
*   **Caching**: Uses an in-memory Python dictionary (`_cache`) to store feed results for up to 30 minutes, preventing excessive network requests. Includes automated fallback logic that returns stale data if Google's feed is down.

### Client-Side
*   **Framework**: Vanilla HTML5, ES6+ JavaScript, CSS3 Custom Properties.
*   **Theming**: Integrates Dark and Light modes using CSS variables, checking and saving preference in the browser's local storage.
*   **UI/UX**: Responsive glassmorphism cards with smooth animations, custom badges, filter metrics, and a dynamic circular progress ring.

---

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

---

## 🔌 API Documentation

### Get Release Notes
Returns the parsed release updates.

*   **URL**: `/api/notes`
*   **Method**: `GET`
*   **Query Parameters**:
    *   `refresh` (optional): Set to `true` to force a cache bypass and fetch latest feed data.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "count": 48,
      "fallback": false,
      "last_fetched": "2026-06-15 18:35:10",
      "notes": [
        {
          "id": "tag:google.com,2010:repository-gcp-release-notes-bigquery:2026-06-15-feature-0",
          "date": "June 15, 2026",
          "type": "Feature",
          "html": "<p>BigQuery now supports new SQL options...</p>",
          "text": "BigQuery now supports new SQL options...",
          "link": "https://cloud.google.com/bigquery/docs/release-notes",
          "updated_raw": "2026-06-15T18:00:00Z"
        }
      ]
    }
    ```
