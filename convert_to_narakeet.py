#!/usr/bin/env python3
"""
Convert DEMO_VIDEO_SCRIPT.md to Narakeet format
This creates a script that can be used with Narakeet to generate a video automatically
"""

import re
from pathlib import Path

def convert_to_narakeet(markdown_file, output_file):
    """Convert markdown script to Narakeet format"""
    
    with open(markdown_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract sections
    sections = re.split(r'### \d+\.\s+([^\n]+)', content)
    
    narakeet_script = []
    narakeet_script.append("# CareerPilot Consulting Demo Video\n")
    narakeet_script.append("Generated from DEMO_VIDEO_SCRIPT.md\n\n")
    
    # Process each section
    for i in range(1, len(sections), 2):
        if i + 1 < len(sections):
            section_title = sections[i].strip()
            section_content = sections[i + 1]
            
            # Extract narration
            narration_match = re.search(r'\*\*Narration\*\*:\s*\n> (.+?)(?=\n\n|\*\*|$)', section_content, re.DOTALL)
            if narration_match:
                narration = narration_match.group(1).strip()
                # Clean up markdown formatting
                narration = re.sub(r'\n> ', ' ', narration)
                narration = re.sub(r'\n', ' ', narration)
                
                narakeet_script.append(f"## {section_title}\n\n")
                narakeet_script.append(f"{narration}\n\n")
                
                # Add image placeholder if actions mention showing something
                if 'show' in section_content.lower() or 'display' in section_content.lower():
                    # Try to extract what to show
                    if 'landing page' in section_content.lower():
                        narakeet_script.append("[Show image: landing-page.png]\n\n")
                    elif 'dashboard' in section_content.lower():
                        narakeet_script.append("[Show image: dashboard.png]\n\n")
                    elif 'generator' in section_content.lower():
                        narakeet_script.append("[Show image: generator.png]\n\n")
                    elif 'cover letter' in section_content.lower():
                        narakeet_script.append("[Show image: cover-letter-generated.png]\n\n")
                    elif 'star story' in section_content.lower():
                        narakeet_script.append("[Show image: star-story.png]\n\n")
                    elif 'help' in section_content.lower() or 'faq' in section_content.lower():
                        narakeet_script.append("[Show image: help-sidebar.png]\n\n")
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(''.join(narakeet_script))
    
    print(f"✅ Converted to Narakeet format: {output_file}")
    print(f"\nNext steps:")
    print(f"1. Take screenshots of your app at key points")
    print(f"2. Name them: landing-page.png, dashboard.png, generator.png, etc.")
    print(f"3. Upload script + images to Narakeet")
    print(f"4. Generate video automatically!")

if __name__ == "__main__":
    script_dir = Path(__file__).parent
    markdown_file = script_dir / "DEMO_VIDEO_SCRIPT.md"
    output_file = script_dir / "NARAKEET_SCRIPT.md"
    
    if not markdown_file.exists():
        print(f"❌ Error: {markdown_file} not found")
        exit(1)
    
    convert_to_narakeet(markdown_file, output_file)

