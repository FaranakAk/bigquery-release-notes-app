import os
import time
import requests
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_FILE = "feed_cache.json"
CACHE_DURATION = 1800 # 30 minutes cache

# In-memory cache
_cache = {
    "data": None,
    "last_fetched": 0
}

def parse_feed_content(feed_data):
    """
    Parses the raw feed entries into structured individual updates.
    """
    parsed_entries = []
    
    for entry in feed_data.entries:
        date_str = entry.get('title', 'Unknown Date')
        entry_link = entry.get('link', '')
        updated_raw = entry.get('updated', '')
        
        # Content is typically in content[0].value or summary
        content_html = ""
        if 'content' in entry and len(entry['content']) > 0:
            content_html = entry['content'][0]['value']
        else:
            content_html = entry.get('summary', '')
            
        soup = BeautifulSoup(content_html, 'html.parser')
        h3s = soup.find_all('h3')
        
        if not h3s:
            # Fallback if no h3 structure is found
            text_content = soup.get_text().strip()
            parsed_entries.append({
                'date': date_str,
                'link': entry_link,
                'type': 'General',
                'html': content_html,
                'text': text_content,
                'updated_raw': updated_raw,
                'id': entry.get('id', f"{date_str}-general")
            })
        else:
            # Loop through each h3 tag and gather its contents
            for idx, h3 in enumerate(h3s):
                update_type = h3.get_text().strip()
                sibling = h3.next_sibling
                sibling_htmls = []
                sibling_texts = []
                
                # Gather sibling tags until we hit the next h3
                while sibling and sibling.name != 'h3':
                    if sibling.name:
                        sibling_htmls.append(str(sibling))
                        sibling_texts.append(sibling.get_text().strip())
                    sibling = sibling.next_sibling
                    
                update_html = "".join(sibling_htmls)
                update_text = " ".join(sibling_texts).strip()
                
                # Unique ID for UI selection purposes
                entry_id = entry.get('id', date_str)
                unique_id = f"{entry_id}-{update_type.lower()}-{idx}"
                
                parsed_entries.append({
                    'date': date_str,
                    'link': entry_link,
                    'type': update_type,
                    'html': update_html,
                    'text': update_text,
                    'updated_raw': updated_raw,
                    'id': unique_id
                })
                
    return parsed_entries

def get_release_notes(force_refresh=False):
    """
    Retrieves and parses release notes. Uses memory cache unless expired or force_refresh is True.
    """
    global _cache
    current_time = time.time()
    
    # Check if cache is valid
    if not force_refresh and _cache["data"] is not None and (current_time - _cache["last_fetched"] < CACHE_DURATION):
        return _cache["data"], False
        
    try:
        # Fetch xml feed
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(FEED_URL, headers=headers, timeout=15)
        response.raise_for_status()
        
        # Parse XML using feedparser
        feed_data = feedparser.parse(response.content)
        
        if not feed_data.entries:
            # If feedparser failed or feed is empty, check cache
            if _cache["data"] is not None:
                return _cache["data"], True
            raise ValueError("No entries found in feed")
            
        parsed_data = parse_feed_content(feed_data)
        
        # Update cache
        _cache["data"] = parsed_data
        _cache["last_fetched"] = current_time
        
        return parsed_data, False
        
    except Exception as e:
        print(f"Error fetching/parsing feed: {e}")
        # If fetch fails, try to return cached data even if expired
        if _cache["data"] is not None:
            return _cache["data"], True
        raise e

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def api_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    try:
        notes, using_fallback = get_release_notes(force_refresh)
        return jsonify({
            'success': True,
            'notes': notes,
            'count': len(notes),
            'last_fetched': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(_cache["last_fetched"])),
            'fallback': using_fallback
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Default Flask runs on localhost:5000
    app.run(debug=True, port=5000)
