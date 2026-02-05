from playwright.sync_api import sync_playwright
import os

class PDFService:
    @staticmethod
    def generate_pdf(url: str, output_path: str):
        """
        Generates a PDF from a given URL using Playwright.
        This ensures pixel-level structural accuracy by using a real Chromium engine.
        """
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            
            # Navigate to the preview page (frontend must have a dedicated preview route)
            page.goto(url, wait_until="networkidle")
            
            # Apply print media styles
            page.emulate_media(media="print")
            
            page.pdf(
                path=output_path,
                format="A4",
                print_background=True,
                margin={"top": "0in", "right": "0in", "bottom": "0in", "left": "0in"}
            )
            browser.close()
            return output_path
