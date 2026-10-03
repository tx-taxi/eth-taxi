"""Parse the actual callback sitemap independently of the JavaScript generator."""
from pathlib import Path
import json
import xml.etree.ElementTree as ET

directory = Path(__file__).parent
document = ET.parse(directory / "sitemap.xml").getroot()
namespace = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
assert document.tag == namespace + "urlset"
urls = [element.text for element in document.findall(namespace + "url/" + namespace + "loc")]
expected = {
    "https://eth.tx.taxi" + route
    for route in [
        "/", "/blocks/1", "/txs", "/production", "/mempool-block/0", "/about",
        "/privacy-policy", "/terms-of-service", "/docs/faq", "/docs/api/rest", "/docs/api/websocket",
    ]
}
assert set(urls) == expected
assert len(urls) == len(set(urls))
assert all(url.startswith("https://eth.tx.taxi/") for url in urls)
report = {
    "parser": "Python ElementTree actual XML namespace",
    "scope": "Root /sitemap.xml covers every included path",
    "urls": urls,
    "duplicates": 0,
    "failures": 0,
}
(directory / "xml-check.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({"urls": len(urls), "failures": 0}))
