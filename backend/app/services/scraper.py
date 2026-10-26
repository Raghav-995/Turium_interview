import re
from typing import Tuple
from bs4 import BeautifulSoup
import httpx
import trafilatura
from backend.app.core.config import settings
from backend.app.core.logging import logger


class ScraperError(Exception):
    """Custom exception raised when web scraping fails."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


async def fetch_url_content(url: str) -> Tuple[str, str]:
    """
    Fetches and extracts clean text and document title from a given URL.
    Returns:
        (title, clean_text)
    Raises:
        ScraperError with appropriate message and HTTP status code.
    """
    logger.info(f"Fetching URL content from: {url}")
    
    headers = {
        "User-Agent": settings.SCRAPER_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    try:
        async with httpx.AsyncClient(
            timeout=settings.SCRAPER_TIMEOUT_SECONDS,
            follow_redirects=True,
            headers=headers
        ) as client:
            response = await client.get(url)
            
            if response.status_code >= 400:
                logger.warning(f"URL fetch returned status {response.status_code} for {url}")
                raise ScraperError(
                    f"Target website returned HTTP {response.status_code}: {response.reason_phrase}",
                    status_code=400
                )
            
            html_content = response.text

    except httpx.TimeoutException:
        logger.error(f"Timeout fetching {url}")
        raise ScraperError(f"Request timed out after {settings.SCRAPER_TIMEOUT_SECONDS}s while fetching URL.", status_code=408)
    except httpx.RequestError as exc:
        logger.error(f"Network error fetching {url}: {str(exc)}")
        raise ScraperError(f"Failed to connect to URL: {str(exc)}", status_code=400)

    # 1. Extract Document Title
    soup = BeautifulSoup(html_content, "html.parser")
    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()
    elif og_title := soup.find("meta", property="og:title"):
        title = og_title.get("content", "").strip()
    
    if not title:
        # Fallback to URL hostname and path
        title = url.split("://")[-1].split("?")[0][:60]

    # 2. Extract Article / Main Text using trafilatura
    # trafilatura strips boilerplate navigation, footers, headers, and ads
    extracted_text = trafilatura.extract(
        html_content,
        include_comments=False,
        include_tables=True,
        no_fallback=False
    )

    # 3. Fallback to BeautifulSoup text extraction if trafilatura produces empty result
    if not extracted_text or not extracted_text.strip():
        logger.info(f"Trafilatura returned empty content for {url}; falling back to BeautifulSoup.")
        # Strip script and style tags
        for element in soup(["script", "style", "noscript", "header", "footer", "nav"]):
            element.decompose()
        
        raw_text = soup.get_text(separator="\n")
        # Collapse excessive blank lines
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        extracted_text = "\n".join(lines)

    if not extracted_text or len(extracted_text.strip()) < 30:
        logger.warning(f"Insufficient text content extracted from {url}")
        raise ScraperError(
            "Could not extract sufficient text from the target page. The page might require JavaScript or be login-protected.",
            status_code=422
        )

    # Clean whitespace
    cleaned_text = re.sub(r"\n{3,}", "\n\n", extracted_text.strip())
    logger.info(f"Successfully extracted {len(cleaned_text)} characters from {url} (Title: '{title[:40]}...')")
    return title, cleaned_text
