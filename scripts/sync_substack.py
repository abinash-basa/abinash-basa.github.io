"""
Substack Synchronization Script for Abinash Basa Portfolio
Fetches public Substack long-form articles (persistent collection)
and short-form notes (rolling newest-first feed).
Generates clean, sanitized, normalized JSON datasets in data/ directory.
"""

import os
import sys
import json
import re
import html
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

SUBSTACK_HANDLE = "abinashbasa"
SUBSTACK_USER_ID = "301766687"
SUBSTACK_PUB_URL = "https://abinashbasa.substack.com"
SUBSTACK_PROFILE_URL = "https://substack.com/@abinashbasa"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
ARTICLES_FILE = os.path.join(DATA_DIR, "substack-articles.json")
NOTES_FILE = os.path.join(DATA_DIR, "substack-notes.json")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

def make_request(url, is_json=False):
    """
    Executes a resilient GET request with appropriate headers and timeouts.
    """
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json, application/xml, text/xml, text/html, */*",
        "Accept-Language": "en-US,en;q=0.9"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode("utf-8", errors="ignore")
            if is_json:
                return json.loads(content)
            return content
    except Exception as e:
        print(f"[WARN] Failed fetching {url}: {e}")
        return None

def clean_text(text):
    """
    Sanitizes raw text, strips HTML tags, replaces em dashes with hyphens/colons,
    normalizes quotes, and collapses whitespace.
    """
    if not text:
        return ""
    # Unescape HTML entities
    text = html.unescape(text)
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Normalize unicode em-dashes and en-dashes per project rules (no em dashes)
    text = text.replace("—", " - ").replace("–", " - ")
    # Normalize curly quotes and apostrophes
    text = text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
    # Collapse multiple whitespace within lines
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text)
    return text.strip()

def clean_single_line(text):
    t = clean_text(text)
    return re.sub(r"\s+", " ", t).strip()

def parse_iso_date(date_str):
    if not date_str:
        return ""
    try:
        # Handle ISO strings like 2026-07-20T02:25:06.182Z
        if "T" in date_str:
            clean_str = date_str.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_str)
            return dt.astimezone(timezone.utc).isoformat()
        # Handle RFC 822 / RSS dates like Mon, 20 Jul 2026 02:25:06 GMT
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(date_str)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return date_str

def fetch_substack_articles():
    """
    Fetches articles from Archive API and RSS feed.
    Returns a list of normalized article dictionaries.
    """
    articles = {}

    # 1. Fetch from Archive API
    archive_url = f"{SUBSTACK_PUB_URL}/api/v1/archive?sort=new&limit=50"
    archive_data = make_request(archive_url, is_json=True)
    if archive_data and isinstance(archive_data, list):
        for item in archive_data:
            canonical_url = item.get("canonical_url") or f"{SUBSTACK_PUB_URL}/p/{item.get('slug', '')}"
            title = clean_single_line(item.get("title", ""))
            if not title or not canonical_url:
                continue
            
            raw_date = item.get("post_date") or item.get("created_at")
            iso_date = parse_iso_date(raw_date)
            
            excerpt = clean_single_line(item.get("subtitle") or item.get("description") or "")
            cover_image = item.get("cover_image")
            
            articles[canonical_url] = {
                "id": str(item.get("id") or item.get("slug")),
                "title": title,
                "url": canonical_url,
                "date": iso_date,
                "excerpt": excerpt,
                "image": cover_image,
                "type": "article"
            }

    # 2. Fetch from RSS feed (enrich or supplement)
    feed_url = f"{SUBSTACK_PUB_URL}/feed"
    feed_xml = make_request(feed_url, is_json=False)
    if feed_xml:
        try:
            root = ET.fromstring(feed_xml)
            for item in root.findall(".//item"):
                link = item.find("link")
                url = link.text.strip() if link is not None and link.text else ""
                if not url:
                    continue
                # Normalize url (strip query parameters)
                url = url.split("?")[0]
                
                title_elem = item.find("title")
                title = clean_single_line(title_elem.text if title_elem is not None else "")
                
                pub_elem = item.find("pubDate")
                iso_date = parse_iso_date(pub_elem.text if pub_elem is not None else "")
                
                desc_elem = item.find("description")
                desc_text = clean_single_line(desc_elem.text if desc_elem is not None else "")
                
                enclosure = item.find("enclosure")
                enc_url = enclosure.attrib.get("url") if enclosure is not None else None
                
                if url in articles:
                    # Enrich missing image or excerpt if not present
                    if not articles[url].get("image") and enc_url:
                        articles[url]["image"] = enc_url
                    if not articles[url].get("excerpt") and desc_text:
                        articles[url]["excerpt"] = desc_text
                else:
                    slug = url.rstrip("/").split("/")[-1]
                    articles[url] = {
                        "id": slug,
                        "title": title,
                        "url": url,
                        "date": iso_date,
                        "excerpt": desc_text,
                        "image": enc_url,
                        "type": "article"
                    }
        except Exception as e:
            print(f"[WARN] Error parsing RSS XML: {e}")

    # Convert to list and sort descending by date
    result = list(articles.values())
    result.sort(key=lambda x: x.get("date", ""), reverse=True)
    return result

def merge_persistent_articles(new_articles, existing_articles_file):
    """
    CRITICAL REQUIREMENT: Long-form articles must never disappear.
    Merges newly fetched articles with previously saved articles.
    """
    merged = {}
    
    # Load existing articles if file exists
    if os.path.exists(existing_articles_file):
        try:
            with open(existing_articles_file, "r", encoding="utf-8") as f:
                existing_list = json.load(f)
                if isinstance(existing_list, list):
                    for a in existing_list:
                        u = a.get("url")
                        if u:
                            merged[u] = a
        except Exception as e:
            print(f"[WARN] Could not read existing articles file: {e}")

    # Merge newly fetched articles (updates metadata while preserving all existing items)
    for a in new_articles:
        u = a.get("url")
        if u:
            merged[u] = a

    # Sort descending by date
    final_list = list(merged.values())
    final_list.sort(key=lambda x: x.get("date", ""), reverse=True)
    return final_list

def extract_note_fields(body_text, comment_id):
    """
    Intelligently extracts a display title/hook and short excerpt from a Substack Note.
    """
    cleaned = clean_text(body_text)
    if not cleaned:
        return "Substack Note", ""
    
    paragraphs = [p.strip() for p in cleaned.split("\n\n") if p.strip()]
    if not paragraphs:
        return "Substack Note", ""
        
    if len(paragraphs) == 1:
        single = paragraphs[0]
        lines = [l.strip() for l in single.split("\n") if l.strip()]
        if len(lines) > 1 and lines[1].startswith(("-", " -", "--")):
            title = f"{lines[0]} {lines[1]}"
            excerpt = " ".join(lines[2:])
            return title.strip(), excerpt.strip()
        if len(single) <= 100:
            return single, ""
        sentences = re.split(r"(?<=[.!?])\s+", single)
        if len(sentences) > 1 and len(sentences[0]) <= 110:
            return sentences[0].strip(), " ".join(sentences[1:]).strip()
        return single[:90].rsplit(" ", 1)[0] + "...", single
        
    # Multiple paragraphs
    p0 = paragraphs[0]
    p1 = paragraphs[1]
    
    # Check if p1 is an attribution line like "- Friedrich Nietzsche"
    if p1.startswith(("-", " -", "--")) and len(p1) < 60:
        title = f"{p0} {p1}"
        excerpt = " ".join(paragraphs[2:])
        return title.strip(), excerpt.strip()
    
    if len(p0) <= 110:
        title = p0
        excerpt = " ".join(paragraphs[1:])
        return title.strip(), excerpt.strip()
    else:
        sentences = re.split(r"(?<=[.!?])\s+", p0)
        if len(sentences) > 1 and len(sentences[0]) <= 110:
            title = sentences[0]
            excerpt = " ".join(sentences[1:]) + " " + " ".join(paragraphs[1:])
            return title.strip(), excerpt.strip()
        else:
            title = p0[:90].rsplit(" ", 1)[0] + "..."
            excerpt = p0 + " " + " ".join(paragraphs[1:])
            return title.strip(), excerpt.strip()

def fetch_substack_notes(user_id=SUBSTACK_USER_ID):
    """
    Fetches short-form notes from public profile reader feed.
    """
    feed_url = f"https://substack.com/api/v1/reader/feed/profile/{user_id}?limit=50"
    data = make_request(feed_url, is_json=True)
    
    if not data or not isinstance(data, dict):
        print("[WARN] Reader feed returned invalid data or empty response")
        return []

    items = data.get("items", [])
    raw_notes = []
    seen_ids = set()
    
    for item in items:
        # Check if item represents a note (comment entity)
        if item.get("type") == "comment":
            comment = item.get("comment") or {}
            comment_id = comment.get("id")
            if not comment_id or comment_id in seen_ids:
                continue
            
            raw_body = comment.get("body") or ""
            if not raw_body.strip():
                continue
                
            seen_ids.add(comment_id)
            iso_date = parse_iso_date(comment.get("date") or comment.get("created_at"))
            
            title, excerpt = extract_note_fields(raw_body, comment_id)
            note_url = f"https://substack.com/@{SUBSTACK_HANDLE}/note/c-{comment_id}"
            
            raw_notes.append({
                "id": str(comment_id),
                "title": title,
                "url": note_url,
                "date": iso_date,
                "excerpt": excerpt,
                "full_text": clean_text(raw_body),
                "type": "note"
            })

    # Sort strictly descending by date (newest first)
    raw_notes.sort(key=lambda x: x.get("date", ""), reverse=True)

    # Deduplicate draft prefixes posted within minutes of a full note
    deduped_notes = []
    for note in raw_notes:
        is_subsumed = False
        for kept in deduped_notes:
            # If this note's full text is a substring/prefix of an already kept newer note
            if note["full_text"] in kept["full_text"] and len(note["full_text"]) < len(kept["full_text"]):
                is_subsumed = True
                break
        if not is_subsumed:
            deduped_notes.append(note)

    return deduped_notes

def sync_substack():
    """
    Main orchestration function.
    Safely synchronizes Substack articles and notes without losing historical data.
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"Starting Substack synchronization for @{SUBSTACK_HANDLE}...")

    # 1. Fetch & Merge Articles (Persistent)
    new_articles = fetch_substack_articles()
    print(f"Fetched {len(new_articles)} long-form articles from Substack feeds.")
    
    if new_articles:
        final_articles = merge_persistent_articles(new_articles, ARTICLES_FILE)
    else:
        # If fetch failed or was empty, preserve existing articles file
        print("[INFO] No new articles fetched. Retaining existing article dataset.")
        if os.path.exists(ARTICLES_FILE):
            with open(ARTICLES_FILE, "r", encoding="utf-8") as f:
                final_articles = json.load(f)
        else:
            final_articles = []
            
    print(f"Total persistent articles in collection: {len(final_articles)}")

    # 2. Fetch Notes (Rolling)
    notes = fetch_substack_notes(SUBSTACK_USER_ID)
    print(f"Fetched {len(notes)} short-form notes from Substack profile.")

    # 3. Check for Changes and Write
    articles_changed = False
    notes_changed = False

    if final_articles:
        articles_json_str = json.dumps(final_articles, indent=2, ensure_ascii=False) + "\n"
        if os.path.exists(ARTICLES_FILE):
            with open(ARTICLES_FILE, "r", encoding="utf-8") as f:
                old_articles_str = f.read()
            if old_articles_str != articles_json_str:
                articles_changed = True
        else:
            articles_changed = True

        if articles_changed:
            with open(ARTICLES_FILE, "w", encoding="utf-8") as f:
                f.write(articles_json_str)
            print(f"[UPDATED] {ARTICLES_FILE}")
        else:
            print(f"[UNCHANGED] {ARTICLES_FILE}")

    if notes:
        notes_json_str = json.dumps(notes, indent=2, ensure_ascii=False) + "\n"
        if os.path.exists(NOTES_FILE):
            with open(NOTES_FILE, "r", encoding="utf-8") as f:
                old_notes_str = f.read()
            if old_notes_str != notes_json_str:
                notes_changed = True
        else:
            notes_changed = True

        if notes_changed:
            with open(NOTES_FILE, "w", encoding="utf-8") as f:
                f.write(notes_json_str)
            print(f"[UPDATED] {NOTES_FILE}")
        else:
            print(f"[UNCHANGED] {NOTES_FILE}")
    elif not os.path.exists(NOTES_FILE):
        with open(NOTES_FILE, "w", encoding="utf-8") as f:
            f.write("[]\n")
        print(f"[INITIALIZED EMPTY] {NOTES_FILE}")

    if articles_changed or notes_changed:
        print("STATUS: DATA_CHANGED")
    else:
        print("STATUS: NO_CHANGES")

if __name__ == "__main__":
    sync_substack()
